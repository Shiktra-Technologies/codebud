"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Table of Contents ── */
const sections = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "accounts", title: "User Accounts" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "payment", title: "Payment & Subscriptions" },
    { id: "conduct", title: "User Conduct" },
    { id: "termination", title: "Termination" },
    { id: "liability", title: "Limitation of Liability" },
    { id: "governing-law", title: "Governing Law" },
    { id: "contact", title: "Contact" },
];

/* ── Section Component ── */
function TermsSection({
    id,
    title,
    children,
    index,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
    index: number;
}) {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.03, duration: 0.5, ease }}
            className="scroll-mt-28"
        >
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary/70">
                    {index + 1}
                </span>
                {title}
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3 pl-10">
                {children}
            </div>
        </motion.div>
    );
}

/* ── Page ── */
export function TermsPage() {
    const [activeSection, setActiveSection] = useState(sections[0].id);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);
                if (visible) setActiveSection(visible.target.id);
            },
            { rootMargin: "-30% 0px -60% 0px" }
        );
        sections.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <PageLayout
            badge="Legal"
            title={
                <>
                    Terms of{" "}
                    <span className="text-primary">Service</span>
                </>
            }
            subtitle="Please read these terms carefully before using MYCODEBUD."
        >
            <section className="py-16 relative overflow-hidden bg-background">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Last updated */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-10 justify-center"
                    >
                        <Calendar size={12} />
                        Last updated: February 1, 2026
                    </motion.div>

                    <div className="flex gap-12">
                        {/* Sticky TOC */}
                        <aside className="hidden lg:block w-56 flex-shrink-0">
                            <nav className="sticky top-28">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
                                    On this page
                                </p>
                                <ul className="space-y-1.5">
                                    {sections.map((s) => (
                                        <li key={s.id}>
                                            <a
                                                href={`#${s.id}`}
                                                className={`block text-xs py-1 px-3 rounded-md transition-all duration-200 ${activeSection === s.id
                                                        ? "text-primary/80 bg-primary/[0.06]"
                                                        : "text-muted-foreground/70 hover:text-muted-foreground"
                                                    }`}
                                            >
                                                {s.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>

                        {/* Content */}
                        <div className="flex-1 max-w-3xl">
                            <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-8 md:p-10 space-y-12">
                                <TermsSection id="acceptance" title="Acceptance of Terms" index={0}>
                                    <p>By accessing or using MYCODEBUD (&quot;the Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, you must not use the Platform.</p>
                                    <p>These Terms constitute a legally binding agreement between you and Shiktra Technologies LLP (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;). We may update these Terms from time to time; continued use of the Platform after such updates constitutes acceptance.</p>
                                </TermsSection>

                                <TermsSection id="accounts" title="User Accounts" index={1}>
                                    <p>To access certain features, you must create an account. You agree to:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Provide accurate and complete registration information.</li>
                                        <li>Maintain the confidentiality of your login credentials.</li>
                                        <li>Accept responsibility for all activities under your account.</li>
                                        <li>Notify us immediately of any unauthorised access.</li>
                                    </ul>
                                    <p>We reserve the right to suspend or terminate accounts that violate these Terms or are inactive for more than 12 months.</p>
                                </TermsSection>

                                <TermsSection id="intellectual-property" title="Intellectual Property" index={2}>
                                    <p>All content on the Platform — including courses, videos, code samples, graphics, and UI design — is the intellectual property of Shiktra Technologies LLP or its licensors and is protected by copyright, trademark, and other intellectual property laws.</p>
                                    <p>You are granted a limited, non-exclusive, non-transferable licence to access and use course materials for personal, non-commercial learning purposes only. You may not:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Reproduce, distribute, or publicly display course content.</li>
                                        <li>Create derivative works based on our content.</li>
                                        <li>Use our content for commercial training or resale.</li>
                                        <li>Remove any copyright or proprietary notices.</li>
                                    </ul>
                                </TermsSection>

                                <TermsSection id="payment" title="Payment & Subscriptions" index={3}>
                                    <p>Certain features require a paid subscription. By subscribing, you agree that:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Subscriptions automatically renew at the end of each billing period unless cancelled.</li>
                                        <li>Prices may change with 30 days&apos; prior notice.</li>
                                        <li>Refunds are available within 14 days of initial purchase if you haven&apos;t completed more than 20% of any course.</li>
                                        <li>All payments are processed securely via Stripe. We do not store your full card details.</li>
                                    </ul>
                                </TermsSection>

                                <TermsSection id="conduct" title="User Conduct" index={4}>
                                    <p>You agree not to:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Use the Platform for any unlawful purpose.</li>
                                        <li>Share your account credentials with others.</li>
                                        <li>Attempt to gain unauthorised access to any part of the Platform.</li>
                                        <li>Harass, bully, or intimidate other users in community forums.</li>
                                        <li>Submit malicious code or attempt to disrupt Platform operations.</li>
                                        <li>Scrape, crawl, or otherwise extract data from the Platform without written permission.</li>
                                    </ul>
                                </TermsSection>

                                <TermsSection id="termination" title="Termination" index={5}>
                                    <p>We may suspend or terminate your access to the Platform at our discretion, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties.</p>
                                    <p>You may close your account at any time from your account settings. Upon termination, your right to use the Platform ceases immediately, though certain provisions of these Terms (intellectual property, limitation of liability, governing law) survive termination.</p>
                                </TermsSection>

                                <TermsSection id="liability" title="Limitation of Liability" index={6}>
                                    <p>To the maximum extent permitted by law:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>The Platform is provided &quot;as is&quot; without warranties of any kind, express or implied.</li>
                                        <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages.</li>
                                        <li>Our total liability is limited to the amount you paid us in the 12 months prior to the claim.</li>
                                        <li>We do not guarantee that the Platform will be uninterrupted, error-free, or secure.</li>
                                    </ul>
                                </TermsSection>

                                <TermsSection id="governing-law" title="Governing Law" index={7}>
                                    <p>These Terms are governed by the laws of India. Any disputes arising under these Terms shall be resolved in the courts of Bangalore, Karnataka, India.</p>
                                    <p>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
                                </TermsSection>

                                <TermsSection id="contact" title="Contact" index={8}>
                                    <p>For questions about these Terms, please contact us:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Email: <a href="mailto:legal@codebud.dev" className="text-primary/60 hover:text-primary transition-colors">legal@codebud.dev</a></li>
                                        <li>Address: Shiktra Technologies LLP, Bangalore, India</li>
                                    </ul>
                                </TermsSection>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
