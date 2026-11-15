/**
 * helpers.js · UI utility functions shared across render modules.
 * DOM helpers, HTML builders, chart renderer.
 */
import { ICONS, LV_ICON } from './icons.js';
import { LEVELS, METRICS, CONFIG, SCHEMA } from '../config.js';
import { esc, fmtTime, pad, clamp } from '../utils.js';
import { State } from '../state.js';

/* ===== DOM helpers ===== */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Update innerHTML only when it changed; preserve keyboard focus by data-fk */
export function setHtml(el, html) {
  if (!el || el.__h === html) return false;
  const ae = document.activeElement, fk = ae && el.contains(ae) ? ae.getAttribute('data-fk') : null;
  el.innerHTML = html; el.__h = html;
  if (fk) el.querySelector(`[data-fk="${fk.replace(/"/g, '\\"')}"]`)?.focus({ preventScroll: true });
  return true;
}
export const setText = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };

/* ===== HTML component builders ===== */
export const pillHtml = (level, text) =>
  `<span class="pill" data-level="${level}"><i class="lvdot"></i>${esc(text ?? LEVELS[level]?.short ?? level)}</span>`;

export const alertLevelData = a => a.domain === 'reminder' ? 'sensor' : a.level === 'info' ? 'normal' : a.level;

export const alertIcon = a =>
  a.domain === 'reminder' ? ICONS.bell
  : a.domain === 'sensor' ? (/batter|Recharge/i.test(a.title) ? ICONS.battery : ICONS.plug)
  : a.domain === 'environment' ? ICONS.wind
  : (LV_ICON[a.level] || ICONS.alert);

export const alertPillText = a =>
  a.domain === 'reminder'    ? 'Reminder'
  : a.domain === 'sensor'    ? 'Sensor'
  : a.domain === 'environment' ? 'Environment · ' + LEVELS[a.level].short
  : LEVELS[a.level]?.label || '';

/* ===== Value formatting ===== */
export const fmtVal = (v, dec) => v == null ? '--' : Number(v).toFixed(dec);
export const hhmm   = iso => fmtTime(iso).slice(0, 5);
export const trusted = r => r && (r.quality === 'ok' || r.quality === 'missing');
export const levelOf = id => State.evals[id]?.overall || 'nodata';
export const metricKey = g => g === 'bp' ? 'bpSys' : g;
export const histRows  = (id, win) => (State.history[id] || []).filter(r => +new Date(r.timestamp) > Date.now() - win * 60000);

/* ===== SVG chart inner ===== */
export function chartInner({ rows, key, W, H, L = 36, R = 8, T = 8, B = 22, th, baseline, bands = 'normal', dec = 0, labels = true }) {
  const n = rows.length, line = rows.map(r => trusted(r) ? r[key] : null), xs = line.filter(v => v != null);
  if (n < 2 || xs.length < 2) return `<text x="${W / 2}" y="${H / 2}" text-anchor="middle">Not enough data in this window</text>`;
  let lo = Math.min(...xs), hi = Math.max(...xs);
  if (baseline != null) { lo = Math.min(lo, baseline); hi = Math.max(hi, baseline); }
  const p = (hi - lo) * .2 || 1; lo -= p; hi += p;
  const X = i => L + i / (n - 1) * (W - L - R);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const cy = y => Math.max(T, Math.min(H - B, y));
  const rect = (y1, y2, fill) => y2 - y1 > .5 ? `<rect x="${L}" y="${y1.toFixed(1)}" width="${W - L - R}" height="${(y2 - y1).toFixed(1)}" style="fill:var(${fill})"/>` : '';
  let out = '';
  if (th) {
    const [a1, a2] = th.attention, [c1, c2] = th.surgeon;
    if (bands === 'all') { out += rect(T, cy(Y(c2)), '--band-crit') + rect(cy(Y(c1)), H - B, '--band-crit') + rect(cy(Y(c2)), cy(Y(a2)), '--band-warn') + rect(cy(Y(a1)), cy(Y(c1)), '--band-warn'); }
    out += rect(cy(Y(a2)), cy(Y(a1)), '--band-ok');
  }
  for (let i = 0; i <= 3; i++) { const v = lo + (hi - lo) * i / 3, y = Y(v); out += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="grid-l"/>`; if (labels) out += `<text x="${L - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${v.toFixed(dec)}</text>`; }
  if (baseline != null) out += `<line x1="${L}" x2="${W - R}" y1="${Y(baseline).toFixed(1)}" y2="${Y(baseline).toFixed(1)}" class="base-l"/>`;
  let d = '', pen = false, pts = [];
  line.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; pts.push([X(i), Y(v)]); });
  if (pts.length > 1) out += `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}L${pts.at(-1)[0].toFixed(1)} ${H - B}L${pts[0][0].toFixed(1)} ${H - B}Z" class="area"/>`;
  out += `<path d="${d}" class="line-p"/>`;
  let bad = 0;
  for (let i = n - 1; i >= 0 && bad < 30; i--) { const r = rows[i]; if (!trusted(r) && r[key] != null) { bad++; out += `<circle class="q-bad" cx="${X(i).toFixed(1)}" cy="${Y(Math.max(lo, Math.min(hi, r[key]))).toFixed(1)}" r="2.6"/>`; } }
  const last = pts.at(-1); if (last) out += `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4.5" class="end-dot" filter="url(#tz-glow)"/>`;
  if (labels) for (let k = 0; k <= 4; k++) { const i = Math.round(k / 4 * (n - 1)); out += `<text x="${X(i).toFixed(1)}" y="${H - 5}" text-anchor="${k === 0 ? 'start' : k === 4 ? 'end' : 'middle'}">${k === 4 ? 'Now' : hhmm(rows[i].timestamp)}</text>`; }
  return out;
}

/* ===== Toast helpers ===== */
export function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

let audioCtx;
export function beep() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; g.gain.value = 0.05;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.18);
  } catch (e) { /* audio not available */ }
}
