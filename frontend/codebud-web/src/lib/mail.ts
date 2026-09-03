/*
 * SMTP transport — every mail this site sends goes out through info@mycodebud.in.
 *
 * The FROM address is always the mailbox we authenticate as. It is not the
 * visitor's address, even though the mail is about them: sending as
 * someone@gmail.com from our server fails that domain's SPF/DMARC and lands the
 * mail in spam or gets it rejected outright. The visitor's address goes in
 * Reply-To instead, so hitting reply in the inbox still answers them directly.
 *
 * Credentials come from the environment and are never logged. The transporter
 * is cached across invocations because a serverless container may serve many
 * requests, and rebuilding it per request means a fresh TCP + TLS handshake
 * every time.
 */

import nodemailer, { type Transporter } from "nodemailer";

/** The one mailbox the site sends from and delivers to. */
export const MAIL_ADDRESS = "info@mycodebud.in";

let cached: Transporter | null = null;

export function getTransport(): Transporter {
    if (cached) return cached;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
    }

    const port = Number(process.env.SMTP_PORT ?? 587);

    cached = nodemailer.createTransport({
        host,
        port,
        // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
        secure: port === 465,
        auth: { user, pass },
    });

    return cached;
}

/** True when the environment carries enough to send. Lets a route answer with a
 *  clear 503 instead of throwing when the deployment has no SMTP set up yet. */
export function isMailConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
