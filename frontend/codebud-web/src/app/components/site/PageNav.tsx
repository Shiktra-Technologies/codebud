"use client";

/*
 * The homepage's section bar, for every other page: same pill, same sliding
 * marker and hover decode, but its items are pages, and the marker sits on
 * the page you are on. Styles are the homepage's (.scene-nav*, home.css).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { PLATFORM_AUTH_URL } from "@/lib/platformUrl";
import { EASE_OUT, ScrambleText } from "../home/primitives";

const PAGES = [
    { href: "/", label: "Home" },
    { href: "/#how", label: "How it works" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
];

export function PageNav() {
    const pathname = usePathname();
    const reduce = useReducedMotion();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const id = window.setTimeout(() => setReady(true), reduce ? 0 : 500);
        return () => window.clearTimeout(id);
    }, [reduce]);

    return (
        <motion.nav
            aria-label="Site"
            className="scene-nav"
            initial={{ opacity: 0, y: 28 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
        >
            <Link href="/" className="scene-nav__mark mh-focus" aria-label="MYCODEBUD — home">
                <img src="/logo/logo-sm.webp" alt="" className="h-5 w-5 object-contain" />
            </Link>
            <ul className="scene-nav__list mh-no-scrollbar">
                {PAGES.map((p) => (
                    <PageNavItem key={p.href} {...p} active={pathname === p.href} />
                ))}
            </ul>
            <a href={PLATFORM_AUTH_URL} className="scene-nav__cta mh-focus">
                Start <span aria-hidden="true">↗</span>
            </a>
        </motion.nav>
    );
}

function PageNavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
    const [replay, setReplay] = useState(0);
    return (
        <li className="relative">
            {active && (
                <motion.span
                    layoutId="page-nav-active"
                    className="scene-nav__active"
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                />
            )}
            <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("scene-nav__link mh-focus", active && "is-active")}
                onMouseEnter={() => setReplay((n) => n + 1)}
                onFocus={() => setReplay((n) => n + 1)}
            >
                <ScrambleText text={label} from="text" active={replay > 0} replayKey={replay} duration={420} />
            </Link>
        </li>
    );
}
