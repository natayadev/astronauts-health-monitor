/**
 * overlays/index.js · Which metric drives which overlay.
 *
 * An overlay is an object with one method:
 *
 *   mount(ctx) → { update(reading), tick(dt, calm), readout() }
 *
 *   ctx      { svg, art, defs, body, live, overlays }  the figure's layers and the generated art
 *   update   called with { value, level, signal, focused, pinned } whenever the dashboard renders
 *   tick     called every frame while anything moves; return true to keep the loop running
 *   readout  one short line for the plate's corner
 *
 * To add a metric: draw its parts in tools/twin/overlays/<name>.mjs, export them through
 * build.mjs into ART.overlays, write its live half next to heart.js, and add one line here.
 */
import { heartRate } from './heart.js';

export const OVERLAYS = {
  hr: heartRate
};
