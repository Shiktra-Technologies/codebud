"use client";

/*
 * 404 — the homepage's parts at their simplest: the code decoding in display
 * type over the brass horizon (BrassRing reads #page-hero), the old terminal
 * hint as a code block, and mono links home.
 */

import Link from "next/link";
import { motion } from "motion/react";

import { BrassRing } from "./components/home/BrassRing";
import { EASE_OUT, RiseText, ScrambleText } from "./components/home/primitives";
import { PageNav } from "./components/site/PageNav";

export default function NotFound() {
    return (
        <>
            <main id="page-hero" className="lost">
                <ScrambleText as="p" text="Error 404 — page not found" duration={800} className="scene-label text-brass-500" />
                <ScrambleText as="h1" text="404" duration={1100} delay={150} className="lost__code" />
                <RiseText as="p" text="Lost in the codebase?" play delay={0.5} className="lost__title" />
                <motion.p
                    className="lost__lede"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9, ease: EASE_OUT }}
                >
                    The page you&apos;re looking for was moved, deleted, or maybe never existed. Let&apos;s get you
                    back on track.
                </motion.p>

                <motion.div
                    aria-hidden="true"
                    className="typed-code lost__term"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.05, ease: EASE_OUT }}
                >
                    <span className="block">
                        <span className="text-signal-400">Error</span>: Page.<span className="tok-kw">notFound</span>()
                    </span>
                    <span className="block tok-com">  at Router (navigation.tsx:42)</span>
                    <span className="block">
                        <span className="tok-kw">→</span> Try navigating home
                    </span>
                </motion.div>

                <motion.ul
                    className="lost__links"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                >
                    <li>
                        <Link href="/" className="contact-link mh-focus">
                            <span aria-hidden="true" className="contact-link__arrow">
                                →
                            </span>
                            Take me home
                        </Link>
                    </li>
                    <li>
                        <button type="button" onClick={() => window.history.back()} className="contact-link mh-focus">
                            <span aria-hidden="true" className="contact-link__arrow">
                                ←
                            </span>
                            Go back
                        </button>
                    </li>
                    <li>
                        <Link href="/contact" className="contact-link mh-focus">
                            <span aria-hidden="true" className="contact-link__arrow">
                                →
                            </span>
                            Tell us what broke
                        </Link>
                    </li>
                </motion.ul>
            </main>
            <BrassRing variant="page" />
            <PageNav />
        </>
    );
}
