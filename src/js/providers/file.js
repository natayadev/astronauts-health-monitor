/**
 * file.js · FileProvider
 * Uses a locally loaded CSV or JSON bundle as the data source.
 * Replays readings in time order at the configured tick rate.
 */
import { DataProvider } from './base.js';
import { CONFIG } from '../config.js';
import { round, dayKey } from '../utils.js';

export class FileProvider extends DataProvider {
  constructor(bundle, { tickMs = CONFIG.tickMs, fileName = 'file' } = {}) {
    super(); this.kind = 'FileProvider'; this.sourceTag = 'real';
    this.fileName = fileName; this.tickMs = tickMs;
    this.vitals = [...bundle.vitals].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const ids = [...new Set(this.vitals.map(v => v.astronautId))];
    this.crew = bundle.crew?.length ? bundle.crew : ids.map((id, i) => ({ id, name: `Crew member ${id}`, role: 'No role in file', avatar: `T${i + 1}`, baseline: this._baselineFrom(id) }));
    this.env = bundle.environment || null;
    this.devices = bundle.devices || [];
    this.sleep = bundle.sleepActivity || [];
    this.cursor = {}; this.played = {};
    ids.forEach(id => { this.cursor[id] = 0; this.played[id] = []; });
    this.subs = new Map();
    this.timer = setInterval(() => this._tick(), tickMs);
  }

  _baselineFrom(id) {
    const rows = this.vitals.filter(v => v.astronautId === id);
    const avg = k => { const xs = rows.map(r => r[k]).filter(x => x != null); return xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length, k === 'temp' ? 1 : 0) : null; };
    return { hr: avg('hr'), spo2: avg('spo2'), bpSys: avg('bpSys'), bpDia: avg('bpDia'), temp: avg('temp'), resp: avg('resp'), hrv: avg('hrv') };
  }

  _tick() {
    for (const id in this.cursor) {
      const rows = this.vitals.filter(v => v.astronautId === id); if (!rows.length) continue;
      const r = rows[this.cursor[id] % rows.length]; this.cursor[id]++;
      const rd = { ...r, timestamp: new Date().toISOString() };
      this.played[id].push(rd); if (this.played[id].length > 2000) this.played[id].shift();
      for (const cb of (this.subs.get(id) || [])) cb(rd);
    }
    for (const cb of (this.subs.get('*') || [])) cb(Date.now());
  }

  describe() { return { kind: this.kind, source: this.sourceTag, file: this.fileName, readings: this.vitals.length, crew: this.crew.length, hasEnvironment: !!this.env, devices: this.devices.length }; }

  async getCrew() { return this.crew; }

  async getVitals(id, from, to) {
    const f = +new Date(from || 0), tt = +new Date(to || Date.now());
    return this.played[id].filter(r => { const x = +new Date(r.timestamp); return x >= f && x <= tt; });
  }

  subscribeVitals(id, cb) {
    if (!this.subs.has(id)) this.subs.set(id, new Set());
    this.subs.get(id).add(cb);
    return () => this.subs.get(id)?.delete(cb);
  }

  async getEnvironment()          { return this.env; }
  async getDevices(id)            { return this.devices.filter(d => d.astronautId === id); }
  async getSleepActivity(id, day) { return this.sleep.find(s => s.astronautId === id && (!day || s.day === day)) || null; }
  destroy()                       { clearInterval(this.timer); }
}
