/**
 * types.ts · The props contract. Same shape as the vanilla createTwin().update(props).
 */
import type { ReactElement } from 'react';
import type { HeartGeometry, MetricReading } from './model/heart';

export type { MetricReading } from './model/heart';

/** One entry per metric id ("hr", "spo2", …). Overlays read their own. */
export type Metrics = Partial<Record<string, MetricReading>>;

/** Static drawing, built once on the server by art.tsx. Elements are keyed; the rest is plain data. */
export interface TwinArt {
  /** <g data-layer="base"> and <g data-layer="body">: the stand and the suit. */
  base: ReactElement;
  body: ReactElement;
  /** What the heart-rate port shows when it opens: the chest cavity and the heart. */
  hr: { cavity: ReactElement; heart: ReactElement };
  geometry: {
    width: number;
    height: number;
    label: string;
    /** Where the figure's top-left corner sits on the 1440 × 780 stage. */
    x: number;
    y: number;
    hr: HeartGeometry;
  };
  /** Stage point each metric's link line ends on. */
  anchors: Record<string, [number, number]>;
}

export interface TwinProps {
  art: TwinArt;
  metrics: Metrics;
  /** Metric being hovered or selected, or null. */
  focus?: string | null;
  /** True when the focus is a selection (its detail panel is open), false for a hover. */
  pinned?: boolean;
  motion?: 'full' | 'reduced';
  /** True while the 360° view turns the figure. */
  spin?: boolean;
  /** Bump to run one scan sweep (0 = none). onScanEnd fires when it is over. */
  scan?: number;
  onScanEnd?: () => void;
}
