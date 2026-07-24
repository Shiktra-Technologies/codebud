import { notFound } from "next/navigation";

/*
 * Machined Hive — WS-1 token reference. Dev-only; 404 in production.
 * Renders every swatch, semantic mapping, radius tier, elevation, focus
 * state, and motion sample defined in theme.css. Not linked from any nav.
 */
export const metadata = { title: "Design Tokens — Machined Hive", robots: "noindex" };

type Sw = { name: string; v: string; note?: string; fg?: string };

const carbon: Sw[] = [
    { name: "carbon-canvas", v: "14.6% 0.006 75", note: "page bg · 18.12:1 bone" },
    { name: "carbon-comb", v: "16.0% 0.006 75", note: "honeycomb fill · RESERVED" },
    { name: "carbon-surface", v: "18.2% 0.007 75", note: "cards, panels" },
    { name: "carbon-elevated", v: "21.0% 0.009 75", note: "modals, popovers" },
    { name: "carbon-input", v: "24.1% 0.011 75", note: "inputs, wells" },
    { name: "carbon-border", v: "28.8% 0.013 75", note: "default hairline" },
    { name: "carbon-border-hi", v: "34.3% 0.016 75", note: "hover / focus border" },
    { name: "carbon-tertiary", v: "51.8% 0.021 75", note: "3.55:1 · decor only" },
    { name: "carbon-secondary", v: "70.3% 0.023 75", note: "7.47:1 · secondary text" },
    { name: "carbon-bone", v: "97.0% 0.004 75", note: "primary text" },
];
const brass: Sw[] = [
    { name: "brass-100", v: "95.6% 0.053 92" }, { name: "brass-200", v: "90.9% 0.104 91" },
    { name: "brass-300", v: "86.4% 0.144 89", note: "hover" }, { name: "brass-400", v: "83.4% 0.165 88", note: "focus ring" },
    { name: "brass-500", v: "81.1% 0.166 85", note: "PRIMARY · 10.86:1", fg: "var(--carbon-canvas)" },
    { name: "brass-600", v: "72.3% 0.148 84", note: "pressed" }, { name: "brass-700", v: "60.8% 0.124 84" },
    { name: "brass-900", v: "29.8% 0.059 87" },
];
const material: Sw[] = [
    { name: "patina-300", v: "78.1% 0.091 184" },
    { name: "patina-500", v: "63.4% 0.100 182", note: "success / student · 6.03:1", fg: "var(--carbon-canvas)" },
    { name: "patina-700", v: "48.2% 0.076 182" },
    { name: "signal-500", v: "61.7% 0.188 28", note: "danger · 4.91:1", fg: "var(--carbon-canvas)" },
    { name: "ember-500", v: "69.3% 0.161 51", note: "warning · 6.84:1", fg: "var(--carbon-canvas)" },
    { name: "steel-500", v: "65.9% 0.141 269", note: "info · 6.20:1", fg: "var(--carbon-canvas)" },
];
const semantic: Sw[] = [
    { name: "background", v: "→ carbon-canvas" }, { name: "foreground", v: "→ carbon-bone" },
    { name: "card", v: "→ carbon-surface" }, { name: "popover", v: "→ carbon-elevated" },
    { name: "primary", v: "→ brass-500", fg: "var(--primary-foreground)", note: "fg → canvas (§D1)" },
    { name: "secondary", v: "→ carbon-input", fg: "var(--secondary-foreground)" },
    { name: "muted", v: "→ carbon-input", fg: "var(--muted-foreground)", note: "fg → secondary (§D3)" },
    { name: "accent", v: "→ carbon-border", fg: "var(--accent-foreground)", note: "hover lightens (§D2)" },
    { name: "destructive", v: "→ signal-500", fg: "var(--destructive-foreground)", note: "fg → canvas (§D1)" },
    { name: "border", v: "→ carbon-border" }, { name: "input", v: "→ carbon-border" }, { name: "ring", v: "→ brass-400" },
    { name: "sidebar", v: "→ carbon-canvas", note: "chrome, hairline-split (§D4)" },
];
const bridge: Sw[] = [
    { name: "surface-0", v: "→ carbon-canvas" }, { name: "surface-1", v: "→ carbon-surface" },
    { name: "surface-2", v: "→ carbon-surface" }, { name: "surface-3", v: "→ carbon-elevated" },
    { name: "surface-4", v: "→ carbon-input" }, { name: "surface-5", v: "→ carbon-input" },
    { name: "surface-6", v: "→ carbon-border" },
];
const radii = [
    { name: "sm", v: "6px" }, { name: "md", v: "10px" }, { name: "lg", v: "14px" },
    { name: "xl", v: "20px · card" }, { name: "2xl", v: "28px · shell" }, { name: "full", v: "9999" },
];
const elev = [
    { name: "elev-1", v: "var(--elev-1)" }, { name: "elev-2", v: "var(--elev-2)" },
    { name: "elev-3", v: "var(--elev-3)" }, { name: "glow-brass", v: "var(--glow-brass)" },
];
const motion = [
    { name: "dur-fast", v: "120ms", d: "var(--dur-fast)" },
    { name: "dur-base", v: "200ms", d: "var(--dur-base)" },
    { name: "dur-slow", v: "380ms", d: "var(--dur-slow)" },
];
const typeScale = [
    { cls: "text-display-xl", sample: "Machined Hive", meta: "Cabinet 800 · 60/62 · -0.03em" },
    { cls: "text-display-lg", sample: "Build the future", meta: "Cabinet 700 · 44/48 · -0.025em" },
    { cls: "text-heading-lg", sample: "Find your first mentor", meta: "Cabinet 700 · 30/36 · -0.02em" },
    { cls: "text-heading-md", sample: "Project marketplace", meta: "Cabinet 500 · 22/28 · -0.015em" },
    { cls: "text-heading-sm", sample: "Upcoming sessions", meta: "Switzer 600 · 18/26 · -0.01em" },
    { cls: "text-body-lg", sample: "The comb carries the personality; the rest carries the work.", meta: "Switzer 400 · 17/28" },
    { cls: "text-body", sample: "Neutrals are warm-shifted, never pure gray.", meta: "Switzer 400 · 15/24" },
    { cls: "text-body-sm", sample: "Text on any brass fill is always carbon-canvas.", meta: "Switzer 400 · 13.5/20" },
    { cls: "text-label", sample: "SESSION ID", meta: "JetBrains 500 · 12/16 · 0.08em upper" },
    { cls: "text-data", sample: "10.86:1 · 380ms · #F2B705", meta: "JetBrains 400 · 13/18" },
];

function Swatch({ s, big }: { s: Sw; big?: boolean }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
                style={{
                    height: big ? 72 : 48, borderRadius: 10,
                    background: `var(--${s.name})`,
                    border: "1px solid var(--carbon-border)",
                    display: "flex", alignItems: "flex-end", padding: 8,
                    color: s.fg ?? "var(--carbon-secondary)",
                    fontFamily: "var(--font-mono)", fontSize: 11,
                }}
            >
                {s.fg ? "Aa · text" : ""}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--carbon-bone)" }}>{s.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--carbon-tertiary)" }}>{s.v}</div>
            {s.note && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--carbon-secondary)" }}>{s.note}</div>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--carbon-secondary)", marginBottom: 16 }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 } as const;

export default function DesignTokensPage() {
    if (process.env.NODE_ENV === "production") notFound();
    return (
        <main style={{ minHeight: "100vh", background: "var(--carbon-canvas)", color: "var(--carbon-bone)", padding: "48px 32px", maxWidth: 1120, margin: "0 auto" }}>
            <header style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em" }}>Machined Hive · Tokens</h1>
                <p style={{ color: "var(--carbon-secondary)", marginTop: 8, fontSize: 14 }}>
                    WS-1 reference. All values authored in OKLCH; contrast ratios measured vs <code>--carbon-canvas</code>.
                </p>
            </header>

            <Section title="Type scale — §2 (self-hosted, no CDN)">
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {typeScale.map(t => (
                        <div key={t.cls}>
                            <div className={t.cls} style={{ color: "var(--carbon-bone)" }}>{t.sample}</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--carbon-tertiary)", marginTop: 4 }}>
                                .{t.cls} · {t.meta}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Carbon — surfaces & text"><div style={grid}>{carbon.map(s => <Swatch key={s.name} s={s} />)}</div></Section>
            <Section title="Brass — primary"><div style={grid}>{brass.map(s => <Swatch key={s.name} s={s} />)}</div></Section>
            <Section title="Patina & semantics"><div style={grid}>{material.map(s => <Swatch key={s.name} s={s} />)}</div></Section>
            <Section title="shadcn semantic layer"><div style={grid}>{semantic.map(s => <Swatch key={s.name} s={s} big />)}</div></Section>
            <Section title="Bridge — surface-* (remove in WS-8)"><div style={grid}>{bridge.map(s => <Swatch key={s.name} s={s} />)}</div></Section>

            <Section title="Radii">
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {radii.map(r => (
                        <div key={r.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ width: 88, height: 88, background: "var(--carbon-surface)", border: "1px solid var(--carbon-border)", borderRadius: r.name === "full" ? 9999 : `var(--radius-${r.name})` }} />
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.name}</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--carbon-tertiary)" }}>{r.v}</div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Elevation — border + glow, not drop shadow">
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                    {elev.map(e => (
                        <div key={e.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ width: 140, height: 88, background: "var(--carbon-surface)", borderRadius: "var(--radius-xl)", boxShadow: e.v }} />
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{e.name}</div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Focus ring — brass-400, 2px offset">
                <button
                    style={{
                        background: "var(--primary)", color: "var(--primary-foreground)",
                        border: "none", borderRadius: "var(--radius-md)", padding: "10px 18px",
                        fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        outline: "2px solid var(--brass-400)", outlineOffset: 2,
                    }}
                >
                    Tab to me · focus-visible
                </button>
            </Section>

            <Section title="Motion — durations honor prefers-reduced-motion">
                <style>{`
                    @keyframes tokslide { from { transform: translateX(0); } to { transform: translateX(180px); } }
                    .tokbar { animation: tokslide 1.6s var(--ease-out) infinite alternate; }
                    @media (prefers-reduced-motion: reduce) { .tokbar { animation: none !important; } }
                `}</style>
                {motion.map(m => (
                    <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                        <div style={{ width: 90, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--carbon-secondary)" }}>{m.name}</div>
                        <div style={{ width: 240, height: 10, background: "var(--carbon-input)", borderRadius: 9999, overflow: "hidden" }}>
                            <div className="tokbar" style={{ width: 60, height: 10, background: "var(--brass-500)", borderRadius: 9999, animationDuration: `calc(${m.d} * 6)` }} />
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--carbon-tertiary)" }}>{m.v}</div>
                    </div>
                ))}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--carbon-tertiary)", marginTop: 8 }}>ease-out · cubic-bezier(.2,.8,.2,1) &nbsp;·&nbsp; ease-spring · cubic-bezier(.32,.72,0,1)</p>
            </Section>
        </main>
    );
}
