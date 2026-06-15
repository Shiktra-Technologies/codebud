"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Calendar } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Table of Contents ── */
const sections = [
    { id: "data-collection", title: "Data We Collect" },
    { id: "usage", title: "How We Use Your Data" },
    { id: "sharing", title: "Data Sharing" },
    { id: "security", title: "Data Security" },
    { id: "rights", title: "Your Rights" },
    { id: "cookies", title: "Cookies" },
    { id: "changes", title: "Policy Changes" },
    { id: "contact", title: "Contact Us" },
];

/* ── Section Component ── */
function PolicySection({
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
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center text-xs font-bold text-yellow-400/70">
                    {index + 1}
                </span>
                {title}
            </h2>
            <div className="text-sm text-white/35 leading-relaxed space-y-3 pl-10">
                {children}
            </div>
        </motion.div>
    );
}

/* ── Page ── */
export function PrivacyPage() {
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
                    Privacy{" "}
                    <span className="text-shimmer">Policy</span>
                </>
            }
            subtitle="Your privacy matters. Here's how we collect, use, and protect your information."
        >
            <section className="py-16 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg opacity-8 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Last updated */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-xs text-white/25 mb-10 justify-center"
                    >
                        <Calendar size={12} />
                        Last updated: February 1, 2026
                    </motion.div>

                    <div className="flex gap-12">
                        {/* Sticky TOC */}
                        <aside className="hidden lg:block w-56 flex-shrink-0">
                            <nav className="sticky top-28">
                                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-4">
                                    On this page
                                </p>
                                <ul className="space-y-1.5">
                                    {sections.map((s) => (
                                        <li key={s.id}>
                                            <a
                                                href={`#${s.id}`}
                                                className={`block text-xs py-1 px-3 rounded-md transition-all duration-200 ${activeSection === s.id
                                                        ? "text-yellow-400/80 bg-yellow-400/[0.06]"
                                                        : "text-white/25 hover:text-white/50"
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
                            <div className="rounded-2xl border border-white/[0.06] bg-surface-2/20 backdrop-blur-sm p-8 md:p-10 space-y-12">
                                <PolicySection id="data-collection" title="Data We Collect" index={0}>
                                    <p>We collect information you provide directly when you create an account, enroll in courses, or contact us. This includes:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li><strong className="text-white/50">Account information:</strong> name, email address, password, and profile details.</li>
                                        <li><strong className="text-white/50">Payment information:</strong> billing address and payment method details (processed securely via Stripe).</li>
                                        <li><strong className="text-white/50">Usage data:</strong> course progress, quiz scores, code submissions, and interaction patterns.</li>
                                        <li><strong className="text-white/50">Device information:</strong> IP address, browser type, operating system, and device identifiers.</li>
                                    </ul>
                                </PolicySection>

                                <PolicySection id="usage" title="How We Use Your Data" index={1}>
                                    <p>We use the information we collect to:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Provide, maintain, and improve our learning platform.</li>
                                        <li>Personalise your learning experience with AI-powered recommendations.</li>
                                        <li>Process payments and send transactional emails.</li>
                                        <li>Communicate with you about updates, new courses, and promotional offers (with your consent).</li>
                                        <li>Detect and prevent fraud, abuse, and security incidents.</li>
                                        <li>Comply with legal obligations.</li>
                                    </ul>
                                </PolicySection>

                                <PolicySection id="sharing" title="Data Sharing" index={2}>
                                    <p>We do not sell your personal data. We may share your data with:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li><strong className="text-white/50">Service providers:</strong> hosting (Vercel), payment processing (Stripe), analytics (PostHog), and email delivery (Resend).</li>
                                        <li><strong className="text-white/50">Legal compliance:</strong> when required by law, subpoena, or government request.</li>
                                        <li><strong className="text-white/50">Business transfers:</strong> in connection with a merger, acquisition, or sale of assets (you will be notified).</li>
                                    </ul>
                                </PolicySection>

                                <PolicySection id="security" title="Data Security" index={3}>
                                    <p>We implement industry-standard security measures to protect your data:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>All data in transit is encrypted via TLS 1.3.</li>
                                        <li>Data at rest is encrypted using AES-256.</li>
                                        <li>We conduct regular security audits and penetration testing.</li>
                                        <li>Access to personal data is restricted to authorised personnel on a need-to-know basis.</li>
                                    </ul>
                                </PolicySection>

                                <PolicySection id="rights" title="Your Rights" index={4}>
                                    <p>Depending on your location, you may have the right to:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Access, correct, or delete your personal data.</li>
                                        <li>Object to or restrict certain processing activities.</li>
                                        <li>Port your data to another service.</li>
                                        <li>Withdraw consent at any time (where processing is based on consent).</li>
                                        <li>Lodge a complaint with your local data protection authority.</li>
                                    </ul>
                                    <p>To exercise these rights, email <a href="mailto:privacy@codebud.dev" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">privacy@codebud.dev</a>.</p>
                                </PolicySection>

                                <PolicySection id="cookies" title="Cookies" index={5}>
                                    <p>We use cookies and similar technologies for:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li><strong className="text-white/50">Essential cookies:</strong> authentication, security, and session management.</li>
                                        <li><strong className="text-white/50">Analytics cookies:</strong> understanding usage patterns to improve the platform.</li>
                                        <li><strong className="text-white/50">Preference cookies:</strong> remembering your settings and display preferences.</li>
                                    </ul>
                                    <p>You can manage cookie preferences through your browser settings.</p>
                                </PolicySection>

                                <PolicySection id="changes" title="Policy Changes" index={6}>
                                    <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and, where appropriate, via email. Your continued use of MYCODEBUD after changes take effect constitutes acceptance of the updated policy.</p>
                                </PolicySection>

                                <PolicySection id="contact" title="Contact Us" index={7}>
                                    <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>Email: <a href="mailto:privacy@codebud.dev" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">privacy@codebud.dev</a></li>
                                        <li>Address: Shiktra Technologies LLP, Bangalore, India</li>
                                    </ul>
                                </PolicySection>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
