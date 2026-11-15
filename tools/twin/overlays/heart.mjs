/**
 * overlays/heart.mjs · Geometry for the heart-rate overlay.
 *
 * Two halves:
 *  - buildThoraxPort(): the round view port bolted to the chest. It is part of the suit and always drawn.
 *  - heartOverlay():    what the port shows when it opens (cavity, ribs, lungs in outline, vessels, heart),
 *                       plus the numbers the live code needs to animate it. Drawn above the suit, clipped to the opening.
 *
 * A new metric overlay is one more file like this one, registered in build.mjs. A chest overlay
 * (respiration, for example) can reuse this port and cavity and add its own parts inside.
 */
import { k, G, P, KS, at, S, Ln, Dots, disc, facingFront, planeMatrix } from "../scene.mjs";
import { tubePieces, tubeSvg } from "../kit/tube.mjs";
import { CHEST_Y } from "../suit.mjs";

export const PORT = { centre: [0.5, CHEST_Y, 127], bezel: 13.3, opening: 11.6, face: 1.2, depth: 3.6 };

const F = facingFront(PORT.centre);
const faceCentre = [PORT.centre[0], CHEST_Y + PORT.face, PORT.centre[2]];
const onBezel = (deg) => {
  const r = (PORT.bezel + PORT.opening) / 2, a = (deg * Math.PI) / 180;
  return [faceCentre[0] + r * Math.cos(a), faceCentre[1], faceCentre[2] + r * Math.sin(a)];
};

export function buildThoraxPort() {
  const { bezel, opening, face } = PORT;
  const bolts = G.dotsOf(F, face, (bezel + opening) / 2, 14, P, { all: true, phase: 0.22 });
  const iris = G.circleOf(F, face, opening, P, 72);
  disc("thorax-port", F, 0, face, bezel, { tone: "mid" }, {
    region: "chest", part: "thorax-port", bevel: 0.3,
    extra: Dots(bolts, { size: 0.42 })
      + `<g data-part="iris"><path class="twin-iris" d="${iris}"/>`
      + Ln(G.spokesOf(F, face, 2.4, opening, 12, P, { sweep: 0.72 }), { tone: "lo" })
      + Ln(G.circleOf(F, face, 2.4, P, 24), { tone: "mid" }) + `</g>`
      + Ln(iris, { tone: "mid" }),
  });
  /* Where the dashboard's link lines land: on the bezel, so they never cover the window. */
  return { anchors: { hr: onBezel(38), resp: onBezel(180) } };
}

/* The heart's half-section: a round base that tapers to the apex. One analytic curve, so the shading is smooth. */
const HEART = { top: 5.6, length: 15.5, r: 6.8 };
const radius = (s) => (s <= HEART.top
  ? HEART.r * Math.sqrt(Math.max(0, 1 - ((s - HEART.top) / HEART.top) ** 2))
  : HEART.r * (1 - ((s - HEART.top) / (HEART.length - HEART.top)) ** 1.8));
const slope = (s) => (s <= HEART.top
  ? (-HEART.r * (s - HEART.top)) / HEART.top ** 2 / Math.max(0.05, Math.sqrt(Math.max(0, 1 - ((s - HEART.top) / HEART.top) ** 2)))
  : (-HEART.r * 1.8 * ((s - HEART.top) / (HEART.length - HEART.top)) ** 0.8) / (HEART.length - HEART.top));

export function heartOverlay() {
  const { opening, face, depth } = PORT;
  const back = face - depth, [px, , pz] = PORT.centre;
  const onWall = (u, v) => at([px + u, CHEST_Y + back, pz + v]);

  /* Cavity: the back wall sits `depth` behind the face. Ribs bow across it and end on its outline;
     the two lungs are closed outlines, unlit, there to place the heart. */
  const wall = G.circleOf(F, back, opening, P, 72);
  const ribs = [-7.4, -3.7, 0, 3.7, 7.4].map((v) => {
    const half = Math.sqrt(opening ** 2 - v ** 2);
    return k.pathOf(Array.from({ length: 15 }, (_, i) => { const u = -half + (2 * half * i) / 14; return onWall(u, v + 1.1 * (1 - (u / half) ** 2)); }));
  }).join("");
  const lung = (side) => k.pathOf(Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * Math.PI * 2; return onWall(side * 6 + 3.2 * Math.cos(a), 0.6 + 6.3 * Math.sin(a) - 0.9 * Math.cos(a) * side); }), true);
  const lungs = lung(-1) + lung(1);
  const cavity = `<path class="twin-cavity" d="${G.circleOf(F, face, opening + 0.5, P, 72)}"/>`
    + `<path class="twin-cavity-back" d="${wall}"/>` + Ln(wall, { tone: "faint" }) + Ln(ribs, { tone: "faint" })
    + `<path class="twin-lung" d="${lungs}"/>` + Ln(lungs, { tone: "faint" });

  /* Heart: base up, apex down and to the astronaut's left. Two vessels leave the base. */
  const axis = G.unit3([0.42, 0.1, -1]);
  const middle = [px + 2.4, CHEST_Y + face, pz - 0.4];          // the heart's centre lies in the port's face plane
  const o = G.sub3(middle, G.mul3(axis, 6.4));
  const FH = G.frameAlong(o, axis);
  const profile = Array.from({ length: 27 }, (_, i) => { const s = 0.05 + ((HEART.length - 0.05) * i) / 26; return [s, radius(s), 1]; });
  profile[profile.length - 1] = [HEART.length, 0, 1];
  const groove = HEART.top + 0.6;
  const body = S(G.solidOf(profile, FH, P, { smooth: { slope, radius } }), {
    tone: "hi", lit: true,
    inner: Ln(G.arcOf(FH, groove, radius(groove), P, { slope: slope(groove) }), { tone: "lit" }),
  });
  const vessel = (points, r) => tubePieces(G.fillet(points, 2.4 * r, 9), r, P, { maxLength: 60, caps: false })
    .map((piece) => tubeSvg(piece, { tone: "hi" })).join("");
  const up = (dx, dy, dz) => [o[0] + dx, o[1] + dy, o[2] + dz];
  const vessels = vessel([up(0.6, 0, 1.4), up(1, 0, 6.2), up(-4.2, 0, 9.8), up(-11, 0, 8)], 1.9)
    + vessel([up(3.4, 0.6, 1), up(4.9, 0.6, 5), up(12.5, 0.6, 7.2)], 1.5);

  return {
    cavity,
    heart: vessels + body,
    /* Flat (u, v) units on the port face: u to the astronaut's left, v down. */
    plane: planeMatrix(faceCentre, [1, 0, 0], [0, 0, -1]),
    opening,
    bezel: PORT.bezel,
    centre: at(middle),
    port: at(faceCentre),
    glow: PORT.bezel * KS * 1.25,
  };
}
