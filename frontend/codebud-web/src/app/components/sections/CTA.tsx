"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { SectionBadge } from "@/components/section-badge";
import { Button } from "@/components/ui/button";
import { PLATFORM_AUTH_URL } from "@/lib/platformUrl";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Social proof mini avatars ── */
const avatars = [
    { initials: "PS", color: "from-muted to-muted" },
    { initials: "AM", color: "from-muted to-muted" },
    { initials: "SC", color: "from-muted to-muted" },
    { initials: "RP", color: "from-primary to-muted" },
    { initials: "AG", color: "from-muted to-muted" },
];

export const CTA = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="max-w-2xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease }}
                        className="mb-6"
                    >
                        <SectionBadge>Get Started</SectionBadge>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05, duration: 0.7, ease }}
                        className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-foreground tracking-tight leading-tight"
                    >
                        Ready to start your
                        <br />
                        <span className="text-primary">coding journey?</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease }}
                        className="text-muted-foreground text-base md:text-lg mb-10 leading-relaxed max-w-md mx-auto"
                    >
                        Join thousands of students already building real-world projects and
                        leveling up their skills with MYCODEBUD.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15, duration: 0.5, ease }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
                    >
                        <Link href={PLATFORM_AUTH_URL}>
                            <Button variant="default" size="lg" className="px-10 group">
                                Join MYCODEBUD Today
                                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>
                        <a href="/#features">
                            <Button variant="outline" size="lg" className="px-8">
                                Explore Courses
                            </Button>
                        </a>
                    </motion.div>

                    {/* Social proof */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25, duration: 0.5, ease }}
                        className="flex items-center justify-center gap-3"
                    >
                        <div className="flex -space-x-2">
                            {avatars.map((a) => (
                                <div
                                    key={a.initials}
                                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-[9px] font-bold text-foreground ring-2 ring-background`}
                                >
                                    {a.initials}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Join <span className="text-primary/70 font-semibold">10,000+</span> developers
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
