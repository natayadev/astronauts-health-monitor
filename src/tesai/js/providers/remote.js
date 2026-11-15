/**
 * remote.js · RemoteProvider skeleton
 * Ready for fetch with timeout, retries and in-memory cache.
 * Each method throws NotImplementedError until wired to a real endpoint.
 * See the "HOW TO CONNECT REAL DATA" comment at the bottom of the original
 * index.html for the full integration guide.
 */
import { DataProvider } from './base.js';
import { CONFIG } from '../config.js';

export class NotImplementedError extends Error {
  constructor(m) { super(m); this.name = 'NotImplementedError'; }
}

export class RemoteProvider extends DataProvider {
  constructor(api = CONFIG.api) {
    super(); this.kind = 'RemoteProvider'; this.sourceTag = 'real';
    this.api = api; this.cache = new Map(); this.loading = new Set(); this.lastError = null;
  }

  describe() {
    return { kind: this.kind, source: this.sourceTag, baseUrl: this.api.baseUrl || '(not configured)', implemented: false, lastError: this.lastError?.message || null };
  }

  /** GET JSON with timeout, exponential retries and TTL cache. */
  async fetchJson(path, { params = {}, ttl = this.api.cacheTtlMs } = {}) {
    if (!this.api.baseUrl) throw new NotImplementedError('CONFIG.api.baseUrl is empty: configure the endpoint or proxy.');
    const url = new URL(path, this.api.baseUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const key = url.toString();
    const hit = this.cache.get(key); if (hit && Date.now() - hit.t < ttl) return hit.data;
    let err;
    for (let i = 0; i <= this.api.retries; i++) {
      const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), this.api.timeoutMs);
      this.loading.add(key);
      try {
        const res = await fetch(key, { signal: ctrl.signal, headers: this.api.nasaApiKey ? { 'x-api-key': this.api.nasaApiKey } : {} });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json(); this.cache.set(key, { t: Date.now(), data }); return data;
      } catch (e) { err = e; await new Promise(r => setTimeout(r, this.api.retryBackoffMs * 2 ** i)); }
      finally { clearTimeout(to); this.loading.delete(key); }
    }
    this.lastError = err; throw err;
  }

  async getCrew()                 { throw new NotImplementedError('RemoteProvider.getCrew: TODO → fetchJson("/crew") + Adapters.adaptRestJson.crew'); }
  async getVitals(id, from, to)   { throw new NotImplementedError('RemoteProvider.getVitals: TODO → fetchJson(`/vitals/${id}`, {params:{from,to}}) + Adapters.adaptRestJson.vitals'); }
  subscribeVitals(id, cb)         { console.warn('RemoteProvider.subscribeVitals: TODO → polling or WebSocket/SSE'); return () => {}; }
  async getEnvironment()          { throw new NotImplementedError('RemoteProvider.getEnvironment: TODO → fetchJson("/environment") + Adapters.adaptRestJson.environment'); }
  async getDevices(id)            { throw new NotImplementedError('RemoteProvider.getDevices: TODO → fetchJson(`/devices/${id}`) + Adapters.adaptRestJson.devices'); }
  async getSleepActivity(id, day) { throw new NotImplementedError('RemoteProvider.getSleepActivity: TODO → fetchJson(`/activity/${id}`, {params:{day}}) + Adapters.adaptRestJson.sleepActivity'); }
  async pushEvent(ev)             { console.warn('RemoteProvider.pushEvent: TODO → POST /events', ev); return { ok: false, reason: 'not implemented' }; }
}
