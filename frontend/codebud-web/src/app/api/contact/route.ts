/*
 * Contact + newsletter intake. Both land in info@mycodebud.in.
 *
 * `runtime = "nodejs"` because nodemailer opens a TCP socket, which the edge
 * runtime has no API for. `dynamic = "force-dynamic"` keeps the build from
 * trying to evaluate this at prerender time, when no SMTP credentials exist.
 */

import { NextResponse } from "next/server";

import { MAIL_ADDRESS, getTransport, isMailConfigured } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Throttle ──
 * One in-memory bucket per IP. This is a best-effort speed bump against a bot
 * hammering the form, NOT a real rate limiter: serverless instances each keep
 * their own map and it resets on cold start. A shared store is the fix if this
 * ever needs to actually hold. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function recentHits(ip: string): number[] {
    const now = Date.now();
    return (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
}

function isOverLimit(ip: string): boolean {
    return recentHits(ip).length >= MAX_PER_WINDOW;
}

/* Only a request that actually reaches the send counts against the budget.
   Counting rejected ones instead would let three mistyped email addresses lock
   a real person out for a minute. */
function recordSend(ip: string): void {
    const now = Date.now();
    hits.set(ip, [...recentHits(ip), now]);

    // The map would otherwise grow for the life of the instance.
    if (hits.size > 5_000) {
        for (const [key, times] of hits) {
            if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
        }
    }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Header values are attacker-controlled; a newline in one splits the message
 *  into extra headers. Subject and Reply-To are built from user input, so both
 *  get stripped of CR/LF before they go anywhere near the envelope. */
function headerSafe(value: string): string {
    return value.replace(/[\r\n]+/g, " ").trim();
}

function clamp(value: unknown, max: number): string {
    return typeof value === "string" ? value.slice(0, max).trim() : "";
}

export async function POST(request: Request) {
    if (!isMailConfigured()) {
        return NextResponse.json(
            { error: "Email is not configured on this deployment." },
            { status: 503 },
        );
    }

    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    if (isOverLimit(ip)) {
        return NextResponse.json(
            { error: "Too many messages. Try again in a minute." },
            { status: 429 },
        );
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const topic = body.topic === "newsletter" ? "newsletter" : "contact";
    const email = clamp(body.email, 200);

    if (!EMAIL.test(email)) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // A hidden field real people never fill in. Bots fill everything, so a
    // non-empty value is answered with a 200 — telling a bot it was caught only
    // teaches it to try again differently.
    if (clamp(body.company, 100)) {
        return NextResponse.json({ ok: true });
    }

    const name = clamp(body.name, 120);
    const subject = clamp(body.subject, 200);
    const message = clamp(body.message, 5_000);

    if (topic === "contact" && (!name || !message)) {
        return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
    }

    const mailSubject =
        topic === "newsletter"
            ? `Newsletter signup — ${email}`
            : headerSafe(subject ? `Contact form — ${subject}` : `Contact form — ${name}`);

    const text =
        topic === "newsletter"
            ? `New newsletter signup.\n\nEmail: ${email}\n`
            : [
                  `Name:    ${name}`,
                  `Email:   ${email}`,
                  `Subject: ${subject || "(none)"}`,
                  "",
                  message,
              ].join("\n");

    recordSend(ip);

    try {
        await getTransport().sendMail({
            from: `MyCodeBud <${MAIL_ADDRESS}>`,
            to: MAIL_ADDRESS,
            replyTo: headerSafe(email),
            subject: mailSubject,
            text,
        });
    } catch (error) {
        // The message may name the host or user, so log the failure without
        // echoing anything that could carry a credential back to the client.
        console.error("[contact] SMTP send failed:", error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: "Could not send your message. Please email us directly." },
            { status: 502 },
        );
    }

    return NextResponse.json({ ok: true });
}
