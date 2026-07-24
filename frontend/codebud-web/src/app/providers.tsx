"use client";

import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        // §D12a: honor §3 reduced-motion guard for `motion` (which bypasses the
        // CSS guard). "user" disables transform/layout animation and snaps to the
        // target — opacity still runs, which §3 permits.
        <MotionConfig reducedMotion="user">
            {children}
        </MotionConfig>
    );
}
