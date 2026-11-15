/**
 * visor.js · Visor view, situation notice and "second doctor".
 * Visor = every crew member's vital signs always in view (like the helmet
 * visor in the Higía simulation), plus a situation notice that, when an alert
 * opens, guides the crew step by step, by voice and on screen.
 * Same visual system as the rest of Tesai (mint + teal glass).
 */
import { $, $$, setHtml, pillHtml, fmtVal } from './helpers.js';
import { ICONS } from './icons.js';
import { showToast, closeToastFor } from './toasts.js';
import { CONFIG, METRICS, LEVELS } from '../config.js';
import { esc, uid } from '../utils.js';
import { State, ackAlert, personName } from '../state.js';
import { Sound } from '../audio.js';
import { t, guideFor, hasGuide, alertText, introScript, stepScript } from '../guidance.js';

const V = { focusId: null, cur: {}, done: {}, earth: {}, spoken: new Set(), reading: 0, simWho: null, scene: 'ship', onChange: () => {} };

const VITALS = ['hr', 'spo2', 'bp', 'resp', 'temp'];
const SCENES = [
  ['ship', 'Station', 'Estación'],
  ['rover', 'Rover', 'Rover']
];
const SIM = [
  ['tachycardia', 'Tachycardia', 'Taquicardia'],
  ['hypoxia', 'Low oxygen', 'Oxígeno bajo'],
  ['fever', 'Fever', 'Fiebre'],
  ['hypertension', 'High blood pressure', 'Presión alta'],
  ['co2', 'High cabin CO₂', 'CO₂ alto en cabina']
];

/* ===== Data ===== */
const situations = () => State.alerts
  .filter(a => hasGuide(a) && (a.status === 'active' || a.status === 'acknowledged') && (a.level === 'surgeon' || a.level === 'attention'))
  .sort((x, y) => (y.level === 'surgeon') - (x.level === 'surgeon') || y.openedAt - x.openedAt);

export const Visor = {
  /** Called once from UI.init(); onChange re-renders the whole app. */
  init({ onChange }) {
    V.onChange = onChange;
    const root = $('#view-visor');
    root.addEventListener('click', e => { const b = e.target.closest('[data-vz]'); if (b) this.act(b); });
    root.addEventListener('change', e => { const s = e.target.closest('[data-vz="who"]'); if (s) V.simWho = s.value; });
  },

  /** Open the visor focused on one alert (used by the toast action). */
  focus(alertId) { V.focusId = alertId; },

  /** Called when an alert opens or gets worse: tone, and voice for the situation. */
  onSituation(a) {
    if (!hasGuide(a) || (a.level !== 'surgeon' && a.level !== 'attention')) return;
    const k = a.id + ':' + a.level; if (V.spoken.has(k)) return; V.spoken.add(k);
    if (!Sound.enabled || !Sound.unlocked) return;
    const who = personName(a.astronautId), g = guideFor(a);
    if (a.level === 'surgeon') {
      Sound.announce('surgeon', introScript(a, who) + ' ' + t('Open the second doctor for the steps.', 'Abrí el segundo doctor para ver los pasos.'));
    } else {
      Sound.announce('attention', `${t('Notice.', 'Aviso.')} ${who ? who + '. ' : ''}${g ? g.title + '.' : ''}`);
    }
  },

  /* ===== Render ===== */
  render() {
    const root = $('#view-visor'); if (!root) return;
    const pov = $('#vz-pov');
    if (pov) { pov.dataset.scene = V.scene; pov.dataset.alert = situations()[0]?.level || 'none'; }
    setHtml($('#vz-head'), this.headHtml());
    setHtml($('#vz-sit'), this.sitHtml());
    setHtml($('#vz-crew'), this.crewHtml());
    setHtml($('#vz-sim'), this.simHtml());
  },

  headHtml() {
    const on = Sound.enabled, d = CONFIG.uplink.oneWayDelayS;
    return `<div>
        <h2 id="h-visor">Visor</h2>
        <p>${esc(t('What you see through your visor, with every crew member\'s vital signs always in view. If something changes, Tesai warns by tone and voice and the second doctor guides you step by step.', 'Lo que ves a través de tu visor, con los signos vitales de cada tripulante siempre a la vista. Si algo cambia, Tesai avisa con un tono y por voz, y el segundo doctor te guía paso a paso.'))}</p>
      </div>
      <div class="vz-chips">
        <span class="vz-scenes" role="group" aria-label="${esc(t('View', 'Vista'))}">${SCENES.map(([k, en, es]) =>
          `<button class="vz-chip" type="button" data-vz="scene" data-scene="${k}" data-fk="scene-${k}" aria-pressed="${V.scene === k}"><span>${esc(t(en, es))}</span></button>`).join('')}</span>
        <button class="vz-chip" type="button" data-vz="audio" data-fk="vz-audio" aria-pressed="${on}">${AUDIO_ICON}<span>${esc(on ? t('Audio on', 'Audio activado') : t('Audio off', 'Audio apagado'))}</span></button>
        <span class="vz-chip static" title="${esc(t('Simulated one-way delay', 'Demora simulada de ida'))}">${ICONS.link}<span>${esc(t('Earth link', 'Enlace con la Tierra'))} · ${String(d).replace('.', t('.', ','))} s</span></span>
        <a class="vz-chip" href="../simulacion/index.html" data-i18n="off">${ICONS.play ? ICONS.play : ''}<span>${esc(t('Open the simulation', 'Abrir la simulación'))}</span></a>
      </div>`;
  },

  sitHtml() {
    const list = situations();
    if (!list.length) {
      return `<section class="vz-sit calm" data-level="normal" aria-label="${esc(t('Situation notice', 'Aviso de situación'))}">
        <div class="vz-calm">${ICONS.circleOk}<div><b>${esc(t('No active situations', 'Sin situaciones activas'))}</b>
        <p>${esc(t('The second doctor is watching. If a vital sign or the cabin goes out of range, it will warn you here, by tone and by voice.', 'El segundo doctor está atento. Si un signo vital o la cabina se salen de rango, te avisa acá, con un tono y por voz.'))}</p></div></div>
      </section>`;
    }
    const a = list.find(x => x.id === V.focusId) || list[0]; V.focusId = a.id;
    const g = guideFor(a), who = personName(a.astronautId) || t('Cabin', 'Cabina');
    const done = (V.done[a.id] ||= new Set()), cur = V.cur[a.id] ?? 0, crit = a.level === 'surgeon';
    const earth = !!V.earth[a.id] || !!a.escalatedAt, acked = a.status === 'acknowledged';
    const chips = list.length > 1 ? `<div class="vz-pick" role="group" aria-label="${esc(t('Active situations', 'Situaciones activas'))}">${list.map(x =>
      `<button type="button" class="vz-chip" data-vz="focus" data-id="${x.id}" data-fk="focus-${x.id}" aria-pressed="${x.id === a.id}" data-level="${x.level}"><i class="lvdot"></i><span>${esc((personName(x.astronautId) || t('Cabin', 'Cabina')) + ' · ' + (guideFor(x)?.title || x.title))}</span></button>`).join('')}</div>` : '';
    return `<section class="vz-sit" data-level="${a.level}" role="region" aria-labelledby="vz-sit-h">
      <div class="vz-sit-top">
        <span class="eyebrow">${esc(t('Situation notice', 'Aviso de situación'))}</span>
        ${pillHtml(a.level, crit ? t('Alert flight surgeons', 'Avisar a cirujanos de vuelo') : t('Needs attention', 'Requiere atención'))}
        ${acked ? `<span class="vz-ok">${ICONS.tick}${esc(t('Acknowledged', 'Reconocida'))}</span>` : ''}
      </div>
      ${chips}
      <h3 id="vz-sit-h">${esc(who)} · ${esc(g.title)}</h3>
      <p class="vz-reason">${esc(alertText(a.message))}</p>
      <div class="vz-doc">
        <div class="vz-doc-h">${ICONS.heart}<b>${esc(t('Second doctor', 'Segundo doctor'))}</b><span>${esc(t('Step by step', 'Paso a paso'))}</span></div>
        <ol class="vz-steps">${g.steps.map((s, i) => `<li class="${done.has(i) ? 'is-done' : ''}${i === cur ? ' is-next' : ''}">
          <button type="button" data-vz="tick" data-id="${a.id}" data-i="${i}" data-fk="tick-${i}" aria-pressed="${done.has(i)}"><span class="vz-n">${done.has(i) ? ICONS.tick : i + 1}</span><span class="vz-t">${esc(s)}</span></button></li>`).join('')}</ol>
        <div class="vz-actions">
          <button class="btn brand" type="button" data-vz="read" data-id="${a.id}" data-fk="read">${AUDIO_ICON}${esc(t('Read aloud', 'Leer en voz alta'))}</button>
          <button class="btn" type="button" data-vz="next" data-id="${a.id}" data-fk="next">${esc(cur >= g.steps.length ? t('Repeat steps', 'Repetir pasos') : t('Next step', 'Siguiente paso'))}</button>
          <button class="btn" type="button" data-vz="stop" data-fk="stop">${esc(t('Stop voice', 'Detener voz'))}</button>
          <span class="grow"></span>
          <button class="btn" type="button" data-vz="earth" data-id="${a.id}" data-fk="earth" ${earth ? 'disabled' : ''}>${ICONS.link}${esc(earth ? t('Earth notified', 'Tierra avisada') : t('Notify Earth', 'Avisar a la Tierra'))}</button>
          <button class="btn primary" type="button" data-vz="ack" data-id="${a.id}" data-fk="ack" ${acked ? 'disabled' : ''}>${esc(acked ? t('Acknowledged', 'Reconocida') : t('Acknowledge', 'Reconocer'))}</button>
        </div>
        <p class="note">${esc(t('Prototype guidance with simulated data. It is not a diagnosis and does not replace the flight surgeon.', 'Guía de prototipo con datos simulados. No es un diagnóstico ni reemplaza al cirujano de vuelo.'))}</p>
      </div>
    </section>`;
  },

  crewHtml() {
    if (!State.crew.length) return '';
    return State.crew.map(c => {
      const r = State.shown[c.id], ev = State.evals[c.id], lvl = ev?.overall || 'nodata';
      const vit = VITALS.map(g => {
        const m = METRICS[g], ml = ev?.metrics?.[g]?.level || 'nodata';
        const val = !r ? '--' : g === 'bp' ? `${fmtVal(r.bpSys, 0)}/${fmtVal(r.bpDia, 0)}` : fmtVal(r[g], m.dec);
        return `<div class="vz-v" data-level="${ml}"><small>${esc(m.short)}</small><b>${val}</b><i>${esc(m.unit)}</i></div>`;
      }).join('');
      const text = lvl === 'surgeon' ? t('Alert flight surgeons', 'Avisar a cirujanos de vuelo') : lvl === 'attention' ? t('Attention', 'Atención') : lvl === 'normal' ? t('Normal', 'Normal') : lvl === 'partial' ? t('Partial data', 'Datos parciales') : t('No data', 'Sin datos');
      const q = r?.quality && r.quality !== 'ok' ? `<span class="vz-q">${esc(t('Doubtful reading', 'Lectura dudosa'))}</span>` : '';
      return `<article class="vz-card" data-level="${lvl}" aria-label="${esc(c.name)}">
        <header><span class="avatar" data-level="${lvl}">${esc(c.avatar)}</span><div class="who"><b>${esc(c.name)}</b><span>${esc(c.role)}</span></div>${pillHtml(lvl, text)}</header>
        <div class="vz-vitals">${vit}</div>
        ${q}
      </article>`;
    }).join('');
  },

  simHtml() {
    if (!State.demo || State.provider?.describe?.().source !== 'simulated') return '';
    const who = V.simWho && State.crew.some(c => c.id === V.simWho) ? V.simWho : (State.selectedId || State.crew[0]?.id);
    V.simWho = who;
    return `<section class="panel vz-simp" aria-labelledby="vz-sim-h">
      <h3 id="vz-sim-h"><span class="grow">${esc(t('Try a situation', 'Probá una situación'))}</span><span class="tag">${esc(t('Demo mode', 'Modo demo'))}</span></h3>
      <p class="note">${esc(t('Starts a simulated event so you can see and hear the notice and the second doctor. Nothing here is real data.', 'Inicia un evento simulado para que veas y escuches el aviso y al segundo doctor. Nada de esto son datos reales.'))}</p>
      <div class="vz-simrow">
        <label>${esc(t('Crew member', 'Tripulante'))}
          <select data-vz="who" data-fk="vz-who">${State.crew.map(c => `<option value="${c.id}" ${c.id === who ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <div class="vz-simbtns">${SIM.map(([k, en, es]) => `<button class="btn" type="button" data-vz="sim" data-type="${k}" data-fk="sim-${k}">${esc(t(en, es))}</button>`).join('')}</div>
      </div>
    </section>`;
  },

  /* ===== Actions ===== */
  async act(b) {
    const a = State.alerts.find(x => x.id === b.dataset.id), what = b.dataset.vz;
    if (what === 'audio') {
      Sound.unlock(); const on = !Sound.enabled; Sound.setEnabled(on);
      if (on) { Sound.tone('ok'); Sound.speak(t('Audio on. Tesai will warn you by tone and voice.', 'Audio activado. Tesai te avisa con un tono y por voz.')); }
      V.onChange(); return;
    }
    if (what === 'scene') { V.scene = b.dataset.scene === 'rover' ? 'rover' : 'ship'; this.render(); return; }
    if (what === 'focus') { V.focusId = b.dataset.id; this.render(); return; }
    if (what === 'tick' && a) { const s = (V.done[a.id] ||= new Set()), i = +b.dataset.i; s.has(i) ? s.delete(i) : s.add(i); this.render(); return; }
    if (what === 'stop') { V.reading++; Sound.stop(); return; }
    if (what === 'sim') { this.simulate(b.dataset.type); return; }
    if (!a) return;
    if (what === 'read' || what === 'next') {
      Sound.unlock(); if (!Sound.enabled) { Sound.setEnabled(true); V.onChange(); }
      const g = guideFor(a); if (!g) return;
      if (what === 'read') return this.readAll(a, g);
      let i = V.cur[a.id] ?? 0; if (i >= g.steps.length) { i = 0; V.done[a.id] = new Set(); }
      V.reading++; (V.done[a.id] ||= new Set()).add(i); V.cur[a.id] = i + 1; this.render();
      Sound.speak(stepScript(g, i)); return;
    }
    if (what === 'earth') {
      V.earth[a.id] = true; a.escalatedAt ||= Date.now();
      const who = personName(a.astronautId);
      State.uplink.unshift({ id: uid(), alertId: a.id, text: `SECOND DOCTOR · ${a.title}${who ? ' · ' + who : ''}`, queuedAt: Date.now() });
      if (State.uplink.length > 10) State.uplink.pop();
      showToast({ level: 'normal', title: t('Earth notified', 'Tierra avisada'), message: t('Logged over the ground link (simulated).', 'Registrado en el enlace con la Tierra (simulado).') });
      this.render(); V.onChange(); return;
    }
    if (what === 'ack') { ackAlert(a.id); closeToastFor(a.id); V.onChange(); return; }
  },

  async readAll(a, g) {
    const token = ++V.reading, who = personName(a.astronautId);
    await Sound.speak(introScript(a, who));
    for (let i = 0; i < g.steps.length; i++) {
      if (token !== V.reading || !Sound.enabled) return;
      V.cur[a.id] = i; (V.done[a.id] ||= new Set()); this.render();
      await Sound.speak(stepScript(g, i), { interrupt: false });
      if (token !== V.reading) return;
      V.done[a.id].add(i); V.cur[a.id] = i + 1; this.render();
    }
  },

  async simulate(type) {
    const p = State.provider; if (!p?.pushEvent) return;
    Sound.unlock();
    const r = await p.pushEvent({ type, astronautId: type === 'co2' ? null : V.simWho, durationMs: 120000 });
    showToast({ level: 'normal', title: t('Simulated event started', 'Evento simulado iniciado'), message: r?.ok === false ? t('This data source does not accept events.', 'Esta fuente de datos no acepta eventos.') : t('The notice can take a few seconds to appear.', 'El aviso puede tardar unos segundos en aparecer.') });
  }
};

const AUDIO_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
export { AUDIO_ICON };
