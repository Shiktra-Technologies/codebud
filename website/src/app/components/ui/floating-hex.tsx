"use client";

import React from "react";
import { motion, type MotionProps } from "motion/react";
import { cn } from "./utils";

/* ── FloatingHex ──────────────────────────────────────────────────── */
/* Decorative floating hexagon with CSS hex-float animation           */

interface FloatingHexProps {
    size: number;
    x: string;
    y: string;
    delay?: number;
    opacity?: number;
    rotation?: number;
    className?: string;
}

export function FloatingHex({
    size,
    x,
    y,
    delay = 0,
    opacity = 0.06,
    rotation = 0,
    className,
}: FloatingHexProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity, scale: 1 }}
            transition={{
                duration: 1.5,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}
            className={cn("absolute pointer-events-none", className)}
            style={{ left: x, top: y }}
        >
            <div
                style={{
                    width: size,
                    height: size,
                    animation: `hex-float ${6 + delay * 2}s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                }}
            >
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <path
                        d="M50 3 L93.3 28 L93.3 72 L50 97 L6.7 72 L6.7 28 Z"
                        fill="none"
                        stroke="#FFC107"
                        strokeWidth="0.8"
                        opacity="0.6"
                    />
                </svg>
            </div>
        </motion.div>
    );
}
