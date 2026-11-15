/**
 * utils.js · Pure utility functions shared across the app.
 * No side effects, no imports from other app modules.
 */

/** Clamp v to [a, b] */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Round v to d decimal places; returns null for null/undefined */
export const round = (v, d = 0) => v == null ? null : Math.round(v * 10 ** d) / 10 ** d;

/** Zero-pad a number to 2 digits */
export const pad = n => String(n).padStart(2, '0');

/** Format a date to 'YYYY-MM-DD' */
export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

/** Generate a short random ID */
export const uid = () => Math.random().toString(36).slice(2, 10);

/** Format an ISO timestamp to 'HH:MM:SS' (local time) */
export const fmtTime = iso => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Escape HTML special characters */
export const esc = s =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Mulberry32 — deterministic seeded PRNG.
 * Returns a function rnd() that also exposes:
 *   rnd.gauss() → normally distributed sample (Box-Muller)
 *   rnd.pick(arr) → random element
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  const rnd = () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  rnd.gauss = () => {
    const u = 1 - rnd(), v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  rnd.pick = arr => arr[Math.floor(rnd() * arr.length)];
  return rnd;
}

/** Shorthand querySelector */
export const $ = (sel, root = document) => root.querySelector(sel);
