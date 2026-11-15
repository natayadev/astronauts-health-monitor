# Astronaut twin · React / Next.js

The astronaut from the middle of the Overview stage as React components, ready for a future Next.js app. The live dashboard does **not** use this folder: it runs the vanilla module in `src/tesai/js/twin/`, with no build step. Both render the same markup, so `src/tesai/styles/components/twin.css` styles both, and both read the same generated drawing (`src/tesai/js/twin/art.js`).

Nothing here is deployed, and the repo has no `package.json` for it. It is tested with React 18.3 and expects a bundler that resolves TypeScript and JSX, such as Next.js.

## Use

```tsx
// app/overview/page.tsx (server component)
import { TWIN_ART } from '@/react/astronaut/art';   // the drawing: about 340 KB, stays on the server
import { OverviewStage } from './OverviewStage';

export default function Page() {
  return <OverviewStage art={TWIN_ART} />;
}
```

```tsx
// app/overview/OverviewStage.tsx
'use client';
import { Twin, useMetricFocus, useStillness, type TwinArt, type Metrics } from '@/react/astronaut';

export function OverviewStage({ art }: { art: TwinArt }) {
  const f = useMetricFocus();
  const still = useStillness();   // the system's reduced-motion setting; combine with your own if you have one
  const metrics: Metrics = { hr: { value: 72, level: 'normal', signal: true } };   // from your data source
  return (
    <div id="stage">
      <button className="metric" data-m="hr" {...f.cardProps('hr')}>Heart rate</button>
      <div id="twin"><Twin art={art} metrics={metrics} focus={f.focus} pinned={f.pinned} motion={still ? 'reduced' : 'full'} /></div>
    </div>
  );
}
```

Import `TWIN_ART` only from server code. `index.ts` does not export it, so the client bundle stays at about 10 KB minified (React excluded).

## Props

Same contract as `createTwin(root).update(props)` in the vanilla module.

| Prop | Meaning |
|---|---|
| `art` | `TWIN_ART` from `art.tsx`. |
| `metrics` | One `{ value, level, signal }` per metric id. Only `hr` is drawn so far. With `signal: false` or no value, nothing beats and the dial parks. |
| `focus` | Metric hovered or selected, or `null`. |
| `pinned` | `true` when `focus` is a selection, `false` for a hover. |
| `motion` | `'reduced'` stops the beat animation: the lamp stays on and the port opens without easing. |
| `spin` | `true` while the 360° view turns the figure. |
| `scan`, `onScanEnd` | Change `scan` to a new number to run one scan sweep; `onScanEnd` fires about 3.2 s later. |

## Heart rate interaction

`useMetricFocus()` follows the dashboard's rules (`src/tesai/js/ui/ui.js`): hovering a card with a mouse or pen, or focusing it with the keyboard, previews the metric; a click selects it and a second click clears it; a selection wins over a hover. Touch never previews, but a tapped card keeps keyboard focus, so after a second tap clears the selection the card previews until focus moves, as in the vanilla dashboard. Pass `selected` and `onSelect` to keep the selection in your own state, for example the detail drawer.

While heart rate has a trusted reading, the console dial reads bpm, the lamp and the chest pip blink once per beat, and the chest display scrolls an ECG-style trace. When heart rate is focused, the chest port opens on the heart, which contracts twice per beat (S1, then S2). A ring runs across the bezel on every beat and a tag beside the port shows the bpm. Selecting gives a brighter glow than hovering. A new reading changes the tempo without restarting the beat.

## Files

| File | Role |
|---|---|
| `Twin.tsx` | The whole centre of the stage: plate, 360° box, figure, scan sweep. |
| `Figure.tsx` | The drawing plus one animation loop for every overlay. The loop runs only while the figure is on screen and stops when nothing moves. |
| `overlays/HeartRate.tsx` | Heart-rate parts. React owns what comes from props (level, state, bpm text); the loop writes the moving attributes through refs, so a re-render never fights the animation. |
| `model/heart.ts` | Heart rate as numbers, with no DOM and no React: `step()` advances the clock, `poseOf()` returns every value the loop writes. |
| `useMetricFocus.ts` | Card hover, focus and click to `focus` and `pinned`. |
| `Plate.tsx`, `ScanSweep.tsx` | Frame and readout line; scan sweep. |
| `art.tsx` | The generated drawing as keyed React elements. Server only. |
| `kit/live.tsx` | Loop and visibility hooks from the Anatomy kit (MIT, see `kit/LICENSE`). |

To add a metric, draw its parts in `tools/twin/overlays/`, expose them in `art.tsx`, write a hook next to `HeartRate.tsx` that returns the `Overlay` shape in `overlays/types.ts`, and call it in `Figure.tsx`.

## Tests

Run both from the repo root on Node 22.

```bash
# The model must move exactly like the vanilla overlay (no dependencies needed)
node --experimental-strip-types react/astronaut/test/parity.mjs

# The components in a real React DOM: loop, card hover, focus and click, Strict Mode, hydration, cleanup.
# Needs react@18.3.1, react-dom@18.3.1, jsdom@25.0.1 and esbuild installed in some folder <deps>.
npx esbuild react/astronaut/test/client.tsx --bundle --platform=node --format=cjs --jsx=automatic \
  --external:jsdom --external:react --external:react-dom --outfile=/tmp/twin-client.cjs
NODE_PATH=<deps>/node_modules node /tmp/twin-client.cjs
```

`parity.mjs` compares 370 frames with every write. `client.tsx` runs 50 checks, including 12 beats in 10 s at 72 bpm and 20 at 120 bpm, a single frame chain under Strict Mode, hydration of the server HTML with no mismatch, and no frames or observers left after unmount. Both run in Node only; nothing has been checked in a real browser or a Next.js app yet. If you change `model/heart.ts` or `src/tesai/js/twin/overlays/heart.js`, change the other one too and run `parity.mjs`.
