/*
 * HexCluster — decorative 3D honeycomb cells drifting in a section's corners.
 *
 * The same flat-top hexagon as the ambient field and the icon plinths, at a
 * third scale: field (texture) → badge (component) → cluster (scenery). Purely
 * CSS transforms — see `.hex-cluster` in theme.css. No canvas, no engine.
 *
 * Its parent needs `position: relative`, and the cluster is `aria-hidden` and
 * `pointer-events: none`, so it never enters the accessibility tree or eats a
 * click. Motion stops with `data-honey="off"` like every other ambient layer.
 */

interface Cell {
    /** Percentage offsets within the parent box. */
    left: string;
    top: string;
    size: number;
    /** Seconds for one drift cycle. */
    dur: number;
    delay: number;
    opacity: number;
}

const LEFT_CELLS: Cell[] = [
    { left: "4%", top: "18%", size: 72, dur: 21, delay: 0, opacity: 0.5 },
    { left: "11%", top: "58%", size: 44, dur: 17, delay: -6, opacity: 0.35 },
    { left: "2%", top: "76%", size: 96, dur: 25, delay: -12, opacity: 0.22 },
];

const RIGHT_CELLS: Cell[] = [
    { left: "88%", top: "12%", size: 58, dur: 19, delay: -3, opacity: 0.42 },
    { left: "93%", top: "48%", size: 88, dur: 23, delay: -9, opacity: 0.25 },
    { left: "82%", top: "80%", size: 40, dur: 16, delay: -14, opacity: 0.4 },
];

export function HexCluster({ side = "both" }: { side?: "left" | "right" | "both" }) {
    const cells =
        side === "left" ? LEFT_CELLS : side === "right" ? RIGHT_CELLS : [...LEFT_CELLS, ...RIGHT_CELLS];

    return (
        <div className="hex-cluster" aria-hidden="true">
            {cells.map((c, i) => (
                <div
                    key={i}
                    className="hex-float"
                    style={
                        {
                            left: c.left,
                            top: c.top,
                            width: c.size,
                            height: c.size,
                            opacity: c.opacity,
                            "--dur": `${c.dur}s`,
                            "--delay": `${c.delay}s`,
                        } as React.CSSProperties
                    }
                >
                    <i />
                </div>
            ))}
        </div>
    );
}
