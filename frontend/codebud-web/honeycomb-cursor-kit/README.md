# Honeycomb background + honey cursor — drop-in kit

Extracted from `codebud-platform`. Self-contained: React + one CSS file, zero
npm dependencies beyond `react`. No Tailwind, no shadcn, no `@/` aliases.

```
honeycomb-cursor-kit/
├── honeycomb-cursor.css      # tokens + every rule the components need
└── components/
    ├── HoneycombField.tsx    # static SVG comb plate (+ HoneycombBand)
    ├── HoneycombWave.tsx     # canvas wave that lifts cells — imported by Field
    └── HoneyCursor.tsx       # liquid brass pointer, click droplets, drips
```

## Install

1. Copy `components/` into your app (e.g. `src/components/`) and
   `honeycomb-cursor.css` anywhere your global CSS lives.
2. Import the CSS **once, globally**, after your reset/Tailwind base:

   ```ts
   import "./honeycomb-cursor.css";
   ```

3. Mount both layers once, at the root layout — not per page:

   ```tsx
   // app/layout.tsx  (Next.js App Router)
   import { HoneycombField } from "@/components/HoneycombField";
   import HoneyCursor from "@/components/HoneyCursor";

   export default function RootLayout({ children }: { children: React.ReactNode }) {
       return (
           <html lang="en">
               <body>
                   <HoneycombField />
                   {children}
                   <HoneyCursor />
               </body>
           </html>
       );
   }
   ```

   Plain React (Vite/CRA): same two components inside your top-level `<App>`.
   `"use client"` at the top of `HoneycombWave` / `HoneyCursor` is a Next
   directive and is simply ignored by other bundlers — leave it.

## Requirements the host page must meet

- **The body must not paint an opaque background.** `HoneycombField` is
  `position: fixed; z-index: -1`, which puts it *below* in-flow content but
  *above* the propagated body canvas. An opaque `body { background: … }` hides
  it. Let the field's own `--carbon-canvas` be the page background.
- **The palette is dark.** The comb is a brass gutter on near-black carbon. On
  a light page the cells read as black holes — retheme the tokens first (below).
- Nothing else. Both layers are `aria-hidden` and `pointer-events: none`.

## The three tokens that matter

Redefine in your own `:root` *after* importing the CSS.

| Token | Default | What it does |
|---|---|---|
| `--carbon-comb-edge` | `rgba(242,183,5,0.22)` | Gutter colour — **the** dial for how loud the comb is |
| `--carbon-canvas` | `oklch(14.6% .006 75)` | Page background, and the ink the wave clears to |
| `--honey-vibrance` | `0.57` | Cursor saturation: `1` = neon, `0` = grey |

`--carbon-comb` (cell fill) is *not* a lever — raising it flattens the cells
into the gutter and the honeycomb disappears into a grey wash.

Cell size lives in the components, not CSS, and must match in both:
`S = 32.33` in `HoneycombField.tsx` **and** `HoneycombWave.tsx`.

## Global off switch

```js
document.documentElement.dataset.honey = "off";
```

Stops the wave, unmounts the cursor layer, and kills every honey animation.
The static comb plate stays — it is the resting state and the fallback.

Auto-gated already: the cursor never mounts on coarse pointers (touch), and the
drip rig is hidden under `(hover: none)`. Note the layer deliberately does
**not** honour `prefers-reduced-motion` — the last section of the CSS re-grants
animation duration that a global reduce rule would flatten to `0.01ms`. To
restore preference-driven behaviour, re-add the `matchMedia` check in
`HoneyCursor.tsx` and delete that re-grant block.

## Optional hooks the cursor looks for

| Class / attribute | Effect |
|---|---|
| `.honey-surface`, `[data-slot="card"]`, `.tilt-3d` | Pointer is tracked across it; gets the honey drip off its bottom edge, and its headings flip to brass on hover |
| `.no-tilt` / `.no-honey` | Opts an element out of that tracking |
| `[data-honey-text]` | Cursor blob hides, native caret returns (already applied to `input`, `textarea`, `select`, `[contenteditable]`, `pre`, `code`, `.monaco-editor`) |

If your site has no cards, ignore all of it — the cursor and comb work alone.

## `HoneycombBand`

Second export of `HoneycombField.tsx`. Same geometry run hotter, as an
absolutely-positioned band — meant to be *seen*, for a page header zone:

```tsx
<HoneycombBand top="4rem" height={240} />
```

Its parent needs `position: relative`. It anchors below a sticky header, so
`top` should clear that header's height.

## Cost

- Comb plate: one fixed SVG `<pattern>`, own compositor layer, rasterised once.
- Wave: one canvas, one rAF loop, cells bucketed into 14 `Path2D`s — ~28 draws
  per frame regardless of cell count, at a 7s period.
- Cursor: one rAF loop writing `transform` straight to the DOM, outside React.
  Click ephemera are DOM nodes that remove themselves on `animationend`.
