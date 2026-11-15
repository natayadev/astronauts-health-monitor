/**
 * scan.js · The scan sweep: a glowing line that runs down the stage once.
 *
 *   const scan = mountScan(el);   // el becomes the sweep layer (an <svg> over the whole stage)
 *   await scan.run();             // resolves when the sweep is over; a second call during a sweep gets the same promise
 *   scan.destroy();
 *
 * The band is masked by #twin-scan-mask, whose group is still empty, so today only the line shows.
 * The line's glow uses the page's shared #tz-glow filter (index.html), which the charts use too.
 */
const SWEEP_MS = 3200;   // the CSS animation runs 3 s; the layer stays up a little longer

export function mountScan(el) {
  el.innerHTML = `<defs>
      <linearGradient id="twin-scanband" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--color-aqua)" stop-opacity="0"/>
        <stop offset=".85" style="stop-color:var(--color-aqua)" stop-opacity=".55"/>
        <stop offset="1" style="stop-color:var(--scan-hi)" stop-opacity="1"/>
      </linearGradient>
      <mask id="twin-scan-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="780">
        <g stroke-linecap="round" stroke-linejoin="round"></g>
      </mask>
    </defs>
    <g mask="url(#twin-scan-mask)">
      <rect class="scan-band" x="540" y="-60" width="360" height="70" fill="url(#twin-scanband)"/>
    </g>
    <line class="scan-line" x1="520" x2="920" y1="10" y2="10" style="stroke:var(--color-teal)" stroke-width="1.2" filter="url(#tz-glow)"/>`;

  let timer = 0, pending = null;
  return {
    run() {
      if (pending) return pending;
      el.hidden = true; void el.getBoundingClientRect(); el.hidden = false;   // restart the CSS animation
      pending = new Promise(resolve => { timer = setTimeout(() => { el.hidden = true; timer = 0; pending = null; resolve(); }, SWEEP_MS); });
      return pending;
    },
    destroy() { clearTimeout(timer); timer = 0; pending = null; el.innerHTML = ''; }
  };
}
