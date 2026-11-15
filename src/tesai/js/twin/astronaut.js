/**
 * astronaut.js · The original astronaut illustration (assets/human.png) and the layers for its overlays.
 *
 *   const figure = mountFigure(host, { onReadout });
 *   figure.update({ metrics, focus, pinned, motion });
 *   figure.destroy();
 *
 * Same contract as figure.js (the generated isometric drawing), so twin.js can use either one.
 * The picture is mounted exactly where the first Tesai design had it: the whole 1440 × 780 stage,
 * centred and scaled to fit (preserveAspectRatio "meet"), at 95 % opacity.
 *
 * The suit always stays whole. Future metric overlays (heart, lungs, circulation, oxygen,
 * temperature) are drawn ON TOP of the picture, in its own pixel space (1920 × 1080):
 *   defs      gradients, masks and filters an overlay needs
 *   body      the picture itself; an overlay may give it a soft, local see-through mask, never cut it open
 *   live      small live marks
 *   overlays  the anatomical layers (semi-transparent, over the chest, the whole body, …)
 * An overlay has the same shape as in overlays/index.js: mount(ctx) → { update(reading), tick(dt, calm), readout() }.
 * Register it in OVERLAYS below. None is registered yet.
 */
const IMG = { href: 'assets/human.png', width: 1920, height: 1080 };
const STAGE = { width: 1440, height: 780 };
const SCALE = Math.min(STAGE.width / IMG.width, STAGE.height / IMG.height);

/** Where the picture sits on the 1440 × 780 stage. */
export const FIGURE = {
  name: 'astronaut',
  x: (STAGE.width - IMG.width * SCALE) / 2, y: (STAGE.height - IMG.height * SCALE) / 2,
  width: IMG.width * SCALE, height: IMG.height * SCALE, scale: SCALE
};

/**
 * Body points, in the picture's own pixels. The astronaut faces us, so their left is the viewer's right.
 * Every point lies on the suit (checked against the picture's pixels), and each metric must have one:
 * ui.js draws a link line to it.
 */
export const ANCHORS = {
  hrv:  [960, 150],    // helmet visor
  resp: [900, 405],    // chest, below the control panel
  spo2: [785, 565],    // right glove
  hr:   [985, 410],    // left chest, over the heart
  bp:   [1110, 400],   // left upper arm, where a cuff sits
  temp: [960, 560]     // abdomen
};

/** Stage point a metric's link line ends on, or null if the figure has no place for it. */
export const anchorOf = metric => {
  const a = ANCHORS[metric];
  return a ? [Math.round(FIGURE.x + a[0] * SCALE), Math.round(FIGURE.y + a[1] * SCALE)] : null;
};

/** metric id → overlay. Empty for now: the figure shows the picture only. */
const OVERLAYS = {};

export function mountFigure(host, { onReadout } = {}) {
  host.innerHTML = `<svg class="twin-fig twin-astronaut" viewBox="0 0 ${IMG.width} ${IMG.height}" width="${FIGURE.width}" height="${FIGURE.height}" style="left:${FIGURE.x}px;top:${FIGURE.y}px" focusable="false">
    <defs data-layer="defs"></defs>
    <g data-layer="body"><image href="${IMG.href}" x="0" y="0" width="${IMG.width}" height="${IMG.height}" opacity=".95"/></g>
    <g data-layer="live"></g>
    <g data-layer="overlays"></g>
  </svg>`;
  const svg = host.firstElementChild;
  const layer = name => svg.querySelector(`[data-layer="${name}"]`);

  /* Mount every registered overlay. Each gets the same context and owns only its own nodes. */
  const ctx = { svg, image: IMG, anchors: ANCHORS, defs: layer('defs'), body: layer('body'), live: layer('live'), overlays: layer('overlays') };
  const mounted = Object.entries(OVERLAYS).map(([metric, overlay]) => ({ metric, instance: overlay.mount(ctx) }));

  let props = { metrics: {}, focus: null, pinned: false, motion: 'full' };
  let frame = 0, last = 0, visible = true, said = '';

  const say = () => {
    if (!onReadout) return;
    const shown = mounted.find(o => o.metric === props.focus) || mounted[0];
    const text = shown ? shown.instance.readout() : '';
    if (text !== said) { said = text; onReadout(text); }
  };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60; last = now;
    const calm = props.motion === 'reduced';
    let moving = false;
    for (const o of mounted) moving = o.instance.tick(dt, calm) || moving;
    say();
    frame = moving && visible && !document.hidden ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (mounted.length && !frame && visible && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } };

  /* Only animate while the figure is on screen and the tab is in front. */
  const io = new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: '80px' });
  io.observe(svg);
  const onShow = () => run();
  document.addEventListener('visibilitychange', onShow);

  return {
    update(next) {
      props = { ...props, ...next };
      svg.dataset.focus = props.focus || '';
      for (const o of mounted) {
        const focused = props.focus === o.metric;
        o.instance.update({ ...(props.metrics[o.metric] || { value: null, level: 'nodata', signal: false }), focused, pinned: focused && props.pinned });
      }
      say(); run();
    },
    destroy() {
      cancelAnimationFrame(frame); frame = 0; io.disconnect();
      document.removeEventListener('visibilitychange', onShow);
      host.innerHTML = '';
    }
  };
}
