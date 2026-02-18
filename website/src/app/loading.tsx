export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] bg-surface-0 flex flex-col items-center justify-center overflow-hidden">
            {/* Honeycomb background */}
            <div className="absolute inset-0 honeycomb-bg opacity-15 pointer-events-none" />

            {/* Spotlight */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 60%)",
                    animation: "spotlight-pulse 3s ease-in-out infinite",
                }}
            />

            {/* Floating code particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[
                    { symbol: "</>", x: "15%", y: "20%", delay: "0s", dur: "8s" },
                    { symbol: "{ }", x: "80%", y: "15%", delay: "1s", dur: "10s" },
                    { symbol: "=>", x: "70%", y: "70%", delay: "2s", dur: "9s" },
                    { symbol: "( )", x: "10%", y: "65%", delay: "0.5s", dur: "11s" },
                    { symbol: "//", x: "85%", y: "45%", delay: "1.5s", dur: "7s" },
                    { symbol: "&&", x: "25%", y: "80%", delay: "3s", dur: "12s" },
                ].map((p, i) => (
                    <span
                        key={i}
                        className="absolute font-mono text-yellow-400/[0.06] font-bold select-none loading-float-particle"
                        style={{
                            left: p.x,
                            top: p.y,
                            fontSize: 14,
                            animationDelay: p.delay,
                            animationDuration: p.dur,
                        }}
                    >
                        {p.symbol}
                    </span>
                ))}
            </div>

            {/* Logo */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Pulsing glow behind logo */}
                <div className="relative mb-8">
                    <div
                        className="absolute -inset-6 rounded-2xl"
                        style={{
                            background: "radial-gradient(circle, rgba(255,193,7,0.15) 0%, transparent 70%)",
                            animation: "logo-pulse 2s ease-in-out infinite",
                        }}
                    />
                    <div className="relative w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,193,7,0.2)]"
                        style={{ animation: "logo-breathe 2s ease-in-out infinite" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-8 h-8">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                </div>

                {/* Brand name with shimmer */}
                <h1 className="text-2xl font-bold tracking-tight mb-3 text-shimmer">
                    CODE BUD
                </h1>

                {/* Loading dots */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-yellow-400"
                            style={{
                                animation: "loading-dot 1.4s ease-in-out infinite",
                                animationDelay: `${i * 0.16}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                    style={{
                        animation: "loading-progress 1.5s ease-in-out infinite",
                    }}
                />
            </div>
        </div>
    );
}
