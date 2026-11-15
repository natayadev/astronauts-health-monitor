/**
 * plate.js · The frame behind the figure: figure number, title, and a one-line readout.
 *
 *   const plate = mountPlate(el);
 *   plate.say('Heart rate 72 bpm · …');
 *   plate.destroy();
 */
const PLATE = { fig: 'Fig 1', title: 'Suit checkout stand' };

export function mountPlate(el) {
  el.innerHTML = `<span class="twin-plate-fig">${PLATE.fig}</span><span class="twin-plate-title">${PLATE.title}</span><span class="twin-plate-readout" data-readout></span>`;
  const readout = el.querySelector('[data-readout]');
  return {
    say(text) { readout.textContent = text; },
    destroy() { el.innerHTML = ''; }
  };
}
