"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Categories ── */
const categories = ["All", "Tutorials", "News", "Community", "Engineering"];

/* ── Blog posts (static placeholder) ── */
const featuredPost = {
    title: "How We Built a Real-Time Collaborative Code Editor",
    excerpt:
        "A deep dive into the architecture behind MYCODEBUD's pair-programming feature — from CRDTs to WebSocket orchestration and conflict resolution at scale.",
    category: "Engineering",
    date: "Feb 10, 2026",
    readTime: "12 min read",
    gradient: "from-primary/30 via-primary/20 to-muted",
};

const posts = [
    {
        title: "10 JavaScript Patterns Every Developer Should Know",
        excerpt: "Master these essential patterns to write cleaner, more maintainable code in any JavaScript project.",
        category: "Tutorials",
        date: "Feb 5, 2026",
        readTime: "8 min read",
    },
    {
        title: "MYCODEBUD 2.0: What's New in Our Biggest Update",
        excerpt: "AI-powered code reviews, learning streaks, and a redesigned dashboard — here's everything in our 2.0 release.",
        category: "News",
        date: "Jan 28, 2026",
        readTime: "5 min read",
    },
    {
        title: "From Zero to Full-Stack: A Student Success Story",
        excerpt: "How Maya went from knowing nothing about code to landing her dream job in just 6 months with MYCODEBUD.",
        category: "Community",
        date: "Jan 20, 2026",
        readTime: "6 min read",
    },
    {
        title: "Understanding React Server Components",
        excerpt: "A comprehensive guide to React Server Components, when to use them, and how they change the way we think about rendering.",
        category: "Tutorials",
        date: "Jan 15, 2026",
        readTime: "10 min read",
    },
    {
        title: "Building Accessible Web Applications",
        excerpt: "Accessibility isn't an afterthought — it's a feature. Learn the fundamentals of WCAG compliance and inclusive design.",
        category: "Tutorials",
        date: "Jan 8, 2026",
        readTime: "7 min read",
    },
    {
        title: "Our Community Hits 10,000 Members",
        excerpt: "A celebration of milestones, the power of learning together, and what's next for the MYCODEBUD community.",
        category: "Community",
        date: "Jan 2, 2026",
        readTime: "4 min read",
    },
];

/* ── Category colors ── */
const categoryColors: Record<string, string> = {
    Tutorials: "border-border text-muted-foreground bg-muted",
    News: "border-primary/30 text-primary/80 bg-primary/[0.06]",
    Community: "border-border text-foreground bg-muted",
    Engineering: "border-border text-muted-foreground bg-muted",
};

/* ── Page ── */
export function BlogPage() {
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredPosts =
        activeCategory === "All"
            ? posts
            : posts.filter((p) => p.category === activeCategory);

    return (
        <PageLayout
            badge="Blog"
            title={
                <>
                    Insights &{" "}
                    <span className="text-primary">tutorials</span>
                </>
            }
            subtitle="Deep dives, tutorials, product updates, and stories from the MYCODEBUD community."
        >
            {/* ── Featured Post ── */}
            <section className="pb-12 relative overflow-hidden bg-background">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <motion.article
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease }}
                        className="group relative rounded-xl border border-border bg-card backdrop-blur-sm overflow-hidden cursor-pointer hover:border-primary/15 transition-colors duration-500"
                    >
                        {/* Gradient banner */}
                        <div className={`h-48 md:h-56 bg-gradient-to-br ${featuredPost.gradient} relative`}>
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
                            <div className="absolute top-5 left-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${categoryColors[featuredPost.category]}`}>
                                    <Tag size={10} />
                                    {featuredPost.category}
                                </span>
                            </div>
                            <div className="absolute top-5 right-5 px-3 py-1 bg-primary/90 text-primary-foreground text-[11px] font-bold rounded-full uppercase tracking-wider">
                                Featured
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-primary/90 transition-colors duration-300">
                                {featuredPost.title}
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-2xl">
                                {featuredPost.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                                <span>{featuredPost.date}</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {featuredPost.readTime}
                                </span>
                                <span className="ml-auto flex items-center gap-1 text-primary/50 group-hover:text-primary/80 font-medium transition-colors">
                                    Read article
                                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                </span>
                            </div>
                        </div>
                    </motion.article>
                </div>
            </section>


            {/* ── Category filter + Post grid ── */}
            <section className="py-24 relative overflow-hidden bg-background">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    {/* Category pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease }}
                        className="flex flex-wrap gap-2 mb-12"
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${activeCategory === cat
                                        ? "border-primary/40 bg-primary/10 text-primary"
                                        : "border-border text-muted-foreground hover:text-muted-foreground hover:border-border"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </motion.div>

                    {/* Posts grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredPosts.map((post, i) => (
                            <motion.article
                                key={post.title}
                                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07, duration: 0.5, ease }}
                                className="group relative rounded-xl border border-border bg-card backdrop-blur-sm p-6 cursor-pointer hover:border-primary/15 hover:-translate-y-1 transition-colors duration-500"
                            >
                                {/* Hover glow */}
                                <div
                                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{
                                        background: "radial-gradient(ellipse at top, transparent 0%, transparent 60%)",
                                    }}
                                />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${categoryColors[post.category] || "border-border text-muted-foreground bg-muted"}`}>
                                            <Tag size={9} />
                                            {post.category}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground/70">{post.date}</span>
                                    </div>
                                    <h3 className="font-semibold text-foreground text-[15px] mb-2 group-hover:text-primary/90 transition-colors duration-300 leading-snug">
                                        {post.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
                                        <span className="flex items-center gap-1">
                                            <Clock size={11} />
                                            {post.readTime}
                                        </span>
                                        <span className="flex items-center gap-1 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                                            Read
                                            <ArrowRight size={11} />
                                        </span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    {filteredPosts.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <p className="text-muted-foreground text-sm">
                                No posts in this category yet. Check back soon!
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>
        </PageLayout>
    );
}
