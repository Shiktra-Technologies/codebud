"use client";

/*
 * Contact — the last screen, and the finale of every other page too.
 * Transparent, so the brass ring returns behind it as a horizon (BrassRing
 * reads this section's position). The vision lands word by word when the
 * section comes into view; the links decode on hover; the newsletter signup
 * (the old footer's) sits under them.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";

import { cn } from "@/lib/utils";
import { PLATFORM_AUTH_URL } from "@/lib/platformUrl";
import { CONTACT } from "./content";
import { EASE_OUT, RiseText, ScrambleText } from "./primitives";

const LINKS = [
    { label: "Start learning — ₹99 / month", href: PLATFORM_AUTH_URL, external: true },
    { label: CONTACT.email, href: `mailto:${CONTACT.email}`, external: true },
    { label: "About MYCODEBUD", href: "/about", external: false },
    { label: "Write to us", href: "/contact", external: false },
];

export function ContactScene() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: "0px 0px -35% 0px" });

    return (
        <section id="contact" ref={ref} aria-labelledby="contact-title" className="relative flex min-h-svh flex-col">
            <div className="grid flex-1 grid-cols-1 gap-8 px-4 pt-[11svh] md:grid-cols-12 md:gap-6">
                <div className="md:col-span-4">
                    <ScrambleText text={CONTACT.glyph} active={inView} duration={900} className="contact-glyph" />
                </div>

                <div className="md:col-span-8 md:col-start-5 lg:col-span-7 lg:col-start-5">
                    <motion.p
                        className="scene-label mb-6 text-brass-500"
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : undefined}
                        transition={{ duration: 0.6 }}
                    >
                        {CONTACT.label}
                    </motion.p>

                    <RiseText id="contact-title" text={CONTACT.statement} play={inView} className="contact-statement" />

                    <motion.ul
                        className="mt-12 space-y-3"
                        initial="hidden"
                        animate={inView ? "shown" : "hidden"}
                        variants={{ shown: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } } }}
                    >
                        {LINKS.map((link) => (
                            <motion.li
                                key={link.label}
                                variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
                                }}
                            >
                                <ContactLink {...link} />
                            </motion.li>
                        ))}
                    </motion.ul>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={inView ? { opacity: 1, y: 0 } : undefined}
                        transition={{ duration: 0.6, delay: 1.3, ease: EASE_OUT }}
                    >
                        <NewsletterForm />
                    </motion.div>
                </div>
            </div>

            <footer className="contact-foot">
                <p>
                    © {new Date().getFullYear()} {CONTACT.company}
                </p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>{CONTACT.place}</span>
                    <Link href="/privacy" className="contact-foot__link mh-focus">
                        Privacy
                    </Link>
                    <Link href="/terms" className="contact-foot__link mh-focus">
                        Terms
                    </Link>
                </p>
            </footer>
        </section>
    );
}

/** The newsletter signup — /api/contact with topic "newsletter", as the old footer posted it. */
function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || status === "sending") return;
        setStatus("sending");
        setError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, topic: "newsletter" }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error ?? "Could not sign you up. Please try again.");
                setStatus("error");
                return;
            }
            setEmail("");
            setStatus("sent");
        } catch {
            setError("Network error. Please try again.");
            setStatus("error");
        }
    };

    return (
        <form onSubmit={submit} className="newsletter">
            <label htmlFor="newsletter-email" className="newsletter__label">
                <span className="text-brass-500">Stay in the loop</span> — ecosystem updates, hackathon calls and new
                project briefs.
            </label>
            <div className="newsletter__row">
                <input
                    id="newsletter-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="newsletter__input"
                />
                <button type="submit" disabled={status === "sending"} className="newsletter__submit mh-focus">
                    {status === "sending" ? "Sending…" : "Subscribe"} <span aria-hidden="true">→</span>
                </button>
            </div>
            <p role="status" aria-live="polite" className={cn("newsletter__status", status === "error" && "is-error")}>
                {status === "sent" && "You're on the list."}
                {status === "error" && error}
            </p>
        </form>
    );
}

function ContactLink({ label, href, external }: { label: string; href: string; external: boolean }) {
    const [replay, setReplay] = useState(0);
    const body = (
        <>
            <span aria-hidden="true" className="contact-link__arrow">
                →
            </span>
            <ScrambleText text={label} from="text" active={replay > 0} replayKey={replay} duration={500} />
        </>
    );
    const props = {
        className: "contact-link mh-focus",
        onMouseEnter: () => setReplay((n) => n + 1),
        onFocus: () => setReplay((n) => n + 1),
    };
    return external ? (
        <a href={href} {...props}>
            {body}
        </a>
    ) : (
        <Link href={href} {...props}>
            {body}
        </Link>
    );
}
