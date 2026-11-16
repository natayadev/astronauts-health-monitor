/**
 * rules.js · RulesEngine
 * Receives normalized readings → returns normal / attention / surgeon state.
 * No knowledge of the UI or the data source.
 */
import { CONFIG, SCHEMA, METRICS, LEVELS, ENV_META } from './config.js';
import { round } from './utils.js';

export const VITAL_KEYS = ['hr', 'spo2', 'bpSys', 'bpDia', 'temp', 'resp', 'hrv'];
export const GROUPS     = Object.keys(METRICS); // ['hr', 'spo2', 'bp', 'temp', 'resp', 'hrv']

export const RulesEngine = {
  maxLevel(a, b) { return LEVELS[a].order >= LEVELS[b].order ? a : b; },

  band(value, th) {
    if (value == null) return 'nodata';
    const [a1, a2] = th.attention, [c1, c2] = th.surgeon;
    if (value < c1 || value > c2) return 'surgeon';
    if (value < a1 || value > a2) return 'attention';
    return 'normal';
  },

  evaluateMetric(key, value, baseline) {
    const th = CONFIG.thresholds[key]; if (!th) return { level: 'nodata', reason: '' };
    const name = { bpSys: 'Systolic BP', bpDia: 'Diastolic BP' }[key] || METRICS[key]?.short || key;
    const unit = SCHEMA.VitalReading[key]?.unit || '';
    let level = this.band(value, th), reason = '';
    if (level === 'attention') reason = `${name} out of range (${value} ${unit})`;
    if (level === 'surgeon')   reason = `${name} critical (${value} ${unit})`;
    // Deviation from personal baseline (HRV excluded — it varies too much naturally)
    if (value != null && baseline?.[key] != null && level === 'normal' && key !== 'hrv') {
      const dev = Math.abs(value - baseline[key]) / baseline[key] * 100;
      if (dev > CONFIG.thresholds.baselineDeviationPct) { level = 'attention'; reason = `${name} deviates ${round(dev)}% from baseline`; }
    }
    return { level, reason };
  },

  /**
   * Full reading → { overall, metrics:{hr,spo2,bp,temp,resp,hrv → {level,reason}}, reasons[], partial, missing[], coverage }
   */
  evaluateReading(r, baseline) {
    const out = { overall: 'nodata', metrics: {}, reasons: [], quality: r?.quality || 'missing', partial: false, missing: [], coverage: 0 };
    if (!r) { out.missing = [...GROUPS]; return out; }
    const raw = {};
    for (const k of VITAL_KEYS) raw[k] = this.evaluateMetric(k, r[k], baseline);
    for (const g of GROUPS) {
      if (g === 'bp') {
        const a = raw.bpSys, b = raw.bpDia, lv = [a.level, b.level].filter(x => x !== 'nodata');
        out.metrics.bp = { level: lv.length ? lv.reduce((x, y) => this.maxLevel(x, y)) : 'nodata', reason: [a.reason, b.reason].filter(Boolean).join(' · ') };
      } else out.metrics[g] = raw[g];
    }
    let overall = 'nodata';
    for (const g of GROUPS) {
      const m = out.metrics[g];
      if (m.level === 'nodata') { out.missing.push(g); continue; }
      out.coverage++;
      overall = overall === 'nodata' ? m.level : this.maxLevel(overall, m.level);
      if (m.reason) out.reasons.push({ level: m.level, text: m.reason, metric: g });
    }
    out.partial = out.coverage > 0 && out.missing.length > 0;
    // With missing metrics "Normal" would be misleading → report "Partial data" instead
    out.overall = out.partial && overall === 'normal' ? 'partial' : overall;
    return out;
  },

  evaluateEnvironment(env) {
    const out = { overall: 'normal', metrics: {}, reasons: [] };
    if (!env) { out.overall = 'nodata'; return out; }
    const names = Object.fromEntries(Object.entries(ENV_META).map(([k, m]) => [k, m.label]));
    for (const k in CONFIG.thresholds.env) {
      const lvl = this.band(env[k], CONFIG.thresholds.env[k]); out.metrics[k] = lvl;
      if (lvl === 'attention' || lvl === 'surgeon') {
        out.overall = this.maxLevel(out.overall, lvl);
        out.reasons.push({ level: lvl, metric: k, name: names[k], text: `${names[k]} ${lvl === 'surgeon' ? 'critical' : 'elevated'}: ${env[k]} ${SCHEMA.Environment[k].unit}` });
      }
    }
    return out;
  },

  /** Returns a list of { kind, sev, reason } for a device */
  evaluateDevice(d) {
    const t = CONFIG.thresholds.device, out = [];
    if (d.status === 'disconnected')                                      out.push({ kind: 'offline', sev: 1, reason: `${d.name} disconnected` });
    if (d.battery != null && d.battery <= t.batteryCrit)                  out.push({ kind: 'bat',    sev: 2, reason: `${d.name}: critical battery ${d.battery}%` });
    else if (d.battery != null && d.battery <= t.batteryWarn)             out.push({ kind: 'bat',    sev: 1, reason: `${d.name}: low battery ${d.battery}%` });
    if (d.status === 'degraded')                                          out.push({ kind: 'signal', sev: 1, reason: `${d.name}: weak signal ${d.signal}%` });
    return out;
  }
};
