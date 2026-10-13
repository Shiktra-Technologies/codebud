"use client";

/*
 * Error boundary page — same frame as the 404: a decoding mark over the brass
 * horizon, the error itself in a code block, and mono actions.
 */

import Link from "next/link";
import { motion } from "motion/react";

import { BrassRing } from "./components/home/BrassRing";
import { EASE_OUT, RiseText, ScrambleText } from "./components/home/primitives";
import { PageNav } from "./components/site/PageNav";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <>
            <main id="page-hero" className="lost">
                <ScrambleText as="p" text="Error — something broke" duration={800} className="scene-label text-signal-400" />
                <ScrambleText as="p" text="</>" duration={1000} delay={150} className="lost__code lost__code--glyph" />
                <RiseText as="h1" text="Oops! Something broke." play delay={0.5} className="lost__title" />
                <motion.p
                    className="lost__lede"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9, ease: EASE_OUT }}
                >
                    An unexpected error occurred. Our team has been notified and we&apos;re working on a fix.
                </motion.p>

                <motion.div
                    className="typed-code lost__term"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.05, ease: EASE_OUT }}
                >
                    <span className="block truncate text-signal-400">
                        {error.message || "An unexpected error occurred"}
                    </span>
                    {error.digest && <span className="block tok-com">digest: {error.digest}</span>}
                </motion.div>

                <motion.ul
                    className="lost__links"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                >
                    <li>
                        <button type="button" onClick={() => reset()} className="contact-link mh-focus">
                            <span aria-hidden="true" className="contact-link__arrow">
                                ↻
                            </span>
                            Try again
                        </button>
                    </li>
                    <li>
                        <Link href="/" className="contact-link mh-focus">
                            <span aria-hidden="true" className="contact-link__arrow">
                                →
                            </span>
                            Go home
                        </Link>
                    </li>
                </motion.ul>
            </main>
            <BrassRing variant="page" />
            <PageNav />
        </>
    );
}
