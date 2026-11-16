/**
 * overlays/heart.js · Heart rate, live.
 *
 * Always on (while there is a trusted reading):
 *   - the console dial's needle reads beats per minute
 *   - the console lamp and the pip on the chest port blink once per beat
 *   - the chest display scrolls an ECG-style trace at the same rate
 * When heart rate is hovered or selected:
 *   - the chest port opens on the heart, which contracts twice per beat (S1 then S2)
 *   - a ring runs across the port's bezel on every beat
 *   - a tag beside the port reads the rate in bpm; its dot blinks with each beat
 *
 * One phase accumulator drives all of it (phase += dt × bpm / 60), so a new reading changes
 * the rate without a jump. With no trusted reading nothing beats and the needle parks.
 */

let serial = 0;

/* One heartbeat as a polyline: [fraction of the cycle after the R peak, height]. */
const BEAT = [[-0.115, 0], [-0.085, 0.14], [-0.055, 0], [-0.025, 0], [-0.015, -0.12], [0, 1], [0.015, -0.22], [0.03, 0], [0.145, 0], [0.205, 0.26], [0.265, 0]];
const WINDOW_S = 2.2;      // seconds of trace the chest display shows
/* The bpm tag, relative to the port centre: up and right of the port, above the Heart rate link line,
   clear of the chest display (below the port) and the respiration point (left of it). */
const TAG = { dx: 52, dy: -48, w: 76, h: 22 };

const burst = (age, rise, fall) => (age <= 0 ? 0 : age < rise ? (age / rise) ** 2 * (3 - 2 * age / rise) : Math.exp(-(age - rise) / fall));
const follow = (now, target, dt, seconds, calm) => (calm || Math.abs(target - now) < 1e-3 ? target : now + (target - now) * (1 - Math.exp(-dt / seconds)));
const fix = n => +n.toFixed(2);

export const heartRate = {
  mount({ art, defs, body, live, overlays }) {
    const A = art.overlays.hr, D = art.dial, S = art.screen, id = `twin-hr-${++serial}`;
    const [cx, cy] = A.centre, [px, py] = A.port;

    defs.insertAdjacentHTML('beforeend',
      `<clipPath id="${id}-open"><circle r="0" transform="${A.plane}"/></clipPath>` +
      `<clipPath id="${id}-screen"><rect width="${S.w}" height="${S.h}" transform="${S.plane}"/></clipPath>`);

    /* Live parts that sit on the machine itself. */
    live.insertAdjacentHTML('beforeend', `<g class="twin-hr-live" data-level="nodata" data-signal="off">
      <path class="iso-line twin-dial-band" d="${D.normal}"/>
      ${D.limits.map(([x, y]) => `<circle class="twin-dial-limit" cx="${x}" cy="${y}" r="1.1"/>`).join('')}
      <g transform="${D.plane}"><line class="twin-needle" x1="0" y1="1.6" x2="0" y2="${-D.needle}"/></g>
      <g clip-path="url(#${id}-screen)"><path class="twin-trace" transform="${S.plane}" d=""/></g>
      <circle class="twin-pip" transform="${A.plane}" r="1.25"/>
    </g>`);
    const liveG = live.lastElementChild;
    const needle = liveG.querySelector('.twin-needle'), trace = liveG.querySelector('.twin-trace');
    const lamp = body.querySelector('[data-part="lamp"]');

    /* What the open port shows. */
    overlays.insertAdjacentHTML('beforeend', `<g class="twin-ov" data-ov="hr" data-level="nodata" data-state="idle" data-signal="off">
      <circle class="twin-glow" cx="${px}" cy="${py}" r="${A.glow}"/>
      <g clip-path="url(#${id}-open)">${A.cavity}<g class="twin-heart">${A.heart}</g></g>
      <circle class="twin-aperture" transform="${A.plane}" r="0"/>
      <circle class="twin-pulse" transform="${A.plane}" r="${A.opening}"/>
      <g class="twin-bpm" transform="translate(${fix(px + TAG.dx)} ${fix(py + TAG.dy)})">
        <rect width="${TAG.w}" height="${TAG.h}" rx="${TAG.h / 2}"/>
        <circle class="twin-bpm-dot" cx="${TAG.h / 2}" cy="${TAG.h / 2}" r="3.5"/>
        <text x="${TAG.h - 2}" y="${TAG.h / 2}" dominant-baseline="central"><tspan class="twin-bpm-v">--</tspan><tspan class="twin-bpm-u" dx="4">bpm</tspan></text>
      </g>
    </g>`);
    const ov = overlays.lastElementChild;
    const clip = defs.querySelector(`#${id}-open circle`);
    const heart = ov.querySelector('.twin-heart'), aperture = ov.querySelector('.twin-aperture'), pulse = ov.querySelector('.twin-pulse'), glow = ov.querySelector('.twin-glow');
    const tag = ov.querySelector('.twin-bpm'), tagValue = tag.querySelector('.twin-bpm-v');

    let reading = { value: null, level: 'nodata', signal: false, focused: false, pinned: false };
    let phase = 0, open = 0, shown = D.min, drawn = '';

    const beating = () => reading.signal && reading.value > 0;

    function drawTrace(bpm) {
      const base = S.h * 0.7, amp = S.h * 0.52;
      if (!bpm) return `M0 ${fix(base)}H${S.w}`;
      const cycles = WINDOW_S * bpm / 60, first = Math.floor(phase - cycles) - 1, lastBeat = Math.floor(phase) + 1;
      const pts = [];
      for (let k = first; k <= lastBeat; k++) for (const [f, a] of BEAT) pts.push(`${fix(S.w * (1 - (phase - (k + f)) / cycles))} ${fix(base - a * amp)}`);
      return 'M' + pts.join('L');
    }

    function draw(calm) {
      const on = beating(), period = on ? 60 / reading.value : 0;
      const age = on ? (phase % 1) * period : 0;                       // seconds since this beat's R peak
      const systole = 0.32 * Math.sqrt(period || 1);                   // S1 to S2 shortens as the rate rises
      const s1 = on && !calm ? burst(age, 0.035, 0.1) : 0, s2 = on && !calm ? burst(age - systole, 0.03, 0.07) : 0;
      const flash = on && (calm || age < 0.12);

      needle.setAttribute('transform', `rotate(${fix(D.from + (Math.min(D.max, Math.max(D.min, shown)) - D.min) / (D.max - D.min) * D.span)})`);
      if (lamp) lamp.toggleAttribute('data-on', flash);
      liveG.toggleAttribute('data-beat', flash);
      const d = drawTrace(on ? reading.value : 0); if (d !== drawn) { drawn = d; trace.setAttribute('d', d); }

      const r = A.opening * open;
      clip.setAttribute('r', fix(r)); aperture.setAttribute('r', fix(r));
      ov.style.opacity = open < 0.01 ? 0 : 1;
      tag.style.opacity = fix(open);
      tag.toggleAttribute('data-beat', flash);
      if (open < 0.01) return;
      const k = 1 - 0.075 * s1 - 0.035 * s2;                           // the heart gets smaller as it contracts
      heart.setAttribute('transform', `translate(${cx} ${cy}) scale(${fix(k + 0.0001)}) translate(${-cx} ${-cy})`);
      const wave = on && !calm ? Math.min(1, age / 0.42) : 1;
      pulse.setAttribute('r', fix(A.opening + 0.35 + (A.bezel - A.opening - 0.7) * wave));
      pulse.style.opacity = on && !calm ? fix((1 - wave) * 0.9 * open) : 0;
      glow.style.opacity = fix(open * (reading.pinned ? 0.34 : 0.24) * (on ? 0.72 + 0.28 * s1 : 0.5));
    }

    return {
      update(next) {
        reading = next;
        for (const el of [liveG, ov]) { el.dataset.level = next.level; el.dataset.signal = beating() ? 'on' : 'off'; }
        ov.dataset.state = next.pinned ? 'pinned' : next.focused ? 'preview' : 'idle';
        const bpm = beating() ? String(Math.round(next.value)) : '--';
        if (tagValue.textContent !== bpm) tagValue.textContent = bpm;
      },
      tick(dt, calm) {
        const on = beating(), target = reading.focused ? 1 : 0, park = on ? reading.value : D.min;
        if (on && !calm) phase += dt * reading.value / 60;
        open = follow(open, target, dt, 0.13, calm);
        shown = follow(shown, park, dt, 0.4, calm);
        draw(calm);
        return (on && !calm) || open !== target || shown !== park;
      },
      readout() {
        return beating() ? `Heart rate ${Math.round(reading.value)} bpm · one beat every ${(60 / reading.value).toFixed(2)} s` : 'Heart rate · no signal';
      }
    };
  }
};
