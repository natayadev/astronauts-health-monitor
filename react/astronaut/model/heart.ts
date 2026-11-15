/**
 * model/heart.ts · Heart rate, as numbers. No DOM, no React.
 *
 * A line-for-line port of src/js/twin/overlays/heart.js (the vanilla dashboard's overlay),
 * split into the two halves a React figure needs:
 *
 *   step(state, reading, dt, calm, geometry)  advance the clock; returns true while anything moves
 *   poseOf(state, reading, calm, geometry)    every attribute the loop writes, for this instant
 *
 * One phase accumulator drives all of it (phase += dt × bpm / 60), so a new reading changes the
 * rate without a jump. With no trusted reading nothing beats and the dial needle parks at its minimum.
 *
 * test/parity.mjs runs the vanilla overlay and this model side by side and compares every write.
 * Change one, change the other.
 */

export interface MetricReading {
  value: number | null;
  level: string;
  signal: boolean;
}

/** The overlay's own view of the heart-rate reading, plus whether the dashboard is pointing at it. */
export interface HeartReading extends MetricReading {
  focused: boolean;
  pinned: boolean;
}

export interface DialGeometry {
  plane: string;
  min: number;
  max: number;
  from: number;
  span: number;
  needle: number;
  normal: string;
  limits: [number, number][];
}

export interface ScreenGeometry {
  plane: string;
  w: number;
  h: number;
}

export interface PortGeometry {
  plane: string;
  opening: number;
  bezel: number;
  centre: [number, number];
  port: [number, number];
  glow: number;
}

export interface HeartGeometry {
  dial: DialGeometry;
  screen: ScreenGeometry;
  port: PortGeometry;
}

export interface HeartState {
  phase: number;   // beats since mount; the fraction is where we are in this beat
  open: number;    // 0 closed … 1 open: how far the chest port has opened
  shown: number;   // bpm the dial needle points at (follows the reading)
}

/** Everything the animation loop writes. null means "leave it as it is" (the port is closed). */
export interface HeartPose {
  needle: string;
  flash: boolean;
  trace: string;
  radius: string;
  portOpacity: number;
  tagOpacity: number;
  heart: string | null;
  pulseRadius: string | null;
  pulseOpacity: number | null;
  glowOpacity: number | null;
}

/** One heartbeat as a polyline: [fraction of the cycle after the R peak, height]. */
export const BEAT: [number, number][] = [[-0.115, 0], [-0.085, 0.14], [-0.055, 0], [-0.025, 0], [-0.015, -0.12], [0, 1], [0.015, -0.22], [0.03, 0], [0.145, 0], [0.205, 0.26], [0.265, 0]];
/** Seconds of trace the chest display shows. */
export const WINDOW_S = 2.2;
/** The bpm tag, relative to the port centre: up and right of the port, above the Heart rate link line.
    Same numbers as TAG in src/js/twin/overlays/heart.js. */
export const TAG = { dx: 52, dy: -48, w: 76, h: 22 };

export const NO_READING: HeartReading = { value: null, level: 'nodata', signal: false, focused: false, pinned: false };

export const burst = (age: number, rise: number, fall: number): number =>
  age <= 0 ? 0 : age < rise ? (age / rise) ** 2 * (3 - 2 * age / rise) : Math.exp(-(age - rise) / fall);
export const follow = (now: number, target: number, dt: number, seconds: number, calm: boolean): number =>
  calm || Math.abs(target - now) < 1e-3 ? target : now + (target - now) * (1 - Math.exp(-dt / seconds));
export const fix = (n: number): number => +n.toFixed(2);

export const beating = (r: MetricReading): r is MetricReading & { value: number } => r.signal && r.value != null && r.value > 0;

export const restOf = (g: HeartGeometry): HeartState => ({ phase: 0, open: 0, shown: g.dial.min });

/** Advance the clock by dt seconds. Returns true while anything still moves. */
export function step(state: HeartState, r: HeartReading, dt: number, calm: boolean, g: HeartGeometry): boolean {
  const on = beating(r), target = r.focused ? 1 : 0, park = on ? r.value as number : g.dial.min;
  if (on && !calm) state.phase += dt * (r.value as number) / 60;
  state.open = follow(state.open, target, dt, 0.13, calm);
  state.shown = follow(state.shown, park, dt, 0.4, calm);
  return (on && !calm) || state.open !== target || state.shown !== park;
}

/** The chest display's trace: WINDOW_S seconds of beats ending at the current phase. */
export function traceOf(phase: number, bpm: number, s: ScreenGeometry): string {
  const base = s.h * 0.7, amp = s.h * 0.52;
  if (!bpm) return `M0 ${fix(base)}H${s.w}`;
  const cycles = WINDOW_S * bpm / 60, first = Math.floor(phase - cycles) - 1, lastBeat = Math.floor(phase) + 1;
  const pts: string[] = [];
  for (let k = first; k <= lastBeat; k++) for (const [f, a] of BEAT) pts.push(`${fix(s.w * (1 - (phase - (k + f)) / cycles))} ${fix(base - a * amp)}`);
  return 'M' + pts.join('L');
}

export function poseOf(state: HeartState, r: HeartReading, calm: boolean, g: HeartGeometry): HeartPose {
  const { dial: D, port: A } = g;
  const on = beating(r), period = on ? 60 / (r.value as number) : 0;
  const age = on ? (state.phase % 1) * period : 0;                   // seconds since this beat's R peak
  const systole = 0.32 * Math.sqrt(period || 1);                     // S1 to S2 shortens as the rate rises
  const s1 = on && !calm ? burst(age, 0.035, 0.1) : 0, s2 = on && !calm ? burst(age - systole, 0.03, 0.07) : 0;
  const flash = on && (calm || age < 0.12);
  const open = state.open, radius = String(fix(A.opening * open));

  const pose: HeartPose = {
    needle: `rotate(${fix(D.from + (Math.min(D.max, Math.max(D.min, state.shown)) - D.min) / (D.max - D.min) * D.span)})`,
    flash,
    trace: traceOf(state.phase, on ? r.value as number : 0, g.screen),
    radius,
    portOpacity: open < 0.01 ? 0 : 1,
    tagOpacity: fix(open),
    heart: null, pulseRadius: null, pulseOpacity: null, glowOpacity: null,
  };
  if (open < 0.01) return pose;

  const [cx, cy] = A.centre;
  const k = 1 - 0.075 * s1 - 0.035 * s2;                             // the heart gets smaller as it contracts
  const wave = on && !calm ? Math.min(1, age / 0.42) : 1;
  pose.heart = `translate(${cx} ${cy}) scale(${fix(k + 0.0001)}) translate(${-cx} ${-cy})`;
  pose.pulseRadius = String(fix(A.opening + 0.35 + (A.bezel - A.opening - 0.7) * wave));
  pose.pulseOpacity = on && !calm ? fix((1 - wave) * 0.9 * open) : 0;
  pose.glowOpacity = fix(open * (r.pinned ? 0.34 : 0.24) * (on ? 0.72 + 0.28 * s1 : 0.5));
  return pose;
}

/** The plate's readout line. */
export const readoutOf = (r: MetricReading): string =>
  beating(r) ? `Heart rate ${Math.round(r.value)} bpm · one beat every ${(60 / r.value).toFixed(2)} s` : 'Heart rate · no signal';

/** The number on the bpm tag. */
export const bpmText = (r: MetricReading): string => (beating(r) ? String(Math.round(r.value)) : '--');

/** Overlay state for the markup: closed, previewed (hover) or pinned (selected). */
export const stateOf = (r: HeartReading): 'idle' | 'preview' | 'pinned' => (r.pinned ? 'pinned' : r.focused ? 'preview' : 'idle');
