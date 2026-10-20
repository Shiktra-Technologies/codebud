/*
 * The displaced-honeycomb painter behind <HoneycombWave> — see that file for
 * what the wave is and why it is drawn this way.
 *
 * No DOM in here: it paints into whatever 2D context it is handed, so the same
 * code runs in the worker that normally owns the canvas
 * (honeycomb-wave.worker.ts) and on the main thread where a browser cannot
 * hand a canvas to a worker.
 */

/* Geometry — identical to HoneycombField's plate (§A2 cell size). */
const S = 32.33; // circumradius
const H = Math.sqrt(3) * S; // ≈ 56 — row pitch
const COL_PITCH = 1.5 * S; // ≈ 48.5 — column pitch
const R = S - 0.6; // cell radius; the 0.6 is half the gutter
const GUTTER_W = 1.2; // stroke width, matching the plate's gutter

/** Seconds for one pass from beyond the corners to the centre, then a beat. */
const PERIOD = 7;
const HOLD = 0.08; // fraction of the period spent at rest before the next pass

/** How far past the far corner the ring starts, as a fraction of the diagonal. */
const START = 1.15;

/** Half-width of the band that is displaced, in pixels of radius. */
const BAND = 150;

/** Peak lift at the crest, in CSS pixels. Around a fifth of the row pitch —
 *  enough that the grid visibly breaks alignment along the ridge, not so much
 *  that cells detach from the comb and read as loose tiles. */
const LIFT = 11;

/** Brightness buckets. Enough steps that the ridge reads as smooth; few enough
 *  that a frame stays a handful of draws. */
export const BUCKETS = 14;

/** Opaque inks, one fill and one stroke per bucket (index 0 = at rest). */
export interface WaveInks {
    canvas: string;
    fills: string[];
    strokes: string[];
}

type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/* Flat-top unit hexagon, vertices at 0°, 60°, … 300°. */
const HEX_X = Array.from({ length: 6 }, (_, k) => Math.cos((Math.PI / 3) * k));
const HEX_Y = Array.from({ length: 6 }, (_, k) => Math.sin((Math.PI / 3) * k));

/** Hermite ease, for ramping the wave in and out. */
function smoothstep(edge0: number, edge1: number, x: number) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

export function createWavePainter(ctx: Context, inks: WaveInks) {
    let width = 0;
    let height = 0;
    let maxRadius = 0;
    let count = 0;
    // Per cell: resting centre, distance from the screen centre, current lift.
    let xs = new Float32Array(0);
    let ys = new Float32Array(0);
    let dist = new Float32Array(0);
    let lifts = new Float32Array(0);
    const byBucket: number[][] = Array.from({ length: BUCKETS }, () => []);
    let resting = false; // the canvas already shows the comb at rest

    /** Size the backing store and lay the grid out for a viewport. */
    const resize = (w: number, h: number, dpr: number) => {
        width = w;
        height = h;
        ctx.canvas.width = Math.round(w * dpr);
        ctx.canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineWidth = GUTTER_W;
        ctx.lineJoin = "round";

        const centreX = w / 2;
        const centreY = h / 2;
        maxRadius = Math.hypot(centreX, centreY);

        // A row and column of overscan, so a lifted cell never uncovers an
        // edge of the grid.
        const cols = Math.ceil(w / COL_PITCH) + 2;
        const rows = Math.ceil(h / H) + 3;
        const size = (cols + 1) * (rows + 1);
        xs = new Float32Array(size);
        ys = new Float32Array(size);
        dist = new Float32Array(size);
        lifts = new Float32Array(size);
        count = 0;
        for (let i = -1; i < cols; i++) {
            const x = i * COL_PITCH;
            const stagger = i % 2 === 0 ? H / 2 : 0;
            for (let k = -1; k < rows; k++) {
                const y = k * H + stagger;
                xs[count] = x;
                ys[count] = y;
                dist[count] = Math.hypot(x - centreX, y - centreY);
                count++;
            }
        }
        resting = false; // resizing cleared the canvas
    };

    /** Paint the wave as it stands `seconds` into the loop. */
    const draw = (seconds: number) => {
        const elapsed = seconds % PERIOD;
        const progress = Math.min(elapsed / (PERIOD * (1 - HOLD)), 1);
        const ringRadius = (1 - progress) * maxRadius * START;

        /*
         * Amplitude envelope. Without it the ring reaches the centre still at
         * full strength and the wave does not end so much as switch off — a
         * whole ridge vanishing between one frame and the next. Ramping the
         * amplitude down over the last third lets the ripple die out as it
         * converges, which is what a real one does. The ramp in matters far
         * less (the ring enters from off-screen) but costs nothing.
         */
        const envelope = smoothstep(0, 0.08, progress) * (1 - smoothstep(0.66, 1, progress));

        // Between passes every frame is the same flat comb: paint it once.
        if (envelope < 0.002) {
            if (resting) return;
            resting = true;
        } else {
            resting = false;
        }

        ctx.fillStyle = inks.canvas;
        ctx.fillRect(0, 0, width, height);

        for (const list of byBucket) list.length = 0;
        for (let i = 0; i < count; i++) {
            const offset = dist[i] - ringRadius;
            let lift = 0;
            if (envelope >= 0.002 && offset > -BAND && offset < BAND) {
                // Cosine bump: 0 at the band edges, 1 on the ring itself, so
                // cells ease into and out of the wave rather than snapping up
                // as it arrives.
                lift = ((Math.cos((offset / BAND) * Math.PI) + 1) / 2) * envelope;
            }
            lifts[i] = lift;
            byBucket[Math.min(BUCKETS - 1, Math.round(lift * (BUCKETS - 1)))].push(i);
        }

        // Ascending, so the least-lifted cells go down first and the crest is
        // painted last — a raised cell overlaps its neighbours from in front,
        // which is the whole point of raising it. The slight scale with lift
        // is what stops the rise reading as a flat slide upward.
        for (let b = 0; b < BUCKETS; b++) {
            const list = byBucket[b];
            if (list.length === 0) continue;
            ctx.beginPath();
            for (let j = 0; j < list.length; j++) {
                const i = list[j];
                const lift = lifts[i];
                const r = R * (1 + lift * 0.07);
                const x = xs[i];
                const y = ys[i] - lift * LIFT;
                ctx.moveTo(x + r * HEX_X[0], y + r * HEX_Y[0]);
                for (let v = 1; v < 6; v++) ctx.lineTo(x + r * HEX_X[v], y + r * HEX_Y[v]);
                ctx.closePath();
            }
            ctx.fillStyle = inks.fills[b];
            ctx.fill();
            ctx.strokeStyle = inks.strokes[b];
            ctx.stroke();
        }
    };

    return { resize, draw };
}
