"use client";

/*
 * One Lenis instance for the homepage, shared through context so the scene
 * nav can drive programmatic scrolls through the same smoothing the wheel
 * uses. Lenis writes the native scroll position every frame, so `motion`'s
 * useScroll and every `position: sticky` stage keep working unchanged.
 */

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

export function LenisProvider({ children }: { children: React.ReactNode }) {
    const [lenis, setLenis] = useState<Lenis | null>(null);

    useEffect(() => {
        const instance = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        let frame = requestAnimationFrame(function raf(time: number) {
            instance.raf(time);
            frame = requestAnimationFrame(raf);
        });

        setLenis(instance);
        return () => {
            cancelAnimationFrame(frame);
            instance.destroy();
            setLenis(null);
        };
    }, []);

    return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
