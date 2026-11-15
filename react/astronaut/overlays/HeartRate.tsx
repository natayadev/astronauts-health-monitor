'use client';
/**
 * overlays/HeartRate.tsx · Heart rate, live. React port of src/js/twin/overlays/heart.js.
 *
 * Always on (while there is a trusted reading): the console dial's needle reads bpm, the console lamp
 * and the pip on the chest port blink once per beat, and the chest display scrolls an ECG-style trace.
 * When heart rate is hovered or selected, the chest port opens on the heart, which contracts twice per
 * beat (S1 then S2); a ring runs across the bezel on every beat, and a tag beside the port reads the bpm.
 *
 * One owner per attribute:
 *   React (from props)  data-level, data-signal, data-state, the bpm text, and the rest pose
 *   the loop (refs)     needle, trace, port radius, opacities, heart scale, pulse, glow, data-beat, lamp
 * The rest-pose values are computed once per geometry, so re-renders never touch what the loop writes.
 */
import * as React from 'react';
import type { Overlay } from './types';
import { TAG, NO_READING, bpmText, fix, poseOf, restOf, stateOf, step, type HeartGeometry, type HeartReading, type HeartState } from '../model/heart';

interface Nodes {
  needle: SVGLineElement | null;
  trace: SVGPathElement | null;
  live: SVGGElement | null;
  clip: SVGCircleElement | null;
  port: SVGGElement | null;
  aperture: SVGCircleElement | null;
  heart: SVGGElement | null;
  pulse: SVGCircleElement | null;
  glow: SVGCircleElement | null;
  tag: SVGGElement | null;
}

interface Args {
  reading: HeartReading;
  geometry: HeartGeometry;
  cavity: React.ReactElement;
  heart: React.ReactElement;
  /** The figure's <svg>, to find the console lamp in the static body art. */
  svg: React.RefObject<SVGSVGElement | null>;
}

export function useHeartRate({ reading, geometry: g, cavity, heart, svg }: Args): Overlay {
  const id = 'twin-hr-' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const nodes = React.useRef<Nodes>({ needle: null, trace: null, live: null, clip: null, port: null, aperture: null, heart: null, pulse: null, glow: null, tag: null }).current;
  const state = React.useRef<HeartState | null>(null);
  state.current ??= restOf(g);
  const latest = React.useRef(reading);
  latest.current = reading;
  const lamp = React.useRef<Element | null>(null);
  React.useEffect(() => { lamp.current = svg.current?.querySelector('[data-part="lamp"]') ?? null; }, [svg]);

  /* What the server and the first client render show: closed port, parked needle, flat trace. */
  const rest = React.useMemo(() => poseOf(restOf(g), NO_READING, true, g), [g]);

  const tick = React.useCallback((dt: number, calm: boolean) => {
    const r = latest.current, s = state.current as HeartState;
    const moving = step(s, r, dt, calm, g);
    const p = poseOf(s, r, calm, g), n = nodes;
    n.needle?.setAttribute('transform', p.needle);
    lamp.current?.toggleAttribute('data-on', p.flash);
    n.live?.toggleAttribute('data-beat', p.flash);
    if (n.trace && n.trace.getAttribute('d') !== p.trace) n.trace.setAttribute('d', p.trace);
    n.clip?.setAttribute('r', p.radius);
    n.aperture?.setAttribute('r', p.radius);
    if (n.port) n.port.style.opacity = String(p.portOpacity);
    if (n.tag) { n.tag.style.opacity = String(p.tagOpacity); n.tag.toggleAttribute('data-beat', p.flash); }
    if (p.heart !== null) n.heart?.setAttribute('transform', p.heart);
    if (p.pulseRadius !== null) n.pulse?.setAttribute('r', p.pulseRadius);
    if (p.pulseOpacity !== null && n.pulse) n.pulse.style.opacity = String(p.pulseOpacity);
    if (p.glowOpacity !== null && n.glow) n.glow.style.opacity = String(p.glowOpacity);
    return moving;
  }, [g, nodes]);

  const { dial: D, screen: S, port: A } = g;
  const [px, py] = A.port;
  const signal = reading.signal && (reading.value ?? 0) > 0 ? 'on' : 'off';

  const defs = (
    <React.Fragment key="hr-defs">
      <clipPath id={`${id}-open`}><circle ref={el => { nodes.clip = el; }} r={rest.radius} transform={A.plane} /></clipPath>
      <clipPath id={`${id}-screen`}><rect width={S.w} height={S.h} transform={S.plane} /></clipPath>
    </React.Fragment>
  );

  /* Live parts that sit on the machine itself. */
  const live = (
    <g key="hr-live" ref={el => { nodes.live = el; }} className="twin-hr-live" data-level={reading.level} data-signal={signal}>
      <path className="iso-line twin-dial-band" d={D.normal} />
      {D.limits.map(([x, y], i) => <circle key={i} className="twin-dial-limit" cx={x} cy={y} r="1.1" />)}
      <g transform={D.plane}><line ref={el => { nodes.needle = el; }} className="twin-needle" x1="0" y1="1.6" x2="0" y2={-D.needle} transform={rest.needle} /></g>
      <g clipPath={`url(#${id}-screen)`}><path ref={el => { nodes.trace = el; }} className="twin-trace" transform={S.plane} d={rest.trace} /></g>
      <circle className="twin-pip" transform={A.plane} r="1.25" />
    </g>
  );

  /* What the open port shows, and the bpm tag beside it. */
  const port = (
    <g key="hr-port" ref={el => { nodes.port = el; }} className="twin-ov" data-ov="hr" data-level={reading.level} data-state={stateOf(reading)} data-signal={signal} style={{ opacity: rest.portOpacity }}>
      <circle ref={el => { nodes.glow = el; }} className="twin-glow" cx={px} cy={py} r={A.glow} />
      <g clipPath={`url(#${id}-open)`}>{cavity}<g ref={el => { nodes.heart = el; }} className="twin-heart">{heart}</g></g>
      <circle ref={el => { nodes.aperture = el; }} className="twin-aperture" transform={A.plane} r={rest.radius} />
      <circle ref={el => { nodes.pulse = el; }} className="twin-pulse" transform={A.plane} r={A.opening} />
      <g ref={el => { nodes.tag = el; }} className="twin-bpm" transform={`translate(${fix(px + TAG.dx)} ${fix(py + TAG.dy)})`} style={{ opacity: rest.tagOpacity }}>
        <rect width={TAG.w} height={TAG.h} rx={TAG.h / 2} />
        <circle className="twin-bpm-dot" cx={TAG.h / 2} cy={TAG.h / 2} r="3.5" />
        <text x={TAG.h - 2} y={TAG.h / 2} dominantBaseline="central"><tspan className="twin-bpm-v">{bpmText(reading)}</tspan><tspan className="twin-bpm-u" dx="4">bpm</tspan></text>
      </g>
    </g>
  );

  return { metric: 'hr', defs, live, port, tick };
}
