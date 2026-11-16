/**
 * simulated.js · SimulatedProvider
 * Realistic synthetic data: circadian rhythm, AR(1) noise, injectable events,
 * random sensor gaps and disconnections. Fully deterministic given the seed.
 */
import { DataProvider } from './base.js';
import { CONFIG, SCHEMA } from '../config.js';
import { clamp, round, dayKey, makeRng } from '../utils.js';

/* ===== Seed crew ===== */
export const CREW_SEED = [
  { id: 'ast-01', name: 'Valentina Ruiz', role: 'Commander',        avatar: 'VR', baseline: { hr: 62, spo2: 98, bpSys: 118, bpDia: 76, temp: 36.6, resp: 14, hrv: 62 } },
  { id: 'ast-02', name: 'Marcus Chen',    role: 'Flight engineer',   avatar: 'MC', baseline: { hr: 57, spo2: 97, bpSys: 122, bpDia: 79, temp: 36.4, resp: 13, hrv: 74 } },
  { id: 'ast-03', name: 'Amara Okafor',   role: 'Medical officer',   avatar: 'AO', baseline: { hr: 66, spo2: 98, bpSys: 112, bpDia: 72, temp: 36.8, resp: 15, hrv: 55 } },
  { id: 'ast-04', name: 'Luca Moretti',   role: 'Mission specialist', avatar: 'LM', baseline: { hr: 71, spo2: 96, bpSys: 128, bpDia: 82, temp: 36.5, resp: 16, hrv: 48 } }
];

const EVENT_EFFECTS = {
  tachycardia:  { hr: +48, resp: +6, hrv: -25 },
  hypoxia:      { spo2: -9, hr: +16, resp: +7 },
  fever:        { temp: +1.9, hr: +14, hrv: -12 },
  hypertension: { bpSys: +42, bpDia: +22 },
  exercise:     { hr: +55, resp: +12, temp: +0.5, bpSys: +18, hrv: -20 },
  co2:          { env: { co2: +2800 } }
};

export class SimulatedProvider extends DataProvider {
  constructor({ seed = CONFIG.seed, tickMs = CONFIG.tickMs, crew = CREW_SEED } = {}) {
    super(); this.kind = 'SimulatedProvider'; this.sourceTag = 'simulated';
    this.seed = seed; this.tickMs = tickMs; this.rng = makeRng(seed);
    this.crew = crew.map(c => ({ ...c, baseline: { ...c.baseline } }));
    this.sim = {}; this.events = []; this.subs = new Map(); this.timer = null;
    this.manual = {};
    const r = this.rng;
    for (const c of this.crew) {
      this.sim[c.id] = {
        phase: r() * Math.PI * 2,
        ar: { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, temp: 0, resp: 0, hrv: 0 },
        devices: [
          { id: `${c.id}-patch`,     astronautId: c.id, name: 'Biometric patch',      type: 'patch',     status: 'connected', battery: 40 + r() * 60, signal: 80 + r() * 20, provides: ['hr', 'resp', 'hrv', 'temp'] },
          { id: `${c.id}-wristband`, astronautId: c.id, name: 'SpO₂/BP wristband',    type: 'wristband', status: 'connected', battery: 20 + r() * 80, signal: 70 + r() * 30, provides: ['spo2', 'bpSys', 'bpDia'] },
          { id: `${c.id}-helmet`,    astronautId: c.id, name: 'Helmet sensor',         type: 'helmet',    status: 'connected', battery: 60 + r() * 40, signal: 85 + r() * 15, provides: [] }
        ],
        disconnectUntil: {}
      };
    }
    // One device starts with a low battery to trigger the recharge reminder on startup
    if (this.sim['ast-02']) this.sim['ast-02'].devices[1].battery = 14;
    else if (this.crew[1]) this.sim[this.crew[1].id].devices[1].battery = 14;
    this.env = { co2: 1800 + r() * 500, oxygen: 21.3, temp: 22.5, humidity: 45, pressure: 101.2, radiation: 12 };
    this.envAr = { co2: 0, oxygen: 0, temp: 0, humidity: 0, pressure: 0, radiation: 0 };
    this.history = {}; this._preloadHistory();
    this._startLoop();
  }

  describe() { return { kind: this.kind, source: this.sourceTag, seed: this.seed, tickMs: this.tickMs, crew: this.crew.length }; }

  /* ---- Model ---- */
  _circadian(t) {
    const h = new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60;
    return Math.sin((h - 9) / 24 * Math.PI * 2); // peak ~15h, trough ~3h
  }

  _eventEffect(astronautId, key, t) {
    let eff = 0;
    for (const ev of this.events) {
      if (ev.astronautId && ev.astronautId !== astronautId) continue;
      const def = EVENT_EFFECTS[ev.type]; if (!def || def[key] == null) continue;
      const p = (t - ev.start) / ev.durationMs; if (p < 0 || p > 1) continue;
      const ramp = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
      eff += def[key] * ramp;
    }
    return eff;
  }

  _reading(astronautId, t, { noiseBoost = 1 } = {}) {
    const c = this.crew.find(x => x.id === astronautId), s = this.sim[astronautId], r = this.rng, b = c.baseline;
    const circ = this._circadian(t);
    const step = (k, sd) => { s.ar[k] = s.ar[k] * 0.9 + r.gauss() * sd * noiseBoost; return s.ar[k]; };
    const v = {
      hr:    b.hr    * (1 + 0.05 * circ) + step('hr',    1.6) + this._eventEffect(astronautId, 'hr',    t) + Math.sin(t / 9000 + s.phase) * 1.5,
      spo2:  b.spo2  - 0.4 * Math.max(0, -circ) + step('spo2',  0.25) + this._eventEffect(astronautId, 'spo2',  t),
      bpSys: b.bpSys * (1 + 0.04 * circ) + step('bpSys', 1.8) + this._eventEffect(astronautId, 'bpSys', t),
      bpDia: b.bpDia * (1 + 0.03 * circ) + step('bpDia', 1.2) + this._eventEffect(astronautId, 'bpDia', t),
      temp:  b.temp  + 0.3 * circ         + step('temp',  0.04) + this._eventEffect(astronautId, 'temp',  t),
      resp:  b.resp  * (1 + 0.05 * circ) + step('resp',  0.5) + this._eventEffect(astronautId, 'resp',  t),
      hrv:   b.hrv   * (1 - 0.15 * circ) + step('hrv',   2.5) + this._eventEffect(astronautId, 'hrv',   t)
    };
    let quality = 'ok';
    const devs = this._devicesAt(astronautId, t);
    for (const d of devs) if (d.status === 'disconnected') for (const k of d.provides) v[k] = null;
    const missingAll = devs.filter(d => d.provides.length).every(d => d.status === 'disconnected');
    const u = r();
    if (missingAll || u < 0.02)         { quality = 'missing';  for (const k in v) v[k] = null; }
    else if (u < 0.06)                  { quality = 'noisy';    for (const k in v) if (v[k] != null) v[k] += r.gauss() * (k === 'temp' ? 0.4 : k === 'spo2' ? 1.5 : 6); }
    else if (u < 0.09)                  { quality = 'delayed';  t -= 4000 + r() * 6000; }
    else if (Object.values(v).some(x => x == null)) quality = 'missing';
    const out = { astronautId, timestamp: new Date(t).toISOString(), source: this.sourceTag, quality };
    for (const k in v) out[k] = v[k] == null ? null : round(clamp(v[k], SCHEMA.VitalReading[k].range[0], SCHEMA.VitalReading[k].range[1]), k === 'temp' ? 1 : 0);
    return out;
  }

  _devicesAt(astronautId, t) {
    const s = this.sim[astronautId], r = this.rng;
    for (const d of s.devices) {
      const until = s.disconnectUntil[d.id] || 0;
      if (until > t) { d.status = 'disconnected'; d.signal = 0; continue; }
      d.baseSignal ??= d.signal;
      d.signal = clamp(d.signal + (d.baseSignal - d.signal) * 0.15 + r.gauss() * 2.5, 10, 100);
      if (r() < 0.0006) s.disconnectUntil[d.id] = t + 30000 + r() * 60000;
      d.status = d.signal < CONFIG.thresholds.device.signalWarn ? 'degraded' : 'connected';
      d.lastSeen = new Date(t).toISOString();
    }
    return s.devices;
  }

  _tickDevices() {
    for (const id in this.sim) for (const d of this.sim[id].devices) {
      d.battery = clamp(d.battery - 0.03 - (d.type === 'patch' ? 0.02 : 0), 0, 100);
      if (d.battery <= 0) this.sim[id].disconnectUntil[d.id] = Date.now() + 3600000;
    }
  }

  _eventEffectEnv(key, t) {
    let e = 0;
    for (const ev of this.events) {
      const d = EVENT_EFFECTS[ev.type]?.env; if (!d || d[key] == null) continue;
      const p = (t - ev.start) / ev.durationMs; if (p < 0 || p > 1) continue;
      e += d[key] * (p < 0.2 ? p / 0.2 : p > 0.75 ? (1 - p) / 0.25 : 1);
    }
    return e;
  }

  _envAt(t) {
    const r = this.rng, a = this.envAr, base = this.env;
    const st = (k, sd) => { a[k] = a[k] * 0.92 + r.gauss() * sd; return a[k]; };
    return {
      timestamp: new Date(t).toISOString(), source: this.sourceTag,
      co2:      round(base.co2      + st('co2', 25)      + this._eventEffectEnv('co2', t) + 150 * Math.sin(t / 60000)),
      oxygen:   round(base.oxygen   + st('oxygen', 0.03), 2),
      temp:     round(base.temp     + st('temp', 0.08),   1),
      humidity: round(base.humidity + st('humidity', 0.6)),
      pressure: round(base.pressure + st('pressure', 0.02), 2),
      radiation: round(Math.max(0, base.radiation + st('radiation', 0.5) + (r() < 0.004 ? 14 : 0)), 1)
    };
  }

  _preloadHistory() {
    const now = Date.now(), n = Math.floor(CONFIG.historyWindowMin * 60000 / this.tickMs);
    for (const c of this.crew) {
      this.history[c.id] = [];
      for (let i = n; i > 0; i--) this.history[c.id].push(this._reading(c.id, now - i * this.tickMs));
    }
  }

  _startLoop() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const t = Date.now(); this._tickDevices();
      this.events = this.events.filter(e => t < e.start + e.durationMs);
      for (const c of this.crew) {
        const rd = this._reading(c.id, t), h = this.history[c.id]; h.push(rd);
        const cut = t - 3 * 3600000; while (h.length && new Date(h[0].timestamp).getTime() < cut) h.shift();
        for (const cb of (this.subs.get(c.id) || [])) cb(rd);
      }
      for (const cb of (this.subs.get('*') || [])) cb(t);
    }, this.tickMs);
  }

  /* ---- Contract ---- */
  async getCrew() { return this.crew.map(c => ({ ...c })); }

  async getVitals(id, from, to) {
    const f = +new Date(from || 0), tt = +new Date(to || Date.now());
    return (this.history[id] || []).filter(r => { const x = +new Date(r.timestamp); return x >= f && x <= tt; });
  }

  subscribeVitals(id, cb) {
    if (!this.subs.has(id)) this.subs.set(id, new Set());
    this.subs.get(id).add(cb);
    return () => this.subs.get(id)?.delete(cb);
  }

  async getEnvironment() { return this._envAt(Date.now()); }

  async getEnvironmentHistory(count, stepMs) {
    const now = Date.now(), out = [];
    for (let i = count; i > 0; i--) out.push(this._envAt(now - i * stepMs));
    return out;
  }

  async getDevices(id) {
    return this._devicesAt(id, Date.now()).map(d => ({ ...d, battery: round(d.battery), signal: round(d.signal) }));
  }

  async getSleepActivity(id, day = dayKey()) {
    const h = [...(id + day + this.seed)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7), r = makeRng(h);
    const isToday = day === dayKey(); const m = (this.manual[id] || {})[day] || {};
    const minutesToday = (Date.now() - SimulatedProvider.sessionStart) / 60000;
    const exEvent = this.events.filter(e => e.type === 'exercise' && e.astronautId === id).reduce((a, e) => a + Math.min(Date.now() - e.start, e.durationMs) / 60000 * 10, 0);
    return {
      astronautId: id, day, source: this.sourceTag,
      sleepHours:  round(5.6 + r() * 3, 1),
      sleepQuality: round(55 + r() * 40),
      exerciseMin: round(isToday ? Math.min(180, 12 + minutesToday * 0.8 + (m.exerciseMin || 0) + exEvent) : 35 + r() * 50),
      hobbyMin:    round(isToday ? (m.hobbyMin || 0) + Math.min(40, minutesToday * 0.3) : 10 + r() * 60),
      steps:       round(isToday ? 2000 + minutesToday * 40 : 4000 + r() * 6000)
    };
  }

  async pushEvent(ev) {
    const t = Date.now(), id = ev.astronautId || null;
    if (ev.type === 'recharge') {
      for (const aid in this.sim) for (const d of this.sim[aid].devices) if (d.id === ev.params?.deviceId) { d.battery = 100; delete this.sim[aid].disconnectUntil[d.id]; }
      return { ok: true };
    }
    if (ev.type === 'reconnect') {
      for (const aid in this.sim) if (this.sim[aid].disconnectUntil[ev.params?.deviceId]) delete this.sim[aid].disconnectUntil[ev.params.deviceId];
      return { ok: true };
    }
    if (ev.type === 'disconnect') {
      const s = this.sim[id];
      const d = ev.params?.deviceId ? s.devices.find(x => x.id === ev.params.deviceId) : this.rng.pick(s.devices.filter(x => x.provides.length));
      s.disconnectUntil[d.id] = t + (ev.durationMs || 60000);
      return { ok: true };
    }
    if (ev.type === 'hobby' || ev.type === 'manual_exercise' || ev.type === 'hydration') {
      const key = ev.type === 'hobby' ? 'hobbyMin' : 'exerciseMin';
      const m = (this.manual[id] ||= {}); const d = (m[dayKey()] ||= {});
      if (ev.type !== 'hydration') d[key] = (d[key] || 0) + (ev.params?.minutes || 15);
      return { ok: true };
    }
    this.events.push({ type: ev.type, astronautId: id, start: t, durationMs: ev.durationMs || 90000, params: ev.params || {} });
    return { ok: true };
  }

  destroy() { clearInterval(this.timer); this.subs.clear(); }
}

SimulatedProvider.sessionStart = Date.now();
