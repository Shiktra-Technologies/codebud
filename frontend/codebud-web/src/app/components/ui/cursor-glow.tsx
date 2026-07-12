"use client";

import React, { useEffect, useRef, useState } from "react";

/* ── CursorGlow ───────────────────────────────────────────────────── */
/* Global radial gradient that follows the mouse pointer              */

export function CursorGlow() {
    const glowRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!glowRef.current) return;
            if (!visible) setVisible(true);
            glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        };

        const handleMouseLeave = () => setVisible(false);
        const handleMouseEnter = () => setVisible(true);

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [visible]);

    return (
        <div
            ref={glowRef}
            className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
            style={{
                width: 600,
                height: 600,
                opacity: visible ? 1 : 0,
                background:
                    "radial-gradient(circle, rgba(255,193,7,0.04) 0%, rgba(255,193,7,0.015) 25%, transparent 50%)",
                willChange: "transform",
            }}
        />
    );
}
