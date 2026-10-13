"use client";

/*
 * The homepage's only chrome: a compact section bar fixed to the bottom edge,
 * plus SKIP while a pinned scene holds the viewport.
 *
 * The active section is whichever one owns the middle of the viewport; a bone
 * pill slides between labels to mark it. Clicks route through Lenis so a jump
 * across several scenes plays through them at speed rather than cutting.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { PLATFORM_AUTH_URL } from "@/lib/platformUrl";
import { SECTIONS, type SectionId } from "./content";
import { useLenis } from "./lenis";
import { EASE_OUT, ScrambleText } from "./primitives";

export function SceneNav() {
    const lenis = useLenis();
    const reduce = useReducedMotion();
    const [active, setActive] = useState<SectionId>("home");
    const [skipTo, setSkipTo] = useState<SectionId | null>(null);
    const [ready, setReady] = useState(false);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const id = window.setTimeout(() => setReady(true), reduce ? 0 : 1100);
        return () => window.clearTimeout(id);
    }, [reduce]);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const vh = window.innerHeight;
            let current: SectionId = "home";
            let skip: SectionId | null = null;
            SECTIONS.forEach((s, i) => {
                const el = document.getElementById(s.id);
                if (!el) return;
                const r = el.getBoundingClientRect();
                if (r.top <= vh * 0.5) {
                    current = s.id;
                    // Offer SKIP while the scene is pinned and has real distance left.
                    const next = SECTIONS[i + 1];
                    skip = s.pinned && next && r.top <= 1 && r.bottom - vh > vh * 0.35 ? next.id : null;
                }
            });
            setActive((prev) => (prev === current ? prev : current));
            setSkipTo((prev) => (prev === skip ? prev : skip));
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    // Keep the live label in view when the bar scrolls sideways on narrow screens.
    useEffect(() => {
        const list = listRef.current;
        const item = list?.querySelector<HTMLElement>(`[data-section="${active}"]`);
        if (!list || !item || list.scrollWidth <= list.clientWidth) return;
        const left = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
        list.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
    }, [active, reduce]);

    const go = useCallback(
        (id: SectionId) => {
            const el = document.getElementById(id);
            if (!el) return;
            const top = id === "home" ? 0 : el.getBoundingClientRect().top + window.scrollY;
            if (!lenis) {
                window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
                return;
            }
            const distance = Math.abs(top - window.scrollY);
            lenis.scrollTo(top, {
                duration: reduce ? 0 : Math.min(2.6, 0.9 + distance / 6000),
                easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
                immediate: !!reduce,
            });
        },
        [lenis, reduce],
    );

    return (
        <>
            <motion.nav
                aria-label="Page sections"
                className="scene-nav"
                initial={{ opacity: 0, y: 28 }}
                animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
            >
                <a
                    href="#home"
                    className="scene-nav__mark mh-focus"
                    aria-label="MYCODEBUD — back to top"
                    onClick={(e) => {
                        e.preventDefault();
                        go("home");
                    }}
                >
                    <img src="/logo/logo-sm.webp" alt="" className="h-5 w-5 object-contain" />
                </a>
                <ul ref={listRef} className="scene-nav__list mh-no-scrollbar">
                    {SECTIONS.map((s) => (
                        <NavItem key={s.id} id={s.id} label={s.label} active={active === s.id} onGo={go} />
                    ))}
                </ul>
                <a href={PLATFORM_AUTH_URL} className="scene-nav__cta mh-focus">
                    Start <span aria-hidden="true">↗</span>
                </a>
            </motion.nav>

            <AnimatePresence>
                {skipTo && (
                    <motion.button
                        key="skip"
                        type="button"
                        className="scene-skip mh-focus"
                        onClick={() => go(skipTo)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                    >
                        Skip <span aria-hidden="true">↓</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}

function NavItem({
    id,
    label,
    active,
    onGo,
}: {
    id: SectionId;
    label: string;
    active: boolean;
    onGo: (id: SectionId) => void;
}) {
    const [replay, setReplay] = useState(0);
    return (
        <li data-section={id} className="relative">
            {active && (
                <motion.span
                    layoutId="scene-nav-active"
                    className="scene-nav__active"
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                />
            )}
            <a
                href={`#${id}`}
                aria-current={active ? "true" : undefined}
                className={cn("scene-nav__link mh-focus", active && "is-active")}
                onMouseEnter={() => setReplay((n) => n + 1)}
                onFocus={() => setReplay((n) => n + 1)}
                onClick={(e) => {
                    e.preventDefault();
                    onGo(id);
                }}
            >
                <ScrambleText text={label} from="text" active={replay > 0} replayKey={replay} duration={420} />
            </a>
        </li>
    );
}
