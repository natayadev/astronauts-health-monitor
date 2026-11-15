/**
 * ui/checkin.js · Daily check-in view (private by default).
 * Renders the form, the comparison with the person's own history and the
 * symptom / cabin CO₂ panel. Never raises alerts and never adds points.
 */
import { $, setHtml, pillHtml } from './helpers.js';
import { showToast } from './toasts.js';
import { esc, dayKey } from '../utils.js';
import { State } from '../state.js';
import { CHECKIN_ITEMS, TENSION_OPTIONS, SYMPTOMS, TREND_RULE, ownEntry, saveEntry, skipToday, clearOwn, series, compare, recentCo2, shareSetting } from '../checkin.js';

const crewIndex = id => Math.max(0, State.crew.findIndex(c => c.id === id));
const STATUS = {
  similar:   { level: 'normal',  text: 'Similar to your usual' },
  lower:     { level: 'sensor',  text: 'Lower than your usual for 3 days' },
  notenough: { level: 'partial', text: 'Not enough days yet' },
  nodata:    { level: 'nodata',  text: 'No answers yet' }
};

export const CheckinUI = {
  renderedFor: null,

  init() {
    const form = $('#ci-form');
    form.addEventListener('submit', e => { e.preventDefault(); this.save(); });
    $('#ci-skip').onclick = () => { skipToday(State.selectedId); this.render(true); showToast({ level: 'normal', title: 'Marked as skipped', message: 'Skipping is fine. It is recorded as a missing day, never as "normal".' }); };
    $('#ci-clear').onclick = () => { clearOwn(State.selectedId); this.render(true); showToast({ level: 'normal', title: 'Your answers were deleted from this device', message: 'The simulated demo history is still shown.' }); };
    $('#ci-share').onchange = e => { shareSetting.set(State.selectedId, e.target.checked); this.renderPrivacy(); };
  },

  /** Called on view enter and on every tick; only rebuilds the form when the person changes. */
  render(force) {
    const id = State.selectedId; if (!id) return;
    if (force || this.renderedFor !== id) { this.renderForm(); this.renderedFor = id; }
    this.renderTrend(); this.renderCo2(); this.renderPrivacy();
  },

  renderForm() {
    const id = State.selectedId, e = ownEntry(id), name = State.crew.find(c => c.id === id)?.name || '';
    $('#ci-day').textContent = dayKey();
    setHtml($('#ci-state'), e ? (e.skipped ? pillHtml('partial', 'Skipped today') : pillHtml('normal', 'Answered today')) : pillHtml('nodata', 'Not answered yet'));
    $('#ci-who').textContent = name;
    const items = CHECKIN_ITEMS.map(it => {
      const cur = e && !e.skipped ? e[it.id] : null;
      const radios = Array.from({ length: 11 }, (_, v) => `<label class="ci-opt"><input type="radio" name="ci-${it.id}" value="${v}" ${cur === v ? 'checked' : ''} required><span>${v}</span></label>`).join('');
      return `<fieldset class="ci-q"><legend><b>${esc(it.label)}</b><span class="tag">${esc(it.period)}</span></legend>
        <p class="ci-text">${esc(it.q)}</p>
        <div class="ci-scale" role="radiogroup" aria-label="${esc(it.q)}">${radios}</div>
        <div class="ci-anchors" aria-hidden="true"><span>0 · ${esc(it.lo)}</span><span>10 · ${esc(it.hi)}</span></div></fieldset>`;
    }).join('');
    const ten = e && !e.skipped ? e.tension : null;
    const tension = `<fieldset class="ci-q"><legend><b>Tension</b><span class="tag">Last 24 hours</span><span class="tag">Optional</span></legend>
      <p class="ci-text">Was there any tension with someone? Do not name anyone.</p>
      <div class="ci-choices">${TENSION_OPTIONS.map(o => `<label class="ci-chip"><input type="radio" name="ci-tension" value="${o.v}" ${ten === o.v ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset>`;
    const sy = e && !e.skipped ? (e.symptoms || []) : [];
    const symptoms = `<fieldset class="ci-q"><legend><b>Symptoms</b><span class="tag">Right now</span><span class="tag">Optional</span></legend>
      <div class="ci-choices">${SYMPTOMS.map(o => `<label class="ci-chip"><input type="checkbox" name="ci-sym" value="${o.v}" ${sy.includes(o.v) ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset>`;
    setHtml($('#ci-items'), items + tension + symptoms);
    $('#ci-submit').textContent = e && !e.skipped ? 'Update today’s check-in' : 'Save today’s check-in';
  },

  save() {
    const id = State.selectedId, f = $('#ci-form'), entry = {};
    for (const it of CHECKIN_ITEMS) { const v = f.querySelector(`input[name="ci-${it.id}"]:checked`); if (!v) return; entry[it.id] = +v.value; }
    entry.tension = f.querySelector('input[name="ci-tension"]:checked')?.value || null;
    entry.symptoms = [...f.querySelectorAll('input[name="ci-sym"]:checked')].map(x => x.value);
    saveEntry(id, entry);
    this.render(true);
    showToast({ level: 'normal', icon: 'achievement', title: 'Saved on this device', message: 'Nothing was shared. The check-in never raises alerts and never earns points.' });
  },

  renderTrend() {
    const id = State.selectedId, ser = series(id, crewIndex(id));
    const rows = CHECKIN_ITEMS.map(it => {
      const c = compare(ser, it.id), st = STATUS[c.status];
      const cells = ser.map(x => {
        const e = x.entry, v = e && !e.skipped ? e[it.id] : null;
        const cls = !e ? 'ci-none' : e.skipped ? 'ci-skip' : '';
        const sim = e?.source === 'simulated' ? ' ci-sim' : '';
        return `<i class="ci-cell ${cls}${sim}" style="--v:${v == null ? 0 : v / 10}" title="${x.day}: ${v == null ? (e?.skipped ? 'skipped' : 'no data') : v}">${v == null ? '' : v}</i>`;
      }).join('');
      return `<div class="ci-row"><div class="ci-rh"><b>${esc(it.label)}</b>${pillHtml(st.level, st.text)}</div>
        <div class="ci-strip" role="img" aria-label="${esc(it.label)}: last ${TREND_RULE.baselineDays} days">${cells}</div>
        <div class="ci-meta"><span>Your usual</span><b>${c.usual ?? '--'}</b><span>Latest</span><b>${c.last ?? '--'}</b></div></div>`;
    }).join('');
    const lower = CHECKIN_ITEMS.filter(it => compare(ser, it.id).status === 'lower').map(it => it.label);
    const tensionDays = ser.filter(x => x.entry && !x.entry.skipped && x.entry.tension && x.entry.tension !== 'none').length;
    const msg = lower.length
      ? `<div class="ci-msg"><b>Something changed in your own answers.</b> This is a comparison with your history, not a diagnosis. You decide whether to rest, adjust your day, or bring it up with the crew medical officer or in your private medical conference.</div>`
      : '';
    setHtml($('#ci-trend'), msg + rows + `<p class="note">Tension reported on ${tensionDays} of the last ${TREND_RULE.baselineDays} days.</p>`);
  },

  renderCo2() {
    const e = ownEntry(State.selectedId), sy = e && !e.skipped ? (e.symptoms || []) : [];
    const resp = sy.includes('headache') || sy.includes('congestion');
    if (!resp) { setHtml($('#ci-co2'), '<p class="note">If you report a headache or a stuffy nose, Tesai shows the recent cabin CO₂ next to it, because both have been linked in ISS crews.</p>'); return; }
    const c = recentCo2(State.envHistory, 30);
    if (!c) { setHtml($('#ci-co2'), '<div class="empty">No cabin CO₂ data in this source.</div>'); return; }
    const near = c.mmHg >= 2.3;
    setHtml($('#ci-co2'), `<div class="kv"><div data-level="${near ? 'attention' : 'normal'}"><div class="k">Cabin CO₂, last 30 min</div><div class="v">${c.mmHg}<small>mmHg</small></div></div><div><div class="k">Same, in ppm</div><div class="v">${c.ppm}<small>ppm</small></div></div></div>
      <p class="note"><span>${near ? 'The recent average is in the range where ISS crews have reported symptoms (from about 2.3 mmHg). Consider checking the air system.' : 'The recent average is below the range where ISS crews have reported symptoms (about 2.3 mmHg).'}</span> <span>Showing both together does not mean one causes the other.</span></p>`);
  },

  renderPrivacy() {
    const on = shareSetting.get(State.selectedId); $('#ci-share').checked = on;
    setHtml($('#ci-share-note'), on
      ? '<p class="note">Concept only: a short trend summary (for example "lower than usual for 3 days"), never your answers, would go to the crew medical officer. Nothing is transmitted in this prototype.</p>'
      : '<p class="note">Off: nobody else sees anything from your check-in.</p>');
  }
};
