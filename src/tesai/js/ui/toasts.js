/**
 * toasts.js · Dark pill notifications.
 * Critical ones stay pinned until acknowledged.
 */
import { ICONS, LV_ICON } from './icons.js';
import { $ } from './helpers.js';
import { State } from '../state.js';
import { esc } from '../utils.js';

const TOAST_ICON = { health: null, environment: ICONS.wind, sensor: ICONS.plug, reminder: ICONS.bell, achievement: ICONS.medal };

export function showToast({ alertId = null, level = 'normal', title, message = '', persistent = false, action = null, icon = null }) {
  const box = $('#toasts'), el = document.createElement('div');
  el.className = 'toast'; el.dataset.level = level;
  if (!alertId) el.setAttribute('role', 'status');
  const glyph = TOAST_ICON[icon] || LV_ICON[level] || ICONS.tick;
  el.innerHTML = `${glyph}<div class="tx"><b><i class="lvdot"></i>${esc(title)}</b><span>${esc(message)}</span></div>${action ? `<button class="btn" type="button">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.run(); if (!action.keep) dismissToast(el); };
  box.appendChild(el);
  if (alertId) State.toastByAlert[alertId] = el;
  el._persistent = persistent;
  while (box.children.length > 4) { const old = [...box.children].find(t => !t._persistent) || box.firstChild; dismissToast(old, true); }
  if (!persistent) setTimeout(() => dismissToast(el), 5500);
}

export function dismissToast(el, now) {
  if (!el) return;
  if (now) { el._gone = true; el.remove(); return; }
  if (el._gone) return;
  el._gone = true; el.classList.add('out');
  setTimeout(() => el.remove(), 220);
}

export function closeToastFor(alertId) {
  const el = State.toastByAlert[alertId];
  if (el) { dismissToast(el); delete State.toastByAlert[alertId]; }
}
