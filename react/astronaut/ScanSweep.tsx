'use client';
/**
 * ScanSweep.tsx · The scan sweep: a glowing line that runs down the stage once.
 *
 * Mounted only while it runs, and keyed by the run number, so each run restarts the CSS animation
 * (.scan-line / .scan-band in twin.css). The band is masked by an empty mask, as in the vanilla
 * dashboard, so only the line shows. The glow filter is its own, not the page's #tz-glow.
 */
import * as React from 'react';

const SWEEP_MS = 3200;   // the CSS animation runs 3 s; the layer stays up a little longer

export function ScanSweep({ run = 0, onEnd }: { run?: number; onEnd?: () => void }) {
  const [active, setActive] = React.useState(0);
  const done = React.useRef(onEnd);
  done.current = onEnd;
  const id = 'twin-scan-' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

  React.useEffect(() => {
    if (!run) return;
    setActive(run);
    const timer = setTimeout(() => { setActive(0); done.current?.(); }, SWEEP_MS);
    return () => clearTimeout(timer);
  }, [run]);

  if (!active) return null;
  return (
    <svg key={active} className="twin-scan" viewBox="0 0 1440 780" width="1440" height="780" focusable="false">
      <defs>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--color-aqua)' }} stopOpacity="0" />
          <stop offset=".85" style={{ stopColor: 'var(--color-aqua)' }} stopOpacity=".55" />
          <stop offset="1" style={{ stopColor: 'var(--scan-hi)' }} stopOpacity="1" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="780">
          <g strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        <rect className="scan-band" x="540" y="-60" width="360" height="70" fill={`url(#${id}-band)`} />
      </g>
      <line className="scan-line" x1="520" x2="920" y1="10" y2="10" style={{ stroke: 'var(--color-teal)' }} strokeWidth="1.2" filter={`url(#${id}-glow)`} />
    </svg>
  );
}
