/**
 * dataset.js · DatasetProvider
 * Replays real, published datasets that were converted to Tesai's schema by the scripts in tools/datasets/.
 * It is a FileProvider with these differences: the files ship with the app (data/*.json), each carries its own
 * attribution (meta), several files are merged into one crew, the cabin environment can be a real time series,
 * and it starts with a short history so the charts are not empty on load.
 * Metrics a dataset did not measure stay null, so the app shows "no data" for them: nothing is invented.
 */
import { FileProvider } from './file.js';

export class DatasetProvider extends FileProvider {
  /** urls: one file or an array; their crew, readings and sleep summaries are merged, the first environment series is used */
  static async load(urls) {
    const list = [].concat(urls);
    const bundles = await Promise.all(list.map(async url => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`The dataset file ${url} could not be loaded (${res.status})`);
      return res.json();
    }));
    const pick = k => bundles.flatMap(b => b[k] || []);
    return new DatasetProvider({
      meta: { id: bundles.map(b => b.meta?.id).filter(Boolean).join('+'), datasets: bundles.map(b => b.meta).filter(Boolean) },
      crew: pick('crew'), vitals: pick('vitals'), sleepActivity: pick('sleepActivity'), devices: pick('devices'),
      environment: null, environmentSeries: bundles.map(b => b.environmentSeries).find(s => s?.length) || []
    });
  }

  constructor(bundle) {
    super(bundle, { fileName: bundle.meta?.id || 'dataset' });
    this.kind = 'DatasetProvider'; this.sourceTag = 'real'; this.meta = bundle.meta || {};
    this.envSeries = bundle.environmentSeries || []; this.envCursor = 0;
    // start a little way in, with that part already "played", so History and the trends have something to show
    const warm = 60;
    for (const id of Object.keys(this.cursor)) {
      const rows = this.vitals.filter(v => v.astronautId === id), n = Math.min(warm, Math.max(0, rows.length - 1));
      this.played[id] = rows.slice(0, n).map((r, i) => ({ ...r, timestamp: new Date(Date.now() - (n - i) * this.tickMs).toISOString() }));
      this.cursor[id] = n;
    }
    this.envCursor = Math.min(120, Math.max(0, this.envSeries.length - 1));
  }

  describe() {
    const sets = this.meta.datasets || [];
    return { kind: this.kind, source: this.sourceTag, id: this.meta.id, datasets: sets.map(d => ({ id: d.id, name: d.name, license: d.license, sample: !!d.sample })),
      astronauts: false, readings: this.vitals.length, crew: this.crew.length, hasEnvironment: this.envSeries.length > 0 };
  }

  _tick() { super._tick(); if (this.envSeries.length) this.envCursor++; }

  // the cabin environment is a real series that advances with the readings and loops
  _envAt(i) { const n = this.envSeries.length; return this.envSeries[((i % n) + n) % n]; }
  async getEnvironment() { return this.envSeries.length ? { ...this._envAt(this.envCursor), timestamp: new Date().toISOString() } : null; }
  async getEnvironmentHistory(count, stepMs) {
    if (!this.envSeries.length) return [];
    const now = Date.now();
    return Array.from({ length: count }, (_, k) => ({ ...this._envAt(this.envCursor - (count - 1 - k)), timestamp: new Date(now - (count - 1 - k) * stepMs).toISOString() }));
  }

  // the recordings are one day (or one night) long; the app asks for "today", so the summary is returned whatever day is asked
  async getSleepActivity(id, day) {
    const s = this.sleep.find(x => x.astronautId === id);
    return s ? { ...s, day: day || s.day } : null;
  }
}
