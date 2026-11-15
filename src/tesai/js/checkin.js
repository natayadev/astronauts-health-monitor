/**
 * checkin.js · Private daily check-in (data + trend logic, no DOM).
 *
 * Design rules (see docs/psicologia-social.md, sections 3.4, 3.6, 4 and 5):
 *  - Private by default: answers stay on this device and are never shown to
 *    other crew members, never raise alerts and never earn points.
 *  - Original items, NOT a validated instrument. Same direction on every scale
 *    (0 = worst, 10 = best), labeled anchors and a stated recall period.
 *  - Each person is compared only with their own history. The thresholds
 *    below are team design values with no published source.
 */
import { CONFIG } from './config.js';
import { makeRng, dayKey, round } from './utils.js';

export const CHECKIN_KEY = 'tesai.checkin.v1';

/** Scale items. Every scale: 0 = worst, 10 = best. */
export const CHECKIN_ITEMS = [
  { id: 'sleepQ',  label: 'Sleep quality',     q: 'How well did you sleep last night?',            period: 'Last night',        lo: 'Very poorly',        hi: 'Very well' },
  { id: 'mood',    label: 'Mood',              q: 'How is your mood right now?',                   period: 'Right now',         lo: 'Very low',           hi: 'Very good' },
  { id: 'calm',    label: 'Calm',              q: 'How calm do you feel right now?',               period: 'Right now',         lo: 'Very stressed',      hi: 'Completely calm' },
  { id: 'sharp',   label: 'Mental sharpness',  q: 'How mentally sharp do you feel right now?',     period: 'Right now',         lo: 'Mentally exhausted', hi: 'Fully sharp' },
  { id: 'connect', label: 'Connection with the crew', q: 'How connected have you felt to your crew?', period: 'Last 24 hours', lo: 'Not at all',         hi: 'Very connected' }
];

/** Optional item: tension in the last 24 h. Never names anyone. */
export const TENSION_OPTIONS = [
  { v: 'none',   label: 'No' },
  { v: 'crew',   label: 'Yes, within the crew' },
  { v: 'ground', label: 'Yes, with mission control' },
  { v: 'both',   label: 'Yes, with both' }
];

export const SYMPTOMS = [
  { v: 'headache',   label: 'Headache' },
  { v: 'congestion', label: 'Stuffy nose' },
  { v: 'eyes',       label: 'Eye irritation' },
  { v: 'nausea',     label: 'Nausea' }
];

/** Team design values (no published source). */
export const TREND_RULE = {
  baselineDays: 14,   // window used for "your usual"
  recentDays: 3,      // consecutive recent days that must differ
  minBaseline: 5,     // entries needed before any comparison
  drop: 2             // points below "your usual" on the 0–10 scale
};

/* ===== Storage (separate key; never sent anywhere) ===== */
function loadAll() {
  try { return JSON.parse(localStorage.getItem(CHECKIN_KEY) || '{}') || {}; } catch { return {}; }
}
function saveAll(all) { try { localStorage.setItem(CHECKIN_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ } }

export const shareSetting = {
  get(id) { return !!loadAll().__share?.[id]; },
  set(id, on) { const all = loadAll(); (all.__share ||= {})[id] = !!on; saveAll(all); }
};

/** Own entry for today (self-reported), or null. */
export function ownEntry(id, day = dayKey()) { return loadAll()[id]?.[day] || null; }

export function saveEntry(id, entry, day = dayKey()) {
  const all = loadAll(); (all[id] ||= {})[day] = { ...entry, at: new Date().toISOString(), source: 'self' }; saveAll(all);
}
export function skipToday(id, day = dayKey()) {
  const all = loadAll(); (all[id] ||= {})[day] = { skipped: true, at: new Date().toISOString(), source: 'self' }; saveAll(all);
}
export function clearOwn(id) { const all = loadAll(); delete all[id]; saveAll(all); }

/* ===== Simulated history for the demo (labeled; never stored) =====
   Deterministic per crew member. One member shows a slow drop in sleep
   quality and sharpness over the last days so the trend view has something
   to show. Some days are skipped on purpose: missing data is normal. */
function simulatedHistory(id, idx, days) {
  const rng = makeRng((CONFIG.seed || 2026) * 31 + idx * 7919), out = {};
  const base = { sleepQ: 6.5 + idx * 0.4, mood: 7 + (idx % 2) * 0.5, calm: 6.5 + (idx % 3) * 0.4, sharp: 7, connect: 7.5 - (idx % 2) * 0.6 };
  const declining = idx === 0;
  for (let i = days; i >= 1; i--) {
    const d = new Date(Date.now() - i * 86400000), k = dayKey(d);
    const skip = rng() < 0.15;
    if (skip && !(declining && i <= 3)) { out[k] = { skipped: true, source: 'simulated' }; continue; }
    const e = { source: 'simulated' };
    for (const it of CHECKIN_ITEMS) {
      let v = base[it.id] + rng.gauss() * 0.9;
      if (declining && i <= 3 && (it.id === 'sleepQ' || it.id === 'sharp')) v -= 3 + (3 - i) * 0.4;
      e[it.id] = Math.max(0, Math.min(10, Math.round(v)));
    }
    e.tension = rng() < 0.12 ? (rng() < 0.6 ? 'ground' : 'crew') : 'none';
    e.symptoms = rng() < 0.1 ? ['headache'] : [];
    out[k] = e;
  }
  return out;
}

/**
 * Series for one person: last `days` days up to today, oldest first.
 * Each item: { day, entry|null } where entry may be { skipped:true }.
 * Self-reported entries override simulated ones for the same day.
 */
export function series(id, crewIndex, days = TREND_RULE.baselineDays, { simulated = true } = {}) {
  const own = loadAll()[id] || {}, sim = simulated ? simulatedHistory(id, crewIndex, days) : {};
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(new Date(Date.now() - i * 86400000));
    out.push({ day: k, entry: own[k] || sim[k] || null });
  }
  return out;
}

const isAnswered = e => e && !e.skipped;

/**
 * Per-item comparison with the person's own history.
 * status: 'notenough' | 'similar' | 'lower' | 'nodata'
 */
export function compare(ser, itemId) {
  const R = TREND_RULE;
  // Today without an answer yet is not a missing day: compare up to yesterday.
  if (ser.length && !ser[ser.length - 1].entry) ser = ser.slice(0, -1);
  const recent = ser.slice(-R.recentDays), past = ser.slice(0, -R.recentDays);
  const pastVals = past.filter(x => isAnswered(x.entry) && x.entry[itemId] != null).map(x => x.entry[itemId]);
  const last = [...ser].reverse().find(x => isAnswered(x.entry) && x.entry[itemId] != null);
  const usual = pastVals.length ? round(pastVals.reduce((a, b) => a + b, 0) / pastVals.length, 1) : null;
  if (!last) return { status: 'nodata', usual, last: null, n: pastVals.length };
  if (pastVals.length < R.minBaseline) return { status: 'notenough', usual, last: last.entry[itemId], n: pastVals.length };
  const recentVals = recent.map(x => isAnswered(x.entry) ? x.entry[itemId] : null);
  const lower = recentVals.every(v => v != null && v <= usual - R.drop);
  return { status: lower ? 'lower' : 'similar', usual, last: last.entry[itemId], n: pastVals.length };
}

/** Average cabin CO₂ over recent environment readings, in ppm and mmHg. */
export function recentCo2(envHistory, minutes = 30) {
  const since = Date.now() - minutes * 60000;
  const rows = (envHistory || []).filter(e => e.co2 != null && (!e.timestamp || +new Date(e.timestamp) >= since));
  if (!rows.length) return null;
  const ppm = rows.reduce((a, e) => a + e.co2, 0) / rows.length;
  const kPa = rows.reduce((a, e) => a + (e.pressure ?? 101.325), 0) / rows.length;
  // partial pressure: ppm × total pressure; 1 kPa = 7.50062 mmHg
  return { ppm: Math.round(ppm), mmHg: round(ppm * 1e-6 * kPa * 7.50062, 2), n: rows.length };
}
