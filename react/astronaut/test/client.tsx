/**
 * test/client.tsx · The React twin in a real React DOM: loop, card hover and click, Strict Mode, cleanup.
 *
 * Needs react@18.3.1, react-dom@18.3.1 and jsdom@25.0.1 somewhere on NODE_PATH, plus esbuild to bundle:
 *   esbuild react/astronaut/test/client.tsx --bundle --platform=node --format=cjs --jsx=automatic \
 *     --external:jsdom --external:react --external:react-dom --outfile=<tmp>/client.cjs
 *   NODE_PATH=<deps>/node_modules node <tmp>/client.cjs
 *
 * Frames are 16 ms each and run only when the test asks (see env.ts), so every count below is exact.
 */
import { frames, pending, root, scroll, watching } from './env';
import * as React from 'react';
import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Twin } from '../Twin';
import { useMetricFocus } from '../useMetricFocus';
import { TWIN_ART } from '../art';
import type { Metrics } from '../types';

let fails = 0, checks = 0;
function ok(cond: unknown, what: string) { checks++; if (!cond) { fails++; console.log('FAIL', what); } }

/* A minimal Overview stage: one Heart rate card beside the twin, wired the way the dashboard wires it. */
let setMetrics: (m: Metrics) => void = () => {}, setMotion: (m: 'full' | 'reduced') => void = () => {}, setScan: (n: number) => void = () => {};
let scansEnded = 0;
function Stage() {
  const [metrics, sm] = React.useState<Metrics>({ hr: { value: 72, level: 'normal', signal: true } });
  const [motion, mo] = React.useState<'full' | 'reduced'>('full');
  const [scan, sc] = React.useState(0);
  setMetrics = sm; setMotion = mo; setScan = sc;
  const f = useMetricFocus();
  return (
    <>
      <button className="metric" data-m="hr" {...f.cardProps('hr')}>Heart rate</button>
      <Twin art={TWIN_ART} metrics={metrics} focus={f.focus} pinned={f.pinned} motion={motion} scan={scan} onScanEnd={() => { scansEnded++; }} />
    </>
  );
}

const $ = <T extends Element = Element>(s: string) => root.querySelector(s) as T;
const card = () => $<HTMLButtonElement>('button.metric');
const port = () => $<SVGGElement>('[data-ov="hr"]');
const live = () => $<SVGGElement>('.twin-hr-live');
const run = (n: number, each?: () => void) => { let ran = 0; act(() => { ran = frames(n, each); }); return ran; };
/* React builds onPointerEnter/Leave from pointerover/pointerout and their relatedTarget, so send those. */
/* onFocus/onBlur listen to focusin/focusout. */
const fire = (el: Element, type: 'enter' | 'leave' | 'click' | 'focus' | 'blur', pointerType = 'mouse') => {
  const w = root.ownerDocument.defaultView as unknown as typeof globalThis, outside = root.ownerDocument.body;
  const ev = type === 'click' ? new w.MouseEvent('click', { bubbles: true })
    : type === 'focus' || type === 'blur' ? new w.FocusEvent(type === 'focus' ? 'focusin' : 'focusout', { bubbles: true, relatedTarget: outside })
    : new w.MouseEvent(type === 'enter' ? 'pointerover' : 'pointerout', { bubbles: true, relatedTarget: outside });
  Object.defineProperty(ev, 'pointerType', { value: pointerType });
  act(() => { el.dispatchEvent(ev); });
};
/** Rising edges of data-beat on the live group across n frames: one per heartbeat. */
function beats(n: number) {
  let count = 0, was = live().hasAttribute('data-beat');
  run(n, () => { const on = live().hasAttribute('data-beat'); if (on && !was) count++; was = on; });
  return count;
}

async function main() {
const app = createRoot(root);
act(() => { app.render(<React.StrictMode><Stage /></React.StrictMode>); });

/* 1 · First render is the rest pose, and nothing animates off screen. */
ok(port().style.opacity === '0', 'port closed at rest');
ok(port().dataset.state === 'idle', 'state idle at rest');
ok($('.twin-bpm-v').textContent === '72', 'bpm tag text from props');
ok($('.twin-plate-readout').textContent?.startsWith('Heart rate 72 bpm'), 'plate readout');
ok(watching() === 1, `one observer after Strict Mode double mount (got ${watching()})`);
ok(pending() === 0, 'no frames before the figure is in view');

/* 2 · In view: the heart beats at the reading's rate, from one loop only. */
act(() => scroll(true));
ok(pending() === 1, `exactly one frame chain (got ${pending()})`);
run(60);
const needle72 = $('.twin-needle').getAttribute('transform');
const b72 = beats(625);                                      // 10 s
ok(b72 >= 11 && b72 <= 13, `72 bpm gives 12 beats in 10 s (got ${b72})`);
ok($('.twin-needle').getAttribute('transform') !== 'rotate(' + TWIN_ART.geometry.hr.dial.from + ')', `needle left its park (${needle72})`);
ok(port().style.opacity === '0', 'port stays closed without focus');

/* 3 · Hovering the card opens the port on the heart and shows the bpm tag. */
fire(card(), 'enter');
ok($('svg.twin-fig').getAttribute('data-focus') === 'hr', 'figure data-focus=hr on hover');
ok(port().dataset.state === 'preview', 'state preview on hover');
let scales = new Set<string>();
run(60, () => { scales.add($('.twin-heart').getAttribute('transform') ?? ''); });
ok(port().style.opacity === '1', 'port open after hover');
ok(Number($<SVGGElement>('.twin-bpm').style.opacity) > 0.99, 'bpm tag shown');
ok(Number($('.twin-aperture').getAttribute('r')) > 0, 'aperture open');
ok(scales.size > 5, `heart contracts while open (${scales.size} distinct poses)`);
const glowPreview = Number($<SVGCircleElement>('.twin-glow').style.opacity);

/* 4 · Leaving closes it; a touch "hover" never opens it. */
fire(card(), 'leave');
run(60);
ok(port().dataset.state === 'idle' && port().style.opacity === '0', 'port closes on leave');
fire(card(), 'enter', 'touch');
ok(port().dataset.state === 'idle', 'touch does not preview');

/* 5 · Click pins it (survives leaving the card); a second click unpins. */
fire(card(), 'click');
fire(card(), 'leave');
run(60);
ok(port().dataset.state === 'pinned', 'click pins');
ok(card().getAttribute('aria-pressed') === 'true', 'card aria-pressed');
ok(port().style.opacity === '1', 'pinned port stays open after leave');
ok(Number($<SVGCircleElement>('.twin-glow').style.opacity) > glowPreview, 'glow brighter when pinned than on hover');

/* 6 · A new rate changes the tempo without resetting the phase. */
const before = $('.twin-trace').getAttribute('d');
act(() => setMetrics({ hr: { value: 120, level: 'attention', signal: true } }));
ok($('.twin-trace').getAttribute('d') === before, 're-render does not touch loop-owned trace');
ok($('.twin-bpm-v').textContent === '120' && port().dataset.level === 'attention', 'tag and level follow props');
const b120 = beats(625);
ok(b120 >= 19 && b120 <= 21, `120 bpm gives 20 beats in 10 s (got ${b120})`);
fire(card(), 'click');
run(60);
ok(port().dataset.state === 'idle' && port().style.opacity === '0', 'second click unpins');

/* 6b · Keyboard: focus previews, blur clears. A click on a focused card pins; a second click unpins
   but the card keeps focus, so it goes back to a preview until focus moves (same as the vanilla dashboard). */
fire(card(), 'focus');
ok(port().dataset.state === 'preview', 'keyboard focus previews');
fire(card(), 'blur');
ok(port().dataset.state === 'idle', 'blur clears the preview');
fire(card(), 'focus'); fire(card(), 'click');
ok(port().dataset.state === 'pinned', 'focus then click pins');
fire(card(), 'click');
ok(port().dataset.state === 'preview', 'second click unpins; focused card still previews');
fire(card(), 'blur');
run(60);
ok(port().dataset.state === 'idle' && port().style.opacity === '0', 'blur after unpin closes the port');

/* 7 · No signal: nothing beats, the needle parks, the loop stops. */
act(() => setMetrics({ hr: { value: null, level: 'nodata', signal: false } }));
run(300);
ok($('.twin-bpm-v').textContent === '--', 'tag shows -- without signal');
ok(live().dataset.signal === 'off' && !live().hasAttribute('data-beat'), 'no beat without signal');
ok($('.twin-needle').getAttribute('transform') === `rotate(${TWIN_ART.geometry.hr.dial.from})`, 'needle parked at minimum');
ok(pending() === 0, 'loop stopped when still');
act(() => setMetrics({ hr: { value: 72, level: 'normal', signal: true } }));
ok(pending() === 1, 'new reading restarts the loop');

/* 8 · Reduced motion: lamp steady, no pulse ring, loop settles. */
act(() => setMotion('reduced'));
run(5);
ok(live().hasAttribute('data-beat'), 'reduced motion: lamp steady on');
ok(pending() === 0, 'reduced motion: loop stops');
act(() => setMotion('full'));

/* 9 · Off screen stops the loop; back on screen resumes it. */
act(() => scroll(false));
ok(pending() === 0, 'off screen: no frames');
act(() => scroll(true));
ok(pending() === 1, 'on screen again: one frame chain');

/* 10 · Scan sweep mounts once, unmounts after its run, and reports the end. */
const realSetTimeout = globalThis.setTimeout;
act(() => setScan(1));
ok(root.querySelectorAll('svg.twin-scan').length === 1, 'scan sweep mounted');
await act(() => new Promise<void>(r => realSetTimeout(r, 3300)));
ok(!$('svg.twin-scan') && scansEnded === 1, `scan sweep ends once (ended ${scansEnded})`);

/* 11 · Unmount leaves nothing running. */
act(() => app.unmount());
ok(pending() === 0 && watching() === 0, 'unmount cancels frames and observer');

/* 12 · Hydration: server HTML, then hydrateRoot, with no mismatch, and the live parts take over. */
const errors: unknown[] = [];
const realError = console.error;
console.error = (...a: unknown[]) => { errors.push(a); };
root.innerHTML = renderToString(<React.StrictMode><Stage /></React.StrictMode>);
ok(port().style.opacity === '0' && $('.twin-bpm-v').textContent === '72', 'server HTML is the rest pose');
let hydrated!: ReturnType<typeof hydrateRoot>;
act(() => { hydrated = hydrateRoot(root, <React.StrictMode><Stage /></React.StrictMode>, { onRecoverableError: e => { errors.push(e); } }); });
console.error = realError;
ok(errors.length === 0, `hydrates without errors (${errors.length}${errors.length ? ': ' + String((errors[0] as unknown[])[0] ?? errors[0]).slice(0, 160) : ''})`);
ok(root.querySelectorAll('svg.twin-fig').length === 1, 'one figure after hydration');
act(() => scroll(true));
run(60);
let lampLit = 0;
const lampNode = $('[data-part="lamp"]');
const bh = beats(625);
run(120, () => { if (lampNode?.hasAttribute('data-on')) lampLit++; });
ok(bh >= 11 && bh <= 13, `hydrated: 72 bpm gives 12 beats in 10 s (got ${bh})`);
ok(lampNode && lampLit > 0 && lampLit < 120, `hydrated: console lamp blinks (${lampLit} of 120 frames lit)`);
fire(card(), 'enter');
run(60);
ok(port().dataset.state === 'preview' && port().style.opacity === '1', 'hydrated: hover opens the port');
act(() => hydrated.unmount());
ok(pending() === 0 && watching() === 0, 'hydrated unmount leaves nothing running');

console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
