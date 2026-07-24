"use client";

/**
 * Full-screen loading splash — Metallic Black.
 * Pure CSS keyframes (logo-breathe / loading-dot / loading-progress from
 * theme.css); no animation library. Honors prefers-reduced-motion via the
 * global guard.
 */
export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
            {/* Brand mark */}
            <div
                className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-8"
                style={{ animation: "logo-breathe 2.5s ease-in-out infinite" }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-7 h-7 text-primary-foreground"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>

            {/* Status line */}
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <span className="text-sm font-medium tracking-wide">Loading MyCodeBud</span>
                <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-muted-foreground"
                            style={{ animation: `loading-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
                        />
                    ))}
                </span>
            </div>

            {/* Indeterminate progress hairline */}
            <div className="w-48 h-px bg-border rounded-full overflow-hidden relative">
                <div
                    className="absolute top-0 bottom-0 bg-primary"
                    style={{ animation: "loading-progress 1.8s ease-in-out infinite" }}
                />
            </div>
        </div>
    );
}
