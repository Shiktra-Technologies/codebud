"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Mail,
    MapPin,
    MessageCircle,
    Send,
    ChevronDown,
    Github,
    Twitter,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { sendViaFormSubmit } from "@/lib/formsubmit";

const ease = [0.16, 1, 0.3, 1] as const;

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

/* ── Contact Info cards ── */
const contactInfo = [
    {
        icon: Mail,
        title: "Email Us",
        value: "info@mycodebud.in",
        description: "We'll respond within 24 hours",
        gradient: "from-primary/20 to-primary/10",
    },
    {
        icon: MapPin,
        title: "Location",
        value: "Bengaluru, India",
        description: "Shiktra Technologies LLP",
        gradient: "from-muted to-muted",
    },
    {
        icon: MessageCircle,
        title: "Community",
        value: "Discord & GitHub",
        description: "Join the developer community",
        gradient: "from-muted to-muted",
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

/* ── FAQ Item ── */
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06, duration: 0.5, ease }}
            className="border border-border rounded-xl overflow-hidden hover:border-primary/10 transition-colors duration-300"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left group"
            >
                <span className="font-medium text-foreground group-hover:text-foreground transition-colors text-[15px]">
                    {question}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-primary/50 transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
    const [focusedField, setFocusedField] = useState<string | null>(null);
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

    const inputClasses =
        "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-white/25 outline-none transition-all duration-300 focus:border-primary/30 focus:";

    return (
        <PageLayout
            badge="Contact"
            title={
                <>
                    Get in{" "}
                    <span className="text-primary">touch</span>
                </>
            }
            subtitle="Have a question, feedback, or partnership idea? We'd love to hear from you."
        >
            {/* ── Contact Form + Info ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-5 gap-12">
                        {/* Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease }}
                            className="lg:col-span-3"
                        >
                            <div className="relative rounded-xl border border-border bg-card backdrop-blur-sm p-8 overflow-hidden">
                                {/* Glow */}
                                <div
                                    className="absolute -top-20 -left-20 w-60 h-60 rounded-full pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(circle, transparent 0%, transparent 60%)",
                                    }}
                                />

                                <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Your name"
                                                value={formState.name}
                                                onChange={handleChange}
                                                onFocus={() => setFocusedField("name")}
                                                onBlur={() => setFocusedField(null)}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="your@email.com"
                                                value={formState.email}
                                                onChange={handleChange}
                                                onFocus={() => setFocusedField("email")}
                                                onBlur={() => setFocusedField(null)}
                                                className={inputClasses}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                                            Subject
                                        </label>
                                        <select
                                            name="subject"
                                            value={formState.subject}
                                            onChange={handleChange}
                                            className={inputClasses + " appearance-none cursor-pointer"}
                                        >
                                            {subjectOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            name="message"
                                            placeholder="Tell us what's on your mind..."
                                            value={formState.message}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField("message")}
                                            onBlur={() => setFocusedField(null)}
                                            rows={5}
                                            className={inputClasses + " resize-none"}
                                        />
                                    </div>

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

                                    <div className="flex flex-wrap items-center gap-4">
                                        <button
                                            type="submit"
                                            disabled={status === "sending"}
                                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-8 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            <Send size={15} />
                                            {status === "sending" ? "Sending…" : "Send Message"}
                                        </button>

                                        <p
                                            role="status"
                                            aria-live="polite"
                                            className={`text-sm ${status === "error" ? "text-destructive" : "text-primary/80"}`}
                                        >
                                            {status === "sent" && "Thanks — we'll reply within 24 hours."}
                                            {status === "error" && error}
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </motion.div>

                        {/* Info Cards */}
                        <div className="lg:col-span-2 space-y-5">
                            {contactInfo.map((info, i) => (
                                <motion.div
                                    key={info.title}
                                    initial={{ opacity: 0, x: 30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.6, ease }}
                                    className="group relative rounded-xl border border-border bg-card backdrop-blur-sm p-6 hover:border-primary/15 transition-colors duration-500"
                                >
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        style={{
                                            background: "radial-gradient(ellipse at top, transparent 0%, transparent 60%)",
                                        }}
                                    />
                                    <div className="relative z-10">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center mb-4`}>
                                            <info.icon size={20} className="text-foreground" />
                                        </div>
                                        <h3 className="font-semibold text-foreground text-sm mb-1">{info.title}</h3>
                                        <p className="text-primary/70 font-medium text-sm mb-1">{info.value}</p>
                                        <p className="text-xs text-muted-foreground">{info.description}</p>

                                        {info.socials && (
                                            <div className="flex gap-2 mt-3">
                                                {info.socials.map((s) => (
                                                    <a
                                                        key={s.label}
                                                        href={s.href}
                                                        aria-label={s.label}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground border border-border hover:text-primary/70 hover:border-primary/20 transition-all duration-300"
                                                    >
                                                        <s.icon size={14} />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* ── FAQ ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                            Frequently asked questions
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Can&apos;t find what you&apos;re looking for? Reach out to us directly.
                        </p>
                    </motion.div>

                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
                        ))}
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
