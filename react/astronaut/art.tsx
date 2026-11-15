/**
 * art.tsx · The static drawing as React elements. Server-safe; never import it from a "use client" file.
 *
 * This is the only module that imports the generated art (src/js/twin/art.js, about 340 KB, written by
 * tools/twin/build.mjs). Build TWIN_ART in a server component and pass it down as the `art` prop, so the
 * client receives finished markup instead of shipping the module.
 *
 * The markup is our own build output, so it goes in with dangerouslySetInnerHTML rather than being
 * re-parsed into thousands of JSX nodes. Each element prop has a stable key (see the anatomy skill's
 * note on lazy element props in large server payloads).
 */
import { ART } from '../../src/js/twin/art.js';
import type { TwinArt } from './types';

/** Same placement as FIGURE in src/js/twin/figure.js. */
const X = 420, Y = 10;

export const TWIN_ART: TwinArt = {
  base: <g key="twin-base" data-layer="base" dangerouslySetInnerHTML={{ __html: ART.base }} />,
  body: <g key="twin-body" data-layer="body" dangerouslySetInnerHTML={{ __html: ART.body }} />,
  hr: {
    cavity: <g key="twin-hr-cavity" dangerouslySetInnerHTML={{ __html: ART.overlays.hr.cavity }} />,
    heart: <g key="twin-hr-heart" dangerouslySetInnerHTML={{ __html: ART.overlays.hr.heart }} />,
  },
  geometry: {
    width: ART.width, height: ART.height, label: ART.label, x: X, y: Y,
    hr: {
      dial: { plane: ART.dial.plane, min: ART.dial.min, max: ART.dial.max, from: ART.dial.from, span: ART.dial.span, needle: ART.dial.needle, normal: ART.dial.normal, limits: ART.dial.limits as [number, number][] },
      screen: ART.screen,
      port: { ...ART.overlays.hr, centre: ART.overlays.hr.centre as [number, number], port: ART.overlays.hr.port as [number, number] },
    },
  },
  anchors: Object.fromEntries(Object.entries(ART.anchors).map(([metric, [x, y]]) => [metric, [Math.round(X + x), Math.round(Y + y)]])) as Record<string, [number, number]>,
};
