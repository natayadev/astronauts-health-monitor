/**
 * stand.mjs · The suit checkout stand: base plate on feet, foot restraint, and the
 * biomonitor console whose dial reads heart rate.
 * Edit this file to change anything the astronaut stands on or next to.
 */
import { k, G, A, P, PLATE, PLATE_H, FOOT_H, at, S, Ln, Dots, record, slab, post, disc, facingSide, loop, byDepth } from "./scene.mjs";

/* Foot restraint: the deck the boots stand on, with a toe bar on two posts. */
export const DECK = { x: -27, y: -30, w: 54, d: 44, r: 4 };
export const DECK_TOP = 1.2;
export const TOE_BAR = { x: -27.5, y: 4.5, w: 55, d: 3, r: 1.2 };
export const TOE_BAR_Z = 13.4;

/* Console and its dial. The dial runs 20 to 220 bpm over 270 degrees, one tick per 10 bpm. */
export const CONSOLE = { x: 32, y: -23, w: 26, d: 24, r: 3 };
export const CONSOLE_H = 18;
export const DIAL = { centre: [42.5, -12], r: 9.5, z: CONSOLE_H + 3.4, min: 20, max: 220, from: -135, span: 270, tick: 8.3, needle: 7 };
export const LAMP = { centre: [53.2, -19.4], r: 1.6, z: CONSOLE_H + 1 };

const RAD = Math.PI / 180;
export const dialAngle = (value) => DIAL.from + ((value - DIAL.min) / (DIAL.max - DIAL.min)) * DIAL.span;
const onDial = (value, r) => {
  const a = dialAngle(value) * RAD;
  return [DIAL.centre[0] + Math.sin(a) * r, DIAL.centre[1] - Math.cos(a) * r];
};

/** Static base, drawn before everything else. Returns its SVG. */
export function buildBase() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 17))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 32), { tone: "mid" }));
    record(A.cylinder(x, y, 7, -PLATE_H - FOOT_H, FOOT_H, { name: "stand.foot", ground: true }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -PLATE_H / 2, P, 8), { tone: "faint" }) }));
  record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 3), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));

  /* Ruler strip along the front edge: one tick per 4 cm, a long one every 5th. */
  const strip = { x: -40, y: 17.6, w: 72, d: 4.6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.1, 0.6, [1.5, 2.8], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  out.push(Dots([at([strip.x + 1.8, strip.y + 3.2, 0.6]), at([strip.x + strip.w - 1.8, strip.y + 3.2, 0.6])], { size: 0.45 }));

  /* Label plate: three rule lines stand for engraved text. */
  const label = { x: -43.5, y: -8, w: 13.5, d: 12, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }));
  [[4.8, 8.4], [6.9, 5.6], [9, 7]].forEach(([dy, length]) => out.push(Ln(k.lineOnTop([label.x + 2.6, label.y + dy], [label.x + 2.6 + length, label.y + dy], 0.8, P), { tone: "lo", free: true })));
  out.push(Dots([at([label.x + 1.9, label.y + 2.2, 0.8]), at([label.x + label.w - 1.9, label.y + 2.2, 0.8])], { size: 0.4 }));

  /* Restraint deck under the boots. */
  out.push(S(k.slabOf(DECK, 0, DECK_TOP, P, 5, 0.4), { tone: "lo" }));
  record(A.slab(DECK, 0, DECK_TOP, { name: "stand.deck", ground: true }, 5));
  out.push(Ln(k.planOutline(k.insetPlan(DECK, 2), DECK_TOP, P, 5), { tone: "faint" }));
  out.push(Dots(k.corners(DECK, 4).map(([x, y]) => at([x, y, DECK_TOP])), { size: 0.45 }));
  return out.join("");
}

/** Parts that stand on the plate and sort against the astronaut. */
export function buildStand() {
  /* Toe bar on two posts, just clear of the boot toes. */
  for (const x of [-25, 25]) {
    post("restraint.collar", [x, 6], 2.6, DECK_TOP, 1.4, { tone: "mid" });
    post("restraint.post", [x, 6], 1.5, DECK_TOP + 1.4, TOE_BAR_Z - DECK_TOP - 1.4, { tone: "mid", crease: "none" });
  }
  slab("restraint.bar", TOE_BAR, TOE_BAR_Z, 2.6, { tone: "mid" }, {
    steps: 3, bevel: 0.4,
    extra: Dots([at([-25, 6, TOE_BAR_Z + 2.6]), at([25, 6, TOE_BAR_Z + 2.6])], { size: 0.45 }),
  });

  /* Console body with a lid seam, a row of closed vent slots and a data port. */
  const C = CONSOLE, top = CONSOLE_H, front = C.y + C.d;
  const vents = [0, 1, 2, 3, 4].map((i) => {
    const x = C.x + 6 + i * 3.4;
    return loop([[x, front, 4.5], [x + 1.5, front, 4.5], [x + 1.5, front, 11.5], [x, front, 11.5]]);
  }).join("");
  slab("console.body", C, 0, top, { tone: "mid" }, {
    steps: 5, bevel: 0.8,
    inner: Ln(k.sideSeam(C, top - 3.2, P, 5), { tone: "faint" }),
    extra: Ln(vents, { tone: "lo" })
      + Ln(k.planOutline(k.insetPlan(C, 1.6), top, P, 5), { tone: "faint" })
      + Dots([[C.x + 3, C.y + C.d - 3], [C.x + C.w - 3, C.y + C.d - 3], [C.x + 3, C.y + 3]].map(([x, y]) => at([x, y, top])), { size: 0.45 }),
  });
  disc("console.port", facingSide([C.x + C.w, C.y + 9, 8]), 0, 1.4, 2.2, { tone: "mid" }, {
    extra: Ln(G.circleOf(facingSide([C.x + C.w, C.y + 9, 8]), 1.4, 1.2, P, 16), { tone: "lo" }),
  });

  /* Dial: a knurled puck, face up. Ticks every 10 bpm, long ones at 20, 70, 120, 170 and 220. */
  const [cx, cy] = DIAL.centre, z0 = top, zt = DIAL.z;
  const ticks = k.radialTicks(cx, cy, DIAL.tick, 20, 5, zt, [1.1, 2.2], P, DIAL.from * RAD, DIAL.span * RAD);
  post("console.dial", [cx, cy], DIAL.r, z0, zt - z0, { tone: "hi", crease: "lo" }, {
    steps: 72, bevel: 0.6, part: "dial",
    inner: Ln(k.sideArc(cx, cy, DIAL.r, zt - 1.6, P, 40), { tone: "faint" }),
    extra: Ln(k.knurl(cx, cy, DIAL.r, zt - 1.6, zt, 72, P, 0.25), { tone: "lo" })
      + Ln(k.ring(cx, cy, DIAL.r - 1.2, zt, P, 64), { tone: "lo" })
      + Ln(k.ring(cx, cy, DIAL.tick - 2.2, zt, P, 48), { tone: "faint" })
      + Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" })
      + Ln(k.ring(cx, cy, 1.3, zt, P, 16), { tone: "mid" }),
  });

  /* Pulse lamp: collar and lens. The lens is lit by the live code on every beat. */
  const [lx, ly] = LAMP.centre;
  post("console.lamp-collar", [lx, ly], LAMP.r + 0.7, top, 1, { tone: "mid" });
  post("console.lamp", [lx, ly], LAMP.r, top + 1, 1.2, { tone: "hi" }, { part: "lamp", bevel: 0.3 });

  /* Range knob with a pointer line. */
  const knob = [53, -3.8];
  post("console.knob", knob, 2.4, top, 3, { tone: "mid" }, {
    extra: Ln(k.knurl(knob[0], knob[1], 2.4, top, top + 3, 20, P), { tone: "lo" })
      + Ln(k.lineOnTop(knob, [knob[0], knob[1] - 2.4], top + 3, P), { tone: "hi" }),
  });
}

/** Marks drawn on the dial face from the app's own thresholds (src/tesai/js/config.js). */
export function dialMarks(thresholds) {
  const [lo, hi] = thresholds.attention, r = DIAL.tick - 1.1, points = [];
  for (let v = lo; v <= hi + 1e-6; v += 2.5) points.push(onDial(v, r));
  return {
    normal: k.onTop(points, DIAL.z, P),
    limits: thresholds.surgeon.map((v) => at([...onDial(v, r), DIAL.z])),
  };
}
