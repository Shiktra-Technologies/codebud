"use client";

/*
 * Reading layout for the legal pages: a sticky mono table of contents with a
 * brass marker on the section you are reading and a progress rail beside it,
 * and numbered sections (§01, §02 …) in the display face. Table-of-contents
 * links scroll through Lenis, so the jump eases like everything else.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll } from "motion/react";

import { cn } from "@/lib/utils";
import { useLenis } from "../home/lenis";
import { EASE_OUT } from "../home/primitives";

export interface LegalSectionDef {
    id: string;
    title: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function LegalLayout({ sections, children }: { sections: LegalSectionDef[]; children: React.ReactNode }) {
    const lenis = useLenis();
    const bodyRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(sections[0]?.id);
    const { scrollYProgress } = useScroll({ target: bodyRef, offset: ["start 0.35", "end 0.65"] });

    // The section whose heading has passed the top third of the viewport.
    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const line = window.innerHeight * 0.35;
            let current = sections[0]?.id;
            for (const s of sections) {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= line) current = s.id;
            }
            setActive((prev) => (prev === current ? prev : current));
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
        };
    }, [sections]);

    const jump = (id: string) => (e: React.MouseEvent) => {
        const el = document.getElementById(id);
        if (!el || !lenis) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -window.innerHeight * 0.2, duration: 1.2 });
        history.replaceState(null, "", `#${id}`);
    };

    return (
        <section className="page-section">
            <div className="legal">
                <aside className="legal__toc">
                    <nav aria-label="On this page">
                        <p className="scene-label text-carbon-secondary">On this page</p>
                        <div className="legal__toc-body">
                            <span aria-hidden="true" className="legal__rail">
                                <motion.span className="legal__rail-fill" style={{ scaleY: scrollYProgress }} />
                            </span>
                            <ol>
                                {sections.map((s, i) => (
                                    <li key={s.id}>
                                        <a
                                            href={`#${s.id}`}
                                            onClick={jump(s.id)}
                                            aria-current={active === s.id ? "location" : undefined}
                                            className={cn("legal__link mh-focus", active === s.id && "is-active")}
                                        >
                                            <span className="legal__link-num">{pad2(i + 1)}</span>
                                            {s.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </nav>
                </aside>
                <div ref={bodyRef} className="legal__body">
                    {children}
                </div>
            </div>
        </section>
    );
}

export function LegalSection({
    id,
    title,
    index,
    children,
}: {
    id: string;
    title: string;
    index: number;
    children: React.ReactNode;
}) {
    return (
        <motion.section
            id={id}
            className="legal-section"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
        >
            <p className="legal-section__num">§{pad2(index + 1)}</p>
            <h2 className="legal-section__title">{title}</h2>
            <div className="legal-section__body">{children}</div>
        </motion.section>
    );
}
