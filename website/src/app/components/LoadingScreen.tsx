"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

// --- Subcomponents for clean structure ---

const StaticHoneycomb = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                        <path fill="none" stroke="#FFC107" strokeWidth="1" d="M25 0 L50 14.4 L50 43.3 L25 57.7 L0 43.3 L0 14.4 Z" />
                        <path fill="none" stroke="#FFC107" strokeWidth="1" d="M0 28.8 L25 43.3 L25 72.1 L0 86.6 L-25 72.1 L-25 43.3 Z" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
        </div>
    );
};

const GlowingHexes = () => {
    // Stable random positions for hexes
    const [hexes, setHexes] = useState<{ id: number; x: number; y: number; scale: number; delay: number; duration: number }[]>([]);

    useEffect(() => {
        setHexes(
            Array.from({ length: 15 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                scale: Math.random() * 0.4 + 0.3,
                delay: Math.random() * 5,
                duration: Math.random() * 3 + 2,
            }))
        );
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            {hexes.map((hex) => (
                <motion.div
                    key={hex.id}
                    className="absolute"
                    style={{ left: `${hex.x}%`, top: `${hex.y}%`, width: 100 * hex.scale, height: 115 * hex.scale }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: hex.duration, repeat: Infinity, delay: hex.delay, ease: "easeInOut" }}
                >
                    <svg viewBox="0 0 100 115.47" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]">
                        <path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0Z" fill="rgba(255, 193, 7, 0.15)" stroke="#FFC107" strokeWidth="1.5" />
                    </svg>
                </motion.div>
            ))}
        </div>
    );
};

const Particles = () => {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);

    useEffect(() => {
        setParticles(
            Array.from({ length: 30 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: 100 + Math.random() * 20, // start slightly below
                size: Math.random() * 3 + 1.5,
                duration: Math.random() * 10 + 8,
                delay: Math.random() * 5,
            }))
        );
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-[#FFC107] blur-[1px]"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                    animate={{ y: [0, -800], opacity: [0, 0.8, 0], scale: [1, 1.5, 1] }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
};

const EnergyFlow = () => {
    // Network-like light trails using absolute curves
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
            {[
                { d: "M 0,20 Q 30,20 40,50 T 100,80", delay: 0, dur: 4 },
                { d: "M 100,30 Q 70,30 60,60 T 0,90", delay: 2, dur: 5 },
                { d: "M 20,0 Q 20,40 50,50 T 80,100", delay: 1, dur: 4.5 },
                { d: "M 80,0 Q 80,30 50,60 T 20,100", delay: 3, dur: 3.5 },
            ].map((p, i) => (
                <motion.path
                    key={i}
                    d={p.d}
                    fill="none"
                    stroke="#FFC107"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                    transition={{
                        duration: p.dur,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut",
                    }}
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-[0_0_5px_rgba(255,193,7,0.8)]"
                />
            ))}
        </svg>
    );
};

const CenterHexagon = () => {
    const symbols = ["</>", "{ }", "[ ]", "=>", "( )", "AI"];
    const [symbolIdx, setSymbolIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSymbolIdx((prev) => (prev + 1) % symbols.length);
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex items-center justify-center w-40 h-40 mb-12">
            {/* Ambient background glow */}
            <motion.div
                className="absolute w-32 h-32 rounded-full bg-[#FFC107] blur-[60px]"
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Rotating Outer Dashed Hexagon */}
            <motion.div
                className="absolute inset-0 drop-shadow-[0_0_15px_rgba(255,193,7,0.5)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
                <svg viewBox="0 0 100 115.47" fill="none" className="w-full h-full">
                    <path
                        d="M50 2L91.569 26V74L50 98L8.43097 74V26L50 2Z"
                        stroke="#FFC107"
                        strokeWidth="1.5"
                        strokeDasharray="12 8"
                        opacity="0.8"
                    />
                </svg>
            </motion.div>

            {/* Inner Glowing Hexagon - breathing */}
            <motion.div
                className="absolute w-28 h-28 flex items-center justify-center cursor-default hover:scale-105 transition-transform duration-500"
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <svg
                    viewBox="0 0 100 115.47"
                    fill="none"
                    className="absolute inset-0 w-full h-full drop-shadow-[0_0_20px_rgba(255,193,7,0.6)]"
                >
                    <path d="M50 3L90.705 26.5V73.5L50 97L9.29498 73.5V26.5L50 3Z" stroke="#FFC107" strokeWidth="2.5" />
                    <path d="M50 3L90.705 26.5V73.5L50 97L9.29498 73.5V26.5L50 3Z" fill="rgba(255, 193, 7, 0.08)" />
                </svg>

                <AnimatePresence mode="wait">
                    <motion.span
                        key={symbolIdx}
                        initial={{ opacity: 0, scale: 0.5, rotate: -45, filter: "blur(4px)" }}
                        animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.5, rotate: 45, filter: "blur(4px)" }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[#FFC107] font-mono text-2xl font-bold z-10 drop-shadow-[0_0_8px_rgba(255,193,7,0.8)]"
                    >
                        {symbols[symbolIdx]}
                    </motion.span>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

const LoadingText = () => {
    const texts = [
        "Initializing CodeBud...",
        "Booting Neural Engine...",
        "Establishing Sync...",
        "Loading Modules...",
        "Brewing Coffee...",
        "Preparing Workspace...",
    ];
    const [textIdx, setTextIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIdx((prev) => (prev + 1) % texts.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center">
            <div className="h-6 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={textIdx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.5, ease: "backOut" }}
                        className="flex items-center space-x-2 text-[#FFC107]"
                    >
                        <span className="font-mono text-sm tracking-[0.2em] uppercase opacity-90">
                            {texts[textIdx]}
                        </span>
                        <motion.span
                            animate={{ opacity: [0, 1, 1, 0, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1], ease: "linear" }}
                            className="inline-block w-2.5 h-4 bg-[#FFC107] drop-shadow-[0_0_5px_rgba(255,193,7,0.8)]"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Subtle progress bar that fills over time */}
            <div className="w-48 h-[1px] bg-[#FFC107]/20 mt-6 rounded-full overflow-hidden relative">
                <motion.div
                    className="absolute top-0 left-0 bottom-0 w-full bg-[#FFC107] drop-shadow-[0_0_10px_rgba(255,193,7,1)]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 15, ease: "linear" }}
                />
            </div>
        </div>
    );
};

export default function LoadingScreen() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Parallax effect calculations
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 20px offset
            const y = (e.clientY / window.innerHeight - 0.5) * 20; // max 20px offset
            setMousePosition({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden"
        >
            <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{
                    x: -mousePosition.x,
                    y: -mousePosition.y
                }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
            >
                <StaticHoneycomb />
                <GlowingHexes />
                <EnergyFlow />
                <Particles />
            </motion.div>

            {/* Content layer, also slightly moves but opposite way for 3D feel */}
            <motion.div
                className="relative z-10 flex flex-col items-center justify-center"
                animate={{
                    x: mousePosition.x * 0.5,
                    y: mousePosition.y * 0.5
                }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
            >
                <CenterHexagon />
                <LoadingText />
            </motion.div>

            {/* Soft vignette overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.8)_80%)]" />
        </motion.div>
    );
}
