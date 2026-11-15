/**
 * test/parity.mjs · The React model must move exactly like the vanilla overlay.
 *
 *   node --experimental-strip-types react/astronaut/test/parity.mjs     (Node 22; from the repo root)
 *
 * Mounts the real src/js/twin/overlays/heart.js on stub nodes that record every write, drives it and
 * model/heart.ts with the same readings and frame times, and compares every value the loop writes.
 */
import { ART } from '../../../src/js/twin/art.js';
import { heartRate } from '../../../src/js/twin/overlays/heart.js';
import { restOf, step, poseOf, readoutOf, bpmText, stateOf } from '../model/heart.ts';

/* ---- Stub DOM: each selector gets one recording node ---- */
function node(name) {
  const n = {
    name, attrs: {}, style: {}, dataset: {}, textContent: '', kids: {},
    setAttribute(k, v) { n.attrs[k] = String(v); },
    toggleAttribute(k, on) { if (on) n.attrs[k] = ''; else delete n.attrs[k]; },
    insertAdjacentHTML() {},
    querySelector(sel) { return (n.kids[sel] ||= node(`${name} ${sel}`)); },
    get lastElementChild() { return (n.kids['<last>'] ||= node(`${name}>last`)); },
  };
  return n;
}
const ctx = { svg: node('svg'), art: ART, defs: node('defs'), body: node('body'), live: node('live'), overlays: node('overlays') };
const ov = heartRate.mount(ctx);
const liveG = ctx.live.lastElementChild, port = ctx.overlays.lastElementChild;
const clip = ctx.defs.kids[Object.keys(ctx.defs.kids).find(k => k.endsWith('-open circle'))];
const q = (n, s) => n.kids[s];
const lamp = q(ctx.body, '[data-part="lamp"]');

function vanilla() {
  const tag = q(port, '.twin-bpm');
  return {
    needle: q(liveG, '.twin-needle').attrs.transform,
    flash: 'data-beat' in liveG.attrs, lamp: 'data-on' in lamp.attrs, tagBeat: 'data-beat' in tag.attrs,
    trace: q(liveG, '.twin-trace').attrs.d,
    clip: clip.attrs.r, aperture: q(port, '.twin-aperture').attrs.r,
    portOpacity: String(port.style.opacity), tagOpacity: String(tag.style.opacity),
    heart: q(port, '.twin-heart').attrs.transform, pulseRadius: q(port, '.twin-pulse').attrs.r,
    pulseOpacity: q(port, '.twin-pulse').style.opacity === undefined ? undefined : String(q(port, '.twin-pulse').style.opacity),
    glowOpacity: q(port, '.twin-glow').style.opacity === undefined ? undefined : String(q(port, '.twin-glow').style.opacity),
    level: port.dataset.level, signal: port.dataset.signal, liveLevel: liveG.dataset.level, liveSignal: liveG.dataset.signal, state: port.dataset.state,
    bpm: q(tag, '.twin-bpm-v').textContent, readout: ov.readout(),
  };
}

/* The model, with "leave as is" (null) resolved the way the DOM keeps the last write. */
const G = { dial: ART.dial, screen: ART.screen, port: ART.overlays.hr };
const S = restOf(G); let kept = {};
function model(reading, calm, moving) {
  const p = poseOf(S, reading, calm, G);
  for (const k of ['heart', 'pulseRadius', 'pulseOpacity', 'glowOpacity']) if (p[k] !== null) kept[k] = String(p[k]);
  const signal = reading.signal && reading.value > 0 ? 'on' : 'off';
  return {
    needle: p.needle, flash: p.flash, lamp: p.flash, tagBeat: p.flash, trace: p.trace, clip: p.radius, aperture: p.radius,
    portOpacity: String(p.portOpacity), tagOpacity: String(p.tagOpacity),
    heart: kept.heart, pulseRadius: kept.pulseRadius, pulseOpacity: kept.pulseOpacity, glowOpacity: kept.glowOpacity,
    level: reading.level, signal, liveLevel: reading.level, liveSignal: signal, state: stateOf(reading),
    bpm: bpmText(reading), readout: readoutOf(reading), moving,
  };
}

/* ---- Script: [seconds, reading, calm] ---- */
const R = (value, extra = {}) => ({ value, level: 'normal', signal: value != null, focused: false, pinned: false, ...extra });
const script = [
  [1.0, R(72), false],
  [0.8, R(72, { focused: true }), false],
  [1.5, R(150, { focused: true, level: 'surgeon' }), false],
  [0.7, R(60, { focused: true, pinned: true }), false],
  [0.5, R(60, { focused: true, pinned: true }), true],          // reduced motion
  [0.6, R(60, { focused: true, pinned: true }), false],
  [0.9, R(null, { focused: true, level: 'nodata' }), false],    // no signal while open
  [0.9, R(88, { level: 'attention' }), false],                   // focus off: the port closes
  [1.2, R(null, { level: 'nodata' }), false],
];

let frames = 0, fails = 0;
const seen = { flash: 0, open: 0, pulse: 0, pinnedGlow: 0, calm: 0, noSignalOpen: 0, needles: new Set(), bpms: new Set() };
const dts = [1 / 60, 1 / 60, 1 / 30, 1 / 144, 1 / 20, 1 / 60];
for (const [seconds, reading, calm] of script) {
  ov.update(reading);
  for (let t = 0, i = 0; t < seconds; i++) {
    const dt = dts[(frames + i) % dts.length]; t += dt;
    const vMoving = ov.tick(dt, calm);
    const mMoving = step(S, reading, dt, calm, G);
    const a = { ...vanilla(), moving: vMoving }, b = model(reading, calm, mMoving);
    if (a.flash) seen.flash++; if (a.portOpacity === '1') seen.open++; if (+a.pulseOpacity > 0) seen.pulse++;
    if (reading.pinned && +a.glowOpacity > 0) seen.pinnedGlow++; if (calm) seen.calm++; if (!reading.signal && a.portOpacity === '1') seen.noSignalOpen++;
    seen.needles.add(a.needle); seen.bpms.add(a.bpm);
    for (const k of Object.keys(a)) if (a[k] !== b[k]) {
      if (fails++ < 12) console.log(`frame ${frames} ${k}:\n  vanilla ${String(a[k]).slice(0, 160)}\n  model   ${String(b[k]).slice(0, 160)}`);
    }
    frames++;
  }
}
/* The comparison only means something if the script reached every state. */
const covered = seen.flash > 10 && seen.open > 100 && seen.pulse > 10 && seen.pinnedGlow > 10 && seen.calm > 10 && seen.noSignalOpen > 10 && seen.needles.size > 50 && seen.bpms.size >= 5;
console.log(`coverage · beat flashes ${seen.flash}, port open ${seen.open}, pulse ring ${seen.pulse}, pinned glow ${seen.pinnedGlow}, calm ${seen.calm}, open without signal ${seen.noSignalOpen}, needle angles ${seen.needles.size}, bpm texts ${[...seen.bpms].join(' ')}`);
if (!covered) { console.log('coverage too thin'); fails++; }
console.log(`${frames} frames compared · ${fails} differences`);
process.exit(fails ? 1 : 0);
