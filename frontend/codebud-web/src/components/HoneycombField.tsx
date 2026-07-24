/*
 * Machined Hive — ambient honeycomb field (WS-7, Amendment A §A2).
 *
 * A filled tessellated PLATE, not a wireframe grid: flat-top hexagonal cells
 * filled `--carbon-comb`, separated by a ~1px `--carbon-canvas` gutter.
 *   - NO strokes. Hairlines moiré on scroll and read as cheap wallpaper; the
 *     gutter is the page background showing between solid cells instead.
 *   - NO animation, ever. The ambient layer never moves.
 *   - ONE surface only: the fixed page canvas, z-0, pointer-events-none.
 *   - Masked out of the central content column and faded at all four edges —
 *     the comb lives in the margins, never under body text.
 *
 * Calibration (§A2 / §B1): perceptible only when deliberately looked for.
 * canvas 14.6% → comb 16.0% is a 1.4-point step. If a reviewer notices the
 * texture before the content, drop `--carbon-comb` toward 15.3% and change
 * nothing else. (§A4 gate: enabled-vs-disabled must not be immediately tellable.)
 */

const S = 32.33; // circumradius; flat-to-flat = √3·S ≈ 56px (§A2 cell size)
const H = Math.sqrt(3) * S; // ≈ 56 — tile height, column vertical pitch
const TILE_W = 3 * S; // ≈ 97 — tile width (two hex columns)
const R = S - 0.9; // fill radius < S leaves the ~1px canvas gutter (no stroke)

function hex(cx: number, cy: number): string {
    const p: string[] = [];
    for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 180) * (60 * k); // flat-top: vertices at 0,60,…,300
        p.push(`${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`);
    }
    return p.join(" ");
}

// Four cells per tile; edge cells complete across seams when the pattern repeats
// (0,H/2)+(3S,H/2) meet horizontally; (1.5S,0)+(1.5S,H) meet vertically.
const CELLS = [hex(0, H / 2), hex(1.5 * S, 0), hex(1.5 * S, H), hex(TILE_W, H / 2)];

export function HoneycombField() {
    // Comb in the side margins only: transparent center column, faded far edges,
    // plus a vertical edge fade — combined by intersecting the two masks.
    const maskH =
        "linear-gradient(to right, transparent 0%, #000 10%, #000 26%, transparent 41%, transparent 59%, #000 74%, #000 90%, transparent 100%)";
    const maskV = "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)";
    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                // §4 hard rule: the field never sits above content. A *fixed*
                // element at z-index:0 paints ABOVE static in-flow content, so
                // it sits at -1 — above the propagated body canvas, below flow.
                zIndex: -1,
                pointerEvents: "none",
                background: "var(--carbon-canvas, #0C0A08)",
                WebkitMaskImage: `${maskH}, ${maskV}`,
                maskImage: `${maskH}, ${maskV}`,
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
            }}
        >
            <svg width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
                <defs>
                    <pattern id="mh-comb" width={TILE_W} height={H} patternUnits="userSpaceOnUse">
                        {CELLS.map((pts, i) => (
                            <polygon key={i} points={pts} fill="var(--carbon-comb, #0F0D0A)" />
                        ))}
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mh-comb)" />
            </svg>
        </div>
    );
}

/*
 * L1 feature band (§D13b) — dashboard header zone only.
 *
 * Unlike the L0 plate this is MEANT to be seen: §D15 rules that §A4 item 3
 * (the "can't tell enabled from disabled" calibration) governs L0 only. Do not
 * tune this down to pass a test that isn't about it. Same geometry, brass fill.
 *
 * §D15a — anchors BELOW the sticky DashboardHeader. That bar keeps
 * `bg-background/80`, and 0.035 alpha under an 80% opaque fill resolves to
 * ~0.007 — invisible. `top` defaults to 4rem to clear the h-16 bar.
 *
 * Fades to nothing before the first card row, so it reads as a treatment of the
 * greeting zone rather than a texture applied to the whole page.
 */
export function HoneycombBand({ top = "4rem", height = 240 }: { top?: string; height?: number }) {
    const fade = "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)";
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
                height,
                zIndex: 0,
                pointerEvents: "none",
                WebkitMaskImage: fade,
                maskImage: fade,
            }}
        >
            <svg width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
                <defs>
                    <pattern id="mh-comb-l1" width={TILE_W} height={H} patternUnits="userSpaceOnUse">
                        {CELLS.map((pts, i) => (
                            <polygon key={i} points={pts} fill="rgba(242,183,5,0.035)" />
                        ))}
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mh-comb-l1)" />
            </svg>
        </div>
    );
}
