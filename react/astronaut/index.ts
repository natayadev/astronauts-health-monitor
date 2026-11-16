/**
 * index.ts · Client-safe entry. The static art is NOT exported here: import TWIN_ART from "./art"
 * in a server component, so the generated drawing never lands in a client bundle.
 */
export { Twin } from './Twin';
export { Figure } from './Figure';
export { Plate } from './Plate';
export { ScanSweep } from './ScanSweep';
export { useHeartRate } from './overlays/HeartRate';
export { useMetricFocus } from './useMetricFocus';
export { useStillness } from './kit/live';
export * as heartModel from './model/heart';
export type { TwinArt, TwinProps, Metrics, MetricReading } from './types';
export type { Overlay } from './overlays/types';
