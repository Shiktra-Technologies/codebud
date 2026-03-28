"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import {
    Navbar,
    Hero,
    Stats,
    Features,
    Testimonials,
    Pricing,
    CTA,
    Footer,
} from "./components/sections";
import { CursorGlow } from "./components/ui/cursor-glow";



export default function HomePage() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <>
            <CursorGlow />
            <Navbar />
            <main>
                <Hero />
                <Stats />
                <Features />
                <Testimonials />
                <Pricing />
                <CTA />
            </main>
            <Footer />
        </>
    );
}
