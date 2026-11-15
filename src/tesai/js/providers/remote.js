/**
 * remote.js · RemoteProvider skeleton
 * fetchJson is ready (timeout, retries with backoff, in-memory cache). The data methods are not
 * connected yet: each one throws NotImplementedError and names the endpoint and adapter it needs,
 * and the app falls back to the simulation. Real endpoints go behind a server-side proxy that holds
 * any API key; the browser only knows the proxy's address (CONFIG.api.baseUrl).
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
        const res = await fetch(key, { signal: ctrl.signal, credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json(); this.cache.set(key, { t: Date.now(), data }); return data;
      } catch (e) { err = e; await new Promise(r => setTimeout(r, this.api.retryBackoffMs * 2 ** i)); }
      finally { clearTimeout(to); this.loading.delete(key); }
    }
    this.lastError = err; throw err;
  }

  /* Not connected yet. Each message names the endpoint and the adapter it will use. */
  async getCrew()                 { throw new NotImplementedError('RemoteProvider.getCrew: needs GET /crew + Adapters.adaptRestJson.crew'); }
  async getVitals(id, from, to)   { throw new NotImplementedError('RemoteProvider.getVitals: needs GET /vitals/:id?from&to + Adapters.adaptRestJson.vitals'); }
  subscribeVitals(id, cb)         { return () => {}; }   // needs polling, WebSocket or SSE
  async getEnvironment()          { throw new NotImplementedError('RemoteProvider.getEnvironment: needs GET /environment + Adapters.adaptRestJson.environment'); }
  async getDevices(id)            { throw new NotImplementedError('RemoteProvider.getDevices: needs GET /devices/:id + Adapters.adaptRestJson.devices'); }
  async getSleepActivity(id, day) { throw new NotImplementedError('RemoteProvider.getSleepActivity: needs GET /activity/:id?day + Adapters.adaptRestJson.sleepActivity'); }
  async pushEvent(ev)             { return { ok: false, reason: 'not implemented' }; }   // needs POST /events
}
