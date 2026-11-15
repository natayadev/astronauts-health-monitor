/**
 * app.js · Bootstrap + main loop
 * Owns: provider lifecycle, onReading, onTick, alert processing,
 *       escalations, reminders, runAlertAction, refreshSecondary.
 * Exports the functions that ui.js needs so the circular reference is
 * resolved by ES-module lazy binding (ui.js imports from app.js at the
 * top of the file, but the values are only read at call time).
 */
import { CONFIG, METRICS, LEVELS } from './config.js';
import { uid, dayKey, round } from './utils.js';
import {
  State, upsertAlert, resolveAlert, expireAlerts,
  trackCondition, canOpen, openAlertByKey, alertById,
  ackAlert, addPoints, checkMissions, personName, visibleAlert
} from './state.js';
import { RulesEngine, GROUPS } from './rules.js';
import { SimulatedProvider } from './providers/simulated.js';
import { RemoteProvider }    from './providers/remote.js';
import { FileProvider }      from './providers/file.js';
import { showToast, closeToastFor } from './ui/toasts.js';
import { UI } from './ui/ui.js';

/* ===== File import state ===== */
export let fileBundle = null;
export let fileName   = '';
export function setFileBundle(bundle, name) { fileBundle = bundle; fileName = name; }

/* ===== Provider factory ===== */
function createProvider(kind) {
  if (kind === 'remote') return new RemoteProvider();
  if (kind === 'file') {
    if (!fileBundle) throw new Error('No file loaded. Use "Import data" in the advanced view (#/advanced).');
    return new FileProvider(fileBundle, { fileName });
  }
  return new SimulatedProvider({ seed: CONFIG.seed, tickMs: CONFIG.tickMs });
}
function friendlyError(e, kind) {
  if (e?.name === 'NotImplementedError') return `The "${kind}" source is not connected yet (RemoteProvider is not implemented). Simulation stays on.`;
  return `${e?.message || 'Unknown error'}. Simulation stays on.`;
}

/* ===== startProvider ===== */
export async function startProvider(kind = CONFIG.dataSource) {
  State.unsub.forEach(u => u()); State.unsub = [];
  State.provider?.destroy?.();
  document.querySelectorAll('#toasts .toast').forEach(t => t.remove()); State.toastByAlert = {};
  let p; State.sourceNote = '';
  try {
    p = await createProvider(kind); State.crew = await p.getCrew();
    if (!State.crew.length) throw new Error('The provider returned no crew');
  } catch (e) {
    console.warn('[Tesai] source not available:', e);
    State.sourceNote = friendlyError(e, kind);
    showToast({ level: 'attention', icon: 'sensor', title: 'Source not available', message: State.sourceNote });
    kind = 'simulated'; p?.destroy?.(); p = createProvider('simulated'); State.crew = await p.getCrew();
  }
  CONFIG.dataSource = kind; State.provider = p; State.startedAt = Date.now(); State.save();
  // new context — alerts from the previous source are not carried over
  State.latest = {}; State.shown = {}; State.history = {}; State.evals = {}; State.lastGood = {}; State.gap = {};
  State.alerts = []; State.alertIndex = {}; State.cond = {}; State.uplink = []; State.envHistory = [];
  if (!State.crew.find(c => c.id === State.selectedId)) State.selectedId = State.crew[0].id;
  for (const c of State.crew) {
    State.history[c.id] = await p.getVitals(c.id, new Date(Date.now() - CONFIG.historyWindowMin * 60000).toISOString());
    State.latest[c.id]  = State.history[c.id].at(-1) || null;
    const trusted = [...State.history[c.id]].reverse().find(r => r.quality === 'ok') || State.latest[c.id];
    State.shown[c.id]   = trusted || null;
    State.evals[c.id]   = RulesEngine.evaluateReading(State.shown[c.id], c.baseline);
    State.lastGood[c.id] = State.evals[c.id];
    State.unsub.push(p.subscribeVitals(c.id, rd => onReading(c, rd)));
  }
  try { State.envHistory = ((await p.getEnvironmentHistory?.(120, CONFIG.tickMs * 3)) || []).map(e => ({ ...e, quality: 'ok' })); } catch { State.envHistory = []; }
  State.unsub.push(p.subscribeVitals('*', () => onTick()));
  await refreshSecondary(); UI.renderAll();
}

/* ===== onReading · called on every vital reading ===== */
export function onReading(c, rd) {
  State.latest[c.id] = rd; (State.history[c.id] ||= []).push(rd);
  const cut = Date.now() - 65 * 60000;
  while (State.history[c.id].length && +new Date(State.history[c.id][0].timestamp) < cut) State.history[c.id].shift();
  const ev = RulesEngine.evaluateReading(rd, c.baseline), q = rd.quality;
  if (q === 'ok' || (q === 'missing' && ev.coverage > 0)) {
    State.shown[c.id] = rd; State.evals[c.id] = ev; State.lastGood[c.id] = ev; State.gap[c.id] = 0;
  } else if (q === 'missing') {
    State.gap[c.id] = (State.gap[c.id] || 0) + 1;
    if (State.gap[c.id] >= 3 || !State.lastGood[c.id]) { State.shown[c.id] = rd; State.evals[c.id] = ev; }
  }
  // noisy / delayed: the last trusted state is kept (cards mark it as doubtful)
  processVitals(c, rd, ev);
}

/* ===== onTick · called on every provider tick ===== */
let tickCount = 0;
export async function onTick() {
  tickCount++;
  if (tickCount % 3 === 0) await refreshSecondary();
  checkReminders(); expireAlerts(); checkEscalations(); checkMissions();
  UI.renderLive();
}

/* ===== refreshSecondary · env, devices, sleep ===== */
export async function refreshSecondary() {
  if (State.refreshing) return; State.refreshing = true;
  try {
    const p = State.provider, id = State.selectedId;
    try { State.env = await p.getEnvironment(); } catch { State.env = null; }
    State.envEval = RulesEngine.evaluateEnvironment(State.env); processEnvironment();
    if (State.env) { State.envHistory.push({ ...State.env, quality: 'ok' }); if (State.envHistory.length > 600) State.envHistory.shift(); }
    for (const c of State.crew) {
      try { State.devicesBy[c.id] = (await p.getDevices(c.id)) || []; } catch { State.devicesBy[c.id] = []; }
      try { State.sleepBy[c.id]   = await p.getSleepActivity(c.id, dayKey()); } catch { State.sleepBy[c.id] = null; }
    }
    processDevices();
    State.sleepHistory = [];
    for (let i = 6; i >= 1; i--) { const d = new Date(Date.now() - i * 86400000); try { State.sleepHistory.push(await p.getSleepActivity(id, dayKey(d))); } catch { State.sleepHistory.push(null); } }
  } finally { State.refreshing = false; }
}

/* ===== runAlertAction ===== */
export async function runAlertAction(id) {
  const a = alertById(id); if (!a?.action) return; const act = a.action; let ok = true;
  if (act.type === 'hydration') {
    addPoints(CONFIG.gamification.waterPoints, 'Hydration logged');
  } else {
    const r = await State.provider.pushEvent({ type: act.type, astronautId: a.astronautId || State.selectedId, params: { deviceId: act.deviceId, minutes: 15 } });
    ok = r?.ok !== false;
    if (ok) {
      await refreshSecondary();
      addPoints(act.type === 'recharge' ? 20 : act.type === 'reconnect' ? 10 : 15,
        act.type === 'recharge' ? 'Sensor recharged' : act.type === 'reconnect' ? 'Sensor reconnected' : 'Reminder resolved: ' + a.title);
    } else {
      showToast({ level: 'attention', title: 'Action not available', message: 'This data source does not accept that action.' });
    }
  }
  if (ok) resolveAlert(a.key);
  checkMissions(); UI.renderLive();
}

/* ===== Internal alert-processing helpers ===== */
function processVitals(c, rd, ev) {
  if (!(rd.quality === 'ok' || rd.quality === 'missing')) return; // noisy/delayed never open/close alerts
  for (const g of GROUPS) {
    const present = g === 'bp' ? (rd.bpSys != null || rd.bpDia != null) : rd[g] != null; if (!present) continue;
    const m = ev.metrics[g];
    trackCondition(`health:${c.id}:${g}`, m.level, () => ({ domain: 'health', title: METRICS[g].label, message: m.reason || METRICS[g].label, astronautId: c.id, metric: g }));
    const a = openAlertByKey(`health:${c.id}:${g}`); if (a) { announce(a); onAlertOpened(a); }
  }
}
function processEnvironment() {
  if (!State.envEval) return;
  for (const k in CONFIG.thresholds.env) {
    const lvl = State.envEval.metrics[k]; const r = State.envEval.reasons.find(x => x.metric === k);
    trackCondition(`environment:${k}`, lvl, () => ({ domain: 'environment', title: `Environment · ${r.name}`, message: r.text, metric: k }), { raise: 2, clear: 2 });
  }
}
function processDevices() {
  for (const c of State.crew) for (const d of devicesOf(c.id)) {
    for (const kind of ['offline', 'bat', 'signal']) {
      const issues = RulesEngine.evaluateDevice(d);
      const key = `sensor:${d.id}:${kind}`, i = issues.find(x => x.kind === kind);
      if (!i) { if (openAlertByKey(key)) trackCondition(key, 'normal', () => ({})); continue; }
      const title = kind === 'bat' ? 'Recharge sensor' : kind === 'offline' ? 'Sensor disconnected' : 'Weak sensor signal';
      trackCondition(key, 'attention', () => ({ domain: 'sensor', level: 'sensor', title, message: `${i.reason} (${c.name})`, astronautId: c.id, metric: d.id,
        action: kind === 'bat' ? { label: 'Recharge', type: 'recharge', deviceId: d.id } : kind === 'offline' ? { label: 'Reconnect', type: 'reconnect', deviceId: d.id } : null }));
      const al = openAlertByKey(key); if (al) al.level = 'sensor';
    }
  }
}
function devicesOf(id) { return State.devicesBy[id] || []; }

function checkReminders() {
  const a = State.crew.find(c => c.id === State.selectedId); if (!a) return;
  const s = State.sleepBy[a.id] || null, now = new Date(), h = now.getHours(), day = dayKey(now);
  if (s) {
    const key = `rec:ex:${a.id}:${day}`, g = CONFIG.gamification.goals;
    if (h >= 14 && s.exerciseMin < g.exerciseMin) {
      if (canOpen(key)) upsertAlert({ key, domain: 'reminder', level: 'info', title: 'Time to exercise', message: `${a.name}: ${round(g.exerciseMin - s.exerciseMin)} min of exercise left for the daily mission.`, astronautId: a.id, metric: 'exercise', action: { label: '+15 min', type: 'manual_exercise' } });
    } else if (s.exerciseMin >= g.exerciseMin) resolveAlert(key);
    if (s.sleepHours != null && s.sleepHours < 6) { const k = `rec:sleep:${a.id}:${day}`; if (canOpen(k)) upsertAlert({ key: k, domain: 'reminder', level: 'info', title: 'Not enough rest', message: `${a.name} slept ${s.sleepHours} h. A short nap and a workload review may help.`, astronautId: a.id, metric: 'sleep', expiresAt: Date.now() + 6 * 3600000 }); }
  }
  if (h % 2 === 0 && now.getMinutes() < 2) { const k = `rec:water:${day}:${h}`; if (canOpen(k) && !State.cond[k]) { upsertAlert({ key: k, domain: 'reminder', level: 'info', title: 'Hydration', message: 'Drink water: a guideline of 2 L per day.', metric: 'water', action: { label: 'Done', type: 'hydration' }, expiresAt: Date.now() + CONFIG.thresholds.reminderExpireMs }); } }
}
function checkEscalations() {
  const now = Date.now();
  for (const a of State.alerts) {
    if (a.status !== 'active' || a.priority !== 1 || a.escalatedAt || now - a.openedAt < CONFIG.alerts.escalateAfterMs) continue;
    a.escalatedAt = now; const who = a.astronautId ? ' · ' + personName(a.astronautId) : '';
    State.uplink.unshift({ id: uid(), alertId: a.id, text: `ESCALATED · ${a.title}${who}`, queuedAt: now }); if (State.uplink.length > 10) State.uplink.pop();
    say(`Escalated: ${a.title}${who} has not been acknowledged for ${Math.round(CONFIG.alerts.escalateAfterMs / 1000)} seconds.`, true);
    closeToastFor(a.id);
    showToast({ alertId: a.id, level: 'surgeon', title: `Unacknowledged · ${a.title}${who}`, message: 'Escalated to the flight surgeons over the ground link (simulated).', persistent: true, action: { label: 'Acknowledge', run: () => { ackAlert(a.id); UI.renderLive(); } } });
  }
}
function onAlertOpened(a) {
  if (!a || a.domain !== 'health' || a.level !== 'surgeon') return;
  State.uplink.unshift({ id: uid(), alertId: a.id, text: `${a.title} · ${personName(a.astronautId)}`, queuedAt: Date.now() });
  if (State.uplink.length > 10) State.uplink.pop();
}
function announce(a) {
  if (!visibleAlert(a)) return;
  const who = a.astronautId ? ' · ' + personName(a.astronautId) : '';
  const warming = Date.now() - State.startedAt < 6000 && a.level !== 'surgeon';
  say(`New alert: ${LEVELS[a.level]?.label || a.title}. ${a.message}${who}`, a.level === 'surgeon');
  if (!warming && a.priority < 4) {
    showToast({ alertId: a.id, level: a.level === 'info' ? 'normal' : a.level, title: a.title + who, message: a.message, persistent: a.level === 'surgeon',
      action: a.level === 'surgeon' ? { label: 'Acknowledge', run: () => { ackAlert(a.id); UI.renderLive(); } } : null, icon: a.domain });
  }
}
function say(msg, assertive) { const el = document.querySelector(assertive ? '#live-assertive' : '#live-polite'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); }

/* ===== main · entry point ===== */
const VIEWS = ['overview', 'biometrics', 'checkin', 'alerts', 'history', 'about', 'advanced'];
(async function main() {
  const { I18N } = await import('./i18n.js');
  State.load(); UI.init(); I18N.init(State.lang); UI.syncLang();
  const v = location.hash.replace(/^#\/?/, ''); if (VIEWS.includes(v)) State.view = v;
  await startProvider(CONFIG.dataSource);
  UI.go(State.view, true);
  setInterval(() => UI.renderMet(), 1000);
  if (CONFIG.dataSource === 'simulated') setTimeout(() => showToast({ level: 'attention', icon: 'sensor', title: 'Demo mode', message: `All data is simulated (seed ${CONFIG.seed}). No reading belongs to a real person.` }), 800);
})();
