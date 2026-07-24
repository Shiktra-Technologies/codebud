import localFont from "next/font/local";

/*
 * Machined Hive typography (WS-2). Self-hosted .woff2, no CDN — CSP-clean.
 * Cabinet Grotesk (display) + Switzer (body) via Fontshare; JetBrains Mono
 * (utility/data) self-hosted. Exposed as CSS vars consumed by theme.css
 * (@theme inline: --font-display / --font-sans / --font-mono).
 *
 * adjustFontFallback (§D10): generates a metric-adjusted fallback @font-face
 * (size-adjust / ascent-override / …) so the swap from fallback→real face
 * shifts no layout — zero font-swap CLS. "Arial" is the correct reference for
 * the two grotesks. For a MONOSPACE, an Arial-based adjustment mismatches, so
 * JetBrains uses false + ui-monospace (already metric-close for any mono).
 */

export const cabinet = localFont({
    variable: "--font-cabinet",
    display: "swap",
    adjustFontFallback: "Arial",
    fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
    src: [
        { path: "./CabinetGrotesk-Medium.woff2", weight: "500", style: "normal" },
        { path: "./CabinetGrotesk-Bold.woff2", weight: "700", style: "normal" },
        { path: "./CabinetGrotesk-Extrabold.woff2", weight: "800", style: "normal" },
    ],
});

export const switzer = localFont({
    variable: "--font-switzer",
    display: "swap",
    adjustFontFallback: "Arial",
    fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
    src: [
        { path: "./Switzer-Regular.woff2", weight: "400", style: "normal" },
        { path: "./Switzer-Medium.woff2", weight: "500", style: "normal" },
        { path: "./Switzer-Semibold.woff2", weight: "600", style: "normal" },
    ],
});

export const jetbrains = localFont({
    variable: "--font-jetbrains",
    display: "swap",
    adjustFontFallback: false, // §D10: Arial-based adjust mismatches a monospace; ui-monospace is metric-close
    // §D10 add: lead with real monospaces (advance-width matched) so table
    // numerics don't reflow columns on swap. WS-9 checks a table-heavy surface.
    fallback: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
    src: [
        { path: "./JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
        { path: "./JetBrainsMono-Medium.woff2", weight: "500", style: "normal" },
    ],
});

/** Applied on <html>; sets --font-cabinet / --font-switzer / --font-jetbrains. */
export const fontVariables = `${cabinet.variable} ${switzer.variable} ${jetbrains.variable}`;
