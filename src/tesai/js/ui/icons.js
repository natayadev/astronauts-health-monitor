/**
 * icons.js · SVG icon library.
 * All 2 px stroke, single weight (Lucide-like). Never emojis.
 */
const ic = d => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

export const ICONS = {
  heart:   ic('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  o2:      ic('<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>'),
  bp:      ic('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'),
  temp:    ic('<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>'),
  lungs:   ic('<path d="M12 4v8"/><path d="M12 12c-1 3-3 4-6 6-1.5 1-3-.5-2.5-2L6 8c.5-1.5 2.5-1.5 3 0l1 2"/><path d="M12 12c1 3 3 4 6 6 1.5 1 3-.5 2.5-2L18 8c-.5-1.5-2.5-1.5-3 0l-1 2"/>'),
  brain:   ic('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V6a2 2 0 0 0-3-2z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1V6a2 2 0 0 1 3-2z"/>'),
  run:     ic('<circle cx="15" cy="4.5" r="1.8"/><path d="M13 8l-3 3 3 2.5-2 5"/><path d="M13 8l3 2 3-1"/><path d="M10 11l-3 1-1.5 3"/><path d="M13 13.5l3 2 1 4"/>'),
  moon:    ic('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  music:   ic('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
  battery: ic('<rect x="3" y="8" width="15" height="9" rx="2"/><path d="M21 11v3"/><path d="M11 10l-2 3h3l-2 3"/>'),
  bell:    ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>'),
  medal:   ic('<circle cx="12" cy="15" r="5"/><path d="M8.5 11 6 3h4l2 4 2-4h4l-2.5 8"/>'),
  plug:    ic('<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4"/>'),
  wind:    ic('<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2"/>'),
  link:    ic('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  tick:    ic('<path d="M20 6 9 17l-5-5"/>'),
  alert:   ic('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
  octagon: ic('<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="M12 8v5M12 16h.01"/>'),
  circleOk:ic('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
  partial: ic('<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M12 8v4"/>'),
  nodata:  ic('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  drop:    ic('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'),
  gauge:   ic('<path d="M12 14l4-4"/><path d="M3.3 15a9 9 0 1 1 17.4 0"/>'),
  rad:     ic('<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4V3.5a9 9 0 0 1 7.8 4.5L13.8 11.2M10.6 12.8l-6 3.5A9 9 0 0 1 4.2 8M13.4 12.8l6 3.5a9 9 0 0 1-15.6 0"/>'),
  eye:     ic('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')
};

export const LV_ICON = {
  normal:    ICONS.circleOk,
  attention: ICONS.alert,
  surgeon:   ICONS.octagon,
  partial:   ICONS.partial,
  nodata:    ICONS.nodata,
  sensor:    ICONS.plug
};
