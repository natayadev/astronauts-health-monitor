/**
 * adapters.js · Normalizer + Adapters + CSV parser + schema validator.
 * Everything that touches raw data before it enters the app.
 */
import { SCHEMA } from '../config.js';
import { round, dayKey } from '../utils.js';

/* ===== Normalizer: type-check, range-clamp, fill defaults ===== */
export const Normalizer = {
  num(v, [lo, hi]) {
    if (v == null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return n < lo || n > hi ? null : n;
  },
  vital(o, source) {
    const S = SCHEMA.VitalReading;
    const out = { astronautId: String(o.astronautId ?? ''), timestamp: new Date(o.timestamp).toISOString(), source, quality: ['ok', 'noisy', 'delayed', 'missing'].includes(o.quality) ? o.quality : 'ok' };
    for (const k of ['hr', 'spo2', 'bpSys', 'bpDia', 'temp', 'resp', 'hrv']) out[k] = this.num(o[k], S[k].range);
    if (['hr', 'spo2', 'bpSys', 'bpDia', 'temp', 'resp', 'hrv'].every(k => out[k] == null)) out.quality = 'missing';
    return out;
  },
  environment(o, source) {
    const S = SCHEMA.Environment;
    return { timestamp: new Date(o?.timestamp || Date.now()).toISOString(), source, co2: this.num(o?.co2, S.co2.range), oxygen: this.num(o?.oxygen, S.oxygen.range), temp: this.num(o?.temp, S.temp.range), humidity: this.num(o?.humidity, S.humidity.range), pressure: this.num(o?.pressure, S.pressure.range), radiation: this.num(o?.radiation, S.radiation.range) };
  },
  device(o) {
    return { id: String(o.id), astronautId: String(o.astronautId ?? ''), name: o.name || o.id, type: o.type || 'patch', status: ['connected', 'degraded', 'disconnected'].includes(o.status) ? o.status : 'connected', battery: this.num(o.battery, [0, 100]), signal: this.num(o.signal, [0, 100]), lastSeen: o.lastSeen || new Date().toISOString(), provides: Array.isArray(o.provides) ? o.provides : [] };
  },
  sleepActivity(o, source) {
    const S = SCHEMA.SleepActivity;
    return { astronautId: String(o?.astronautId ?? ''), day: o?.day || dayKey(), source, sleepHours: this.num(o?.sleepHours, S.sleepHours.range), sleepQuality: this.num(o?.sleepQuality, S.sleepQuality.range), exerciseMin: this.num(o?.exerciseMin, S.exerciseMin.range), hobbyMin: this.num(o?.hobbyMin, S.hobbyMin.range), steps: this.num(o?.steps, S.steps.range) };
  }
};

/* ===== Adapters: map raw source format → SCHEMA ===== */
export const Adapters = {
  adaptRestJson: {
    crew(raw) {
      return (raw?.members || []).map(m => ({ id: String(m.id), name: m.name, role: m.role || '', avatar: (m.name || '??').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase(), baseline: m.baseline || {} }));
    },
    vitals(raw, source = 'real') {
      return (raw?.readings || raw || []).map(r => Normalizer.vital({ astronautId: r.astronaut_id ?? r.astronautId, timestamp: r.ts ?? r.timestamp, hr: r.heart_rate ?? r.hr, spo2: r.spo2, bpSys: r.systolic ?? r.bpSys, bpDia: r.diastolic ?? r.bpDia, temp: r.temperature ?? r.temp, resp: r.respiration ?? r.resp, hrv: r.hrv, quality: r.quality }, source));
    },
    environment(raw)   { return Normalizer.environment(raw, 'real'); },
    // ISS Live telemetry (Lightstreamer). Values are in mmHg: kPa = mmHg × 0.133322.
    issTelemetry(raw) {
      const kpa = mm => round(mm * 0.133322, 2), total = raw?.pressureKpa ?? 101.3;
      return Normalizer.environment({ timestamp: raw?.timestamp, oxygen: raw?.ppO2 != null ? kpa(raw.ppO2) : null, co2: raw?.ppCO2 != null ? round(kpa(raw.ppCO2) / total * 1e6) : null, pressure: raw?.pressureKpa, temp: raw?.tempC }, 'real');
    },
    devices(raw)       { return (raw || []).map(d => Normalizer.device(d)); },
    sleepActivity(raw) { return Normalizer.sleepActivity(raw, 'real'); }
  },

  adaptCsvRow(row, source = 'real') {
    const g = (...keys) => { for (const k of keys) { const kk = Object.keys(row).find(x => x.trim().toLowerCase() === k); if (kk != null && row[kk] !== '') return row[kk]; } return null; };
    return Normalizer.vital({
      astronautId: g('astronautid', 'astronaut_id', 'crew_id', 'id', 'subject'),
      timestamp:   g('timestamp', 'ts', 'time', 'datetime', 'date'),
      hr:    g('hr', 'heart_rate', 'heartrate', 'pulse'),
      spo2:  g('spo2', 'oxygen', 'sao2'),
      bpSys: g('bpsys', 'systolic', 'sys', 'bp_sys'),
      bpDia: g('bpdia', 'diastolic', 'dia', 'bp_dia'),
      temp:  g('temp', 'temperature', 'temp_c'),
      resp:  g('resp', 'respiration', 'rr', 'breathing_rate'),
      hrv:   g('hrv', 'rmssd'),
      quality: g('quality') || 'ok'
    }, source);
  },

  adaptDbRow(row, source = 'real') { return Adapters.adaptCsvRow(row, source); }
};

/* ===== Schema validation ===== */
export function validateVital(r, i) {
  const errors = [], warnings = [];
  if (!r.astronautId) errors.push(`row ${i}: astronautId is missing`);
  if (isNaN(new Date(r.timestamp))) errors.push(`row ${i}: invalid timestamp`);
  const keys = ['hr', 'spo2', 'bpSys', 'bpDia', 'temp', 'resp', 'hrv'];
  if (keys.every(k => r[k] == null)) warnings.push(`row ${i}: no numeric metrics (quality=missing)`);
  return { ok: !errors.length, errors, warnings };
}

/* ===== CSV parser (comma or semicolon, quoted fields) ===== */
export function parseCsv(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  const head = lines[0].split(sep).map(s => s.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(l => {
    const cells = l.split(sep).map(s => s.trim().replace(/^"|"$/g, ''));
    const o = {}; head.forEach((h, i) => o[h] = cells[i]); return o;
  });
}
