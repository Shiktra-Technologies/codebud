"use client";

/*
 * Contact — the form, who to write to, and the FAQ, in the homepage's
 * vocabulary. The form's behaviour is unchanged: client-side validation, then
 * a direct relay through FormSubmit (see lib/formsubmit.ts), with the
 * honeypot field bots fill in.
 */

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Github, MessageCircle, Twitter } from "lucide-react";

import { cn } from "@/lib/utils";
import { sendViaFormSubmit } from "@/lib/formsubmit";
import { PageLayout } from "../components/layout/PageLayout";
import { EASE_OUT } from "../components/home/primitives";

/* Drives the <select> and the mail subject line, so the inbox shows
   "Enterprise Plans" rather than the "enterprise" form value. */
const subjectOptions = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "enterprise", label: "Enterprise Plans" },
    { value: "partnership", label: "Partnerships" },
    { value: "feedback", label: "Feedback" },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Who to write to ── */
const contactInfo = [
    {
        label: "Email us",
        value: "info@mycodebud.in",
        href: "mailto:info@mycodebud.in",
        description: "We'll respond within 24 hours",
    },
    {
        label: "Location",
        value: "Bengaluru, India",
        description: "Shiktra Technologies LLP",
    },
    {
        label: "Community",
        value: "Discord & GitHub",
        description: "Join the developer community",
        socials: [
            { icon: Github, href: "#", label: "GitHub" },
            { icon: Twitter, href: "#", label: "Twitter" },
            { icon: MessageCircle, href: "#", label: "Discord" },
        ],
    },
];

/* ── FAQ data ── */
const faqs = [
    {
        question: "How quickly will I get a response?",
        answer: "We typically respond within 24 hours on business days. You can also reach us directly at info@mycodebud.in.",
    },
    {
        question: "What does membership cost?",
        answer: "₹99 per student per month, or ₹1,188 per year for the same rate paid upfront. There are no separate paywalls — every plan includes the entire ecosystem: guidance, mentorship, core and novelty projects, DSA, interview preparation and hackathon support.",
    },
    {
        question: "Do you work with colleges?",
        answer: "Yes. Colleges use MyCodeBud for stronger placement outcomes and a structured way to keep students industry-ready. Email info@mycodebud.in and we will set up a call.",
    },
    {
        question: "Can companies hire through MyCodeBud?",
        answer: "Yes, and it is free of cost. Companies get access to filtered, capability-tested talent without building a pipeline themselves. Write to info@mycodebud.in to join the hiring network.",
    },
    {
        question: "Can I mentor students?",
        answer: "We are always growing the mentor network across product companies, IT services, consulting and academia. If you have shipped real work and want to guide students, email info@mycodebud.in.",
    },
];

/* ── FAQ item ── */
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const id = `faq-${index}`;

    return (
        <motion.li
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: index * 0.06, duration: 0.6, ease: EASE_OUT }}
            className={cn("faq", isOpen && "is-open")}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={id}
                className="faq__q mh-focus"
            >
                <span className="faq__idx">Q.{String(index + 1).padStart(2, "0")}</span>
                <span className="faq__text">{question}</span>
                <span aria-hidden="true" className="faq__icon" />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        id={id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="faq__a">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    );
}

/* ── Page ── */
export function ContactPage() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        subject: "general",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [error, setError] = useState("");
    // Honeypot: hidden from people, irresistible to bots. FormSubmit drops any
    // submission that fills it in.
    const [honey, setHoney] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === "sending") return;

        const name = formState.name.trim();
        const email = formState.email.trim();
        const message = formState.message.trim();

        // The API route used to validate this server-side. Posting straight to
        // FormSubmit means nothing of ours sees the payload, so the check has to
        // happen here or a blank message reaches the inbox.
        if (!name || !message) {
            setError("Name and message are required.");
            setStatus("error");
            return;
        }
        if (!EMAIL.test(email)) {
            setError("Enter a valid email address.");
            setStatus("error");
            return;
        }

        setStatus("sending");
        setError("");

        const subject =
            subjectOptions.find((o) => o.value === formState.subject)?.label ?? "General Inquiry";

        const result = await sendViaFormSubmit({
            name,
            email,
            subject,
            message,
            _honey: honey,
            _subject: `Contact form — ${subject}`,
            // Replying in the inbox answers the visitor, not FormSubmit.
            _replyto: email,
        });

        if (!result.ok) {
            setError(result.error);
            setStatus("error");
            return;
        }

        setStatus("sent");
        setFormState({ name: "", email: "", subject: "general", message: "" });
    };

    return (
        <PageLayout
            eyebrow="Contact"
            title="Have a question? Write to us."
            lede="Have a question, feedback, or partnership idea? We'd love to hear from you."
            meta={[
                { label: "Email", value: "info@mycodebud.in" },
                { label: "Response", value: "Within 24 hours" },
                { label: "Based in", value: "Bengaluru, India" },
            ]}
        >
            {/* ── Form + who to write to ── */}
            <section className="page-section" aria-labelledby="contact-form-title">
                <div className="contact-grid">
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.8, ease: EASE_OUT }}
                        className="form-panel"
                    >
                        <span aria-hidden="true" className="form-panel__corner form-panel__corner--tl" />
                        <span aria-hidden="true" className="form-panel__corner form-panel__corner--br" />
                        <p className="scene-label text-brass-500">Message</p>
                        <h2 id="contact-form-title" className="form-panel__title">
                            Tell us what&apos;s on your mind.
                        </h2>

                        <form onSubmit={handleSubmit} className="form" noValidate>
                            <div className="form__row">
                                <label className="field">
                                    <span className="field__label">Name</span>
                                    <input
                                        type="text"
                                        name="name"
                                        autoComplete="name"
                                        placeholder="Your name"
                                        value={formState.name}
                                        onChange={handleChange}
                                        className="field__input"
                                    />
                                </label>
                                <label className="field">
                                    <span className="field__label">Email</span>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        placeholder="your@email.com"
                                        value={formState.email}
                                        onChange={handleChange}
                                        className="field__input"
                                    />
                                </label>
                            </div>

                            <label className="field">
                                <span className="field__label">Subject</span>
                                <span className="field__select">
                                    <select
                                        name="subject"
                                        value={formState.subject}
                                        onChange={handleChange}
                                        className="field__input"
                                    >
                                        {subjectOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </span>
                            </label>

                            <label className="field">
                                <span className="field__label">Message</span>
                                <textarea
                                    name="message"
                                    placeholder="Tell us what's on your mind..."
                                    value={formState.message}
                                    onChange={handleChange}
                                    rows={6}
                                    className="field__input field__input--area"
                                />
                            </label>

                            {/* Honeypot — off-screen rather than display:none, which
                                some bots detect. Never announced to assistive tech. */}
                            <div className="absolute left-[-9999px]" aria-hidden="true">
                                <label htmlFor="_honey">Company</label>
                                <input
                                    id="_honey"
                                    name="_honey"
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={honey}
                                    onChange={(e) => setHoney(e.target.value)}
                                />
                            </div>

                            <div className="form__actions">
                                <button type="submit" disabled={status === "sending"} className="form__submit mh-focus">
                                    {status === "sending" ? "Sending…" : "Send message"} <span aria-hidden="true">→</span>
                                </button>
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className={cn("form__status", status === "error" && "is-error")}
                                >
                                    {status === "sent" && "Thanks — we'll reply within 24 hours."}
                                    {status === "error" && error}
                                </p>
                            </div>
                        </form>
                    </motion.div>

                    <ul className="info-stack" aria-label="Other ways to reach us">
                        {contactInfo.map((info, i) => (
                            <motion.li
                                key={info.label}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ delay: 0.1 + i * 0.1, duration: 0.7, ease: EASE_OUT }}
                                className="info-card"
                            >
                                <p className="info-card__label">
                                    <span>{info.label}</span>
                                    <span className="text-carbon-tertiary">{String(i + 1).padStart(2, "0")}</span>
                                </p>
                                {info.href ? (
                                    <a href={info.href} className="info-card__value mh-focus">
                                        {info.value}
                                    </a>
                                ) : (
                                    <p className="info-card__value">{info.value}</p>
                                )}
                                <p className="info-card__desc">{info.description}</p>
                                {info.socials && (
                                    <div className="mt-4 flex gap-2">
                                        {info.socials.map((s) => (
                                            <a key={s.label} href={s.href} aria-label={s.label} className="info-card__social mh-focus">
                                                <s.icon size={14} />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="page-section" aria-labelledby="faq-title">
                <div className="faq-wrap">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, ease: EASE_OUT }}
                    >
                        <p className="scene-label text-brass-500">FAQ</p>
                        <h2 id="faq-title" className="section-head__title">
                            Frequently asked questions.
                        </h2>
                        <p className="section-head__lede">Can&apos;t find what you&apos;re looking for? Reach out to us directly.</p>
                    </motion.div>
                    <ol className="faq-list">
                        {faqs.map((faq, i) => (
                            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} index={i} />
                        ))}
                    </ol>
                </div>
            </section>
        </PageLayout>
    );
}
