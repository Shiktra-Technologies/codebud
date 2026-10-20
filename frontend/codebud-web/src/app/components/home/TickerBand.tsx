"use client";

/*
 * Ticker — a short band between the story and the journey.
 *
 * The numbers run one way in display type, the credentials the other way in
 * mono. The drift is driven by the wheel rather than a clock alone: scrolling
 * speeds it up, and scrolling back up reverses both rows. Each row is two
 * copies of the same strip, wrapped by one strip's width, so it never shows a
 * seam. The loop only runs while the band is on screen.
 */

import { useEffect, useRef } from "react";

import { TICKER_CREDENTIALS, TICKER_FIGURES } from "./content";

function Strip({ items, variant, hidden }: { items: string[]; variant: "figures" | "credentials"; hidden?: boolean }) {
    return (
        <ul className="ticker__strip" aria-hidden={hidden || undefined}>
            {items.map((item, i) => (
                <li key={item} className="ticker__item">
                    <span className={variant === "figures" && i % 2 === 1 ? "ticker__outline" : undefined}>{item}</span>
                    {variant === "figures" ? (
                        <svg aria-hidden="true" viewBox="-16 -14 32 28" className="ticker__hex">
                            <polygon points="15,0 7.5,12.99 -7.5,12.99 -15,0 -7.5,-12.99 7.5,-12.99" />
                        </svg>
                    ) : (
                        <span aria-hidden="true" className="ticker__dot">
                            ·
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

export function TickerBand() {
    const bandRef = useRef<HTMLElement>(null);
    const rowA = useRef<HTMLDivElement>(null);
    const rowB = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const band = bandRef.current;
        const a = rowA.current;
        const b = rowB.current;
        if (!band || !a || !b) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let wa = 1;
        let wb = 1;
        const measure = () => {
            wa = (a.firstElementChild as HTMLElement | null)?.offsetWidth || 1;
            wb = (b.firstElementChild as HTMLElement | null)?.offsetWidth || 1;
        };
        // Measured from the observer's reports (the first comes right after
        // layout), never inline during mount.
        const ro = new ResizeObserver(measure);
        ro.observe(a);
        ro.observe(b);

        // Offsets wrap by one strip's width, so 0 and -width show the same.
        let xa = 0;
        let xb = 0;
        let dir = 1;
        let boost = 0;
        let lastY = window.scrollY;
        let lastT = 0;
        let raf = 0;
        let onScreen = false;

        const wrap = (x: number, span: number) => {
            while (x <= -span) x += span;
            while (x > 0) x -= span;
            return x;
        };

        const tick = (now: number) => {
            raf = 0;
            if (!onScreen) {
                lastT = 0;
                return;
            }
            const dt = lastT ? Math.min(64, now - lastT) : 16.7;
            lastT = now;
            const y = window.scrollY;
            const v = (y - lastY) / dt; // px per ms
            lastY = y;
            if (Math.abs(v) > 0.01) dir = v > 0 ? 1 : -1;
            boost += (Math.min(4, Math.abs(v) * 1.6) - boost) * (1 - Math.pow(0.9, dt / 16.7));

            const step = (0.04 + boost * 0.55) * dt * dir;
            xa = wrap(xa - step, wa);
            xb = wrap(xb + step * 0.75, wb);
            a.style.transform = `translate3d(${xa.toFixed(2)}px, 0, 0)`;
            b.style.transform = `translate3d(${xb.toFixed(2)}px, 0, 0)`;
            raf = requestAnimationFrame(tick);
        };

        const io = new IntersectionObserver(
            ([entry]) => {
                onScreen = entry.isIntersecting;
                if (onScreen && !raf) raf = requestAnimationFrame(tick);
            },
            { rootMargin: "120px 0px" },
        );
        io.observe(band);

        return () => {
            cancelAnimationFrame(raf);
            io.disconnect();
            ro.disconnect();
        };
    }, []);

    return (
        <section ref={bandRef} aria-label="MYCODEBUD in numbers" className="ticker">
            <div className="ticker__row ticker__row--figures">
                <div ref={rowA} className="ticker__track">
                    <Strip items={TICKER_FIGURES} variant="figures" />
                    <Strip items={TICKER_FIGURES} variant="figures" hidden />
                </div>
            </div>
            <div className="ticker__row ticker__row--credentials">
                <div ref={rowB} className="ticker__track">
                    <Strip items={TICKER_CREDENTIALS} variant="credentials" />
                    <Strip items={TICKER_CREDENTIALS} variant="credentials" hidden />
                </div>
            </div>
        </section>
    );
}
