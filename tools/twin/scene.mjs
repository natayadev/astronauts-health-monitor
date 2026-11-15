/**
 * scene.mjs · Camera, recorder and drawing helpers shared by every geometry module.
 *
 * World: x = astronaut's left (screen right), y = forward (toward the viewer), z = up.
 * Units are centimetres. Every helper draws a part AND records its true shape, so the
 * audit (node tools/twin/build.mjs --audit) checks exactly what is drawn.
 */
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as A from "./kit/audit.mjs";
import { tubePieces, tubeSvg } from "./kit/tube.mjs";

export { k, G, A };

export const WIDTH = 600;
export const HEIGHT = 760;

/* Everything the camera must fit: the base plate and the top of the helmet. */
export const PLATE = { x: -47, y: -45, w: 109, d: 71, r: 10 };
export const PLATE_H = 8;
export const FOOT_H = 5;
const EXTREMES = [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, -7, 181], [38, -36, 160]];

export const P = k.fitProjection(EXTREMES, WIDTH, HEIGHT, { pad: 30, azimuth: 60 });
export const V = G.viewOf(P);
export const KS = G.scaleOf(P);

export const R = A.recorder(P);
export const record = R.solid;

export const at = (point) => k.iso(point, P);
export const S = (paths, style) => k.solidSvg(paths, style);
export const Ln = (d, style) => k.lineSvg(d, style);
export const Dots = (points, style) => k.dotsSvg(points, style);

/* A material is a token set (see twin.css): "rubber" for boots, gloves and hoses. */
const wrap = (svg, { mat, region, part }) => {
  const attrs = [mat ? `class="twin-mat-${mat}"` : "", region ? `data-region="${region}"` : "", part ? `data-part="${part}"` : ""].filter(Boolean).join(" ");
  return attrs ? `<g ${attrs}>${svg}</g>` : svg;
};

export function put(name, ref, svg, { bias = 0, shapes = [], mat, region, part, route, chunk } = {}) {
  R.put({ piece: "twin", at: ref, bias, svg: wrap(svg, { mat, region, part }), shapes, name: R.nameFor(name), route, chunk });
}

/* A rim that lands on a ball (or a ring under a ball) is sunk into it by design: say so to the audit. */
const seated = (seat) => (seat ? { seated: true, cut: seat } : {});

/* A rounded box standing on a level. */
export function slab(name, plan, z, h, style = {}, { steps = 5, bevel = 0.5, extra = "", inner = "", ...rest } = {}) {
  const shape = record(A.slab(plan, z, h, { name }, steps));
  put(name, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "hi", ...style, inner }) + extra, { shapes: [shape], ...rest });
  return shape;
}

/* An upright cylinder. */
export function post(name, [cx, cy], r, z, h, style = {}, { steps, bevel = 0, extra = "", inner = "", seat, ...rest } = {}) {
  const shape = record(A.cylinder(cx, cy, r, z, h, { name, ...seated(seat) }));
  put(name, [cx, cy, z + h / 2], S(k.cylinder(cx, cy, r, z, h, P, steps ?? G.stepsFor(r, 20, 96, KS), bevel), { tone: "hi", ...style, inner }) + extra, { shapes: [shape], ...rest });
  return shape;
}

/* A short cylinder on any axis: bearings, bezels, cuffs, flanges. */
export function disc(name, F, s0, s1, r, style = {}, { extra = "", inner = "", bevel = 0, owner, seat, ...rest } = {}) {
  const shape = record(A.disc(F, s0, s1, r, { name, owner, ...seated(seat) }));
  put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.disc(s0, s1, r, F, P, { bevel }), { tone: "hi", ...style, inner }) + extra, { shapes: [shape], ...rest });
  return shape;
}

/* A turned part from its half-section. Pass radius + slope for an analytic curve. */
export function turned(name, F, profile, style = {}, { extra = "", inner = "", radius, slope, seat, ...rest } = {}) {
  const smooth = slope ? { slope, ...(radius ? { radius } : {}) } : undefined;
  const shape = record(A.solid(F, profile, { name, ...(radius ? { radius } : {}), ...seated(seat) }));
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(G.solidOf(profile, F, P, smooth ? { smooth } : {}), { tone: "hi", ...style, inner }) + extra, { shapes: [shape], ...rest });
  return shape;
}

/* `flats` are the planes where a limb meets the ball: [nx, ny, nz, d] keeps n·(p − centre) ≤ d.
   The cap beyond each flat lies inside the limb that lands there, so the two never interlock. */
export function ball(name, centre, r, style = {}, { extra = "", flats, ...rest } = {}) {
  const shape = record(A.ball(centre, r, { name, ...(flats ? { flats } : {}) }));
  put(name, centre, S(G.sphereOf(centre, r, P, { steps: G.stepsFor(r, 32, 96, KS) }), { tone: "hi", ...style }) + extra, { shapes: [shape], ...rest });
  return shape;
}

/* A flat plate or block on a face: a polygon in the frame's u,v plane, extruded along its axis. */
export function prism(name, F, polygon, s0, s1, style = {}, { extra = "", ...rest } = {}) {
  const shape = record(A.prism(F, polygon, s0, s1, { name }));
  put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.prismOf(F, polygon, s0, s1, P), { tone: "hi", ...style }) + extra, { shapes: [shape], ...rest });
  return shape;
}

/* A hose between two real ports, with a flange on each end whose back face sits on the port. */
export function hose(name, control, r, { bend = 2.6, flangeR = 1.6, flangeT = 1, tone = "hi", ...rest } = {}) {
  const route = G.fillet(control, bend * r, 9, { P, tube: r });
  const total = G.pathLength(route);
  const gaps = [[0, flangeT], [total - flangeT, total]];
  R.route(name, route, r, { owner: name, gaps, piece: "twin", rims: [r * flangeR, r * flangeR] });
  tubePieces(route, r, P, { maxLength: 9, spacing: 0.8, gaps }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), { shapes: [A.tube(piece.points, piece.radii)], route: name, chunk: index, ...rest }),
  );
  [0, total].forEach((where, index) => {
    const end = G.pointAlong(route, where);
    const tangent = G.tangentAlong(route, where);
    const F = G.frameAlong(G.add3(end, G.mul3(tangent, index ? -flangeT / 2 : flangeT / 2)), tangent);
    disc(`${name}.flange${index}`, F, -flangeT / 2, flangeT / 2, r * flangeR, { tone }, { owner: name, bias: 0.05, ...rest });
  });
  return route;
}

/* Frames used all over: a face looking forward (+y), up (+z) or sideways (±x). */
export const facingFront = (o) => G.frameOf(o, [0, 1, 0], [1, 0, 0], [0, 0, 1]);
export const facingUp = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);
export const facingSide = (o, sign = 1) => G.frameOf(o, [sign, 0, 0], [0, 1, 0], [0, 0, 1]);

/* A closed outline through world points (slots, windows, panels on any face). */
export const loop = (points) => k.pathOf(points.map(at), true);

/* The transform that maps flat (u, v) units onto a plane through `o` spanned by world directions du, dv. */
export function planeMatrix(o, du, dv) {
  const [ox, oy] = at(o);
  const [ux, uy] = at(G.add3(o, du));
  const [vx, vy] = at(G.add3(o, dv));
  const f = (n) => +n.toFixed(4);
  return `matrix(${f(ux - ox)} ${f(uy - oy)} ${f(vx - ox)} ${f(vy - oy)} ${f(ox)} ${f(oy)})`;
}

export const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
