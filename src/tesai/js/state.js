/**
 * state.js · App state store + alert lifecycle + ground link + missions.
 * All mutable runtime state lives here. No DOM access.
 */
import { CONFIG, LEVELS, METRICS } from './config.js';
import { uid, dayKey, round } from './utils.js';
import { RulesEngine, GROUPS } from './rules.js';

/* ===== Mission definitions ===== */
export const MISSION_DEFS = [
  { id: 'exercise',  title: 'Daily training',    desc: 'Complete 60 min of exercise',           goal: () => CONFIG.gamification.goals.exerciseMin, unit: 'min', points: 150, icon: 'run',     progress: s => s.sleepOf(s.selectedId)?.exerciseMin ?? 0 },
  { id: 'sleep',     title: 'Optimal rest',       desc: 'Sleep at least 7 h',                    goal: () => CONFIG.gamification.goals.sleepHours,  unit: 'h',   points: 120, icon: 'moon',    progress: s => s.sleepOf(s.selectedId)?.sleepHours ?? 0 },
  { id: 'hobby',     title: 'Free time',          desc: '30 min of hobby or recreation',          goal: () => CONFIG.gamification.goals.hobbyMin,    unit: 'min', points: 60,  icon: 'music',   progress: s => s.sleepOf(s.selectedId)?.hobbyMin ?? 0 },
  { id: 'batteries', title: 'Charged sensors',    desc: 'All your devices above 50%',             goal: s => Math.max(1, s.devicesOf(s.selectedId).length), unit: '', points: 80, icon: 'battery', progress: s => s.devicesOf(s.selectedId).filter(d => d.battery >= CONFIG.gamification.goals.batteryMin).length }
];

export const defaultGam = () => ({ points: 0, streak: 4, bestStreak: 9, demo: true, completed: {}, streakDays: {}, achievements: [] });

export const State = {
  provider: null, crew: [], selectedId: null,
  latest: {}, shown: {}, history: {}, evals: {}, lastGood: {}, gap: {},
  env: null, envEval: null, envHistory: [],
  devicesBy: {}, sleepBy: {}, sleepHistory: [],
  alerts: [], alertIndex: {}, cond: {}, uplink: [], toastByAlert: {},
  view: 'overview', alertFilter: 'active', sound: true, demo: true,
  motion: 'auto', histPaused: false, selMetric: null, drawerWin: 30,
  gam: defaultGam(), unsub: [], startedAt: Date.now(), sourceNote: '',
  refreshing: false, lang: 'en',

  devicesOf(id) { return this.devicesBy[id] || []; },
  sleepOf(id)   { return this.sleepBy[id] || null; },

  save() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        gam: this.gam, sound: this.sound, demo: this.demo, motion: this.motion,
        seed: CONFIG.seed, tickMs: CONFIG.tickMs, dataSource: CONFIG.dataSource, lang: this.lang
      }));
      localStorage.setItem('tesai.lang', this.lang);
    } catch (e) { /* storage unavailable */ }
  },

  load() {
    const shared = () => { try { const l = localStorage.getItem('tesai.lang'); if (l === 'es' || l === 'en') this.lang = l; } catch (e) { /* the site shares one language */ } };
    try {
      const s = JSON.parse(localStorage.getItem(CONFIG.storageKey) || 'null'); if (!s) { shared(); return; }
      if (s.gam) this.gam = { ...defaultGam(), ...s.gam };
      this.sound = s.sound === undefined ? true : !!s.sound;
      if (s.demo === false) this.demo = false;
      if (s.motion) this.motion = s.motion;
      if (s.seed)   CONFIG.seed = s.seed;
      if (s.tickMs) CONFIG.tickMs = s.tickMs;
      if (s.dataSource && s.dataSource !== 'file') CONFIG.dataSource = s.dataSource;
      if (s.lang === 'es' || s.lang === 'en') this.lang = s.lang;
    } catch (e) { /* corrupt storage */ }
    shared();
  }
};

/* ===== Alert helpers ===== */
const SEV = { normal: 0, info: 0, sensor: 1, attention: 2, surgeon: 3 };
export const sev          = l => SEV[l] ?? 0;
export const alertById    = id => State.alerts.find(a => a.id === id);
export const canOpen      = key => !State.alertIndex[key] && !(State.cond[key]?.until > Date.now());
export const openAlertByKey = key => { const id = State.alertIndex[key]; return id ? alertById(id) : null; };
export const personName   = id => State.crew.find(c => c.id === id)?.name || '';
export const visibleAlert = a => !a.astronautId || a.astronautId === State.selectedId || a.level === 'surgeon';
export const activeAlerts = () => State.alerts.filter(a => a.status === 'active' && visibleAlert(a)).sort((x, y) => x.priority - y.priority || y.openedAt - x.openedAt);

const priorityOf = a => a.level === 'surgeon' ? 1 : (a.domain === 'health' || a.domain === 'environment') ? 2 : a.domain === 'sensor' ? 3 : 4;
export const PRIORITY_LABEL = { 1: 'Critical', 2: 'Health and environment', 3: 'Sensors', 4: 'Reminders' };

/* ===== Alert lifecycle ===== */
export function upsertAlert({ key, domain, level, title, message, astronautId = null, metric = '', action = null, expiresAt = null }) {
  const now = Date.now(); let a = openAlertByKey(key);
  if (a) {
    a.lastSeenAt = now; a.seen++;
    if (sev(level) > sev(a.level)) {
      a.level = level; a.title = title; a.message = message; a.ackedAt = null; a.snoozedUntil = null; a.escalatedAt = null; a.status = 'active'; a.priority = priorityOf(a);
      // announce + onAlertOpened handled by caller (alerts.js) to avoid circular deps
    }
    return a;
  }
  a = { id: uid(), key, domain, level, title, message, astronautId, metric, action, status: 'active', openedAt: now, lastSeenAt: now, ackedAt: null, resolvedAt: null, snoozedUntil: null, escalatedAt: null, seen: 1, expiresAt };
  a.priority = priorityOf(a);
  State.alerts.unshift(a); State.alertIndex[key] = a.id;
  if (State.alerts.length > 160) { const old = State.alerts.findLastIndex(x => x.status === 'resolved'); if (old >= 0) State.alerts.splice(old, 1); }
  return a;
}

export function resolveAlert(key) {
  const a = openAlertByKey(key); if (!a) return;
  a.status = 'resolved'; a.resolvedAt = Date.now(); delete State.alertIndex[key];
  if (a.domain === 'reminder') State.cond[key] = { bad: 0, good: 0, until: Date.now() + (key.startsWith('rec:ex') ? 15 * 60000 : 6 * 3600000) };
}

export function ackAlert(id) {
  const a = alertById(id); if (!a || (a.status !== 'active' && a.status !== 'snoozed')) return;
  a.status = 'acknowledged'; a.ackedAt = Date.now(); a.snoozedUntil = null;
}

export function ackNonCritical() {
  let n = 0;
  State.alerts.forEach(a => { if (a.status === 'active' && a.level !== 'surgeon' && visibleAlert(a)) { a.status = 'acknowledged'; a.ackedAt = Date.now(); n++; } });
  return n;
}

export function snoozeAlert(id) {
  const a = alertById(id); if (!a || a.status !== 'active' || a.priority === 1) return;
  a.status = 'snoozed'; a.snoozedUntil = Date.now() + CONFIG.alerts.snoozeMs;
}

export function unsnoozeAlert(id) {
  const a = alertById(id); if (!a || a.status !== 'snoozed') return;
  a.status = 'active'; a.snoozedUntil = null;
}

export function snoozeNonCritical() {
  let n = 0;
  State.alerts.forEach(a => { if (a.status === 'active' && a.priority > 1 && visibleAlert(a)) { a.status = 'snoozed'; a.snoozedUntil = Date.now() + CONFIG.alerts.snoozeMs; n++; } });
  return n;
}

export function expireAlerts() {
  const now = Date.now();
  for (const a of State.alerts) {
    if (a.status !== 'resolved' && a.expiresAt && a.expiresAt < now) resolveAlert(a.key);
    else if (a.status === 'snoozed' && a.snoozedUntil < now) { a.status = 'active'; a.snoozedUntil = null; }
  }
}

/* ===== Condition debounce (open alert after N consecutive out-of-band readings) ===== */
export function trackCondition(key, level, build, { raise = CONFIG.thresholds.raiseAfter, clear = CONFIG.thresholds.clearAfter } = {}) {
  const st = (State.cond[key] ||= { bad: 0, good: 0 });
  if (level === 'attention' || level === 'surgeon') {
    st.bad++; st.good = 0;
    if (level === 'surgeon' || st.bad >= raise) return upsertAlert({ key, level, ...build() });
  } else if (level === 'normal') {
    st.good++; st.bad = 0; if (st.good >= clear) resolveAlert(key);
  }
}

/* ===== Uplink status ===== */
export function uplinkStatus(u) {
  const e = Date.now() - u.queuedAt, c = CONFIG.uplink;
  return e < c.queueMs ? 'queued' : e < c.queueMs + c.sendMs ? 'transmitting' : 'delivered (simulated)';
}

/* ===== Points and gamification ===== */
export function addPoints(n, why) {
  State.gam.points += n;
  State.gam.achievements.unshift({ t: new Date().toISOString(), text: why, pts: n });
  if (State.gam.achievements.length > 30) State.gam.achievements.pop();
  State.save();
}

export function missionState(def) {
  const goal = typeof def.goal === 'function' ? def.goal(State) : def.goal;
  const prog = def.progress(State) || 0;
  return { goal, prog, pct: Math.min(100, Math.max(0, prog / goal * 100)), done: prog >= goal };
}

export function checkMissions() {
  if (!State.selectedId) return;
  const day = dayKey(), done = (State.gam.completed[day] ||= {});
  let all = true;
  for (const def of MISSION_DEFS) {
    const ms = missionState(def);
    if (ms.done && !done[def.id]) { done[def.id] = new Date().toISOString(); addPoints(def.points, `Mission completed: ${def.title}`); }
    if (!done[def.id]) all = false;
  }
  if (all && !State.gam.streakDays[day]) {
    State.gam.streakDays[day] = true; State.gam.streak += 1;
    State.gam.bestStreak = Math.max(State.gam.bestStreak, State.gam.streak);
    addPoints(200, 'Daily streak bonus');
  }
  State.save();
}

/* ===== Guidance: next recommended step (non-diagnostic) ===== */
export function nextStep() {
  const act = activeAlerts(), top = act[0], id = State.selectedId, ev = State.evals[id];
  if (top?.level === 'surgeon') return 'A simulated notice was logged to the flight surgeons over the ground link. Repeat the measurement in a few minutes and check that the sensor is well placed.';
  const health = act.find(a => a.domain === 'health');
  if (health) return 'Repeat the measurement in a few minutes with the sensor well placed. If the value stays out of range, notify Earth over the link.';
  if (act.find(a => a.domain === 'environment')) return 'Check the ventilation and the cabin equipment. If the value stays out of range, notify Earth.';
  if (act.find(a => a.domain === 'sensor') || ev?.partial) return `Reconnect or recharge the sensor to recover ${ev?.missing?.length ? 'the ' + ev.missing.length + ' missing metrics' : 'the metrics'}.`;
  const m = MISSION_DEFS.map(d => ({ d, s: missionState(d) })).find(x => !x.s.done);
  if (m) return `${round(m.s.goal - m.s.prog, m.d.unit === 'h' ? 1 : 0)} ${m.d.unit || 'sensor(s)'} to go to complete "${m.d.title}".`;
  return 'All good: no pending steps for now.';
}

/* ===== Attention summary for the status strip ===== */
export function attention() {
  const act = activeAlerts(), id = State.selectedId, ev = State.evals[id] || { overall: 'nodata', reasons: [], missing: [], coverage: 0 };
  const p = personName(id), crit = act.filter(a => a.level === 'surgeon'), health = act.filter(a => a.domain === 'health' || a.domain === 'environment'), other = act.filter(a => !(a.domain === 'health' || a.domain === 'environment'));
  if (crit.length)   return { level: 'surgeon',   title: crit.length > 1 ? `Alert flight surgeons · ${crit.length} critical alerts` : `Alert flight surgeons · ${personName(crit[0].astronautId) || 'Cabin'}`, text: (crit[0].escalatedAt ? 'Not acknowledged for over a minute. ' : '') + crit[0].message, ackId: crit[0].id, count: act.length };
  if (health.length) return { level: 'attention', title: `Needs attention · ${health.length} ${health.length > 1 ? 'alerts' : 'alert'}`, text: `${health[0].title}${health[0].astronautId ? ' · ' + personName(health[0].astronautId) : ''}: ${health[0].message}`, ackId: health[0].id, count: act.length };
  if (other.length) { const sensors = other.filter(a => a.domain === 'sensor'), only = !sensors.length; return { level: 'sensor', icon: null, title: only ? (other.length > 1 ? `${other.length} reminders` : other[0].title) : `${sensors.length} ${sensors.length > 1 ? 'sensor alerts' : 'sensor alert'}`, text: (sensors[0] || other[0]).message, ackId: (sensors[0] || other[0]).id, count: act.length }; }
  if (ev.overall === 'partial') return { level: 'partial', title: `Partial data · ${ev.coverage} of ${GROUPS.length} metrics`, text: `Missing: ${ev.missing.map(g => METRICS[g].short).join(', ')}. A "Normal" status cannot be confirmed without all metrics.`, count: 0 };
  if (ev.overall === 'nodata')  return { level: 'nodata',  title: 'No data for ' + (p || 'the selected person'), text: 'There are no trusted readings yet.', count: 0 };
  return { level: ev.overall, title: `Overall status · ${LEVELS[ev.overall].label}`, text: ev.overall === 'normal' ? `All of ${p}'s parameters are in range.` : (ev.reasons.find(r => r.level !== 'normal')?.text || ''), count: 0 };
}
