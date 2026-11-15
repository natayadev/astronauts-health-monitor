'use client';
/**
 * Figure.tsx · The drawing and its metric overlays, with one animation loop for all of them.
 *
 * Painter's order, back to front: overlay defs, base (stand), body (suit), live parts on the machine,
 * then what opens on the body. The static art arrives as element props from art.tsx; only the overlays
 * are client code. The loop runs only while the figure is on screen and stops when nothing moves; a new
 * reading or focus starts it again without resetting the heartbeat's phase.
 */
import * as React from 'react';
import { useInView, useLoop } from './kit/live';
import { useHeartRate } from './overlays/HeartRate';
import { NO_READING } from './model/heart';
import type { TwinArt, Metrics } from './types';

interface FigureProps {
  art: TwinArt;
  metrics: Metrics;
  focus: string | null;
  pinned: boolean;
  motion: 'full' | 'reduced';
}

export function Figure({ art, metrics, focus, pinned, motion }: FigureProps) {
  const svg = React.useRef<SVGSVGElement>(null);
  const inView = useInView(svg);
  const { geometry: G } = art;

  /* One hook per registered overlay, always in this order. */
  const hr = metrics.hr ?? NO_READING;
  const overlays = [
    useHeartRate({ reading: { value: hr.value, level: hr.level, signal: hr.signal, focused: focus === 'hr', pinned: focus === 'hr' && pinned }, geometry: G.hr, cavity: art.hr.cavity, heart: art.hr.heart, svg }),
  ];

  const calm = motion === 'reduced';
  const kick = useLoop((dt) => {
    let moving = false;
    for (const o of overlays) moving = o.tick(dt, calm) || moving;
    return moving;
  }, inView);
  React.useEffect(() => { if (inView) kick(); });   // after every render: new props may need frames

  return (
    <svg ref={svg} className="twin-fig iso-svg" viewBox={`0 0 ${G.width} ${G.height}`} width={G.width} height={G.height}
      style={{ left: G.x, top: G.y }} role="img" aria-label={G.label} focusable="false" data-focus={focus ?? ''}>
      <defs data-layer="defs">{overlays.map(o => o.defs)}</defs>
      {art.base}
      {art.body}
      <g data-layer="live">{overlays.map(o => o.live)}</g>
      <g data-layer="overlays">{overlays.map(o => o.port)}</g>
    </svg>
  );
}
