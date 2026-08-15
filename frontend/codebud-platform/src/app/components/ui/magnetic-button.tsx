"use client";

import React, { useRef } from "react";
import { Button, type buttonVariants } from "./button";
import { cn } from "./utils";
import type { VariantProps } from "class-variance-authority";

/* ── MagneticButton ───────────────────────────────────────────────── */
/* Button that subtly follows cursor position for a magnetic effect   */

interface MagneticButtonProps
    extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
    intensity?: number;
    asChild?: boolean;
}

export function MagneticButton({
    children,
    className,
    intensity = 0.08,
    variant = "brand",
    size = "xl",
    ...props
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = ref.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * intensity;
        const y = (e.clientY - rect.top - rect.height / 2) * intensity;
        btn.style.transform = `translate(${x}px, ${y}px) scale(1.02)`;
    };

    const handleMouseLeave = () => {
        const btn = ref.current;
        if (btn) btn.style.transform = "translate(0, 0) scale(1)";
    };

    return (
        <Button
            ref={ref}
            variant={variant}
            size={size}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn("transition-[background-color,box-shadow]", className)}
            style={{
                transition:
                    "transform 0.2s ease-out, background-color 0.3s, box-shadow 0.3s",
            }}
            {...props}
        >
            {children}
        </Button>
    );
}
