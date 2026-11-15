/**
 * test/env.ts · A browser for the client test: jsdom, plus the three things it lacks.
 *
 *   requestAnimationFrame   a queue the test drains by hand (frames(n)), 16 ms per frame
 *   IntersectionObserver    a stub the test fires by hand (scroll(true|false))
 *   matchMedia              never matches (no reduced-motion preference)
 *
 * Imported first by client.tsx, so react-dom sees a DOM when it loads.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: false });
const w = dom.window as unknown as Window & typeof globalThis;

/* ---- Frames ---- */
let queue = new Map<number, FrameRequestCallback>(), nextId = 1, now = 1000;
w.requestAnimationFrame = (cb) => { const id = nextId++; queue.set(id, cb); return id; };
w.cancelAnimationFrame = (id) => { queue.delete(id); };
export const pending = () => queue.size;
/** Run n frames, 16 ms apart. Returns how many callbacks ran. */
export function frames(n: number, each?: () => void): number {
  let ran = 0;
  for (let i = 0; i < n; i++) {
    now += 16;
    const batch = queue; queue = new Map();
    for (const cb of batch.values()) { cb(now); ran++; }
    each?.();
  }
  return ran;
}

/* ---- Visibility ---- */
type Entry = { isIntersecting: boolean };
const observers = new Set<{ cb: (e: Entry[]) => void; nodes: Set<Element> }>();
class FakeIO {
  private rec: { cb: (e: Entry[]) => void; nodes: Set<Element> };
  constructor(cb: (e: Entry[]) => void) { this.rec = { cb, nodes: new Set() }; observers.add(this.rec); }
  observe(n: Element) { this.rec.nodes.add(n); }
  unobserve(n: Element) { this.rec.nodes.delete(n); }
  disconnect() { this.rec.nodes.clear(); observers.delete(this.rec); }
  takeRecords() { return []; }
}
(w as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
export const watching = () => [...observers].reduce((n, o) => n + o.nodes.size, 0);
export function scroll(visible: boolean) { for (const o of [...observers]) if (o.nodes.size) o.cb([{ isIntersecting: visible }]); }

/* ---- Media queries ---- */
w.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof w.matchMedia;

/* ---- Globals for React ---- */
const g = globalThis as Record<string, unknown>;
for (const k of ['window', 'document', 'navigator', 'requestAnimationFrame', 'cancelAnimationFrame', 'IntersectionObserver', 'matchMedia', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Event', 'MouseEvent', 'getComputedStyle'] as const) {
  Object.defineProperty(g, k, { value: k === 'window' ? w : (w as unknown as Record<string, unknown>)[k], configurable: true, writable: true });
}
g.IS_REACT_ACT_ENVIRONMENT = true;
export const root = w.document.getElementById('root') as HTMLElement;
