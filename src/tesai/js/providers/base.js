/**
 * base.js · DataProvider abstract interface.
 * The UI and rules engine ONLY talk to this contract.
 * Swap the concrete implementation without touching any other file.
 */
export class DataProvider {
  constructor() { this.kind = 'abstract'; this.sourceTag = 'simulated'; }
  async getCrew()                         { throw new Error('getCrew not implemented'); }
  async getVitals(astronautId, from, to)  { throw new Error('getVitals not implemented'); }
  subscribeVitals(astronautId, callback)  { throw new Error('subscribeVitals not implemented'); } // returns unsubscribe()
  async getEnvironment()                  { throw new Error('getEnvironment not implemented'); }
  async getEnvironmentHistory(count, stepMs) { return []; }  // optional
  async getDevices(astronautId)           { throw new Error('getDevices not implemented'); }
  async getSleepActivity(astronautId, day){ throw new Error('getSleepActivity not implemented'); }
  async getAlerts()                       { return []; }
  async pushEvent(event)                  { /* optional */ }
  destroy() {}
  describe() { return { kind: this.kind, source: this.sourceTag }; }
}
