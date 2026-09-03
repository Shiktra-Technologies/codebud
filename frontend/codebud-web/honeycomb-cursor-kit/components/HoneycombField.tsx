/*
 * Machined Hive — ambient honeycomb field (WS-7, Amendment A §A2).
 *
 * A tessellated PLATE of flat-top hexagonal cells filled `--carbon-comb`,
 * separated by a brass gutter — the signature honeycomb. The lines are the
 * page's own comb showing through, not a wireframe drawn on top of it:
 *
 *   - NO <line>/stroke primitives. A stroked tiling draws every shared edge
 *     twice, and two overlapping translucent strokes composite to a brighter
 *     seam than a lone edge — the tiling picks up a plaid. Instead the tile is
 *     backed with the brass tint and the cells are painted over it, so what
 *     reads as a 1.2px line is uniform gutter everywhere, drawn exactly once.
 *   - The PLATE never moves, and stays the resting comb and the fallback. The
 *     one exception to §A2's "never moves" (added deliberately, on request) is
 *     the <HoneycombWave> canvas layered over it, which redraws the comb with
 *     each cell displaced by a travelling wave. Switch it off with
 *     `data-honey="off"` and this plate is what remains.
 *   - ONE surface only: the fixed page canvas, z-0, pointer-events-none.
 *   - Faded at all four edges and damped through the middle, so the comb stays
 *     behind body text rather than competing with it.
 *
 * Calibration: the two dials are `--carbon-comb-edge` (gutter colour, the one
 * that decides how loud the comb is) and R (gutter width). The cell fill,
 * `--carbon-comb`, is NOT a lever — raising it flattens the cells into the
 * gutter and the honeycomb disappears into a grey wash.
 */

import { HoneycombWave } from "./HoneycombWave";

const S = 32.33; // circumradius; flat-to-flat = √3·S ≈ 56px (§A2 cell size)
const H = Math.sqrt(3) * S; // ≈ 56 — tile height, column vertical pitch
const TILE_W = 3 * S; // ≈ 97 — tile width (two hex columns)
const R = S - 0.6; // gutter half-width; 1.2px of brass between neighbouring cells

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
    // Comb across the full width, quieter behind the content column, faded far
    // edges, plus a vertical edge fade — the two masks are intersected.
    //
    // §A3: the centre stops were `transparent`, which switched the comb OFF
    // between 41% and 59% of the width (a ~260px dead band at 1440px) and put
    // roughly a third of the screen below half strength — read as "visible at
    // the sides, absent in the middle". They now hold alpha 0.45 so the comb is
    // continuous full-width while staying recessive under card text. 0.45 is
    // the dial that trades centre-column legibility against continuity; the
    // gutter colour is what makes the comb loud or quiet overall.
    const maskH =
        "linear-gradient(to right, transparent 0%, #000 10%, #000 26%, rgba(0,0,0,0.45) 41%, rgba(0,0,0,0.45) 59%, #000 74%, #000 90%, transparent 100%)";
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
                // Promoted to its own compositor layer. The comb never changes,
                // but as a full-viewport element behind everything it was being
                // re-composited whenever content above it repainted. On its own
                // layer it is rasterised once and then only re-used — the two
                // intersected masks in particular are not cheap to re-run.
                willChange: "transform",
                WebkitMaskImage: `${maskH}, ${maskV}`,
                maskImage: `${maskH}, ${maskV}`,
                WebkitMaskComposite: "source-in",
                maskComposite: "intersect",
            }}
        >
            <svg width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
                <defs>
                    <pattern id="mh-comb" width={TILE_W} height={H} patternUnits="userSpaceOnUse">
                        {/* Backing tint first: everything the cells do not cover
                            is left showing as the brass gutter. */}
                        <rect
                            width={TILE_W}
                            height={H}
                            fill="var(--carbon-comb-edge, rgba(242,183,5,0.22))"
                        />
                        {CELLS.map((pts, i) => (
                            <polygon key={i} points={pts} fill="var(--carbon-comb, #12100E)" />
                        ))}
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mh-comb)" />
            </svg>

            {/*
              * Wave layer (§A2 exception — the plate itself still never moves).
              *
              * The cells are DISPLACED, not merely shaded: a ring travelling
              * from beyond the corners to the centre lifts each hexagon as it
              * passes. That needs per-cell control, which a repeated <pattern>
              * cannot give, so the comb is redrawn on canvas — see
              * HoneycombWave for why canvas rather than 500-3,200 animated
              * elements.
              *
              * It paints opaquely OVER the plate above, which stays as the
              * resting comb and as the fallback when canvas is unavailable or
              * ambient motion is switched off.
              */}
            <HoneycombWave />
        </div>
    );
}

/*
 * L1 feature band (§D13b) — dashboard header zone only.
 *
 * Unlike the L0 plate this is MEANT to be seen: §D15 rules that §A4 item 3
 * (the "can't tell enabled from disabled" calibration) governs L0 only. Do not
 * tune this down to pass a test that isn't about it. Same geometry, and the
 * same gutter construction, run hotter.
 *
 * §D15a — anchors BELOW the sticky DashboardHeader. That bar keeps
 * `bg-background/80`, and a faint band under an 80% opaque fill resolves to
 * nothing — `top` defaults to 4rem to clear the h-16 bar.
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
                        {/* No backing rect here: the band sits over whatever the
                            page already paints, so the cells are the transparent
                            part and only the gutter is drawn. */}
                        <path
                            d={`M0,0 H${TILE_W} V${H} H0 Z ${CELLS.map((pts) => `M${pts.replace(/ /g, " L")} Z`).join(" ")}`}
                            fillRule="evenodd"
                            fill="var(--carbon-comb-edge-l1, rgba(242,183,5,0.10))"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mh-comb-l1)" />
            </svg>
        </div>
    );
}
