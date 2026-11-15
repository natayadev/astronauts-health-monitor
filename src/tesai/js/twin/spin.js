/**
 * spin.js · The 360° view: a perspective box that turns whatever is placed in it.
 *
 *   const spin = mountSpin(el);   // el becomes the perspective box
 *   spin.host                     // put the figure here
 *   spin.set(true | false);
 *   spin.destroy();
 */
export function mountSpin(el) {
  el.classList.add('twin-persp');
  el.innerHTML = '<div class="twin-spin"><div class="twin-host"></div></div>';
  const turner = el.firstElementChild;
  return {
    host: turner.firstElementChild,
    set(on) { turner.classList.toggle('on', !!on); },
    destroy() { el.innerHTML = ''; el.classList.remove('twin-persp'); }
  };
}
