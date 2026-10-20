/*
 * The brass ring's renderer — see BrassRing.tsx for what it draws and when.
 *
 * No DOM and no React in here: it draws into whatever canvas it is handed, so
 * the same code runs in the worker that normally owns the ring's canvas
 * (brass-ring.worker.ts) and on the main thread where a browser cannot hand a
 * WebGL canvas to a worker. The page tells it the viewport, the scroll
 * position, the pointer and where the hero and contact sections sit
 * (RingInput); the frame loop calls frame() and it does the rest.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uCenter;   // device px, GL origin (bottom-left)
uniform float uRadius;  // device px
uniform float uWidth;   // device px, thickness of the core
uniform float uTime;
uniform float uSpin;
uniform float uAlpha;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 d = gl_FragCoord.xy - uCenter;
    float r = length(d);
    float a = atan(d.y, d.x);
    float x = (r - uRadius) / uWidth; // signed distance in core widths, + outside

    // Light travelling around the ring: two slow, out-of-phase lobes.
    float lobes = (0.55 + 0.45 * (0.5 + 0.5 * sin(a + uTime * 0.23 + uSpin)))
                * (0.72 + 0.28 * sin(a * 3.0 - uTime * 0.17 + uSpin * 0.5));

    float core  = exp(-x * x * 2.2);
    float outer = exp(-(x - 1.15) * (x - 1.15) * 0.85);
    float inner = exp(-(x + 1.35) * (x + 1.35) * 0.7);
    float bloom = exp(-x * x * 0.05);
    float haze  = exp(-x * x * 0.006);

    vec3 bone   = vec3(1.0, 0.96, 0.88);
    vec3 brass  = vec3(0.95, 0.70, 0.05);
    vec3 ember  = vec3(0.93, 0.36, 0.10);
    vec3 patina = vec3(0.22, 0.60, 0.55);

    vec3 col = bone * pow(core, 4.0) * 1.1
             + brass * core * 1.25
             + ember * outer * 0.95
             + patina * inner * 0.6
             + brass * bloom * 0.2
             + ember * haze * 0.07;
    col *= lobes;

    // A warm breath of light inside the ring.
    col += vec3(0.07, 0.045, 0.012) * (1.0 - smoothstep(0.0, uRadius, r));

    col = 1.0 - exp(-col * 1.6);
    col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.03;
    col = clamp(col, 0.0, 1.0);

    float alpha = max(col.r, max(col.g, col.b));
    gl_FragColor = vec4(col, alpha) * uAlpha;
}
`;

export type RingVariant = "home" | "page";

/** What the page tells the ring. Section positions are in document px. */
export type RingInput =
    | { type: "view"; width: number; height: number; dpr: number }
    | { type: "geometry"; heroTop: number; heroH: number; heroLen: number; contactTop: number }
    | { type: "scroll"; y: number }
    | { type: "pointer"; x: number; y: number };

/** Backing-store scale, capped: a soft glow gains nothing past ~1.5x, and 4K
 *  panels would otherwise shade ~8M pixels a frame. */
export const ringDpr = (width: number, height: number, deviceDpr: number) =>
    Math.min(deviceDpr || 1, 1.5, Math.sqrt(3_000_000 / Math.max(1, width * height)));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Queues a compile. Its status is read only once the program has linked —
 *  asking earlier would make the driver finish the compile right there. */
function compile(gl: WebGLRenderingContext, type: number, src: string) {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}

export type RingRenderer = NonNullable<ReturnType<typeof createRingRenderer>>;

/**
 * `null` when the canvas gives no WebGL — the caller shows the CSS ring.
 * `onFallback` fires if the shaders fail to build, now or after the GPU hands
 * back a lost context.
 */
export function createRingRenderer(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    { variant, reduce, onFallback }: { variant: RingVariant; reduce: boolean; onFallback: () => void },
) {
    // Both canvas kinds take the same call; typed as one to keep TS's
    // overloads out of a union. No powerPreference: Windows ignores it, and
    // elsewhere the default already favours the low-power GPU.
    const gl = (canvas as HTMLCanvasElement).getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
    });
    if (!gl) return null;

    /*
     * GL resources. Built here, and built again if the GPU drops the context
     * (driver reset, too many contexts) and later restores it — a lost
     * context keeps nothing.
     *
     * build() only queues the compile and link. Where the browser has
     * KHR_parallel_shader_compile the driver does that work in parallel, and
     * frame() calls finish() once it reports the program done; without the
     * extension, finish() waits on the driver at the first frame.
     */
    const parallel = gl.getExtension("KHR_parallel_shader_compile");
    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;
    let prog: WebGLProgram | null = null;
    let buf: WebGLBuffer | null = null;
    let u: Record<"center" | "radius" | "width" | "time" | "spin" | "alpha", WebGLUniformLocation | null> | null = null;

    const build = () => {
        vs = compile(gl, gl.VERTEX_SHADER, VERT);
        fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
        prog = gl.createProgram();
        if (!vs || !fs || !prog) return false;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        return true;
    };

    const linked = () => !parallel || !prog || gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR);

    const finish = () => {
        if (!prog) return false;
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            for (const s of [vs, fs]) {
                if (s && !gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.warn("[BrassRing] shader:", gl.getShaderInfoLog(s));
                }
            }
            return false;
        }
        gl.useProgram(prog);

        // One oversized triangle covers the viewport.
        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        u = {
            center: gl.getUniformLocation(prog, "uCenter"),
            radius: gl.getUniformLocation(prog, "uRadius"),
            width: gl.getUniformLocation(prog, "uWidth"),
            time: gl.getUniformLocation(prog, "uTime"),
            spin: gl.getUniformLocation(prog, "uSpin"),
            alpha: gl.getUniformLocation(prog, "uAlpha"),
        };
        gl.viewport(0, 0, canvas.width, canvas.height);
        return true;
    };
    if (!build()) return null;

    let w = 0;
    let h = 0;
    let dpr = 1;
    // Section geometry in document coordinates.
    let heroTop = 0;
    let heroH = 1;
    let heroLen = 1;
    let contactTop = Infinity;
    let y = 0;
    // Pointer parallax, eased so the ring drifts rather than tracks.
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;

    let start = 0;
    let started = false;
    let cleared = false;
    let lost = false;
    let failed = false;

    const apply = (input: RingInput) => {
        switch (input.type) {
            case "view":
                w = input.width;
                h = input.height;
                dpr = input.dpr;
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                gl.viewport(0, 0, canvas.width, canvas.height);
                break;
            case "geometry":
                ({ heroTop, heroH, heroLen, contactTop } = input);
                break;
            case "scroll":
                y = input.y;
                break;
            case "pointer":
                tx = input.x;
                ty = input.y;
                break;
        }
    };

    const frame = (now: number) => {
        if (failed || lost || w === 0) return;
        if (!u) {
            if (!linked()) return;
            if (!finish()) {
                failed = true;
                onFallback();
                return;
            }
            // The bloom plays from the first frame the ring can draw (not
            // replayed after a context restore).
            if (!started) start = now;
            started = true;
        }
        const t = reduce ? 0 : (now - start) / 1000;

        const heroP = clamp01((y - heroTop) / heroLen);
        const contactP = clamp01((y + h - contactTop) / h);
        const intro = reduce ? 1 : easeOutCubic(clamp01((t - 0.25) / 1.9));

        px += (tx - px) * 0.04;
        py += (ty - py) * 0.04;

        const vmax = Math.max(w, h);
        let cx: number;
        let cy: number; // CSS px from the top
        let radius: number;
        let alpha: number;
        let spin: number;

        if (contactP > 0) {
            const e = easeOutCubic(contactP);
            radius = vmax * 0.92;
            // The arc's crest rises from below the fold to ~10% off the
            // bottom — low enough that the finale's links and newsletter sit
            // above its glow, not in it.
            const crest = h * (1.08 - 0.18 * e);
            cx = w * 0.5;
            cy = crest + radius;
            alpha = smooth(0.1, 0.85, contactP);
            spin = 1.2 + e;
        } else if (variant === "page") {
            // A horizon riding the bottom of the page header: it scrolls up
            // with the header and fades out before the content starts.
            const scrolled = y - heroTop;
            radius = vmax * 0.9;
            cx = w * 0.5;
            cy = heroTop + heroH * 0.9 - y + radius;
            alpha = intro * (1 - smooth(heroH * 0.2, heroH * 0.8, scrolled));
            spin = 1.2 + (scrolled / heroH) * 1.5;
        } else {
            const e = heroP * heroP;
            radius = vmax * (0.47 + 0.34 * e) * (0.82 + 0.18 * intro);
            cx = w * (0.5 + 0.2 * e);
            cy = h * (0.5 + 0.06 * e);
            alpha = intro * (1 - smooth(0.24, 0.5, heroP));
            spin = heroP * 2.4;
        }

        if (alpha <= 0.002) {
            if (!cleared) {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                cleared = true;
            }
            return;
        }
        cleared = false;

        const uni = u;
        if (!uni) return;
        const breathe = 1 + 0.006 * Math.sin(t * 0.8);
        gl.uniform2f(uni.center, (cx + px * 26) * dpr, (h - (cy + py * 18)) * dpr);
        gl.uniform1f(uni.radius, radius * breathe * dpr);
        gl.uniform1f(uni.width, Math.max(10, radius * 0.026) * dpr);
        gl.uniform1f(uni.time, t);
        gl.uniform1f(uni.spin, spin);
        gl.uniform1f(uni.alpha, alpha);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Context loss: stop drawing, and preventDefault so the browser is allowed
    // to hand the context back; on restore, rebuild and carry on.
    const onLost = (e: Event) => {
        e.preventDefault();
        lost = true;
        u = null;
    };
    const onRestored = () => {
        lost = false;
        cleared = false;
        if (!build()) {
            failed = true;
            onFallback();
        }
    };
    const target = canvas as EventTarget;
    target.addEventListener("webglcontextlost", onLost);
    target.addEventListener("webglcontextrestored", onRestored);

    /** Stop listening and free the GPU objects (the context stays). */
    const dispose = () => {
        target.removeEventListener("webglcontextlost", onLost);
        target.removeEventListener("webglcontextrestored", onRestored);
        if (!gl.isContextLost()) {
            gl.deleteBuffer(buf);
            gl.deleteProgram(prog);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
        }
    };

    /** Give the context itself back to the browser. */
    const release = () => gl.getExtension("WEBGL_lose_context")?.loseContext();

    return { apply, frame, dispose, release };
}
