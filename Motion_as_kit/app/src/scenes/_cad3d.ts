// A small 3D renderer for Canvas2D, for CAD-style plates (the text-to-cad episodes).
//  - Geometry is built from extruded 2D profiles (with holes), in millimetres, Z up.
//  - drawParts projects every object through one perspective View, shades each face flat (key light from
//    the camera's upper left, a little sky from above), sorts all faces far to near, and draws the edges a
//    CAD viewport shows: the profile's sharp edges plus the silhouette of smooth ones.
//  - Two looks: 'shaded' (a dark CAD viewport) and 'line' (white parts with black outlines, for manuals).
// Everything is a pure function of its inputs, so parts can be rebuilt every frame (a growing print, a
// parameter that changes from 40 to 60).
import { setWorld, type Cam } from './_vo';

export type V3 = [number, number, number];
export type P2 = [number, number];

export interface Face {
  /** outer loop, counter-clockwise seen from outside */
  p: V3[];
  /** inner loops (filled even-odd) */
  holes?: V3[][];
  /** per outer edge: always drawn */
  sharp?: boolean[];
  /** per outer edge: index of the neighbouring face in the same mesh (the edge is drawn on the silhouette) */
  nb?: number[];
  /** overrides the object's colour */
  col?: string;
  /** a cap that is the top of an extrusion (for the hot layer of a print) */
  top?: boolean;
}

// ------------------------------------------------------------------ vectors
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function newell(p: V3[]): V3 {
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!, b = p[(i + 1) % p.length]!;
    x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm([x, y, z]);
}
function centroid(p: V3[]): V3 {
  let x = 0, y = 0, z = 0;
  for (const q of p) { x += q[0]; y += q[1]; z += q[2]; }
  return [x / p.length, y / p.length, z / p.length];
}

// ------------------------------------------------------------------ 2D profiles
export function area2(p: P2[]) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i]!, b = p[(i + 1) % p.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return s / 2;
}
export function circle(r: number, n = 40, cx = 0, cy = 0, a0 = 0): P2[] {
  return Array.from({ length: n }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as P2; });
}
export function rect(w: number, h: number, cx = 0, cy = 0): P2[] {
  return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
}
export function roundRect(w: number, h: number, r: number, cx = 0, cy = 0, n = 5): P2[] {
  const out: P2[] = [];
  const cs: [number, number, number][] = [[w / 2 - r, -h / 2 + r, -Math.PI / 2], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI]];
  for (const [x, y, a0] of cs) for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); out.push([cx + x + r * Math.cos(a), cy + y + r * Math.sin(a)]); }
  return out;
}
/** A spur gear outline: `teeth` trapezoid teeth between root radius r0 and tip radius r1. */
export function gearProfile(teeth: number, r0: number, r1: number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2, d = (Math.PI * 2) / teeth;
    for (const [f, r] of [[0, r0], [0.18, r0], [0.32, r1], [0.58, r1], [0.72, r0]] as [number, number][]) out.push([r * Math.cos(a + f * d), r * Math.sin(a + f * d)]);
  }
  return out;
}

// ------------------------------------------------------------------ extrusion
export type Plane = 'xy' | 'xz' | 'yz';
/** Map profile (u, v) and depth w into 3D, keeping right-handedness so CCW profiles get outward normals. */
function mapper(plane: Plane): (u: number, v: number, w: number) => V3 {
  if (plane === 'xy') return (u, v, w) => [u, v, w];
  if (plane === 'xz') return (u, v, w) => [u, -w, v];
  return (u, v, w) => [w, u, v];
}
/**
 * Extrude a profile (and its holes) by h along the plane's normal, from w0. Plane 'xy' extrudes up the Z axis,
 * 'xz' stands the profile up (its v is Z) and extrudes it towards -Y, 'yz' extrudes it along +X.
 */
export function extrude(outer: P2[], holes: P2[][], h: number, o: { plane?: Plane; w0?: number; col?: string; sharpDeg?: number; capCol?: string } = {}): Face[] {
  const M = mapper(o.plane ?? 'xy');
  const w0 = o.w0 ?? 0, w1 = w0 + h;
  const sharpCos = Math.cos(((o.sharpDeg ?? 28) * Math.PI) / 180);
  const out = area2(outer) < 0 ? [...outer].reverse() : outer;
  const hs = holes.map((hl) => (area2(hl) > 0 ? [...hl].reverse() : hl)); // holes run clockwise
  const faces: Face[] = [];
  const at = (q: P2, w: number) => M(q[0], q[1], w);
  // caps
  faces.push({ p: out.map((q) => at(q, w1)), holes: hs.map((hl) => hl.map((q) => at(q, w1))), sharp: out.map(() => true), col: o.capCol ?? o.col, top: true });
  faces.push({ p: [...out].reverse().map((q) => at(q, w0)), holes: hs.map((hl) => hl.map((q) => at(q, w0))), sharp: out.map(() => true), col: o.capCol ?? o.col });
  // walls, one loop at a time
  for (const loop of [out, ...hs]) {
    const n = loop.length, base = faces.length;
    const sharpAt = (i: number) => {
      const a = loop[(i - 1 + n) % n]!, b = loop[i]!, c = loop[(i + 1) % n]!;
      const d1 = [b[0] - a[0], b[1] - a[1]], d2 = [c[0] - b[0], c[1] - b[1]];
      const l = Math.hypot(d1[0]!, d1[1]!) * Math.hypot(d2[0]!, d2[1]!) || 1;
      return (d1[0]! * d2[0]! + d1[1]! * d2[1]!) / l < sharpCos;
    };
    for (let i = 0; i < n; i++) {
      const a = loop[i]!, b = loop[(i + 1) % n]!;
      faces.push({
        p: [at(a, w0), at(b, w0), at(b, w1), at(a, w1)],
        sharp: [true, sharpAt((i + 1) % n), true, sharpAt(i)],
        nb: [-1, base + ((i + 1) % n), -1, base + ((i - 1 + n) % n)],
        col: o.col,
      });
    }
  }
  return faces;
}

// ------------------------------------------------------------------ transforms
export interface Xf { at?: V3; rx?: number; ry?: number; rz?: number; s?: number }
export function xpt(p: V3, x: Xf): V3 {
  const s = x.s ?? 1;
  let [a, b, c] = [p[0] * s, p[1] * s, p[2] * s];
  if (x.rx) { const co = Math.cos(x.rx), si = Math.sin(x.rx); [b, c] = [b * co - c * si, b * si + c * co]; }
  if (x.ry) { const co = Math.cos(x.ry), si = Math.sin(x.ry); [a, c] = [a * co + c * si, -a * si + c * co]; }
  if (x.rz) { const co = Math.cos(x.rz), si = Math.sin(x.rz); [a, b] = [a * co - b * si, a * si + b * co]; }
  const t = x.at ?? [0, 0, 0];
  return [a + t[0], b + t[1], c + t[2]];
}
/** Transform a mesh (keeps face order, so neighbour indices stay valid). */
export function xform(faces: Face[], x: Xf): Face[] {
  return faces.map((f) => ({ ...f, p: f.p.map((q) => xpt(q, x)), holes: f.holes?.map((hl) => hl.map((q) => xpt(q, x))) }));
}
/** Join meshes into one, re-basing neighbour indices. */
export function join(...meshes: Face[][]): Face[] {
  const out: Face[] = [];
  for (const m of meshes) { const base = out.length; for (const f of m) out.push({ ...f, nb: f.nb?.map((k) => (k < 0 ? k : k + base)) }); }
  return out;
}
export function recolor(faces: Face[], col: string): Face[] { return faces.map((f) => ({ ...f, col })); }

// ------------------------------------------------------------------ the view
export interface View {
  /** orbit angle around Z (radians), 0 = looking along +Y */
  yaw: number;
  /** elevation (radians) */
  pitch: number;
  /** camera distance (mm) */
  dist: number;
  /** the point the camera looks at */
  target?: V3;
  /** pixels per mm at the target */
  s: number;
}
export interface Proj { cam: V3; right: V3; up: V3; fwd: V3; dist: number; s: number; light: V3 }
export function proj(v: View): Proj {
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
  const t = v.target ?? [0, 0, 0];
  const d: V3 = [cp * sy, -cp * cy, sp];
  const cam: V3 = [t[0] + d[0] * v.dist, t[1] + d[1] * v.dist, t[2] + d[2] * v.dist];
  const fwd: V3 = [-d[0], -d[1], -d[2]];
  const right: V3 = [cy, sy, 0];
  const up: V3 = [-sy * sp, cy * sp, cp];
  const light = norm([-0.45 * right[0] + 0.75 * up[0] - 0.5 * fwd[0], -0.45 * right[1] + 0.75 * up[1] - 0.5 * fwd[1], -0.45 * right[2] + 0.75 * up[2] - 0.5 * fwd[2]]);
  return { cam, right, up, fwd, dist: v.dist, s: v.s, light };
}
/** Screen position (px from the viewport centre) and depth of a 3D point. */
export function project(P: Proj, p: V3): [number, number, number] {
  const r = sub(p, P.cam);
  const z = Math.max(1e-3, dot(r, P.fwd));
  const k = (P.dist / z) * P.s;
  return [dot(r, P.right) * k, -dot(r, P.up) * k, z];
}

// ------------------------------------------------------------------ drawing
export type Look = 'shaded' | 'line';
export interface Obj {
  mesh: Face[];
  xf?: Xf;
  col?: string;
  a?: number;
  /** 0 = solid, 1 = edges only (ghost) */
  wire?: number;
  /** colour a face by its centre and normal (heat maps); null keeps the normal colour */
  paint?: (c: V3, n: V3, f: Face) => string | null;
  /** 0..1 glow on top caps (the layer being printed) */
  hot?: number;
  edge?: string;
}
export interface DrawOpts { look?: Look; grid?: number; gridStep?: number; shadow?: number; edgeW?: number; a?: number; cull?: boolean }

const rgbCache = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let v = rgbCache.get(hex);
  if (!v) { const h = hex.replace('#', ''); v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; rgbCache.set(hex, v); }
  return v;
}
function shadeCol(hex: string, k: number, look: Look, rim: number) {
  const [r, g, b] = rgb(hex);
  if (look === 'line') {
    const base = Math.round(255 * (0.8 + 0.2 * k));
    const mix = (c: number) => Math.round(base * 0.85 + c * 0.15 * (0.75 + 0.25 * k));
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
  }
  const f = (c: number) => Math.min(255, Math.round(c * k + 255 * 0.22 * rim));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/**
 * Draw objects through a view, as a viewport centred at world (x, y) of the plate camera.
 * Returns the projector so callers can anchor 2D overlays (dimensions, labels) to 3D points.
 */
export function drawParts(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, view: View, objs: Obj[], o: DrawOpts = {}): Proj {
  const P = proj(view);
  const look = o.look ?? 'shaded';
  setWorld(ctx, c, x, y, 1, 0);
  const A = o.a ?? 1;
  if (o.grid) drawGrid(ctx, P, o.grid, o.gridStep ?? 10, look, A);
  // soft contact shadows on the floor
  if ((o.shadow ?? 1) > 0) {
    for (const ob of objs) {
      if ((ob.a ?? 1) <= 0.01 || (ob.wire ?? 0) >= 1) continue;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const f of ob.mesh) for (const q of f.p) { const p = ob.xf ? xpt(q, ob.xf) : q; if (p[2] > 2) continue; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      if (!isFinite(x0)) continue;
      const pad = 6;
      const pts = [[x0 - pad, y0 - pad], [x1 + pad, y0 - pad], [x1 + pad, y1 + pad], [x0 - pad, y1 + pad]].map(([a, b]) => project(P, [a!, b!, 0]));
      ctx.save();
      ctx.filter = 'blur(14px)';
      ctx.globalAlpha = A * (ob.a ?? 1) * (o.shadow ?? 1) * (look === 'line' ? 0.12 : 0.5);
      ctx.fillStyle = '#000';
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  // faces of every object, sorted far to near
  interface Item { ob: Obj; f: Face; n: V3; depth: number; front: boolean; fr: boolean[]; pts: [number, number, number][]; holes: [number, number, number][][] }
  const items: Item[] = [];
  for (const ob of objs) {
    if ((ob.a ?? 1) <= 0.003) continue;
    const faces = ob.xf ? xform(ob.mesh, ob.xf) : ob.mesh;
    const ns = faces.map((f) => newell(f.p));
    const fronts = faces.map((f, i) => dot(ns[i]!, sub(P.cam, centroid(f.p))) > 0);
    faces.forEach((f, i) => {
      const pts = f.p.map((q) => project(P, q));
      const depth = pts.reduce((s, q) => s + q[2], 0) / pts.length;
      items.push({ ob, f, n: ns[i]!, depth, front: fronts[i]!, fr: fronts, pts, holes: (f.holes ?? []).map((hl) => hl.map((q) => project(P, q))) });
    });
  }
  items.sort((a, b) => b.depth - a.depth);
  const ew = o.edgeW ?? (look === 'line' ? 3.2 : 1.6);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const it of items) {
    const { ob, f } = it;
    const wire = ob.wire ?? 0;
    if (!it.front && (o.cull ?? true) && wire < 0.5) continue;
    const a = A * (ob.a ?? 1);
    const path = () => {
      ctx.beginPath();
      it.pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
      for (const hl of it.holes) { hl.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); }
    };
    if (wire < 1 && it.front) {
      const d = Math.max(0, dot(it.n, P.light));
      const k = 0.36 + 0.56 * d + 0.12 * Math.max(0, it.n[2]);
      const rim = Math.pow(1 - Math.abs(dot(it.n, P.fwd)), 3);
      const painted = ob.paint?.(centroid(f.p), it.n, f) ?? null;
      let col = shadeCol(painted ?? f.col ?? ob.col ?? '#9AA7B8', k, look, look === 'line' ? 0 : rim);
      ctx.globalAlpha = a * (1 - wire);
      ctx.fillStyle = col; path(); ctx.fill('evenodd');
      if (f.top && (ob.hot ?? 0) > 0) {
        ctx.globalAlpha = a * (ob.hot ?? 0);
        ctx.fillStyle = 'rgba(255,122,26,0.85)'; path(); ctx.fill('evenodd');
        col = '#FF7A1A';
      }
    }
    // edges: sharp ones, plus the silhouette of smooth ones
    ctx.globalAlpha = a * (it.front ? 1 : 0.35 * wire);
    ctx.strokeStyle = ob.edge ?? (look === 'line' ? '#111111' : wire > 0.5 ? '#6FB1FF' : 'rgba(5,8,12,0.9)');
    ctx.lineWidth = ew;
    ctx.beginPath();
    const n = it.pts.length;
    for (let i = 0; i < n; i++) {
      const nbi = f.nb?.[i] ?? -1;
      const draw = (f.sharp?.[i] ?? true) || (nbi >= 0 && it.fr[nbi] !== it.front);
      if (!draw) continue;
      const p0 = it.pts[i]!, p1 = it.pts[(i + 1) % n]!;
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
    }
    for (const hl of it.holes) { hl.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); }
    ctx.stroke();
    if (f.top && (ob.hot ?? 0) > 0 && it.front) {
      ctx.globalAlpha = a * (ob.hot ?? 0);
      ctx.strokeStyle = '#FFB070'; ctx.lineWidth = ew * 2; ctx.shadowColor = 'rgba(255,122,26,0.9)'; ctx.shadowBlur = 16;
      path(); ctx.stroke(); ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return P;
}

/** The floor grid (z = 0) around the target, fading out with distance; X axis red, Y axis green. */
export function drawGrid(ctx: CanvasRenderingContext2D, P: Proj, size: number, step: number, look: Look, a = 1) {
  const n = Math.ceil(size / step);
  const seg = (p: V3, q: V3, col: string, w: number, al: number) => {
    let A = sub(p, P.cam), B = sub(q, P.cam);
    let za = dot(A, P.fwd), zb = dot(B, P.fwd);
    const near = 20;
    if (za < near && zb < near) return;
    if (za < near) { const k = (near - za) / (zb - za); p = [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, 0]; A = sub(p, P.cam); za = near; }
    if (zb < near) { const k = (near - zb) / (za - zb); q = [q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k, 0]; B = sub(q, P.cam); zb = near; }
    const s0 = project(P, p), s1 = project(P, q);
    ctx.globalAlpha = a * al; ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
  };
  const minor = look === 'line' ? '#BDBDBD' : '#3A4556', major = look === 'line' ? '#9E9E9E' : '#566378';
  for (let i = -n; i <= n; i++) {
    const v = i * step, fade = 1 - Math.abs(i) / (n + 1);
    const isMajor = i % 5 === 0;
    seg([v, -size, 0], [v, size, 0], isMajor ? major : minor, isMajor ? 1.4 : 1, (isMajor ? 0.8 : 0.5) * fade);
    seg([-size, v, 0], [size, v, 0], isMajor ? major : minor, isMajor ? 1.4 : 1, (isMajor ? 0.8 : 0.5) * fade);
  }
  seg([-size, 0, 0], [size, 0, 0], look === 'line' ? '#7A7A7A' : '#E5484D', 2, 0.75);
  seg([0, -size, 0], [0, size, 0], look === 'line' ? '#7A7A7A' : '#46C26B', 2, 0.75);
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ parts (mm, Z up, resting on z = 0)
/** A phone stand lying on its side, the way it prints: profile in XY, width up Z (`h` of it built so far). */
export function phoneStandPrint(h = 70, col?: string): Face[] {
  const prof: P2[] = [[0, 0], [95, 0], [95, 6], [66, 6], [91, 100], [83, 100], [58, 6], [0, 6]];
  const body = extrude(prof, [], h, { col });
  const lipA = extrude([[0, 6], [6, 6], [6, 22], [0, 22]], [], Math.min(h, 28), { col });
  const lipB = h > 42 ? extrude([[0, 6], [6, 6], [6, 22], [0, 22]], [], h - 42, { col, w0: 42 }) : [];
  return xform(join(body, lipA, lipB), { at: [-47, -50, 0] });
}
/** The same stand upright: the profile stands in XZ, the cable slot is the gap in the front lip. */
export function phoneStand(col?: string): Face[] {
  const prof: P2[] = [[0, 0], [95, 0], [95, 6], [66, 6], [91, 100], [83, 100], [58, 6], [0, 6]];
  const body = extrude(prof, [], 70, { plane: 'xz', col });
  const lip = (w0: number, h: number) => extrude([[0, 6], [6, 6], [6, 22], [0, 22]], [], h, { plane: 'xz', w0, col });
  return xform(join(body, lip(0, 28), lip(42, 28)), { at: [-47, 35, 0] });
}
/** A shelf bracket `w` wide: a wall plate with two screw holes, a shelf arm and a gusset. */
export function wallBracket(w = 40, col?: string, holeCol?: string): Face[] {
  const wall = extrude(rect(w, 60, 0, 30), [circle(3, 28, 0, 16), circle(3, 28, 0, 38)], 5, { plane: 'xz', w0: -5, col, capCol: holeCol ?? col });
  const arm = extrude(rect(w, 50, 0, 25), [], 5, { w0: 55, col });
  const gusset = extrude([[0, 12], [42, 55], [0, 55]], [], 6, { plane: 'yz', w0: -3, col });
  return join(wall, arm, gusset);
}
export function gear(teeth = 18, r = 30, h = 10, col?: string): Face[] {
  const holes = [circle(4.2, 24), ...[0, 1, 2, 3, 4].map((i) => circle(4.5, 20, 15 * Math.cos((i / 5) * Math.PI * 2), 15 * Math.sin((i / 5) * Math.PI * 2)))];
  return extrude(gearProfile(teeth, r - 4, r), holes, h, { col, sharpDeg: 20 });
}
export function screw(col?: string): Face[] {
  const head = extrude(circle(5.2, 6, 0, 0, Math.PI / 6), [circle(1.6, 6)], 4, { w0: 22, col });
  const shank = extrude(circle(2, 20), [], 22, { col });
  const ridges = Array.from({ length: 9 }, (_, i) => extrude(circle(2.45, 20), [], 0.7, { w0: 2 + i * 2.2, col }));
  return join(shank, ...ridges, head);
}
export function bearing(col?: string, shield?: string): Face[] {
  const outer = extrude(circle(11, 40), [circle(8.6, 40)], 7, { col });
  const inner = extrude(circle(5.6, 32), [circle(4, 32)], 7, { col });
  const seal = extrude(circle(8.6, 40), [circle(5.6, 32)], 6.4, { col: shield ?? '#2A3240', w0: 0.3 });
  return join(seal, outer, inner);
}
export function stepper(col?: string, plate?: string): Face[] {
  const prof: P2[] = [[-21, -17], [-17, -21], [17, -21], [21, -17], [21, 17], [17, 21], [-17, 21], [-21, 17]];
  const body = extrude(prof, [], 34, { col });
  const cap = extrude(prof, [circle(1.6, 12, 15.5, 15.5), circle(1.6, 12, -15.5, 15.5), circle(1.6, 12, 15.5, -15.5), circle(1.6, 12, -15.5, -15.5)], 6, { w0: 34, col: plate ?? '#C9CED6' });
  const boss = extrude(circle(11, 32), [], 2, { w0: 40, col: plate ?? '#C9CED6' });
  const shaft = extrude(circle(2.5, 20), [], 22, { w0: 42, col: '#E6E9EE' });
  return join(body, cap, boss, shaft);
}
export function knob(col?: string): Face[] {
  const grip = extrude(gearProfile(30, 15, 16.2), [circle(3, 16)], 16, { col, sharpDeg: 20 });
  const top = extrude(circle(12.5, 40), [], 3, { w0: 16, col });
  const dot2 = extrude(circle(1.6, 12, 0, 8.5), [], 0.6, { w0: 19, col: '#FF7A1A' });
  return join(grip, top, dot2);
}
export function box(w: number, d: number, h: number, o: { at?: V3; col?: string; r?: number } = {}): Face[] {
  const prof = o.r ? roundRect(w, d, o.r) : rect(w, d);
  return xform(extrude(prof, [], h, { col: o.col }), { at: o.at ?? [0, 0, 0] });
}
export function cyl(r: number, h: number, o: { at?: V3; col?: string; n?: number; hole?: number } = {}): Face[] {
  return xform(extrude(circle(r, o.n ?? 32), o.hole ? [circle(o.hole, o.n ?? 32)] : [], h, { col: o.col }), { at: o.at ?? [0, 0, 0] });
}

// ------------------------------------------------------------------ revolved solids and figures
/**
 * Revolve a profile of (radius, z) points, bottom to top, around Z with n segments. Smooth surfaces draw
 * their silhouette only; profile corners sharper than 30 degrees draw as rings.
 */
export function lathe(prof: P2[], n = 16, o: { col?: string } = {}): Face[] {
  const m = prof.length - 1;
  const faces: Face[] = [];
  const at = (k: number, i: number): V3 => { const a = (i / n) * Math.PI * 2, [r, z] = prof[k]!; return [r * Math.cos(a), r * Math.sin(a), z]; };
  const sharpAt = (k: number) => {
    if (k <= 0 || k >= m) return false;
    const a = prof[k - 1]!, b = prof[k]!, c = prof[k + 1]!;
    const d1 = [b[0] - a[0], b[1] - a[1]], d2 = [c[0] - b[0], c[1] - b[1]];
    const l = Math.hypot(d1[0]!, d1[1]!) * Math.hypot(d2[0]!, d2[1]!) || 1;
    return (d1[0]! * d2[0]! + d1[1]! * d2[1]!) / l < Math.cos(Math.PI / 6);
  };
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < m; k++) {
      faces.push({
        p: [at(k, i), at(k, i + 1), at(k + 1, i + 1), at(k + 1, i)],
        sharp: [sharpAt(k), false, sharpAt(k + 1), false],
        nb: [k > 0 ? i * m + k - 1 : -1, ((i + 1) % n) * m + k, k + 1 < m ? i * m + k + 1 : -1, ((i - 1 + n) % n) * m + k],
        col: o.col,
      });
    }
  }
  return faces;
}
export function sphere(c: V3, r: number, o: { col?: string; n?: number } = {}): Face[] {
  const prof: P2[] = Array.from({ length: 7 }, (_, k) => { const a = -Math.PI / 2 + (k / 6) * Math.PI; return [r * Math.cos(a), r * Math.sin(a)] as P2; });
  return xform(lathe(prof, o.n ?? 14, o), { at: c });
}
/** A capsule (a rounded limb) from a to b. */
export function capsule(a: V3, b: V3, r: number, o: { col?: string; n?: number } = {}): Face[] {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(d[0], d[1], d[2]) || 1e-3;
  const prof: P2[] = [];
  for (let k = 0; k <= 3; k++) { const ang = -Math.PI / 2 + (k / 3) * (Math.PI / 2); prof.push([r * Math.cos(ang), r * Math.sin(ang)]); }
  for (let k = 0; k <= 3; k++) { const ang = (k / 3) * (Math.PI / 2); prof.push([r * Math.cos(ang), L + r * Math.sin(ang)]); }
  return xform(lathe(prof, o.n ?? 10, o), { ry: Math.acos(Math.max(-1, Math.min(1, d[2] / L))), rz: Math.atan2(d[1], d[0]), at: a });
}

/** Joint positions of an artist's mannequin (cm, standing on z = 0, facing -Y). */
export type Pose = Record<'head' | 'neck' | 'chest' | 'pelvis' | 'shL' | 'shR' | 'elL' | 'elR' | 'haL' | 'haR' | 'hipL' | 'hipR' | 'knL' | 'knR' | 'ftL' | 'ftR', V3>;
export const POSES: Record<'stand' | 'point' | 'wave' | 'think' | 'walk' | 'reach', Pose> = {
  stand: { head: [0, 0, 166], neck: [0, 0, 151], chest: [0, 0, 136], pelvis: [0, 0, 100], shL: [-19, 0, 145], shR: [19, 0, 145], elL: [-23, 2, 117], elR: [23, 2, 117], haL: [-24, 3, 91], haR: [24, 3, 91], hipL: [-10, 0, 95], hipR: [10, 0, 95], knL: [-11, -3, 51], knR: [11, -3, 51], ftL: [-12, 0, 7], ftR: [12, 0, 7] },
  point: { head: [0, -2, 166], neck: [0, -1, 151], chest: [0, 0, 136], pelvis: [0, 0, 100], shL: [-19, 0, 145], shR: [19, -1, 146], elL: [-23, 2, 117], elR: [26, -22, 140], haL: [-24, 3, 91], haR: [30, -48, 146], hipL: [-10, 0, 95], hipR: [10, 0, 95], knL: [-12, -3, 51], knR: [13, -8, 51], ftL: [-13, 0, 7], ftR: [14, -12, 7] },
  wave: { head: [0, 0, 166], neck: [0, 0, 151], chest: [0, 0, 136], pelvis: [0, 0, 100], shL: [-19, 0, 145], shR: [19, 0, 146], elL: [-23, 2, 117], elR: [36, 0, 160], haL: [-24, 3, 91], haR: [40, -4, 186], hipL: [-10, 0, 95], hipR: [10, 0, 95], knL: [-11, -3, 51], knR: [11, -3, 51], ftL: [-12, 0, 7], ftR: [12, 0, 7] },
  think: { head: [0, -3, 165], neck: [0, -1, 150], chest: [0, 0, 136], pelvis: [0, 0, 100], shL: [-19, 0, 145], shR: [19, 0, 145], elL: [-14, -14, 122], elR: [18, -16, 122], haL: [10, -12, 126], haR: [4, -12, 152], hipL: [-10, 0, 95], hipR: [10, 0, 95], knL: [-11, -3, 51], knR: [11, -3, 51], ftL: [-12, 0, 7], ftR: [12, 0, 7] },
  walk: { head: [0, -4, 165], neck: [0, -3, 150], chest: [0, -2, 136], pelvis: [0, 0, 100], shL: [-19, -2, 145], shR: [19, -2, 145], elL: [-22, 12, 118], elR: [22, -14, 118], haL: [-23, 22, 94], haR: [23, -26, 96], hipL: [-10, 0, 95], hipR: [10, 0, 95], knL: [-11, -18, 54], knR: [11, 10, 50], ftL: [-12, -26, 9], ftR: [12, 24, 12] },
  reach: { head: [0, -6, 164], neck: [0, -4, 150], chest: [0, -2, 136], pelvis: [0, 0, 100], shL: [-19, -2, 145], shR: [19, -2, 145], elL: [-26, -20, 150], elR: [26, -20, 150], haL: [-24, -44, 168], haR: [24, -44, 168], hipL: [-10, 0, 95], hipR: [10, 0, 95], knL: [-11, -3, 51], knR: [11, -3, 51], ftL: [-12, 0, 7], ftR: [12, 0, 7] },
};
export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const out = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((j) => { const p = a[j], q = b[j]; out[j] = [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k]; });
  return out;
}
/** A wooden artist's mannequin in a pose. */
export function mannequin(p: Pose, col = '#C9A27A', joint = '#8E6B4A'): Face[] {
  const c = (a: V3, b: V3, r: number) => capsule(a, b, r, { col });
  return join(
    sphere(p.head, 11, { col }), c(p.neck, p.head, 4.5),
    c(p.pelvis, p.chest, 13), c(p.shL, p.shR, 6.5), c(p.hipL, p.hipR, 8),
    c(p.shL, p.elL, 5), c(p.elL, p.haL, 4.5), sphere(p.haL, 5.5, { col: joint, n: 10 }),
    c(p.shR, p.elR, 5), c(p.elR, p.haR, 4.5), sphere(p.haR, 5.5, { col: joint, n: 10 }),
    c(p.hipL, p.knL, 7), c(p.knL, p.ftL, 5.5), c(p.hipR, p.knR, 7), c(p.knR, p.ftR, 5.5),
    c(p.ftL, [p.ftL[0], p.ftL[1] - 12, p.ftL[2] - 4], 4), c(p.ftR, [p.ftR[0], p.ftR[1] - 12, p.ftR[2] - 4], 4),
    sphere(p.elL, 5.5, { col: joint, n: 10 }), sphere(p.elR, 5.5, { col: joint, n: 10 }), sphere(p.knL, 7, { col: joint, n: 10 }), sphere(p.knR, 7, { col: joint, n: 10 }),
  );
}
/** A film camera on a tripod, lens pointing along -Y, the lens centre at (0, -34, 150). */
export function cameraRig(col = '#2E3138', lens = '#15171B'): Face[] {
  const body = box(26, 44, 28, { at: [0, 0, 136], col, r: 3 });
  const lensF = xform(lathe([[0, 0], [8, 0], [8, 6], [10, 8], [10, 22], [9, 24], [0, 24]], 18, { col: lens }), { rx: Math.PI / 2, at: [0, -22, 150] });
  const mag = xform(lathe([[0, -6], [10, -6], [10, 6], [0, 6]], 16, { col }), { ry: Math.PI / 2, at: [0, 8, 172] });
  const legs = [0, 1, 2].map((i) => { const a = -Math.PI / 2 + (i / 3) * Math.PI * 2; return capsule([0, 0, 132], [44 * Math.cos(a), 44 * Math.sin(a), 0], 2.4, { col: '#4A4E57' }); });
  return join(body, lensF, mag, ...legs, cyl(5, 10, { at: [0, 0, 126], col: '#4A4E57' }));
}
