/**
 * overlays/types.ts · What every metric overlay hook returns to the figure.
 *
 * To add a metric: draw its parts in tools/twin/overlays/<name>.mjs (as for the vanilla dashboard),
 * expose them through art.tsx, write a hook beside HeartRate.tsx that returns this shape, and call it
 * from Figure.tsx. Hooks are called in a fixed order, so the list never changes at runtime.
 */
import type { ReactElement } from 'react';

export interface Overlay {
  metric: string;
  /** Clip paths and other defs, placed in the figure's <defs>. */
  defs: ReactElement;
  /** Parts that sit on the machine, painted above the body art. */
  live: ReactElement;
  /** What opens on the body when the metric is focused, painted last. */
  port: ReactElement;
  /** Advance by dt seconds and write the new pose through refs. Return true while anything moves. */
  tick(dt: number, calm: boolean): boolean;
}
