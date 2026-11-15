/**
 * ui.js · UI controller
 * Owns: navigation, stage, twin, cards, drawer, views, alert list, About, Advanced.
 */
import { $, $$, setHtml, setText, pillHtml, alertLevelData, alertIcon, alertPillText, fmtVal, levelOf, trusted, metricKey, histRows, chartInner, download, beep } from './helpers.js';
import { ICONS, LV_ICON } from './icons.js';
import { showToast, closeToastFor } from './toasts.js';
import { CONFIG, METRICS, LEVELS, SCHEMA, ENV_META, CREDITS } from '../config.js';
import { esc, fmtTime, pad, clamp, round, dayKey } from '../utils.js';
import { State, activeAlerts, alertById, visibleAlert, ackAlert, ackNonCritical, snoozeAlert, unsnoozeAlert, snoozeNonCritical, resolveAlert, addPoints, checkMissions, missionState, MISSION_DEFS, PRIORITY_LABEL, nextStep, attention, uplinkStatus, personName, defaultGam } from '../state.js';
import { RulesEngine, GROUPS } from '../rules.js';
import { I18N } from '../i18n.js';
import { EVIDENCE, SOURCES, REAL_SOURCES, BASIS_LABEL, BASIS_LEVEL, EVIDENCE_LEGEND, citeText, apaItems, hasUnverified, evBtn, evidenceBody, evCell, basisPill } from '../evidence.js';
import { refreshSecondary, startProvider, runAlertAction } from '../app.js';

const VIEWS = ['overview', 'biometrics', 'alerts', 'history', 'about', 'advanced'];

/* ===== Twin geometry ===== */
/* Astronaut suit silhouette — used only for the scan-line mask.
   PNG is 491×1080, rendered at x=542 y=0 w=356 h=780 in the 1440×780 viewBox.
   Scale factors: sx = 356/491 ≈ 0.725, sy = 780/1080 ≈ 0.722, offset x += 542.
   Suit occupies roughly the central 70% of the PNG width. */
const TWIN_PARTS = [
  // Helmet
  '<ellipse cx="720" cy="108" rx="62" ry="68" stroke-width="0"/>',
  // Neck / collar
  '<ellipse cx="720" cy="178" rx="38" ry="16" stroke-width="0"/>',
  // Torso
  '<path d="M638 184 C624 192 616 210 616 230 L616 460 C616 476 626 488 642 494 L720 498 L798 494 C814 488 824 476 824 460 L824 230 C824 210 816 192 802 184 Z" stroke-width="0"/>',
  // Left upper arm
  '<path d="M622 190 C606 196 594 210 588 228 L572 334 C568 350 574 364 586 370 L608 376 C620 370 626 356 628 340 L640 234 C642 218 638 204 622 190 Z" stroke-width="0"/>',
  // Left forearm + glove
  '<path d="M586 370 C572 378 562 392 560 408 L552 480 C550 496 558 508 570 514 L596 520 C608 514 614 500 614 486 L620 414 C622 398 616 386 602 378 Z" stroke-width="0"/>',
  '<ellipse cx="582" cy="536" rx="28" ry="22" stroke-width="0"/>',
  // Right upper arm
  '<path d="M818 190 C834 196 846 210 852 228 L868 334 C872 350 866 364 854 370 L832 376 C820 370 814 356 812 340 L800 234 C798 218 802 204 818 190 Z" stroke-width="0"/>',
  // Right forearm + glove
  '<path d="M854 370 C868 378 878 392 880 408 L888 480 C890 496 882 508 870 514 L844 520 C832 514 826 500 826 486 L820 414 C818 398 824 386 838 378 Z" stroke-width="0"/>',
  '<ellipse cx="858" cy="536" rx="28" ry="22" stroke-width="0"/>',
  // Left leg
  '<path d="M642 494 C628 500 618 512 616 528 L608 616 C606 632 612 644 624 650 L664 656 C676 650 682 638 682 622 L688 534 C690 518 686 506 672 498 Z" stroke-width="0"/>',
  '<path d="M624 650 C610 658 602 672 602 688 L600 752 C600 762 608 768 620 768 L672 768 C684 768 692 762 692 752 L692 688 C692 672 684 658 668 650 Z" stroke-width="0"/>',
  // Right leg
  '<path d="M798 494 C812 500 822 512 824 528 L832 616 C834 632 828 644 816 650 L776 656 C764 650 758 638 758 622 L752 534 C750 518 754 506 768 498 Z" stroke-width="0"/>',
  '<path d="M816 650 C830 658 838 672 838 688 L840 752 C840 762 832 768 820 768 L768 768 C756 768 748 762 748 752 L748 688 C748 672 756 658 772 650 Z" stroke-width="0"/>'
];

const LAYOUT = {
  hrv:  { side: 'L', top: 60,  node: [720, 108] },  // helmet (HRV)
  resp: { side: 'L', top: 290, node: [655, 310] },  // left chest (respiration)
  spo2: { side: 'L', top: 520, node: [582, 536] },  // left glove (SpO₂)
  hr:   { side: 'R', top: 60,  node: [762, 310] },  // right chest / heart
  bp:   { side: 'R', top: 290, node: [858, 536] },  // right glove (BP cuff)
  temp: { side: 'R', top: 520, node: [720, 420] }   // abdomen / belt (core temp)
};
const COL = { L: { x: 96, w: 290 }, R: { x: 1054, w: 290 } };

function linkPoints(g) {
  const { side, top, node } = LAYOUT[g], c = COL[side], ay = top + 42, dy = Math.abs(ay - node[1]);
  if (side === 'L') { const ax = c.x + c.w + 10, c2 = ax + 128, c1 = Math.min(node[0] - 40, c2 + dy); return { pts: [node, [c1, node[1]], [c2, ay], [ax, ay]], anchor: [ax, ay] }; }
  const ax = c.x - 10, c2 = ax - 128, c1 = Math.max(node[0] + 40, c2 - dy);
  return { pts: [node, [c1, node[1]], [c2, ay], [ax, ay]], anchor: [ax, ay] };
}

function _evBtn(key) { return evBtn(key, pillHtml); }
function _basisPill(b) { return basisPill(pillHtml, b); }
function _evidenceBody(key) { return evidenceBody(key, pillHtml); }
function _evCell(key) { return evCell(key, pillHtml); }

export const UI = {
  menuOpen: null, drawerTrigger: null, compact: false, scale: 1, evOpen: false, evKey: null, evTrigger: null,

  init() {
    // Twin — PNG is shown via <image> in HTML; no SVG primitives needed
    // #twin-body and #twin-mask-g are kept empty (mask not used with the PNG approach)

    // Links and cards
    let links = '', cards = '';
    for (const g of GROUPS) {
      const m = METRICS[g], { side, top, node } = LAYOUT[g], c = COL[side], lp = linkPoints(g);
      links += `<g class="link" id="lk-${g}" data-level="nodata"><polyline points="${lp.pts.map(p => p.join(',')).join(' ')}"/><circle class="dot" cx="${lp.anchor[0]}" cy="${lp.anchor[1]}" r="3.5"/><circle class="ring" cx="${node[0]}" cy="${node[1]}" r="6"/><circle class="node" cx="${node[0]}" cy="${node[1]}" r="5.5"/><circle class="hit" cx="${node[0]}" cy="${node[1]}" r="18" tabindex="0" role="button" aria-label="Open history for ${m.label}" data-m="${g}"/></g>`;
      cards += `<div class="metric" id="m-${g}" role="button" tabindex="0" aria-pressed="false" data-m="${g}" data-level="nodata" style="--x:${c.x}px;--y:${top}px;--w:${c.w}px">
        <div class="hd"><span class="ico">${ICONS[m.icon]}</span><span class="lbl">${m.label}</span></div>
        <div class="val"><b data-r="val">--</b><small>${m.unit}</small></div>
        ${g === 'hr' ? '<svg class="ecg" width="256" height="34" viewBox="0 0 256 34" aria-hidden="true"><g><path d="M0 20 L30 20 L35 16 L40 20 L46 20 L50 3 L55 31 L59 20 L68 20 L75 13 L83 20 L100 20 L130 20 L135 16 L140 20 L146 20 L150 3 L155 31 L159 20 L168 20 L175 13 L183 20 L200 20 L230 20 L235 16 L240 20 L246 20 L250 3 L255 31 L259 20 L268 20 L275 13 L283 20 L300 20 L330 20 L335 16 L340 20 L346 20 L350 3 L355 31 L359 20 L368 20 L375 13 L383 20 L400 20 L430 20 L435 16 L440 20 L446 20 L450 3 L455 31 L459 20 L468 20 L475 13 L483 20 L500 20" class="ecg-p"/></g></svg>' : '<div class="bar"><i data-r="bar" style="width:0"></i></div>'}
        <div class="meta"><span data-r="badge"></span><span class="sub" data-r="sub"></span></div></div>`;
    }
    $('#layer-links').innerHTML = links; $('#cards').innerHTML = cards;
    $('#cards').addEventListener('click', e => { const el = e.target.closest('.metric'); if (el) this.toggleDrawer(el.dataset.m, el); });
    $('#cards').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('metric')) { e.preventDefault(); this.toggleDrawer(e.target.dataset.m, e.target); } });
    $('#layer-links').addEventListener('click', e => { const h = e.target.closest('.hit'); if (h) this.toggleDrawer(h.dataset.m, h); });
    $('#layer-links').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('hit')) { e.preventDefault(); this.toggleDrawer(e.target.dataset.m, e.target); } });

    // Drawer
    $('#dr-close').onclick = () => this.closeDrawer(); $('#scrim').onclick = () => this.closeDrawer();
    $$('#dr-range button').forEach(b => b.onclick = () => { State.drawerWin = +b.dataset.w; $$('#dr-range button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); this.renderDrawer(); });

    // Navigation
    $$('#tabs [data-view], #dock [data-view]').forEach(b => b.onclick = () => this.go(b.dataset.view));
    window.addEventListener('hashchange', () => { const v = location.hash.replace(/^#\/?/, ''); if (VIEWS.includes(v) && v !== State.view) this.go(v, true); });

    // Menus
    this.bindMenu('#bell', '#notif-pop', () => this.renderNotifPop());
    this.bindMenu('#who-btn', '#who-menu', () => this.renderCrewMenu());
    document.addEventListener('click', e => { if (this.menuOpen && !e.target.closest('.who')) this.closeMenu(); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (this.evOpen) { this.closeEvidence(); return; }
      if (this.menuOpen) { const t = $(this.menuOpen.btn); this.closeMenu(); t?.focus(); }
      else if (State.selMetric) this.closeDrawer();
    });

    // Bottom bar
    $('#btn-spin').onclick = () => { const on = !$('#twin-spin').classList.contains('on'); $('#twin-spin').classList.toggle('on', on); $('#stage').classList.toggle('spinning', on); $('#btn-spin').setAttribute('aria-pressed', String(on)); };
    $('#btn-scan').onclick = () => this.runScan();
    $('#btn-export').onclick = () => this.exportReport();

    // Language
    $$('#lang button').forEach(b => b.onclick = () => { State.lang = b.dataset.lang; State.save(); this.syncLang(); });

    // Alerts
    $('#snooze-soft').onclick = () => { const n = snoozeNonCritical(); showToast({ level: 'normal', title: n ? `${n} alert${n > 1 ? 's' : ''} snoozed for ${CONFIG.alerts.snoozeMs / 60000} min` : 'No active non-critical alerts to snooze', message: 'They wake up again if the condition is still there.' }); };
    $$('#alert-filter button').forEach(b => b.onclick = () => { State.alertFilter = b.dataset.filter; $$('#alert-filter button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); this.renderDiag(); });
    $('#ack-soft').onclick = () => { const n = ackNonCritical(); showToast({ level: 'normal', title: n ? `${n} alert${n > 1 ? 's' : ''} acknowledged` : 'No active non-critical alerts', message: 'Critical alerts are acknowledged one at a time.' }); };

    const actionClicks = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = b.dataset.id;
      if (b.dataset.act === 'ack')      { ackAlert(id);       this.renderBadges(); this.renderLive(); }
      else if (b.dataset.act === 'snooze')   { snoozeAlert(id);    this.renderBadges(); this.renderLive(); }
      else if (b.dataset.act === 'unsnooze') { unsnoozeAlert(id);  this.renderBadges(); this.renderLive(); }
      else if (b.dataset.act === 'run')      { runAlertAction(id); }
      else if (b.dataset.act === 'dev')      { this.deviceAction(b.dataset.type, b.dataset.dev); }
      else if (b.dataset.act === 'goto')     { this.closeMenu(); this.go('alerts'); }
    };
    ['#alerts-list', '#strip', '#notif-pop', '#dev-list'].forEach(s => $(s).addEventListener('click', actionClicks));

    // Biometrics
    $('#vgrid').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) { this.go('overview'); setTimeout(() => this.openDrawer(b.dataset.m, document.getElementById('m-' + b.dataset.m)), 60); } });

    // History
    $('#hist-metric').innerHTML = `<optgroup label="Vital signs">${['hr', 'spo2', 'temp', 'resp', 'hrv'].map(k => `<option value="${k}">${METRICS[k].label}</option>`).join('')}<option value="bpSys">Systolic pressure</option><option value="bpDia">Diastolic pressure</option></optgroup>`;
    $('#hist-metric').onchange = () => this.renderHistory();
    $$('#hist-window button').forEach(b => b.onclick = () => { $$('#hist-window button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); this.renderHistory(); });
    $('#hist-pause').onclick = () => { State.histPaused = !State.histPaused; setText($('#hist-pause'), State.histPaused ? 'Resume' : 'Pause'); $('#hist-pause').setAttribute('aria-pressed', String(State.histPaused)); if (!State.histPaused) this.renderHistory(); };
    $('#log-ex').onclick    = async () => { await State.provider.pushEvent({ type: 'manual_exercise', astronautId: State.selectedId, params: { minutes: 15 } }); await refreshSecondary(); checkMissions(); this.renderLive(); showToast({ level: 'normal', icon: 'achievement', title: 'Logged', message: '+15 min of exercise.' }); };
    $('#log-hobby').onclick = async () => { await State.provider.pushEvent({ type: 'hobby', astronautId: State.selectedId, params: { minutes: 15 } }); await refreshSecondary(); checkMissions(); this.renderLive(); };
    $('#log-water').onclick = () => addPoints(CONFIG.gamification.waterPoints, 'Hydration logged');

    this.initSystem();

    // Evidence buttons in static HTML slots
    $$('[data-evslot]').forEach(el => { el.innerHTML = _evBtn(el.dataset.evslot); });
    document.addEventListener('click', e => { const b = e.target.closest('.evbtn'); if (b) { e.preventDefault(); this.openEvidence(b.dataset.ev, b); } });
    $('#ev-close').onclick = () => this.closeEvidence(); $('#evscrim').onclick = () => this.closeEvidence();

    // Stage resize
    const ro = new ResizeObserver(() => this.layoutStage()); ro.observe($('#stage-wrap')); ro.observe($('#strip')); ro.observe($('#dockbar'));
    window.addEventListener('resize', () => { this.layoutStage(); if (State.view === 'history') this.renderHistory(); });
    window.addEventListener('scroll', () => this.placeToasts(), { passive: true });

    this.applyMotion(); matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => this.applyMotion());
  },

  /* ===== Navigation ===== */
  syncLang() { I18N.setLang(State.lang); $$('#lang button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.lang === State.lang))); },
  go(view, fromHash) {
    if (!VIEWS.includes(view)) view = 'overview';
    State.view = view; $('#bell').classList.toggle('on', view === 'alerts');
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $$('#tabs [data-view], #dock [data-view]').forEach(b => { if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (!fromHash) try { history.replaceState(null, '', '#/' + view); } catch (e) { }
    this.closeMenu(); if (view !== 'overview') this.closeDrawer(true);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (view === 'overview') this.layoutStage();
    if (view === 'history')  this.renderHistory();
    if (view === 'advanced') this.renderSystem();
    if (view === 'about')    this.renderAbout();
    this.renderLive(); this.placeToasts();
  },
  bindMenu(btnSel, menuSel, render) {
    const btn = $(btnSel), menu = $(menuSel);
    btn.addEventListener('click', e => { e.stopPropagation(); if (this.menuOpen?.btn === btnSel) { this.closeMenu(); return; } this.closeMenu(); render(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); this.menuOpen = { btn: btnSel, menu: menuSel, render }; menu.querySelector('button')?.focus({ preventScroll: true }); });
  },
  closeMenu() { if (!this.menuOpen) return; const { btn, menu } = this.menuOpen; $(menu).hidden = true; $(btn).setAttribute('aria-expanded', 'false'); this.menuOpen = null; },
  applyMotion() {
    const sys = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reduced = State.motion === 'reduced' || (State.motion === 'auto' && sys);
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    const cb = $('#set-motion'); if (cb) cb.checked = reduced;
  },

  /* ===== Stage ===== */
  layoutStage() {
    const wrap = $('#stage-wrap'); if (!wrap || State.view !== 'overview') return;
    const w = wrap.clientWidth, compact = w < 1000; this.compact = compact;
    $('#view-overview').classList.toggle('compact', compact);
    const host = compact ? $('#compact-host') : $('#stage'), cards = $('#cards');
    if (cards.parentNode !== host) host.appendChild(cards);
    let scale, boxH;
    if (compact) { scale = .4; boxH = Math.round(780 * scale) + 8; }
    else {
      const top = wrap.getBoundingClientRect().top + window.scrollY, dockH = ($('#dockbar')?.offsetHeight || 96) + 28;
      const availH = window.innerHeight - top - dockH - 12;
      scale = Math.max(.74, Math.min(1.15, (w - 16) / 1440, availH / 780)); boxH = Math.round(780 * scale) + 24;
    }
    $('#stage-box').style.height = boxH + 'px'; $('#stage-box').style.overflow = compact ? 'hidden' : 'visible';
    let shift = 0; if (State.selMetric && !compact && w >= 1240) { scale = Math.min(scale, (w - 440) / 1440); shift = -208; }
    this.scale = scale; $('#stage').style.transform = `translateX(-50%) translateX(${shift}px) scale(${scale})`; this.placeToasts();
  },
  placeToasts() {
    const small = innerWidth <= 1000; let b = small ? 92 : 24;
    if (State.view === 'overview' && !small) { const r = $('#dockbar').getBoundingClientRect(); if (r.top < innerHeight - 8) b = Math.max(b, innerHeight - r.top + 12); }
    document.documentElement.style.setProperty('--toast-b', b + 'px');
  },

  /* ===== Render cycle ===== */
  renderAll() { this.renderSourceBadge(); this.renderSystem(); this.renderAbout(); this.renderLive(); this.renderDiag(); },
  renderLive() {
    this.renderMet(); this.renderSourceBadge(); this.renderBadges(); this.renderWho();
    if (State.view === 'overview')   { this.renderStrip(); this.renderStage(); this.renderDockbar(); this.renderMissions(true); this.renderScore(); this.renderEnv(); }
    if (State.view === 'biometrics') this.renderBio();
    if (State.view === 'alerts')     this.renderDiag();
    if (State.view === 'history')    { if (!State.histPaused) this.renderHistory(); this.renderMissions(false); this.renderScore(); }
    if (State.view === 'advanced')   this.renderSystemLive();
    if (State.selMetric)             this.renderDrawer();
    if (this.menuOpen)               this.menuOpen.render();
  },
  renderMet() {
    const ms = Date.now() - new Date(CONFIG.missionStart), d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    setText($('#db-met'), `${d} d ${pad(h)}:${pad(m)}:${pad(s)}`);
  },
  renderSourceBadge() {
    const b = $('#badge-source'), d = State.provider?.describe() || {};
    if (d.source === 'real') { b.className = 'src real'; const file = d.kind === 'FileProvider'; setHtml(b, `<span aria-hidden="true">●</span><span class="lg">${file ? 'FILE DATA · UNVERIFIED' : 'API DATA · UNVERIFIED'}</span><span class="sm">UNVERIFIED</span>`); b.title = 'This data comes from outside and has not been verified by Tesai.'; }
    else { b.className = 'src'; setHtml(b, ''); b.title = ''; }
    b.hidden = d.source !== 'real';
    const live = $('#live'), isFile = d.kind === 'FileProvider';
    setText($('#live-label'), isFile ? 'Replaying' : 'Live'); setText($('#live-rate'), (1000 / CONFIG.tickMs).toFixed(1) + ' Hz');
    live.dataset.state = State.provider ? 'live' : 'paused';
  },
  renderBadges() {
    const act = activeAlerts(), n = act.length, top = act[0], lv = !top ? '' : top.level === 'info' ? 'normal' : top.level;
    const bc = $('#bell-count'); setText(bc, n ? String(n) : ''); if (lv) bc.dataset.level = lv; else delete bc.dataset.level;
    $('#bell').setAttribute('aria-label', n ? `Active alerts: ${n}` : 'No active alerts');
  },
  renderWho() {
    const c = State.crew.find(x => x.id === State.selectedId); if (!c) return; const lv = levelOf(c.id);
    const av = $('#who-av'); setText(av, c.avatar || '?'); av.dataset.level = lv; setText($('#who-name'), c.name); setText($('#who-sid'), c.role || '');
  },
  renderCrewMenu() {
    setHtml($('#who-menu'), `<h3>Monitored crew</h3>` + State.crew.map(c => { const lv = c.id === State.selectedId || levelOf(c.id) === 'surgeon' ? levelOf(c.id) : ''; return `<button class="menu-item" role="menuitemradio" aria-checked="${c.id === State.selectedId}" data-crew="${c.id}" data-fk="crew:${c.id}"><span class="avatar"${lv ? ` data-level="${lv}"` : ''}>${esc(c.avatar || '?')}</span><span class="t"><b>${esc(c.name)}</b><span>${esc(c.role || '')}${lv ? ' · ' + LEVELS[lv].short : ''}</span></span></button>`; }).join(''));
    $('#who-menu').onclick = async e => { const b = e.target.closest('[data-crew]'); if (!b) return; State.selectedId = b.dataset.crew; this.closeMenu(); $('#who-btn').focus(); await refreshSecondary(); if (State.selMetric) this.renderDrawer(); this.renderLive(); };
  },
  renderNotifPop() {
    const act = activeAlerts().slice(0, 6);
    setHtml($('#notif-pop'), `<h3>Needs attention</h3>` + (act.length ? act.map(a => `<div class="arow" style="grid-template-columns:auto minmax(0,1fr) auto;margin:2px 4px" data-level="${alertLevelData(a)}" data-status="active"><span class="tile">${alertIcon(a)}</span><div class="body"><b class="ttl"><i class="lvdot"></i>${esc(a.title)}</b><span>${esc(a.message)}</span></div><button class="btn sm" data-act="ack" data-id="${a.id}" data-fk="pa:${a.id}">Acknowledge</button></div>`).join('') : '<div class="empty" style="margin:4px">No active alerts.</div>') + `<button class="menu-item" data-act="goto" data-fk="goto" style="justify-content:center;font-weight:600;color:var(--color-teal-ink)">View all alerts</button>`);
  },

  /* ===== Overview ===== */
  renderStrip() {
    const a = attention(), el = $('#strip'), next = nextStep(); el.dataset.level = a.level;
    const canAck = a.ackId && alertById(a.ackId)?.status === 'active';
    const acts = (canAck ? `<button class="btn sm ${a.level === 'surgeon' ? 'brand' : ''}" data-act="ack" data-id="${a.ackId}" data-fk="strip-ack">Acknowledge</button>` : '') + (a.count ? `<button class="btn sm" data-act="goto" data-fk="strip-go">${a.count > 1 ? `View all (${a.count})` : 'View alert'}</button>` : '');
    setHtml(el, `<span class="tile">${a.icon || LV_ICON[a.level] || ''}</span><div class="txt"><b class="ttl"><i class="lvdot"></i>${esc(a.title)}</b><span>${esc(a.text)}</span></div><div class="nxt"><span class="k">Next step</span><span>${esc(next)}</span></div><div class="acts">${acts}</div>`);
  },
  renderStage() {
    const id = State.selectedId, ev = State.evals[id] || { overall: 'nodata', metrics: {} }, r = State.shown[id], rawq = State.latest[id]?.quality, c = State.crew.find(x => x.id === id);
    const st = $('#stage'); st.dataset.level = ev.overall; st.classList.toggle('has-sel', !!State.selMetric);
    for (const g of GROUPS) {
      const m = METRICS[g], el = document.getElementById('m-' + g), lk = document.getElementById('lk-' + g), lvl = ev.metrics[g]?.level || 'nodata', key = metricKey(g), th = CONFIG.thresholds[key], sel = State.selMetric === g;
      el.dataset.level = lvl; lk.dataset.level = lvl; lk.classList.toggle('sel', sel); el.setAttribute('aria-pressed', String(sel));
      const text = g === 'bp' ? (r?.bpSys == null && r?.bpDia == null ? '--' : `${fmtVal(r?.bpSys, 0)}/${fmtVal(r?.bpDia, 0)}`) : fmtVal(r?.[g], m.dec);
      setText(el.querySelector('[data-r=val]'), text);
      setHtml(el.querySelector('[data-r=badge]'), pillHtml(lvl, lvl === 'surgeon' ? 'Alert surgeons' : LEVELS[lvl].short));
      const bar = el.querySelector('[data-r=bar]'); if (bar) { const v = r?.[key]; bar.style.width = (v == null || !th ? 0 : clamp((v - th.surgeon[0]) / (th.surgeon[1] - th.surgeon[0]) * 100, 0, 100)) + '%'; }
      const base = g === 'bp' ? (c?.baseline?.bpSys != null ? `${c.baseline.bpSys}/${c.baseline.bpDia}` : null) : c?.baseline?.[g];
      setText(el.querySelector('[data-r=sub]'), rawq === 'noisy' ? 'doubtful reading' : rawq === 'delayed' ? 'delayed reading' : text === '--' ? 'no data' : base != null ? `baseline ${base} ${m.unit}` : '');
      el.classList.toggle('dim', text === '--');
    }
    $('#m-hr').style.setProperty('--beat', (60 / Math.max(40, r?.hr || 70)).toFixed(2) + 's');
  },
  renderDockbar() {
    const id = State.selectedId, c = State.crew.find(x => x.id === id); if (!c) return;
    const lv = levelOf(id), devs = State.devicesOf(id), on = devs.filter(d => d.status === 'connected').length;
    setText($('#db-av'), c.avatar || '?'); $('#db-av').dataset.level = lv; setText($('#db-name'), c.name); setText($('#db-profile'), `${c.role || ''} · ${LEVELS[lv].label}`);
    setText($('#db-sensors'), devs.length ? `${on} of ${devs.length} online` : 'no sensors in this source');
    const last = State.uplink[0], delay = String(CONFIG.uplink.oneWayDelayS);
    setText($('#db-link'), !last ? `Simulated · stable ${delay} s` : uplinkStatus(last) === 'delivered (simulated)' ? 'Simulated · notice delivered' : 'Simulated · notice ' + uplinkStatus(last));
  },
  runScan() {
    const btn = $('#btn-scan'); if (btn.getAttribute('aria-pressed') === 'true') return;
    btn.setAttribute('aria-pressed', 'true'); setText($('#scan-label'), 'Scanning…');
    const s = $('#scan-layer'); s.hidden = true; void s.getBoundingClientRect(); s.hidden = false;
    setTimeout(() => {
      s.hidden = true; btn.setAttribute('aria-pressed', 'false'); setText($('#scan-label'), 'Scan system');
      const ev = State.evals[State.selectedId], devs = State.devicesOf(State.selectedId), on = devs.filter(d => d.status === 'connected').length;
      showToast({ level: ev?.partial ? 'attention' : 'normal', icon: 'achievement', title: 'Scan complete', message: `${ev?.coverage ?? 0} of ${GROUPS.length} metrics · ${on} of ${devs.length} sensors online · ${activeAlerts().length} active alerts` });
    }, 3200);
  },
  exportReport() {
    const id = State.selectedId, c = State.crew.find(x => x.id === id); if (!c) return;
    const rep = { generatedAt: new Date().toISOString(), source: State.provider.describe().source, note: 'Report generated by Tesai (prototype). Simulated data does not belong to real people and is not a diagnosis.', subject: { id, name: c.name, role: c.role, baseline: c.baseline }, status: { overall: levelOf(id), missing: State.evals[id]?.missing || [], reasons: State.evals[id]?.reasons || [] }, alerts: State.alerts.filter(a => a.astronautId === id || !a.astronautId).map(a => ({ title: a.title, message: a.message, domain: a.domain, level: a.level, status: a.status, openedAt: new Date(a.openedAt).toISOString(), resolvedAt: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : null })), environment: State.env, readings: histRows(id, 60) };
    download(`tesai-report-${c.name.split(' ')[0].toLowerCase()}-${Date.now()}.json`, JSON.stringify(rep, null, 1), 'application/json');
    showToast({ level: 'normal', icon: 'achievement', title: 'Report exported', message: `${c.name} · JSON with alerts and the last 60 min of readings.` });
  },
  missionRow(def, full) {
    const ms = missionState(def);
    return `<div class="mission ${ms.done ? 'done' : ''}"><span class="mi">${ICONS[def.icon]}</span><div><div class="mt">${def.title}${_evBtn('goal.' + def.id)}</div>${full ? `<div class="md">${def.desc}</div>` : ''}<div class="bar"><i style="width:${ms.pct}%"></i></div></div><div class="mp">${ms.done ? ICONS.tick.replace('class="ic"', 'class="ic" style="display:inline;width:13px;height:13px;vertical-align:-2px"') + ' ' : ''}${def.points} pts<br><span style="color:var(--color-muted);font-family:var(--font-ui)">${round(ms.prog, def.unit === 'h' ? 1 : 0)}/${round(ms.goal)} ${def.unit}</span></div></div>`;
  },
  renderMissions(mini) {
    const done = MISSION_DEFS.filter(d => missionState(d).done).length;
    setText($('#missions-summary'), `${done}/${MISSION_DEFS.length} completed`);
    if (mini) { setHtml($('#missions-mini'), MISSION_DEFS.map(d => this.missionRow(d, false)).join('')); return; }
    setText($('#missions-day'), dayKey()); setHtml($('#missions-full'), MISSION_DEFS.map(d => this.missionRow(d, true)).join(''));
    setHtml($('#achievements'), State.gam.achievements.length ? State.gam.achievements.slice(0, 8).map(a => `<div class="up-row"><span class="t">${esc(a.text)}</span><span class="mono">${fmtTime(a.t)}</span><b class="ok-t mono">+${a.pts}</b></div>`).join('') : '<div class="empty">No achievements yet. Complete a mission or log a habit.</div>');
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000), k = dayKey(d), on = State.gam.streakDays[k] || (State.gam.demo && i > 0 && i <= State.gam.streak); days.push(`<i class="${on ? 'on' : ''}" title="${k}">${(I18N.lang === 'es' ? 'DLMXJVS' : 'SMTWTFS')[d.getDay()]}</i>`); }
    setHtml($('#streak-days'), days.join('')); setText($('#streak-n'), String(State.gam.streak)); setText($('#streak-best'), String(State.gam.bestStreak)); setText($('#streak-demo'), State.gam.demo ? '(initial demo streak, simulated)' : '');
  },
  renderScore() { setText($('#score-pts'), String(State.gam.points)); setText($('#score-streak'), String(State.gam.streak)); },

  /* ===== Drawer ===== */
  toggleDrawer(g, trigger) { if (State.selMetric === g) this.closeDrawer(); else this.openDrawer(g, trigger); },
  openDrawer(g, trigger) {
    const d = $('#drawer'); State.selMetric = g; this.drawerTrigger = trigger || null;
    d.inert = false; d.classList.add('open'); $('#scrim').classList.add('on');
    this.renderDrawer(); this.layoutStage(); this.renderStage(); d.focus({ preventScroll: true });
  },
  closeDrawer(silent) {
    if (!State.selMetric) return; const d = $('#drawer'); State.selMetric = null;
    d.classList.remove('open'); d.inert = true; $('#scrim').classList.remove('on');
    this.layoutStage(); this.renderStage();
    const t = this.drawerTrigger; this.drawerTrigger = null;
    if (!silent && t && document.contains(t)) t.focus({ preventScroll: true });
  },
  renderDrawer() {
    const g = State.selMetric; if (!g) return;
    const m = METRICS[g], id = State.selectedId, ev = State.evals[id], r = State.shown[id], c = State.crew.find(x => x.id === id), key = metricKey(g), th = CONFIG.thresholds[key], lvl = ev?.metrics[g]?.level || 'nodata';
    $('#dr-ico').innerHTML = ICONS[m.icon]; setText($('#dr-title'), m.label); setHtml($('#dr-ev'), _evBtn(g)); setText($('#dr-region'), m.region + (g === 'bp' ? ' · the chart shows systolic' : ''));
    const text = g === 'bp' ? (r?.bpSys == null ? '--' : `${fmtVal(r.bpSys, 0)}/${fmtVal(r.bpDia, 0)}`) : fmtVal(r?.[g], m.dec);
    setText($('#dr-value'), text); setText($('#dr-unit'), text === '--' ? '' : m.unit); setHtml($('#dr-badge'), pillHtml(lvl, LEVELS[lvl].label));
    const rows = histRows(id, State.drawerWin), chart = $('#dr-chart');
    chart.setAttribute('aria-label', `Trend of ${m.label}, last ${State.drawerWin} minutes. Latest value ${text} ${m.unit}.`);
    setHtml(chart, chartInner({ rows, key, W: 352, H: 170, L: 34, R: 6, T: 8, B: 20, th, baseline: c?.baseline?.[key], dec: m.dec }));
    const xs = rows.filter(trusted).map(x => x[key]).filter(v => v != null), f = v => v.toFixed(m.dec);
    setHtml($('#dr-stats'), xs.length ? `<div><span>Min</span><b>${f(Math.min(...xs))}</b></div><div><span>Avg</span><b>${f(xs.reduce((a, b) => a + b, 0) / xs.length)}</b></div><div><span>Max</span><b>${f(Math.max(...xs))}</b></div>` : '<div style="grid-column:1/-1"><span>No trusted readings in this window</span></div>');
    if (th) { const [c1, c2] = th.surgeon, [a1, a2] = th.attention, sp = c2 - c1; setText($('#dr-ref-label'), `${a1}–${a2} ${m.unit}`); const b = $('#dr-band'); b.style.left = (a1 - c1) / sp * 100 + '%'; b.style.width = (a2 - a1) / sp * 100 + '%'; $('#dr-mark').style.left = clamp(((r?.[key] ?? c1) - c1) / sp * 100, 0, 100) + '%'; }
    setText($('#dr-note'), m.note);
  },

  /* ===== Biometrics ===== */
  renderBio() {
    const id = State.selectedId, r = State.shown[id], ev = State.evals[id] || { metrics: {} }, c = State.crew.find(x => x.id === id), q = State.latest[id]?.quality || 'missing';
    setHtml($('#vgrid'), GROUPS.map(g => {
      const m = METRICS[g], key = metricKey(g), lvl = ev.metrics[g]?.level || 'nodata';
      const text = g === 'bp' ? (r?.bpSys == null ? '--' : `${fmtVal(r.bpSys, 0)}/${fmtVal(r.bpDia, 0)}`) : fmtVal(r?.[g], m.dec);
      const rows = (State.history[id] || []).slice(-45);
      return `<div class="vwrap"><button class="vcard" data-m="${g}" data-level="${lvl}" data-fk="v:${g}"><span class="top"><span style="color:var(--color-teal)">${ICONS[m.icon]}</span><b>${m.label}</b>${pillHtml(lvl)}</span><span class="v">${text}<small>${m.unit}</small></span><svg class="chart" viewBox="0 0 280 54" width="100%" height="54" role="img" aria-label="Trend of ${m.short}: latest value ${text} ${m.unit}">${chartInner({ rows, key, W: 280, H: 54, L: 2, R: 2, T: 4, B: 4, th: CONFIG.thresholds[key], baseline: c?.baseline?.[key], labels: false })}</svg><span class="q">${q === 'ok' ? `source: ${esc(r?.source || '—')} · ${r ? fmtTime(r.timestamp) : ''}` : `${q} reading · ${r ? fmtTime(r.timestamp) : ''}`}</span></button>${_evBtn(g)}</div>`;
    }).join(''));
    this.renderEnv();
    const s = State.sleepOf(id), gl = CONFIG.gamification.goals;
    if (!s) { setHtml($('#activity-block'), '<div class="empty">No sleep and activity data in this source.</div>'); return; }
    const hist = [...(State.sleepHistory || []), s];
    setHtml($('#activity-block'), `<div class="kv"><div><div class="k">Sleep</div><div class="v">${s.sleepHours ?? '--'}<small>h</small></div></div><div><div class="k">Quality</div><div class="v">${s.sleepQuality ?? '--'}<small>%</small></div></div><div><div class="k">Exercise</div><div class="v">${s.exerciseMin ?? '--'}<small>/${gl.exerciseMin} min</small></div></div><div><div class="k">Hobby</div><div class="v">${s.hobbyMin ?? '--'}<small>/${gl.hobbyMin} min</small></div></div></div><div class="note" style="margin-top:12px">Exercise over the last 7 days (the brightest bar is today)</div><div class="bars" role="img" aria-label="Exercise minutes per day, last 7 days">${hist.map((d, i) => `<i title="${d?.day || ''}: ${d?.exerciseMin ?? '--'} min" class="${i === hist.length - 1 ? 'now' : ''} ${d && d.exerciseMin < gl.exerciseMin * .5 ? 'low' : ''}" style="height:${clamp((d?.exerciseMin || 0) / 120 * 100, 6, 100)}%"></i>`).join('')}</div>`);
  },

  /* ===== Environment ===== */
  envRange(k) { const t = CONFIG.thresholds.env[k]; return k === 'radiation' || k === 'co2' ? `up to ${t.attention[1]} ${ENV_META[k].unit}` : `${t.attention[0]}–${t.attention[1]} ${ENV_META[k].unit}`; },
  renderEnv() {
    const e = State.env, ee = State.envEval || { overall: 'nodata', metrics: {} };
    setHtml($('#env-overall'), e ? pillHtml(ee.overall, ee.overall === 'normal' ? 'All in range' : LEVELS[ee.overall].label) : pillHtml('nodata'));
    setHtml($('#env-grid'), e ? Object.keys(ENV_META).map(k => {
      const m = ENV_META[k], lvl = ee.metrics[k] || 'nodata', th = CONFIG.thresholds.env[k], v = e[k] == null ? '--' : Number(e[k]).toFixed(m.dec);
      return `<article class="ecard" data-level="${lvl}"><div class="top"><span style="color:var(--color-teal)">${ICONS[m.icon]}</span><b>${m.label}</b>${_evBtn('env.' + k)}${pillHtml(lvl)}</div><div class="v">${v}<small>${m.unit}</small></div><svg class="chart" viewBox="0 0 280 54" width="100%" height="54" role="img" aria-label="Trend of ${m.label}: latest ${v} ${m.unit}">${chartInner({ rows: State.envHistory.slice(-120), key: k, W: 280, H: 54, L: 2, R: 2, T: 4, B: 4, th, labels: false })}</svg><div class="q">Reference: ${this.envRange(k)}</div></article>`;
    }).join('') : '<div class="empty" style="grid-column:1/-1">No environment data in this source.</div>');
    const rad = e?.radiation; setText($('#env-dose'), rad == null ? '' : `At ${rad.toFixed(1)} µSv/h the equivalent dose is about ${(rad * 24 / 1000).toFixed(2)} mSv per day. Typical ISS crew exposure is 0.2–0.5 mSv per day, with a NASA career limit of 600 mSv.`);
    setHtml($('#env-mini'), e ? Object.keys(ENV_META).map(k => { const m = ENV_META[k], lvl = ee.metrics[k] || 'nodata'; return `<div class="envrow" data-level="${lvl}"><i class="lvdot"></i><b>${m.label}</b><span class="mono">${e[k] == null ? '--' : Number(e[k]).toFixed(m.dec)} ${m.unit}</span></div>`; }).join('') : '<div class="empty">No environment data.</div>');
    setHtml($('#env-mini-pill'), e ? pillHtml(ee.overall, ee.overall === 'normal' ? 'In range' : LEVELS[ee.overall].short) : '');
  },

  /* ===== Alerts ===== */
  alertRow(a) {
    const lvl = alertLevelData(a), who = a.astronautId ? personName(a.astronautId) : 'Cabin', tm = ms => fmtTime(new Date(ms).toISOString());
    const btns = (a.status === 'active' || a.status === 'snoozed' ? `<button class="btn sm ${a.level === 'surgeon' ? 'brand' : ''}" data-act="ack" data-id="${a.id}" data-fk="ack:${a.id}">Acknowledge</button>` : '')
      + (a.status === 'active' && a.priority > 1 ? `<button class="btn sm" data-act="snooze" data-id="${a.id}" data-fk="sz:${a.id}">Snooze ${CONFIG.alerts.snoozeMs / 60000} min</button>` : '')
      + (a.status === 'snoozed' ? `<button class="btn sm" data-act="unsnooze" data-id="${a.id}" data-fk="uz:${a.id}">Wake now</button>` : '')
      + (a.action && a.status !== 'resolved' ? `<button class="btn sm" data-act="run" data-id="${a.id}" data-fk="run:${a.id}">${esc(a.action.label)}</button>` : '');
    const when = a.status === 'resolved' ? `opened ${tm(a.openedAt)} · resolved ${tm(a.resolvedAt)}` : a.status === 'acknowledged' ? `opened ${tm(a.openedAt)} · acknowledged ${tm(a.ackedAt)}` : a.status === 'snoozed' ? `opened ${tm(a.openedAt)} · snoozed until ${tm(a.snoozedUntil)}` : `opened ${tm(a.openedAt)}`;
    const stLabel = { active: 'Active', acknowledged: 'Acknowledged', snoozed: 'Snoozed', resolved: 'Resolved' }[a.status];
    return `<li class="arow" data-level="${lvl}" data-status="${a.status}"><span class="tile">${alertIcon(a)}</span><div class="body"><b class="ttl"><i class="lvdot"></i>${esc(a.title)}</b><span>${esc(a.message)}</span><div class="meta"><span class="prio" title="${PRIORITY_LABEL[a.priority]}">P${a.priority}</span><span class="pill" data-level="${lvl}">${esc(alertPillText(a))}</span>${a.escalatedAt ? '<span class="pill" data-level="surgeon">Escalated</span>' : ''}<span class="tag">${esc(who)} · ${when}</span></div></div><div class="side"><span class="status-chip" data-s="${a.status}">${stLabel}</span>${btns}</div></li>`;
  },
  renderDiag() {
    const f = State.alertFilter, inScope = State.alerts.filter(visibleAlert);
    $$('#alert-filter button').forEach(b => { const n = b.dataset.filter === 'all' ? inScope.length : inScope.filter(a => a.status === b.dataset.filter).length; setText(b, `${b.dataset.label} (${n})`); });
    const list = inScope.filter(a => f === 'all' || a.status === f).sort((x, y) => x.priority - y.priority || y.openedAt - x.openedAt);
    const empty = { active: 'No active alerts. Each out-of-range condition appears once and closes by itself when it returns to normal.', snoozed: 'Nothing is snoozed.', acknowledged: 'No acknowledged alerts are waiting to be resolved.', resolved: 'No alert has been resolved yet.', all: 'No alerts yet.' }[f];
    setHtml($('#alerts-list'), [1, 2, 3, 4].map(p => { const l = list.filter(a => a.priority === p); return l.length ? `<div class="group-title">P${p} · ${PRIORITY_LABEL[p]}</div><ul class="alist">${l.slice(0, 40).map(a => this.alertRow(a)).join('')}</ul>` : ''; }).join('') || `<div class="empty">${empty}</div>`);
    $('#ack-soft').disabled = !State.alerts.some(a => a.status === 'active' && a.priority > 1);
    $('#snooze-soft').disabled = $('#ack-soft').disabled;
    setText($('#next-step'), nextStep());
    const ups = State.uplink.slice(0, 6);
    setHtml($('#uplink'), ups.length ? ups.map(u => { const s = uplinkStatus(u); return `<div class="up-row"><span style="color:var(--color-teal)">${ICONS.link}</span><span class="t">${esc(u.text)}</span><span class="status-chip" data-s="${s.startsWith('delivered') ? 'resolved' : 'acknowledged'}">${s}</span></div>`; }).join('') : `<div class="empty">No notices sent. Stable link (simulated), ${String(CONFIG.uplink.oneWayDelayS)} s delay.</div>`);
    const devs = State.devicesOf(State.selectedId), t = CONFIG.thresholds.device;
    setText($('#dev-note'), devs.length ? `${devs.filter(d => d.status === 'connected').length}/${devs.length} connected` : '');
    setHtml($('#dev-list'), devs.length ? devs.map(d => { const lowBat = d.battery <= t.batteryCrit ? 2 : d.battery <= t.batteryWarn ? 1 : 0; const st = d.status === 'connected' ? pillHtml('normal', 'Connected') : d.status === 'degraded' ? pillHtml('sensor', 'Weak signal') : pillHtml('sensor', 'Disconnected'); return `<div class="dev"><div class="nm"><b>${esc(d.name)}</b><span>${d.status === 'disconnected' ? 'no signal' : 'signal ' + d.signal + '%'}</span></div>${st}<div class="batt" data-low="${lowBat}"><span>${d.battery}%</span><div class="bar"><i style="width:${d.battery}%"></i></div></div>${lowBat ? `<button class="btn sm" data-act="dev" data-type="recharge" data-dev="${d.id}" data-fk="rc:${d.id}">Recharge</button>` : ''}${d.status === 'disconnected' ? `<button class="btn sm" data-act="dev" data-type="reconnect" data-dev="${d.id}" data-fk="rn:${d.id}">Reconnect</button>` : ''}</div>`; }).join('') : '<div class="empty">No devices in this source.</div>');
  },
  async deviceAction(type, deviceId) {
    const r = await State.provider.pushEvent({ type, astronautId: State.selectedId, params: { deviceId } });
    if (r?.ok === false) { showToast({ level: 'attention', title: 'Action not available', message: 'This data source does not accept that action.' }); return; }
    await refreshSecondary(); addPoints(type === 'recharge' ? 20 : 10, type === 'recharge' ? 'Sensor recharged' : 'Sensor reconnected');
    resolveAlert(`sensor:${deviceId}:${type === 'recharge' ? 'bat' : 'offline'}`); checkMissions(); this.renderLive();
  },

  /* ===== History ===== */
  renderHistory() {
    const id = State.selectedId, key = $('#hist-metric').value, win = +($('#hist-window [aria-pressed="true"]')?.dataset.w || 30), rows = histRows(id, win), c = State.crew.find(x => x.id === id), th = CONFIG.thresholds[key], dec = key === 'temp' ? 1 : 0;
    const chart = $('#hist-chart'), nm = METRICS[key]?.label || (key === 'bpSys' ? 'Systolic pressure' : 'Diastolic pressure');
    chart.setAttribute('aria-label', `Trend of ${nm}, last ${win} minutes`);
    setHtml(chart, chartInner({ rows, key, W: 900, H: 300, L: 46, R: 10, T: 10, B: 26, th, baseline: c?.baseline?.[key], bands: 'all', dec }));
    const xs = rows.filter(trusted).map(r => r[key]).filter(v => v != null), unit = SCHEMA.VitalReading[key]?.unit || '';
    setHtml($('#hist-stats'), xs.length ? `<div><div class="k">Minimum</div><div class="v">${Math.min(...xs).toFixed(dec)}<small>${unit}</small></div></div><div><div class="k">Average</div><div class="v">${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(dec)}<small>${unit}</small></div></div><div><div class="k">Maximum</div><div class="v">${Math.max(...xs).toFixed(dec)}<small>${unit}</small></div></div><div><div class="k">Readings</div><div class="v">${xs.length}</div></div>` : '');
    const q = { ok: 0, noisy: 0, delayed: 0, missing: 0 }; rows.forEach(r => q[r.quality] = (q[r.quality] || 0) + 1);
    setHtml($('#hist-quality'), Object.entries(q).map(([k, v]) => `<div data-level="${k !== 'ok' && v > rows.length * .1 ? 'attention' : ''}"><div class="k">${k}</div><div class="v">${v}<small>${rows.length ? round(v / rows.length * 100) : 0}%</small></div></div>`).join(''));
    setHtml($('#hist-baseline'), c?.baseline ? Object.entries(c.baseline).map(([k, v]) => `<div><div class="k">${METRICS[k]?.short || (k === 'bpSys' ? 'Sys. BP' : k === 'bpDia' ? 'Dia. BP' : k)}</div><div class="v">${v ?? '--'}<small>${SCHEMA.VitalReading[k]?.unit || ''}</small></div></div>`).join('') : '<div class="empty" style="grid-column:1/-1">No baseline.</div>');
    setText($('#hist-dev'), String(CONFIG.thresholds.baselineDeviationPct));
  },

  /* ===== Evidence popup ===== */
  openEvidence(key, trigger) {
    const e = EVIDENCE[key]; if (!e) return;
    this.evKey = key; this.evTrigger = trigger || null; this.evOpen = true;
    setText($('#ev-title'), e.label); $('#ev-body').innerHTML = _evidenceBody(key);
    $('#evpop').hidden = false; $('#evscrim').classList.add('on'); $('#app').inert = true; $('#evpop').scrollTop = 0; $('#evpop').focus({ preventScroll: true });
  },
  closeEvidence() {
    if (!this.evOpen) return; this.evOpen = false; $('#evpop').hidden = true; $('#evscrim').classList.remove('on'); $('#app').inert = false;
    const back = document.querySelector(`[data-ev="${this.evKey}"]`) || this.evTrigger; if (back && document.contains(back)) back.focus({ preventScroll: true });
  },

  /* ===== About ===== */
  renderAbout() {
    const C = CREDITS, ini = n => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(), groups = ['Vital signs', 'Cabin environment', 'Goals and alert rules', 'Data'];
    setText($('#about-tag'), `${C.app} is a health twin for astronauts, built by Team ${C.team} for the ${C.event}.`);
    const used = {}; Object.entries(EVIDENCE).forEach(([k, e]) => e.refs.forEach(id => (used[id] ||= []).push(e.label)));
    setHtml($('#about-body'), `
      <section class="dark-card on-dark about-hero"><div class="eyebrow">${esc(C.event)}</div><h3>${esc(C.challenge)}</h3><p>${esc(C.app)} brings an astronaut's vital signs, cabin environment, alerts and daily habits into one calm view. It shows what needs attention first, keeps sensor problems apart from health ones, and every alert has a clear lifecycle.</p></section>
      <div class="grid g2">
        <section class="panel" aria-labelledby="h-team"><h3 id="h-team"><span class="grow">Team ${esc(C.team)}</span></h3><div class="alist">${C.members.map(m => `<div class="member"><span class="avatar">${esc(ini(m))}</span><b>${esc(m)}</b></div>`).join('')}</div></section>
        <section class="panel" aria-labelledby="h-claude"><h3 id="h-claude"><span class="grow">AI tools used</span></h3>
          <p>${esc(C.app)} was made with Claude, an AI assistant by Anthropic. The visual design comes from Claude Design, and Claude Code helped write, review and test the code. Team ${esc(C.team)} chose what to build, directed the work and made the product decisions.</p>
          <p>The team used several Claude models (Fable, Opus and Sonnet), not just one.</p>
          <p>Bob, an AI assistant by IBM, was also used on this project.</p></section>
      </div>
      <section class="panel" aria-labelledby="h-evid"><h3 id="h-evid"><span class="grow">Evidence by data point</span></h3>
        <p class="note">Every number in Tesai is tagged with where it comes from. "Based on a source" means the value follows a published one. "Adapted" means it starts from a source but Tesai changed it, and the note says how. "Team design value" means the team chose it and no published source was found. "No real data source" marks simulated data.</p>
        <p class="note">Open a link to read the original and confirm any number before quoting it.</p>
        ${groups.map(g => `<div class="group-title">${g}</div><div class="alist">${Object.entries(EVIDENCE).filter(([k, e]) => e.group === g).map(([k, e]) => `<div class="evrow"><div class="top"><b>${esc(e.label)}</b>${_basisPill(e.basis)}${_evBtn(k)}</div><p>${esc(e.note)}</p><div class="cites">${e.refs.length ? `Sources: <span data-i18n="off">${esc(citeText(k))}</span>` : 'No published source found.'}</div></div>`).join('')}</div>`).join('')}
      </section>
      <section class="panel" aria-labelledby="h-prov"><h3 id="h-prov"><span class="grow">Data provenance</span></h3>
        <p>Every reading in the app is simulated. The crew members, their personal baselines and the events are invented. The sources below back the ranges and rules, not the readings. The team's research found no public dataset of daily in-flight vital signs, so a real data source would have to be built from the options below or from a mission partner.</p>
        <div class="group-title">Real data sources to explore (not used yet)</div>
        <ul class="links">${REAL_SOURCES.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a> <span class="tag">${esc(r.note)}</span></li>`).join('')}</ul></section>
      <section class="panel" aria-labelledby="h-refs"><h3 id="h-refs"><span class="grow">References</span></h3>
        <ul class="apa" data-i18n="off">${Object.keys(SOURCES).sort((a, b) => SOURCES[a].sort.localeCompare(SOURCES[b].sort)).map(id => `<li>${SOURCES[id].apa}${SOURCES[id].unverified ? ' †' : ''}<div class="cites" style="text-indent:0;margin-top:2px">Used for: ${esc((used[id] || []).join('; '))}</div></li>`).join('')}</ul>
        <p class="note">${esc(EVIDENCE_LEGEND)}</p></section>
      <section class="panel" aria-labelledby="h-notes"><h3 id="h-notes"><span class="grow">Notices</span></h3>
        <ul class="links plain"><li>${esc(C.app)} is an independent prototype made for the ${esc(C.event)}. It is not affiliated with, endorsed by or sponsored by NASA.</li>
        <li>All the data you see is simulated. No reading belongs to a real person, and nothing here is a medical diagnosis or advice.</li>
        <li>Fonts: Plus Jakarta Sans and JetBrains Mono, under the SIL Open Font License 1.1.</li></ul></section>`);
    $$('#about-body [data-evslot-static]').forEach(el => { el.outerHTML = _evBtn('data.simulated'); });
  },

  /* ===== Advanced (developer view) ===== */
  initSystem() {
    setText($('#schema-view'), JSON.stringify(SCHEMA, null, 2));
    const drop = $('#drop'); drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) this.importFile(e.dataTransfer.files[0]); };
    $('#pick-file').onclick = () => $('#file-input').click(); $('#file-input').onchange = e => { if (e.target.files[0]) this.importFile(e.target.files[0]); e.target.value = ''; };
    $('#dl-template').onclick = () => download('tesai-template.csv', 'astronautId,timestamp,hr,spo2,bpSys,bpDia,temp,resp,hrv,quality\nast-01,2026-01-01T12:00:00Z,64,98,118,76,36.6,14,60,ok\nast-01,2026-01-01T12:00:02Z,66,97,119,77,36.6,15,58,ok\nast-01,2026-01-01T12:00:04Z,,,,,,,,missing\n', 'text/csv');
    $('#dl-export').onclick = () => download(`tesai-export-${Date.now()}.json`, JSON.stringify({ crew: State.crew, vitals: Object.values(State.history).flat(), environment: State.env, devices: Object.values(State.devicesBy).flat(), sleepActivity: Object.values(State.sleepBy).filter(Boolean) }, null, 1), 'application/json');
    $('#set-source').onchange = async e => { await startProvider(e.target.value); $('#set-source').value = CONFIG.dataSource; this.renderLive(); this.renderSystem(); };
    $('#apply-sim').onclick = async () => { CONFIG.seed = +$('#set-seed').value || CONFIG.seed; CONFIG.tickMs = clamp(+$('#set-tick').value || CONFIG.tickMs, 250, 60000); await startProvider('simulated'); this.renderSystem(); showToast({ level: 'normal', icon: 'achievement', title: 'Simulation restarted', message: `seed ${CONFIG.seed} · interval ${CONFIG.tickMs} ms` }); };
    $('#set-sound').onchange = e => { State.sound = e.target.checked; State.save(); };
    $('#set-demo').onchange  = e => { State.demo = e.target.checked; State.save(); this.renderSystemLive(); };
    $('#set-motion').onchange = e => { State.motion = e.target.checked ? 'reduced' : 'full'; State.save(); this.applyMotion(); };
    $('#reset-gam').onclick = () => { if (!confirm(I18N.tx('Reset points, streak and missions?'))) return; State.gam = defaultGam(); State.gam.streak = 0; State.gam.bestStreak = 0; State.gam.demo = false; State.save(); this.renderLive(); };
    const inj = [['tachycardia', 'Tachycardia'], ['hypoxia', 'Hypoxia'], ['fever', 'Fever'], ['hypertension', 'Hypertension'], ['exercise', 'Exercise session'], ['disconnect', 'Disconnect sensor'], ['co2', 'CO₂ spike']];
    $('#inject-buttons').innerHTML = inj.map(([k, l]) => `<button class="btn sm" data-inj="${k}">${l}</button>`).join('');
    $('#inject-buttons').addEventListener('click', async e => { const b = e.target.closest('[data-inj]'); if (!b || b.disabled) return; const r = await State.provider.pushEvent({ type: b.dataset.inj, astronautId: b.dataset.inj === 'co2' ? null : State.selectedId }); showToast({ level: r?.ok ? 'normal' : 'attention', title: r?.ok ? 'Event injected' : 'Event not accepted', message: `${b.textContent} · ${personName(State.selectedId) || 'cabin'}` }); });
  },
  renderSystem() {
    $('#set-source').value = CONFIG.dataSource; $('#set-seed').value = CONFIG.seed; $('#set-tick').value = CONFIG.tickMs; $('#set-sound').checked = State.sound; $('#set-demo').checked = State.demo; $('#set-motion').checked = document.documentElement.dataset.motion === 'reduced';
    const rows = [['hr', 'Heart rate (bpm)'], ['spo2', 'SpO₂ (%)'], ['bpSys', 'Systolic BP (mmHg)'], ['bpDia', 'Diastolic BP (mmHg)'], ['temp', 'Temperature (°C)'], ['resp', 'Respiration (rpm)'], ['hrv', 'HRV (ms)']];
    const env = Object.keys(CONFIG.thresholds.env).map(k => [k, `Environment · ${k} (${SCHEMA.Environment[k].unit})`]);
    const range = a => `${a[0]} – ${a[1]}`;
    setHtml($('#thr-table'), `<thead><tr><th scope="col">Metric</th><th scope="col">Normal</th><th scope="col">Attention (outside normal)</th><th scope="col">Alert surgeons (outside this)</th><th scope="col">Basis and sources</th></tr></thead><tbody>` + rows.map(([k, l]) => `<tr><th scope="row" style="text-transform:none;letter-spacing:0;color:var(--color-ink)">${l}</th><td class="n">${range(CONFIG.thresholds[k].attention)}</td><td class="n">${range(CONFIG.thresholds[k].attention)}</td><td class="n">${range(CONFIG.thresholds[k].surgeon)}</td><td>${_evCell(k === 'bpSys' || k === 'bpDia' ? 'bp' : k)}</td></tr>`).join('') + env.map(([k, l]) => `<tr><th scope="row" style="text-transform:none;letter-spacing:0;color:var(--color-ink)">${l}</th><td class="n">${range(CONFIG.thresholds.env[k].attention)}</td><td class="n">${range(CONFIG.thresholds.env[k].attention)}</td><td class="n">${range(CONFIG.thresholds.env[k].surgeon)}</td><td>${_evCell('env.' + k)}</td></tr>`).join('') + '</tbody>');
    this.renderSystemLive();
  },
  renderSystemLive() {
    const d = State.provider?.describe() || {}, canInject = State.demo && d.kind === 'SimulatedProvider';
    $$('#inject-buttons button').forEach(b => { b.disabled = !canInject; });
    setText($('#source-status'), State.sourceNote || (d.kind === 'SimulatedProvider' ? 'Using simulated data with seed ' + CONFIG.seed + '.' : d.kind === 'FileProvider' ? `Replaying ${d.readings} readings from ${d.file}. Unverified data.` : 'Remote source active.'));
    setText($('#provider-info'), JSON.stringify(d, null, 2));
  },
  async importFile(file) {
    const { Adapters, Normalizer, parseCsv, validateVital } = await import('../providers/adapters.js');
    const rep = $('#import-report'); rep.innerHTML = `Reading <b>${esc(file.name)}</b>…`;
    try {
      const text = await file.text(); let bundle = { vitals: [] }, rawRows;
      if (/\.json$/i.test(file.name) || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const j = JSON.parse(text);
        if (Array.isArray(j)) rawRows = j; else { rawRows = j.vitals || j.readings || []; bundle.crew = j.crew; bundle.environment = j.environment ? Normalizer.environment(j.environment, 'real') : null; bundle.devices = (j.devices || []).map(d => Normalizer.device(d)); bundle.sleepActivity = (j.sleepActivity || []).map(s => Normalizer.sleepActivity(s, 'real')); }
        bundle.vitals = rawRows.map(r => Adapters.adaptRestJson.vitals([r])[0]);
      } else { rawRows = parseCsv(text); bundle.vitals = rawRows.map(r => Adapters.adaptCsvRow(r)); }
      const errors = [], warnings = []; bundle.vitals.forEach((v, i) => { const r = validateVital(v, i + 1); errors.push(...r.errors); warnings.push(...r.warnings); });
      const valid = bundle.vitals.filter((v, i) => validateVital(v, i).ok);
      rep.innerHTML = `<p><span class="ok-t">${valid.length}</span> valid readings out of ${bundle.vitals.length} · <span class="err-t">${errors.length} errors</span> · ${warnings.length} warnings · crew: ${esc([...new Set(valid.map(v => v.astronautId))].join(', ') || '—')}</p>` + (errors.length ? `<div class="code" tabindex="0" aria-label="Validation errors">${esc(errors.slice(0, 12).join('\n'))}${errors.length > 12 ? '\n…' : ''}</div>` : '');
      if (!valid.length) { rep.innerHTML += '<p class="err-t">The file could not be used as a source.</p>'; return; }
      bundle.vitals = valid;
      rep.innerHTML += `<p style="margin-top:10px"><button class="btn brand" id="use-file">Use as data source</button></p>`;
      $('#use-file').onclick = async () => {
        const { setFileBundle } = await import('../app.js');
        setFileBundle(bundle, file.name);
        await startProvider('file'); $('#set-source').value = CONFIG.dataSource; this.go('overview');
        showToast({ level: 'normal', icon: 'achievement', title: 'Source changed', message: `Replaying ${valid.length} readings from ${file.name}. Unverified data.` });
      };
    } catch (e) { rep.innerHTML = `<p class="err-t">Error reading the file: ${esc(e.message)}</p>`; }
  }
};
