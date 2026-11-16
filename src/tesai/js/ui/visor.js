/**
 * visor.js · Visor view, situation notice and "second doctor".
 * Visor = every crew member's vital signs always in view (like the helmet
 * visor in the Tesai simulation), plus a situation notice that, when an alert
 * opens, guides the crew step by step, by voice and on screen.
 * The glass HUD uses the same visual language as the immersive simulation.
 */
import { $, setHtml, fmtVal } from './helpers.js';
import { ICONS } from './icons.js';
import { showToast, closeToastFor } from './toasts.js';
import { CONFIG, METRICS } from '../config.js';
import { esc, uid, pad } from '../utils.js';
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
    setHtml($('#vz-top'), this.topHtml());
    setHtml($('#vz-me'), this.meHtml());
    setHtml($('#vz-doc'), this.docHtml());
    setHtml($('#vz-crew'), this.crewHtml());
    setHtml($('#vz-earth'), this.earthHtml());
    setHtml($('#vz-sit'), this.sitHtml());
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
        <a class="vz-chip" href="../simulacion/" data-i18n="off">${ICONS.play ? ICONS.play : ''}<span>${esc(t('Open the simulation', 'Abrir la simulación'))}</span></a>
      </div>`;
  },

  /* HUD on the glass: same visual language as the immersive simulation
     (dark glass cards, small uppercase labels, mono numbers). */
  topHtml() {
    const ms = Date.now() - new Date(CONFIG.missionStart), d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    const scene = V.scene === 'rover' ? t('Pressurized rover', 'Rover presurizado') : t('Station', 'Estación');
    const delay = String(CONFIG.uplink.oneWayDelayS).replace('.', t('.', ','));
    return `<div class="hc vz-top"><span class="hl">${esc(t('Mission', 'Misión'))}</span><span class="mono hv">${d} d ${pad(h)}:${pad(m)}:${pad(s)}</span><i class="sep"></i><span class="hl">${esc(scene)}</span><i class="sep"></i><span class="hl">${esc(t('Earth link', 'Enlace con la Tierra'))}</span><span class="mono hv">${delay} s</span></div>`;
  },

  meHtml() {
    const c = State.crew.find(x => x.id === State.selectedId) || State.crew[0]; if (!c) return '';
    const r = State.shown[c.id], ev = State.evals[c.id], env = State.env || {};
    const lv = g => ev?.metrics?.[g]?.level || 'nodata';
    const v = g => !r ? '--' : g === 'bp' ? `${fmtVal(r.bpSys, 0)}/${fmtVal(r.bpDia, 0)}` : fmtVal(r[g], METRICS[g].dec);
    const first = c.name.split(' ')[0];
    return `<section class="hc" aria-label="${esc(t('Your visor', 'Tu visor'))}">
      <div class="hrow"><span class="hl">${esc(t('Your visor', 'Tu visor'))} · ${esc(first)}</span>${lvWord(ev?.overall)}</div>
      <div class="hgrid">
        ${kv(t('Your pulse', 'Tu pulso'), v('hr'), 'bpm', lv('hr'), true)}
        ${kv('SpO₂', v('spo2'), '%', lv('spo2'), true)}
        ${kv(t('Blood pressure', 'Presión'), v('bp'), 'mmHg', lv('bp'))}
        ${kv(t('Breathing', 'Respiración'), v('resp'), 'rpm', lv('resp'))}
        ${kv(t('Temp.', 'Temp.'), v('temp'), '°C', lv('temp'))}
        ${kv(t('Cabin CO₂', 'CO₂ cabina'), env.co2 == null ? '--' : fmtVal(env.co2, 0), 'ppm', State.envEval?.metrics?.co2 || 'nodata')}
        ${kv(t('Cabin O₂', 'O₂ cabina'), env.oxygen == null ? '--' : fmtVal(env.oxygen, 1), 'kPa', State.envEval?.metrics?.oxygen || 'nodata')}
        ${kv(t('Pressure', 'Presión cab.'), env.pressure == null ? '--' : fmtVal(env.pressure, 1), 'kPa', State.envEval?.metrics?.pressure || 'nodata')}
      </div>
    </section>`;
  },

  docHtml() {
    const list = situations(), voice = Sound.enabled ? t('Voice · on', 'Voz · activada') : t('Voice · off', 'Voz · apagada');
    const top = `<div class="hrow"><span class="hl">Tesai · ${esc(t('Second doctor', 'Segundo doctor'))}</span><span class="hl">${esc(voice)}</span></div>`;
    if (!list.length) {
      return `<section class="hc vz-ai" aria-label="${esc(t('Second doctor', 'Segundo doctor'))}">${top}
        <p class="msg">${esc(t('I am watching the whole crew. If a vital sign or the cabin goes out of range, I will warn you here, by tone and by voice.', 'Estoy atento a toda la tripulación. Si un signo vital o la cabina se salen de rango, te aviso acá, con un tono y por voz.'))}</p>
      </section>`;
    }
    const a = list.find(x => x.id === V.focusId) || list[0]; V.focusId = a.id;
    const g = guideFor(a), who = personName(a.astronautId) || t('Cabin', 'Cabina');
    const done = (V.done[a.id] ||= new Set()), cur = V.cur[a.id] ?? 0, crit = a.level === 'surgeon';
    const earth = !!V.earth[a.id] || !!a.escalatedAt, acked = a.status === 'acknowledged';
    return `<section class="hc vz-ai${crit ? ' crit' : ''}" aria-label="${esc(t('Second doctor', 'Segundo doctor'))}">${top}
      <p class="msg">${esc(who)}: ${esc(g.title.toLowerCase())}. ${esc(t('Follow these steps.', 'Seguí estos pasos.'))}</p>
      <ol class="vz-steps">${g.steps.map((s, i) => `<li class="${done.has(i) ? 'is-done' : ''}${i === cur ? ' is-next' : ''}">
        <button type="button" data-vz="tick" data-id="${a.id}" data-i="${i}" data-fk="tick-${i}" aria-pressed="${done.has(i)}"><span class="vz-n" aria-hidden="true"></span><span class="vz-t">${esc(s)}</span></button></li>`).join('')}</ol>
      <div class="vz-actions">
        <button class="hbtn" type="button" data-vz="read" data-id="${a.id}" data-fk="read">${AUDIO_ICON}${esc(t('Read aloud', 'Leer en voz alta'))}</button>
        <button class="hbtn" type="button" data-vz="next" data-id="${a.id}" data-fk="next">${esc(cur >= g.steps.length ? t('Repeat steps', 'Repetir pasos') : t('Next step', 'Siguiente paso'))}</button>
        <button class="hbtn" type="button" data-vz="stop" data-fk="stop">${esc(t('Stop voice', 'Detener voz'))}</button>
        <button class="hbtn" type="button" data-vz="earth" data-id="${a.id}" data-fk="earth" ${earth ? 'disabled' : ''}>${esc(earth ? t('Earth notified', 'Tierra avisada') : t('Notify Earth', 'Avisar a la Tierra'))}</button>
        <button class="hbtn primary" type="button" data-vz="ack" data-id="${a.id}" data-fk="ack" ${acked ? 'disabled' : ''}>${esc(acked ? t('Acknowledged', 'Reconocida') : t('Acknowledge', 'Reconocer'))}</button>
      </div>
      <p class="hnote">${esc(t('Prototype guidance with simulated data. Not a diagnosis; it does not replace the flight surgeon.', 'Guía de prototipo con datos simulados. No es un diagnóstico ni reemplaza al cirujano de vuelo.'))}</p>
    </section>`;
  },

  crewHtml() {
    const others = State.crew.filter(c => c.id !== State.selectedId);
    return others.map(c => {
      const r = State.shown[c.id], ev = State.evals[c.id], lvl = ev?.overall || 'nodata';
      const lv = g => ev?.metrics?.[g]?.level || 'nodata';
      const v = g => !r ? '--' : g === 'bp' ? `${fmtVal(r.bpSys, 0)}/${fmtVal(r.bpDia, 0)}` : fmtVal(r[g], METRICS[g].dec);
      const first = c.name.split(' ')[0];
      const q = r?.quality && r.quality !== 'ok';
      return `<article class="hc vz-mate" data-level="${lvl}" aria-label="${esc(c.name)}">
        <div class="hrow"><span class="hl">${esc(first)} · ${esc(t('Biomonitor', 'Biomonitor'))}</span>${lvWord(lvl)}</div>
        <div class="hrow base"><b class="big mono" data-level="${lv('hr')}">${v('hr')}<small>bpm</small></b><span class="mono hv" data-level="${lv('spo2')}">SpO₂ ${v('spo2')}%</span></div>
        ${r?.hr != null ? ecgSvg(r.hr, lvl) : ''}
        <div class="hgrid three">
          ${kv(t('BP', 'PA'), v('bp'), '', lv('bp'))}
          ${kv(t('Breath.', 'Resp.'), v('resp'), 'rpm', lv('resp'))}
          ${kv(t('Temp.', 'Temp.'), v('temp'), '°C', lv('temp'))}
        </div>
        ${q ? `<p class="hnote">${esc(t('Doubtful reading: check the sensor.', 'Lectura dudosa: revisá el sensor.'))}</p>` : ''}
      </article>`;
    }).join('');
  },

  earthHtml() {
    const sent = State.uplink.length, delay = String(CONFIG.uplink.oneWayDelayS).replace('.', t('.', ','));
    return `<section class="hc" aria-label="${esc(t('Earth link', 'Enlace con la Tierra'))}">
      <div class="hrow"><span class="hl">${esc(t('Earth · auto uplink', 'Tierra · enlace automático'))}</span><span class="hl mono">${sent}</span></div>
      <div class="hrow base"><span class="hl">${esc(t('One-way delay', 'Demora de ida'))}</span><b class="big mono">${delay}<small>s</small></b></div>
      <div class="hrow"><span class="hl">${esc(t('Medical reply', 'Respuesta médica'))}</span><span class="hv">${esc(sent ? t('notice sent', 'aviso enviado') : t('none requested', 'ninguna pedida'))}</span></div>
      <p class="hnote">${esc(t('Simulated link: nothing is transmitted.', 'Enlace simulado: no se transmite nada.'))}</p>
    </section>`;
  },

  sitHtml() {
    const list = situations();
    if (!list.length) return '';
    const a = list.find(x => x.id === V.focusId) || list[0];
    const g = guideFor(a), who = personName(a.astronautId) || t('Cabin', 'Cabina'), crit = a.level === 'surgeon';
    const earth = !!V.earth[a.id] || !!a.escalatedAt, acked = a.status === 'acknowledged';
    const pick = list.length > 1 ? list.map(x => `<button type="button" class="chip" data-vz="focus" data-id="${x.id}" data-fk="focus-${x.id}" aria-pressed="${x.id === a.id}">${esc((personName(x.astronautId) || t('Cabin', 'Cabina')) + ' · ' + (guideFor(x)?.title || x.title))}</button>`).join('') : '';
    return `<section class="hc vz-banner${crit ? ' crit' : ''}" role="region" aria-labelledby="vz-sit-h">
      <span class="hl">${esc(crit ? t('Alert flight surgeons', 'Avisar a cirujanos de vuelo') : t('Needs attention', 'Requiere atención'))}</span>
      <h3 id="vz-sit-h">${esc(who)} · ${esc(g.title)}</h3>
      <p>${esc(alertText(a.message))}</p>
      <div class="chips"><span class="chip lit">${esc(t('Tone and voice', 'Tono y voz'))}</span><span class="chip${earth ? ' lit' : ''}">${esc(earth ? t('Earth notified', 'Tierra avisada') : t('Earth not notified', 'Tierra sin avisar'))}</span><span class="chip${acked ? ' lit' : ''}">${esc(acked ? t('Acknowledged', 'Reconocida') : t('Not acknowledged', 'Sin reconocer'))}</span>${pick}</div>
    </section>`;
  },

  simHtml() {
    if (!State.demo || !['simulated', 'mixed'].includes(State.provider?.describe?.().source)) return '';
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
    showToast(r?.ok ? { level: 'normal', title: t('Simulated event started', 'Evento simulado iniciado'), message: t('The notice can take a few seconds to appear.', 'El aviso puede tardar unos segundos en aparecer.') }
      : { level: 'attention', title: t('Event not accepted', 'Evento no aceptado'), message: t('This data source does not accept events. Switch to the simulated source in Advanced.', 'Esta fuente de datos no acepta eventos. Cambiá a la fuente simulada en Avanzado.') });
  }
};

function lvWord(lvl) {
  const w = lvl === 'surgeon' ? t('Critical', 'Crítico') : lvl === 'attention' ? t('Attention', 'Atención') : lvl === 'normal' ? t('All good', 'Todo bien') : lvl === 'partial' ? t('Partial data', 'Datos parciales') : t('No data', 'Sin datos');
  return `<span class="hstate" data-level="${lvl || 'nodata'}"><i></i>${esc(w)}</span>`;
}
function kv(label, value, unit, lvl, big) {
  return `<div class="kv" data-level="${lvl || 'nodata'}"><span class="hl">${esc(label)}</span><b class="mono${big ? ' big' : ''}">${value}${unit ? `<small>${esc(unit)}</small>` : ''}</b></div>`;
}
/* Illustrative ECG drawn from the heart rate (beats across a 3 s window), as in the simulation's biomonitor. */
function ecgSvg(hr, lvl) {
  const W = 220, H = 40, mid = 24, beats = Math.max(2, Math.min(8, Math.round(hr / 20))), step = W / beats;
  let d = `M0 ${mid}`;
  for (let i = 0; i < beats; i++) {
    const x = i * step;
    d += ` L${(x + step * .28).toFixed(1)} ${mid} q${(step * .05).toFixed(1)} -4 ${(step * .1).toFixed(1)} 0 L${(x + step * .44).toFixed(1)} ${mid} l3 4 l4 -${mid - 4} l4 ${mid + 4} l3 -8 L${(x + step * .66).toFixed(1)} ${mid} q${(step * .08).toFixed(1)} -7 ${(step * .16).toFixed(1)} 0 L${(x + step).toFixed(1)} ${mid}`;
  }
  return `<svg class="ecg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" data-level="${lvl}"><path d="${d}"/></svg>`;
}

const AUDIO_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
export { AUDIO_ICON };
