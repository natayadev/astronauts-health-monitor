/* Wearables: isometric, separable drawings of the devices astronauts wear, shown in Biometrics.
   The drawings are SVG files in assets/wearables/ (one per device, every part a <g data-layer>); they are
   loaded the first time Biometrics opens and drawn with the page's own tokens (styles/components/wearables.css).
   Text is English; the Spanish comes from i18n.js like the rest of the dashboard. */
import { $, $$ } from './helpers.js';

const ITEMS = [
  { id: 'biomonitor', title: 'Bio-Monitor', devices: 'Astroskin · sleeveless shirt and headband', names: {
    headband: 'Headband · blood oxygen', shirt: 'Sleeveless shirt · breathing bands',
    sensors: 'Heart and electrical activity · skin temperature', activity: 'Activity module' } },
  { id: 'archer', title: 'ARCHeR', devices: 'Wrist wearable · sleep, activity and stress', names: {
    strap: 'Silicone strap', back: 'Back cover', battery: 'Battery', board: 'Circuit board', top: 'Case · two light windows and a button' } },
  { id: 'biobutton', title: 'BioButton', devices: 'Rechargeable version', names: {
    adhesive: 'Adhesive and electrode', flex: 'Circuit board', battery: 'Rechargeable battery', housing: 'Housing · power button and charging contacts' } },
  { id: 'triggerfish', title: 'Triggerfish', devices: 'Contact lens, antenna patch and recorder', names: {
    'lens-low': 'Contact lens · lower layer', circuit: 'Antenna, microprocessor (ASIC) and strain gauge', 'lens-top': 'Contact lens · upper layer',
    patch: 'External antenna · wireless telemetry', recorder: 'Recorder · data cable' } },
  { id: 'badge', title: 'Dosimeter badge', devices: 'Worn at all times', names: {
    strap: 'Strap and buckle', back: 'Back plate', indicator: 'Color indicator · shows the radiation level', cover: 'Front cover · window and label' } },
];

const state = {};
let ready = false;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';

function pose(id) {
  const s = state[id], svg = s.svg; if (!svg) return;
  const [zx, zy] = svg.dataset.z.split(' ').map(Number);
  $$('[data-layer]', svg).forEach(g => {
    const z = Number(g.dataset.z0) + Number(g.dataset.lift) * s.t;
    g.setAttribute('transform', `translate(${(zx * z).toFixed(2)} ${(zy * z).toFixed(2)})`);
  });
  const a = svg.dataset.vbRest.split(' ').map(Number), b = svg.dataset.vbEx.split(' ').map(Number);
  svg.setAttribute('viewBox', a.map((v, i) => (v + (b[i] - v) * s.t).toFixed(1)).join(' '));
}
function label(id) {
  const btn = $(`.wz-plate[data-id="${id}"] [data-act]`), on = state[id].goal > 0.5;
  btn.textContent = on ? 'Assemble' : 'Explode'; btn.setAttribute('aria-pressed', String(on));
}
function step(id, now) {
  const s = state[id], dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60; s.last = now;
  s.t += (s.goal - s.t) * (1 - Math.exp(-dt / 0.16));
  if (Math.abs(s.goal - s.t) < 0.002) s.t = s.goal;
  pose(id); s.raf = s.t === s.goal ? 0 : requestAnimationFrame(n => step(id, n));
}
function go(id, to) {
  const s = state[id]; s.goal = to; label(id);
  if (calm()) { s.t = to; pose(id); return; }
  if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(n => step(id, n)); }
}
function readout(id, layer) {
  const it = ITEMS.find(x => x.id === id), plate = $(`.wz-plate[data-id="${id}"]`);
  $$('[data-layer]', plate).forEach(g => g.classList.toggle('hl', g.dataset.layer === layer));
  plate.querySelector('.wz-stage').classList.toggle('dim', !!(layer && it.names[layer]));
  $('.wz-ro', plate).textContent = layer && it.names[layer] ? it.names[layer] : 'Hover a part';
}

export const Wearables = {
  /* draws the plates the first time; later calls do nothing */
  render() {
    if (ready) return; ready = true;
    const grid = $('#wz-grid');
    grid.innerHTML = ITEMS.map((it, n) => `
      <figure class="wz-plate" data-id="${it.id}">
        <div class="wz-bar"><span>Fig ${n + 1}</span><span class="wz-ttl">${it.title}</span></div>
        <div class="wz-stage"></div>
        <div class="wz-bar wz-foot"><button class="btn sm" type="button" data-act aria-pressed="false">Explode</button><span class="wz-ro" aria-live="polite">Hover a part</span></div>
        <figcaption>${it.devices}</figcaption>
      </figure>`).join('');
    ITEMS.forEach(it => {
      state[it.id] = { t: 0, goal: 0, raf: 0, last: 0, svg: null };
      const plate = $(`.wz-plate[data-id="${it.id}"]`);
      $('[data-act]', plate).onclick = () => go(it.id, state[it.id].goal > 0.5 ? 0 : 1);
      fetch(`assets/wearables/${it.id}.svg`).then(r => r.text()).then(txt => {
        const stage = $('.wz-stage', plate); stage.innerHTML = txt;
        const svg = stage.querySelector('svg'); state[it.id].svg = svg;
        $$('[data-layer]', svg).forEach(g => {
          g.onmouseenter = () => readout(it.id, g.dataset.layer); g.onmouseleave = () => readout(it.id, null);
        });
        pose(it.id);
      }).catch(() => { $('.wz-stage', plate).textContent = ''; });
    });
  }
};
