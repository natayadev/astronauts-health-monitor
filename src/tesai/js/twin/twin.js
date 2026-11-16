/**
 * twin.js · The astronaut twin: the whole centre of the Overview stage, as one component.
 *
 * Shaped like a component so it ports to React later without changes to its contract:
 *
 *   const twin = createTwin(root);                          // mount into an empty element
 *   twin.update({ metrics, focus, pinned, motion, spin });  // props in, every render (partial props are merged)
 *   await twin.scan();                                      // run the scan sweep once
 *   twin.destroy();                                         // unmount
 *
 * It never reads app state. Everything it shows comes from the props:
 *   metrics  { hr: { value, level, signal }, … }  one entry per metric id; overlays read their own
 *   focus    metric id being hovered or selected, or null
 *   pinned   true when the focus is a selection (its detail panel is open), false for a hover
 *   motion   "full" | "reduced"
 *   spin     true while the 360° view turns the figure
 *
 * Inside root, back to front:
 *   plate.js      the frame, its title and the readout line (hidden for the astronaut picture)
 *   spin.js       the perspective box that turns for the 360° view
 *   astronaut.js  the original astronaut picture (assets/human.png) and the layers for its overlays
 *   scan.js       the scan sweep
 *
 * The generated isometric drawing (figure.js + art.js + overlays/) is kept, unused. Both modules
 * export the same mountFigure / anchorOf / FIGURE, so switching back is this one import.
 */
import { mountFigure, anchorOf, FIGURE } from './astronaut.js';
import { mountPlate } from './plate.js';
import { mountSpin } from './spin.js';
import { mountScan } from './scan.js';

export { anchorOf, FIGURE };

export function createTwin(root) {
  root.classList.add('twin');
  if (FIGURE.name) root.dataset.figure = FIGURE.name;
  root.innerHTML = `<div class="twin-plate"></div><div></div><svg class="twin-scan" viewBox="0 0 1440 780" width="1440" height="780" focusable="false" hidden></svg>`;
  const [plateEl, spinEl, scanEl] = root.children;

  const plate = mountPlate(plateEl);
  const spin = mountSpin(spinEl);
  const figure = mountFigure(spin.host, { onReadout: text => plate.say(text) });
  const sweep = mountScan(scanEl);

  return {
    update({ spin: spinning, ...rest } = {}) {
      if (spinning !== undefined) { spin.set(spinning); root.toggleAttribute('data-spinning', !!spinning); }
      figure.update(rest);
    },
    scan: () => sweep.run(),
    destroy() {
      sweep.destroy(); figure.destroy(); spin.destroy(); plate.destroy();
      root.innerHTML = ''; root.classList.remove('twin'); root.removeAttribute('data-spinning'); root.removeAttribute('data-figure');
    }
  };
}
