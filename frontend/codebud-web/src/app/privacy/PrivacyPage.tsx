"use client";

import { PageLayout } from "../components/layout/PageLayout";
import { LegalLayout, LegalSection } from "../components/site/LegalLayout";

/* ── Table of contents ── */
const sections = [
    { id: "data-collection", title: "Data We Collect" },
    { id: "usage", title: "How We Use Your Data" },
    { id: "sharing", title: "Data Sharing" },
    { id: "security", title: "Data Security" },
    { id: "rights", title: "Your Rights" },
    { id: "cookies", title: "Cookies" },
    { id: "changes", title: "Policy Changes" },
    { id: "contact-us", title: "Contact Us" },
];

/* ── Page ── */
export function PrivacyPage() {
    return (
        <PageLayout
            compact
            eyebrow="Legal"
            title="Privacy Policy"
            lede="Your privacy matters. Here's how we collect, use, and protect your information."
            meta={[
                { label: "Last updated", value: "February 1, 2026" },
                { label: "Sections", value: "08" },
                { label: "Applies to", value: "MYCODEBUD · Shiktra Technologies LLP" },
            ]}
        >
            <LegalLayout sections={sections}>
                <LegalSection id="data-collection" title="Data We Collect" index={0}>
                    <p>We collect information you provide directly when you create an account, enroll in courses, or contact us. This includes:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li><strong className="text-muted-foreground">Account information:</strong> name, email address, password, and profile details.</li>
                        <li><strong className="text-muted-foreground">Payment information:</strong> billing address and payment method details (processed securely via Stripe).</li>
                        <li><strong className="text-muted-foreground">Usage data:</strong> course progress, quiz scores, code submissions, and interaction patterns.</li>
                        <li><strong className="text-muted-foreground">Device information:</strong> IP address, browser type, operating system, and device identifiers.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="usage" title="How We Use Your Data" index={1}>
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Provide, maintain, and improve our learning platform.</li>
                        <li>Personalise your learning experience with AI-powered recommendations.</li>
                        <li>Process payments and send transactional emails.</li>
                        <li>Communicate with you about updates, new courses, and promotional offers (with your consent).</li>
                        <li>Detect and prevent fraud, abuse, and security incidents.</li>
                        <li>Comply with legal obligations.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="sharing" title="Data Sharing" index={2}>
                    <p>We do not sell your personal data. We may share your data with:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li><strong className="text-muted-foreground">Service providers:</strong> hosting (Vercel), payment processing (Stripe), analytics (PostHog), and email delivery (Resend).</li>
                        <li><strong className="text-muted-foreground">Legal compliance:</strong> when required by law, subpoena, or government request.</li>
                        <li><strong className="text-muted-foreground">Business transfers:</strong> in connection with a merger, acquisition, or sale of assets (you will be notified).</li>
                    </ul>
                </LegalSection>

                <LegalSection id="security" title="Data Security" index={3}>
                    <p>We implement industry-standard security measures to protect your data:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>All data in transit is encrypted via TLS 1.3.</li>
                        <li>Data at rest is encrypted using AES-256.</li>
                        <li>We conduct regular security audits and penetration testing.</li>
                        <li>Access to personal data is restricted to authorised personnel on a need-to-know basis.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="rights" title="Your Rights" index={4}>
                    <p>Depending on your location, you may have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Access, correct, or delete your personal data.</li>
                        <li>Object to or restrict certain processing activities.</li>
                        <li>Port your data to another service.</li>
                        <li>Withdraw consent at any time (where processing is based on consent).</li>
                        <li>Lodge a complaint with your local data protection authority.</li>
                    </ul>
                    <p>To exercise these rights, email <a href="mailto:info@mycodebud.in" className="text-primary/60 hover:text-primary transition-colors">info@mycodebud.in</a>.</p>
                </LegalSection>

                <LegalSection id="cookies" title="Cookies" index={5}>
                    <p>We use cookies and similar technologies for:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li><strong className="text-muted-foreground">Essential cookies:</strong> authentication, security, and session management.</li>
                        <li><strong className="text-muted-foreground">Analytics cookies:</strong> understanding usage patterns to improve the platform.</li>
                        <li><strong className="text-muted-foreground">Preference cookies:</strong> remembering your settings and display preferences.</li>
                    </ul>
                    <p>You can manage cookie preferences through your browser settings.</p>
                </LegalSection>

                <LegalSection id="changes" title="Policy Changes" index={6}>
                    <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and, where appropriate, via email. Your continued use of MYCODEBUD after changes take effect constitutes acceptance of the updated policy.</p>
                </LegalSection>

                <LegalSection id="contact-us" title="Contact Us" index={7}>
                    <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Email: <a href="mailto:info@mycodebud.in" className="text-primary/60 hover:text-primary transition-colors">info@mycodebud.in</a></li>
                        <li>Address: Shiktra Technologies LLP, Bengaluru, India</li>
                    </ul>
                </LegalSection>
            </LegalLayout>
        </PageLayout>
    );
}
