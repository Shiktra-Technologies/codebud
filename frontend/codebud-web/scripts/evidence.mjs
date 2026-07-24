/*
 * Machined Hive — evidence harness (§D18).
 *
 * Written once, run once: §A4 items 1/2/5/6 batch into WS-9 alongside
 * Lighthouse and axe rather than being captured per workstream (§D18a).
 *
 * Uses the system Edge via `channel: "msedge"`, so no bundled browser download.
 *
 *   node scripts/evidence.mjs zoom    <url> [out]   §A4.1 — 100/150/200% (deviceScaleFactor)
 *   node scripts/evidence.mjs scroll  <url>         §A4.2 — long-frame count during scroll
 *   node scripts/evidence.mjs boot    <url> [rate]  §A4.5 — video at 1x / 4x CPU throttle
 *   node scripts/evidence.mjs cls     <url>         §A4.6 / §D10 — CLS on first uncached load
 *   node scripts/evidence.mjs reduced <url> [out]   §D11a — prefers-reduced-motion capture
 *   node scripts/evidence.mjs axe     <url>         WS-9 — axe-core, fails on criticals
 */

import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const [, , cmd, url, arg] = process.argv;
if (!cmd || !url) {
    console.error("usage: node scripts/evidence.mjs <zoom|scroll|boot|cls|reduced|axe> <url> [arg]");
    process.exit(1);
}
const OUT = "evidence";
mkdirSync(OUT, { recursive: true });

const launch = () => chromium.launch({ channel: "msedge" });

/** Count frames slower than 16ms — §A4 item 2. */
const FRAME_PROBE = () => {
    // @ts-ignore
    window.__frames = 0; window.__long = 0; window.__worst = 0;
    let last = performance.now();
    const tick = () => {
        const now = performance.now();
        const d = now - last; last = now;
        // @ts-ignore
        window.__frames++; if (d > 16) window.__long++;
        // @ts-ignore
        if (d > window.__worst) window.__worst = d;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

/** Accumulate layout shift — §A4 item 6 / §D10. */
const CLS_PROBE = () => {
    // @ts-ignore
    window.__cls = 0;
    new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
            // @ts-ignore
            if (!e.hadRecentInput) window.__cls += e.value;
        }
    }).observe({ type: "layout-shift", buffered: true });
};

const browser = await launch();
try {
    if (cmd === "zoom") {
        for (const scale of [1, 1.5, 2]) {
            const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale });
            const page = await ctx.newPage();
            await page.goto(url, { waitUntil: "networkidle" });
            const file = `${OUT}/${arg ?? "zoom"}-${String(scale * 100)}.png`;
            await page.screenshot({ path: file });
            console.log(`zoom ${scale * 100}% → ${file}`);
            await ctx.close();
        }
    } else if (cmd === "scroll") {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await ctx.newPage();
        await page.addInitScript(FRAME_PROBE);
        await page.goto(url, { waitUntil: "networkidle" });
        await page.evaluate(async () => {
            for (let y = 0; y < 4000; y += 40) {
                window.scrollTo(0, y);
                await new Promise((r) => requestAnimationFrame(r));
            }
        });
        const m = await page.evaluate(() => ({
            // @ts-ignore
            frames: window.__frames, long: window.__long, worst: window.__worst,
        }));
        console.log(`frames=${m.frames} over16ms=${m.long} worst=${m.worst.toFixed(1)}ms`);
        console.log(m.long === 0 ? "PASS — no frame over 16ms" : "FAIL — dropped frames during scroll");
        await ctx.close();
    } else if (cmd === "boot") {
        const rate = Number(arg ?? 1);
        const ctx = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            recordVideo: { dir: `${OUT}/boot-${rate}x`, size: { width: 1280, height: 800 } },
        });
        const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        if (rate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate });
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(4000);
        await ctx.close(); // flushes the video
        console.log(`boot @${rate}x → ${OUT}/boot-${rate}x/`);
    } else if (cmd === "cls") {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await ctx.newPage();
        await page.addInitScript(CLS_PROBE);
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(1500);
        const cls = await page.evaluate(() => window.__cls);
        console.log(`CLS = ${cls.toFixed(4)}  ${cls === 0 ? "(zero)" : cls < 0.1 ? "(good)" : "(FAIL)"}`);
        await ctx.close();
    } else if (cmd === "reduced") {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(1200);
        const file = `${OUT}/${arg ?? "reduced"}.png`;
        await page.screenshot({ path: file, fullPage: true });
        console.log(`reduced-motion → ${file}`);
        await ctx.close();
    } else if (cmd === "axe") {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: "networkidle" });
        const res = await new AxeBuilder({ page }).analyze();
        const crit = res.violations.filter((v) => v.impact === "critical");
        for (const v of res.violations) console.log(`[${v.impact}] ${v.id} ×${v.nodes.length} — ${v.help}`);
        console.log(`violations=${res.violations.length} critical=${crit.length} ${crit.length === 0 ? "PASS" : "FAIL"}`);
        await ctx.close();
    } else {
        console.error(`unknown command: ${cmd}`);
        process.exit(1);
    }
} finally {
    await browser.close();
}
