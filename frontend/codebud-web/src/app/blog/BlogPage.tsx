"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { HexDivider } from "../components/ui/hex-divider";

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
    gradient: "from-amber-500/30 via-yellow-500/20 to-orange-500/30",
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
    Tutorials: "border-cyan-400/30 text-cyan-400/80 bg-cyan-400/[0.06]",
    News: "border-amber-400/30 text-amber-400/80 bg-amber-400/[0.06]",
    Community: "border-emerald-400/30 text-emerald-400/80 bg-emerald-400/[0.06]",
    Engineering: "border-violet-400/30 text-violet-400/80 bg-violet-400/[0.06]",
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
                    <span className="text-shimmer">tutorials</span>
                </>
            }
            subtitle="Deep dives, tutorials, product updates, and stories from the MYCODEBUD community."
        >
            {/* ── Featured Post ── */}
            <section className="pb-12 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg opacity-10 pointer-events-none" />
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <motion.article
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease }}
                        className="group relative rounded-2xl border border-white/[0.06] bg-surface-2/30 backdrop-blur-sm overflow-hidden cursor-pointer hover:border-yellow-400/15 transition-all duration-500"
                    >
                        {/* Gradient banner */}
                        <div className={`h-48 md:h-56 bg-gradient-to-br ${featuredPost.gradient} relative`}>
                            <div className="absolute inset-0 honeycomb-bg opacity-30" />
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-2/80 to-transparent" />
                            <div className="absolute top-5 left-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${categoryColors[featuredPost.category]}`}>
                                    <Tag size={10} />
                                    {featuredPost.category}
                                </span>
                            </div>
                            <div className="absolute top-5 right-5 px-3 py-1 bg-yellow-400/90 text-surface-0 text-[11px] font-bold rounded-full uppercase tracking-wider">
                                Featured
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-yellow-400/90 transition-colors duration-300">
                                {featuredPost.title}
                            </h2>
                            <p className="text-white/35 text-sm leading-relaxed mb-4 max-w-2xl">
                                {featuredPost.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-white/25">
                                <span>{featuredPost.date}</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {featuredPost.readTime}
                                </span>
                                <span className="ml-auto flex items-center gap-1 text-yellow-400/50 group-hover:text-yellow-400/80 font-medium transition-colors">
                                    Read article
                                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                </span>
                            </div>
                        </div>
                    </motion.article>
                </div>
            </section>

            <HexDivider />

            {/* ── Category filter + Post grid ── */}
            <section className="py-24 relative overflow-hidden bg-surface-0">
                <div className="absolute inset-0 honeycomb-bg-lg opacity-10 pointer-events-none" />
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
                                        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                                        : "border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/10"
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
                                className="group relative rounded-2xl border border-white/[0.06] bg-surface-2/20 backdrop-blur-sm p-6 cursor-pointer hover:border-yellow-400/15 hover:-translate-y-1 transition-all duration-500"
                            >
                                {/* Hover glow */}
                                <div
                                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{
                                        background: "radial-gradient(ellipse at top, rgba(255,193,7,0.03) 0%, transparent 60%)",
                                    }}
                                />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${categoryColors[post.category] || "border-white/10 text-white/40 bg-white/[0.03]"}`}>
                                            <Tag size={9} />
                                            {post.category}
                                        </span>
                                        <span className="text-[11px] text-white/20">{post.date}</span>
                                    </div>
                                    <h3 className="font-semibold text-white text-[15px] mb-2 group-hover:text-yellow-400/90 transition-colors duration-300 leading-snug">
                                        {post.title}
                                    </h3>
                                    <p className="text-xs text-white/30 leading-relaxed mb-4">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between text-[11px] text-white/20">
                                        <span className="flex items-center gap-1">
                                            <Clock size={11} />
                                            {post.readTime}
                                        </span>
                                        <span className="flex items-center gap-1 text-yellow-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
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
                            <p className="text-white/30 text-sm">
                                No posts in this category yet. Check back soon!
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>
        </PageLayout>
    );
}
