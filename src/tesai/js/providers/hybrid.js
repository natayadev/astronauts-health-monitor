/**
 * hybrid.js · HybridProvider
 * Real and simulated data together. The real part comes from published datasets converted by tools/datasets/
 * (heart rate, heart rate variability, sleep, and the ISS cabin temperature, humidity and CO₂). Every metric
 * those datasets do not measure comes from the SimulatedProvider, which also keeps the devices, the injectable
 * events (they add on top of the real values) and the cabin oxygen, pressure and radiation.
 * Each reading carries `sources`, a map metric → 'real' | 'simulated', so the app always says where a number comes from.
 */
import { SimulatedProvider, CREW_SEED } from './simulated.js';
import { CONFIG, SCHEMA } from '../config.js';
import { clamp, round } from '../utils.js';

const mod = (i, n) => ((i % n) + n) % n;

export class HybridProvider extends SimulatedProvider {
  /** urls: the dataset files; their crew, readings and sleep summaries are merged, the first environment series is used */
  static async load(urls) {
    const bundles = await Promise.all([].concat(urls).map(async url => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`The dataset file ${url} could not be loaded (${res.status})`);
      return res.json();
    }));
    const pick = k => bundles.flatMap(b => b[k] || []);
    return new HybridProvider({
      datasets: bundles.map(b => b.meta).filter(Boolean), crew: pick('crew'), vitals: pick('vitals'), sleepActivity: pick('sleepActivity'),
      environmentSeries: bundles.map(b => b.environmentSeries).find(s => s?.length) || []
    });
  }

  constructor(bundle, opts = {}) {
    // each participant keeps the baselines of the dataset (heart rate, HRV) and gets simulated baselines for the rest
    const crew = bundle.crew.map((c, i) => {
      const template = CREW_SEED[i % CREW_SEED.length].baseline, own = Object.fromEntries(Object.entries(c.baseline || {}).filter(([, v]) => v != null));
      return { ...c, baseline: { ...template, ...own } };
    });
    super({ ...opts, crew });
    this.kind = 'HybridProvider'; this.sourceTag = 'mixed'; this.datasets = bundle.datasets || [];
    this.real = {}; this.realSleep = {}; this.base = {};
    for (const v of bundle.vitals) (this.real[v.astronautId] ||= []).push(v);
    for (const id in this.real) { this.real[id].sort((a, b) => a.timestamp < b.timestamp ? -1 : 1); this.base[id] = Math.min(120, this.real[id].length - 1); }
    for (const s of bundle.sleepActivity || []) this.realSleep[s.astronautId] = s;
    this.envSeries = bundle.environmentSeries || []; this.envBase = Math.min(120, Math.max(0, this.envSeries.length - 1));
    this.t0 = Date.now();
    this.history = {}; this._preloadHistory();   // the base class built it before the real data was loaded
  }

  describe() {
    return { kind: this.kind, source: this.sourceTag, seed: this.seed, crew: this.crew.length, readings: Object.values(this.real || {}).reduce((a, r) => a + r.length, 0),
      datasets: this.datasets.map(d => ({ id: d.id, name: d.name, license: d.license, sample: !!d.sample })), astronauts: false, hasEnvironment: (this.envSeries || []).length > 0 };
  }

  _realRow(id, t) {
    const rows = this.real?.[id]; if (!rows?.length) return null;
    return rows[mod(this.base[id] + Math.round((t - this.t0) / this.tickMs), rows.length)];
  }

  _reading(id, t, o) {
    const sim = super._reading(id, t, o);
    if (!this.real) return sim;                                   // while the base class is still starting up
    const sources = Object.fromEntries(Object.keys(SCHEMA.VitalReading).filter(k => SCHEMA.VitalReading[k]?.unit).map(k => [k, 'simulated']));
    const out = { ...sim, source: this.sourceTag, sources }, row = this._realRow(id, t);
    if (row) for (const k of ['hr', 'hrv']) {
      if (sim[k] == null || row[k] == null) continue;             // a disconnected simulated sensor stays disconnected; a gap in the data stays a gap
      const [lo, hi] = SCHEMA.VitalReading[k].range;
      out[k] = round(clamp(row[k] + this._eventEffect(id, k, t), lo, hi)); sources[k] = 'real';
    }
    return out;
  }

  _envAt(t) {
    const e = super._envAt(t);
    if (!this.envSeries) return e;
    const n = this.envSeries.length; if (!n) return e;
    const p = this.envSeries[mod(this.envBase + Math.round((t - this.t0) / this.tickMs), n)];
    return { ...e, source: this.sourceTag, co2: round(p.co2 + this._eventEffectEnv('co2', t)), temp: p.temp, humidity: p.humidity,
      sources: { co2: 'real', temp: 'real', humidity: 'real', oxygen: 'simulated', pressure: 'simulated', radiation: 'simulated' } };
  }

  // sleep comes from the recordings; exercise, hobby and steps keep following the simulation (and what the user logs)
  async getSleepActivity(id, day) {
    const sim = await super.getSleepActivity(id, day), real = this.realSleep?.[id];
    if (!real) return sim;
    return { ...sim, source: this.sourceTag, sleepHours: real.sleepHours ?? sim.sleepHours, sleepQuality: real.sleepQuality ?? sim.sleepQuality,
      sources: { sleepHours: 'real', sleepQuality: 'real', exerciseMin: 'simulated', hobbyMin: 'simulated', steps: 'simulated' } };
  }
}
