/**
 * suit.mjs · The astronaut: boots, legs, brief, hard upper torso, life-support pack,
 * chest display, arms as ball-jointed segments, gloves and helmet.
 * Edit this file to change the astronaut only. Sizes are centimetres.
 *
 * Every joint is flush, tangent or a rim landing on a ball, so the painter's order can
 * always be settled from the geometry (see the audit in build.mjs).
 */
import { k, G, P, V, at, Ln, Dots, slab, post, disc, turned, ball, prism, hose, facingFront, facingSide, facingUp, loop } from "./scene.mjs";
import { DECK_TOP } from "./stand.mjs";

const B = DECK_TOP;          // the boots stand on the restraint deck
export const CY = -12.5;     // the body's centre line, front to back

/* Heights, bottom to top. */
const Z = { sole: B + 2.6, foot: B + 11, ankle: 21, cuff: 23, knee: 47, kneeTop: 51, hip: 82, waist: 100, torso: 103, shoulder: 144, neck: 148 };

export const PELVIS = { x: -22.5, y: CY - 12, w: 45, d: 24, r: 9 };
export const TORSO = { x: -23, y: CY - 12.5, w: 46, d: 25, r: 9 };
export const CHEST_Y = TORSO.y + TORSO.d;            // the flat chest face
export const HELMET = { centre: [0, CY, Z.neck + Math.sqrt(17.5 ** 2 - 11.5 ** 2)], r: 17.5 };
export const DCM = { x: -8, y: CHEST_Y, w: 16, d: 5, r: 0.6, z: 104, h: 8.5 };
export const DCM_SCREEN = { x: -5.6, z: 105.9, w: 11.2, h: 4.8 };

const unit = G.unit3;
const along = (o, d, s) => G.add3(o, G.mul3(d, s));

function boots() {
  for (const side of [-1, 1]) {
    const x = side > 0 ? 4 : -21, tag = side > 0 ? "L" : "R";
    const sole = { x, y: -23, w: 17, d: 33.5, r: 6 };
    slab(`boot${tag}.sole`, sole, B, 2.6, { tone: "mid" }, { mat: "rubber", bevel: 0, region: "legs" });
    slab(`boot${tag}.foot`, k.insetPlan(sole, 0.6), Z.sole, Z.foot - Z.sole, {}, {
      mat: "rubber", bevel: 0.6, region: "legs",
      inner: Ln(k.sideSeam(k.insetPlan(sole, 0.6), Z.sole + 3.2, P, 5), { tone: "faint" }),
    });
    const ankle = { x: x + 1, y: -21.5, w: 15, d: 17, r: 6 };
    slab(`boot${tag}.ankle`, ankle, Z.foot, Z.ankle - Z.foot, {}, { mat: "rubber", bevel: 0.5, region: "legs" });
  }
}

function legs() {
  for (const side of [-1, 1]) {
    const c = [side * 12.5, -13], tag = side > 0 ? "L" : "R";
    post(`leg${tag}.cuff`, c, 8.4, Z.ankle, Z.cuff - Z.ankle, { tone: "mid" }, { region: "legs" });
    post(`leg${tag}.shin`, c, 7.6, Z.cuff, Z.knee - Z.cuff, {}, {
      region: "legs",
      inner: Ln(k.sideArc(c[0], c[1], 7.6, 35, P, 24), { tone: "faint" }),
    });
    const bolts = G.dotsOf(facingUp([c[0], c[1], 0]), (Z.knee + Z.kneeTop) / 2, 8.8, 14, P, { fade: [0.04, 0.42] });
    post(`leg${tag}.knee`, c, 8.8, Z.knee, Z.kneeTop - Z.knee, { tone: "mid" }, { region: "legs", extra: Dots(bolts, { size: 0.4 }) });
    post(`leg${tag}.thigh`, c, 9.2, Z.kneeTop, Z.hip - Z.kneeTop, {}, {
      region: "legs",
      inner: Ln(k.sideArc(c[0], c[1], 9.2, 60, P, 24) + k.sideArc(c[0], c[1], 9.2, 74, P, 24), { tone: "faint" }),
    });
  }
}

function trunk() {
  slab("pelvis", PELVIS, Z.hip, Z.waist - Z.hip, {}, {
    steps: 8, bevel: 0.6, region: "abdomen",
    inner: Ln(k.sideSeam(PELVIS, Z.hip + 6, P, 8), { tone: "faint" }),
  });

  /* Waist closure ring with its bolt row. */
  const ring = k.insetPlan(PELVIS, -1);
  const bolts = k.ringOf(k.insetPlan(ring, 0), 8).filter((_, i) => i % 3 === 0).filter(([x, y]) => x * k.towardViewer(P)[0] + (y - CY) * k.towardViewer(P)[1] > 6).map(([x, y]) => at([x, y, Z.waist + 1.5]));
  slab("waist-ring", ring, Z.waist, Z.torso - Z.waist, { tone: "mid" }, { steps: 8, bevel: 0.4, region: "abdomen", extra: Dots(bolts, { size: 0.4 }) });

  /* Core-temperature patch on the brief: a small plate with its lead dot. */
  prism("temp-patch", facingFront([0, PELVIS.y + PELVIS.d, 91]), [[-3.4, -2.6], [3.4, -2.6], [3.4, 2.6], [-3.4, 2.6]], 0, 0.5, { tone: "mid" }, {
    region: "abdomen", part: "temp-patch",
    extra: Dots([at([0, PELVIS.y + PELVIS.d + 0.5, 91])], { size: 0.55, tone: "hi" }),
  });

  slab("torso", TORSO, Z.torso, Z.shoulder - Z.torso, {}, {
    steps: 6, bevel: 0.9, region: "chest",
    extra: Ln(k.planOutline(k.insetPlan(TORSO, 3), Z.shoulder, P, 6), { tone: "faint" }),
  });
}

function pack() {
  const PLSS = { x: -24, y: TORSO.y - 16.5, w: 48, d: 16.5, r: 4 };
  const top = Z.neck;
  slab("pack", PLSS, Z.torso + 1, top - Z.torso - 1, { tone: "mid" }, {
    steps: 5, bevel: 0.7, region: "chest",
    inner: Ln(k.sideSeam(PLSS, top - 6, P, 5), { tone: "faint" }),
    extra: Ln(k.planOutline(k.insetPlan(PLSS, 2), top, P, 5), { tone: "faint" })
      + Dots(k.dotGrid(PLSS.x + 6, PLSS.y + 4, 6, 3, 2.2, top, P), { size: 0.4, tone: "lo" }),
  });
  /* Antenna: collar, mast and tip. */
  const a = [16, PLSS.y + 6];
  post("pack.antenna-collar", a, 1.9, top, 1.2, { tone: "mid" });
  post("pack.antenna", a, 0.8, top + 1.2, 14, { tone: "mid", crease: "none" });
  ball("pack.antenna-tip", [a[0], a[1], top + 15.2 + Math.sqrt(1.4 ** 2 - 0.8 ** 2)], 1.4, { tone: "mid" });
}

function chestUnit() {
  const front = DCM.y + DCM.d, s = DCM_SCREEN;
  const screen = loop([[s.x, front, s.z], [s.x + s.w, front, s.z], [s.x + s.w, front, s.z + s.h], [s.x, front, s.z + s.h]]);
  slab("dcm", DCM, DCM.z, DCM.h, { tone: "mid" }, {
    steps: 3, bevel: 0.4, region: "chest", part: "dcm",
    extra: `<path class="twin-screen" d="${screen}"/>` + Ln(screen, { tone: "lo" })
      + Dots([[-6.9, DCM.z + 1.3], [6.9, DCM.z + 1.3]].map(([x, z]) => at([x, front, z])), { size: 0.38 }),
  });
  for (const x of [-6.9, 6.9]) {
    const F = facingFront([x, front, DCM.z + 5.4]);
    disc("dcm.knob", F, 0, 1, 0.95, { tone: "mid" }, { region: "chest", extra: Ln(G.circleOf(F, 1, 0.45, P, 12), { tone: "lo" }) });
  }

  /* Two hoses from the display's sides down to the waist connectors. They bend in the chest plane, which faces the viewer. */
  for (const side of [-1, 1]) {
    const tag = side > 0 ? "L" : "R";
    const block = { x: side > 0 ? 11.5 : -15.5, y: PELVIS.y + PELVIS.d, w: 4, d: 5.5, r: 0.8 };
    slab(`hose${tag}.block`, block, 93, 5.4, { tone: "mid" }, { steps: 2, bevel: 0.3, region: "abdomen" });
    hose(`hose${tag}`, [[side * 8, CHEST_Y + 2.5, 107], [side * 13.5, CHEST_Y + 2.5, 107], [side * 13.5, CHEST_Y + 2.5, 98.4]], 1.2, { mat: "rubber", region: "chest" });
  }
}

function arm(side) {
  const tag = side > 0 ? "L" : "R", region = `arm${tag}`;
  const S0 = [side * 30.5, CY, 135];
  const dU = unit([side * 0.3, 0.08, -1]), dF = unit([side * 0.04, 0.4, -1]);
  const E = along(S0, dU, 29);
  const FU = G.frameAlong(S0, dU), u0 = Math.sqrt(7.5 ** 2 - 6.2 ** 2), u1 = 29 - Math.sqrt(7 ** 2 - 6.2 ** 2);
  const FF = G.frameAlong(E, dF), f0 = Math.sqrt(7 ** 2 - 5.8 ** 2);
  /* Ball joints. Each limb's rim lands on its ball; the flats tell the audit where. */
  ball(`${region}.shoulder`, S0, 7.5, { tone: "mid" }, { region, flats: [[...dU, u0]] });
  ball(`${region}.elbow`, E, 7, { tone: "mid" }, { region, flats: [[...G.mul3(dU, -1), 29 - u1], [...dF, f0]] });

  /* Upper arm. The left arm carries the blood-pressure cuff. */
  if (side > 0) {
    disc(`${region}.upper-a`, FU, u0, 9, 6.2, {}, { region });
    disc("bp-cuff", FU, 9, 18, 7.1, { tone: "mid" }, {
      region, part: "bp-cuff",
      inner: Ln(G.arcOf(FU, 10.4, 7.1, P) + G.arcOf(FU, 16.6, 7.1, P), { tone: "faint" }),
    });
    disc(`${region}.upper-b`, FU, 18, u1, 6.2, {}, { region });
  } else {
    disc(`${region}.upper`, FU, u0, u1, 6.2, {}, { region, inner: Ln(G.arcOf(FU, 13, 6.2, P), { tone: "faint" }) });
  }

  /* Forearm, wrist bearing and glove. */
  disc(`${region}.forearm`, FF, f0, 24, 5.8, {}, { region, inner: Ln(G.arcOf(FF, 19, 5.8, P), { tone: "faint" }) });
  const bolts = G.dotsOf(FF, 25.25, 6.6, 12, P, { fade: [0.04, 0.42] });
  disc(`${region}.wrist`, FF, 24, 26.5, 6.6, { tone: "mid" }, { region, extra: Dots(bolts, { size: 0.38 }) });

  const g0 = 26.5, gc = 32, ga = 11.2, gr = 6.2, g1 = gc + ga;
  const radius = (s) => gr * Math.sqrt(Math.max(0, 1 - ((s - gc) / ga) ** 2));
  const slope = (s) => (-gr * (s - gc)) / (ga * ga) / Math.max(0.04, Math.sqrt(Math.max(0, 1 - ((s - gc) / ga) ** 2)));
  const profile = Array.from({ length: 19 }, (_, i) => { const s = g0 + ((g1 - g0) * i) / 18; return [s, radius(s), 1]; });
  profile[profile.length - 1] = [g1, 0, 1];
  turned(`glove${tag}`, FF, profile, {}, {
    radius, slope, mat: "rubber", region: `hand${tag}`,
    inner: Ln(G.arcOf(FF, 34.5, radius(34.5), P, { slope: slope(34.5) }), { tone: "faint" }),
  });
  return { tip: along(E, dF, 37), cuff: along(S0, dU, 13.5), dU };
}

function helmet() {
  const { centre: c, r } = HELMET;
  const neckBolts = G.dotsOf(facingUp([0, CY, 0]), Z.shoulder + 2, 11.5, 16, P, { fade: [0.04, 0.42] });
  const dome = ball("helmet", c, r, {}, {
    region: "head", part: "helmet", flats: [[0, 0, -1, c[2] - Z.neck]],
    extra: (() => {
      /* Visor: the cap of the sphere that faces forward, with a rim and one glint. */
      const F = G.frameAlong(c, unit([0.12, 1, 0.1]));
      const s = 11.5, vr = Math.sqrt(r * r - s * s);
      const d = G.circleOf(F, s, vr, P, 64);
      const glint = G.arcOf(F, 14.6, Math.sqrt(r * r - 14.6 ** 2), P, { least: -1, from: 2.2, to: 3.3 });
      return `<path class="twin-visor" d="${d}"/>` + Ln(d, { tone: "hi" }) + `<path class="twin-glint" d="${glint}"/>`;
    })(),
  });
  post("neck-ring", [0, CY], 11.5, Z.shoulder, Z.neck - Z.shoulder, { tone: "mid" }, { region: "head", extra: Dots(neckBolts, { size: 0.4 }) });
  for (const side of [-1, 1]) {
    const F = facingSide(c, side), s0 = Math.sqrt(r * r - 16);
    disc("helmet.ear", F, s0, s0 + 2.4, 4, { tone: "mid" }, { region: "head", seat: dome, extra: G.dot3(F.a, V) > 0.15 ? Ln(G.circleOf(F, s0 + 2.4, 2.2, P, 16), { tone: "lo" }) : "" });
  }
}

/** Builds the astronaut and returns the world points the dashboard links to. */
export function buildSuit() {
  boots();
  legs();
  trunk();
  pack();
  chestUnit();
  const right = arm(-1), left = arm(1);
  helmet();
  return {
    anchors: {
      hrv: [0, CY + 15.5, HELMET.centre[2] + 4],          // helmet
      spo2: right.tip,                                    // right glove
      bp: G.add3(left.cuff, [3, 5.5, 0]),                 // cuff on the left upper arm
      temp: [0, PELVIS.y + PELVIS.d + 0.5, 91],           // patch on the brief
    },
  };
}
