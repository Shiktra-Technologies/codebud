"use client";

import { PageLayout } from "../components/layout/PageLayout";
import { LegalLayout, LegalSection } from "../components/site/LegalLayout";

/* ── Table of contents ── */
const sections = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "accounts", title: "User Accounts" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "payment", title: "Payment & Subscriptions" },
    { id: "conduct", title: "User Conduct" },
    { id: "termination", title: "Termination" },
    { id: "liability", title: "Limitation of Liability" },
    { id: "governing-law", title: "Governing Law" },
    { id: "contact-us", title: "Contact" },
];

/* ── Page ── */
export function TermsPage() {
    return (
        <PageLayout
            compact
            eyebrow="Legal"
            title="Terms of Service"
            lede="Please read these terms carefully before using MYCODEBUD."
            meta={[
                { label: "Last updated", value: "February 1, 2026" },
                { label: "Sections", value: "09" },
                { label: "Applies to", value: "MYCODEBUD · Shiktra Technologies LLP" },
            ]}
        >
            <LegalLayout sections={sections}>
                <LegalSection id="acceptance" title="Acceptance of Terms" index={0}>
                    <p>By accessing or using MYCODEBUD (&quot;the Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, you must not use the Platform.</p>
                    <p>These Terms constitute a legally binding agreement between you and Shiktra Technologies LLP (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;). We may update these Terms from time to time; continued use of the Platform after such updates constitutes acceptance.</p>
                </LegalSection>

                <LegalSection id="accounts" title="User Accounts" index={1}>
                    <p>To access certain features, you must create an account. You agree to:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Provide accurate and complete registration information.</li>
                        <li>Maintain the confidentiality of your login credentials.</li>
                        <li>Accept responsibility for all activities under your account.</li>
                        <li>Notify us immediately of any unauthorised access.</li>
                    </ul>
                    <p>We reserve the right to suspend or terminate accounts that violate these Terms or are inactive for more than 12 months.</p>
                </LegalSection>

                <LegalSection id="intellectual-property" title="Intellectual Property" index={2}>
                    <p>All content on the Platform — including courses, videos, code samples, graphics, and UI design — is the intellectual property of Shiktra Technologies LLP or its licensors and is protected by copyright, trademark, and other intellectual property laws.</p>
                    <p>You are granted a limited, non-exclusive, non-transferable licence to access and use course materials for personal, non-commercial learning purposes only. You may not:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Reproduce, distribute, or publicly display course content.</li>
                        <li>Create derivative works based on our content.</li>
                        <li>Use our content for commercial training or resale.</li>
                        <li>Remove any copyright or proprietary notices.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="payment" title="Payment & Subscriptions" index={3}>
                    <p>Certain features require a paid subscription. By subscribing, you agree that:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Subscriptions automatically renew at the end of each billing period unless cancelled.</li>
                        <li>Prices may change with 30 days&apos; prior notice.</li>
                        <li>Refunds are available within 14 days of initial purchase if you haven&apos;t completed more than 20% of any course.</li>
                        <li>All payments are processed securely via Stripe. We do not store your full card details.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="conduct" title="User Conduct" index={4}>
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Use the Platform for any unlawful purpose.</li>
                        <li>Share your account credentials with others.</li>
                        <li>Attempt to gain unauthorised access to any part of the Platform.</li>
                        <li>Harass, bully, or intimidate other users in community forums.</li>
                        <li>Submit malicious code or attempt to disrupt Platform operations.</li>
                        <li>Scrape, crawl, or otherwise extract data from the Platform without written permission.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="termination" title="Termination" index={5}>
                    <p>We may suspend or terminate your access to the Platform at our discretion, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties.</p>
                    <p>You may close your account at any time from your account settings. Upon termination, your right to use the Platform ceases immediately, though certain provisions of these Terms (intellectual property, limitation of liability, governing law) survive termination.</p>
                </LegalSection>

                <LegalSection id="liability" title="Limitation of Liability" index={6}>
                    <p>To the maximum extent permitted by law:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>The Platform is provided &quot;as is&quot; without warranties of any kind, express or implied.</li>
                        <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages.</li>
                        <li>Our total liability is limited to the amount you paid us in the 12 months prior to the claim.</li>
                        <li>We do not guarantee that the Platform will be uninterrupted, error-free, or secure.</li>
                    </ul>
                </LegalSection>

                <LegalSection id="governing-law" title="Governing Law" index={7}>
                    <p>These Terms are governed by the laws of India. Any disputes arising under these Terms shall be resolved in the courts of Bengaluru, Karnataka, India.</p>
                    <p>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
                </LegalSection>

                <LegalSection id="contact-us" title="Contact" index={8}>
                    <p>For questions about these Terms, please contact us:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Email: <a href="mailto:info@mycodebud.in" className="text-primary/60 hover:text-primary transition-colors">info@mycodebud.in</a></li>
                        <li>Address: Shiktra Technologies LLP, Bengaluru, India</li>
                    </ul>
                </LegalSection>
            </LegalLayout>
        </PageLayout>
    );
}
