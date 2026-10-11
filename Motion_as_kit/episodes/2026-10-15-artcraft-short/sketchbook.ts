// The ArtCraft Short's look (theme `sketchbook`): an artist's sketchbook. Cream cold-press paper with real tooth and
// a wire spiral binding at the top; the pages flip up over the binding as the story moves on. Drawings are graphite
// line art (the 3D mannequins, room and camera of app/src/scenes/_cad3d.ts in its 'line' look, traced twice like a
// sketch), coloured with watercolour washes that bloom out to a darker dried edge. The headlines are lettered by hand
// with single-stroke fonts (app/src/engine/stroke.ts), written stroke by stroke with a pencil; the captions are
// hand-printed capitals written word by word as they are said, the spoken word under a highlighter wash.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { drawStrokeText, strokeText, type StrokeFontName, type StrokeText } from '@engine/stroke';
import { clamp, ease, hash, lerp, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';
import { box, cameraRig, drawParts, extrude, join, mannequin, mixPose, POSES, project, rect, xform, xpt, type Face, type Obj, type Pose, type Proj, type View, type Xf } from '@kit/_cad3d';

export { clamp, ease, hash, lerp, TAU };
export const GRAPHITE = '#3A3A40';
export const LEAD = '#6A6A72';
export const PAPER = '#F4EFE4';
export const VERMILION = '#E06A4A';
export const OCHRE = '#F2B84B';
export const COBALT = '#4A7FB5';
export const SAP = '#6BA368';
/** outBack that is exactly 0 at 0 */
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));

// ------------------------------------------------------------------ the paper
const SKETCH_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 col = C_BONE;
  // cold-press tooth: small bumps lit from the top left
  float n0 = fbm(sp * 0.045 + uSeed, 4), n1 = fbm((sp + vec2(1.6, 1.6)) * 0.045 + uSeed, 4);
  col *= 1.0 + 0.055 * (n0 - n1) * 2.0;
  // fibres and a soft mottle
  col *= 1.0 - 0.025 * fbm(vec2(sp.x * 0.004, sp.y * 0.03) + 5.0, 3) - 0.035 * fbm(sp * 0.0025 + 9.0, 3);
  // the shadow under the binding and a gentle falloff to the edges
  col *= 1.0 - 0.10 * smoothstep(150.0, 0.0, sp.y);
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.12 * smoothstep(0.35, 0.8, length(q * vec2(1.1, 0.8)));
  col += (hash12(sp + floor(uTime * 24.0) * 17.0) - 0.5) * 0.012;
  fragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ hand lettering
const ST = new Map<string, StrokeText>();
export function st(text: string, f: StrokeFontName, size: number): StrokeText {
  const k = `${f}|${size}|${text}`;
  let s = ST.get(k);
  if (!s) { s = strokeText(text, f, size); ST.set(k, s); }
  return s;
}
export interface WriteOpts { col?: string; lw?: number; align?: 'left' | 'center'; rot?: number; a?: number }
/**
 * Write `text` with the pencil from t0 to t1, baseline at world (x, y). Returns the pencil's point in screen px
 * while it is writing, else null.
 */
export function write(ctx: CanvasRenderingContext2D, c: Cam, text: string, f: StrokeFontName, size: number, x: number, y: number, t: number, t0: number, t1: number, o: WriteOpts = {}): { x: number; y: number } | null {
  const k = clamp((t - t0) / Math.max(0.05, t1 - t0));
  if (k <= 0 || (o.a ?? 1) <= 0.003) return null;
  const s = st(text, f, size);
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  if ((o.align ?? 'center') === 'center') ctx.translate(-s.width / 2, 0);
  ctx.globalAlpha = o.a ?? 1;
  ctx.strokeStyle = o.col ?? GRAPHITE; ctx.lineWidth = o.lw ?? 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const head = drawStrokeText(ctx, s, s.total * k);
  let out: { x: number; y: number } | null = null;
  if (head && k < 1) { const p = ctx.getTransform().transformPoint(new DOMPoint(head.x, head.y)); out = { x: p.x, y: p.y }; }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  return out;
}
export const textW = (text: string, f: StrokeFontName, size: number) => st(text, f, size).width;

// ------------------------------------------------------------------ watercolour
/** A wobbly closed blob of radius (rx, ry), the same shape for the same seed. */
function blob(ctx: CanvasRenderingContext2D, rx: number, ry: number, seed: number, wob = 0.22) {
  const N = 56;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    let r = 1;
    for (let h = 2; h <= 6; h++) r += ((hash(seed, h) - 0.5) * wob * 2) / h * Math.sin(a * h + hash(seed, h, 3) * TAU);
    r += (hash(seed, i % N, 9) - 0.5) * 0.035;
    const px = Math.cos(a) * rx * r, py = Math.sin(a) * ry * r;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}
/** A watercolour wash: translucent layers, pigment pooling at a darker dried edge. k 0..1 blooms it out. */
export function wash(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, rx: number, ry: number, col: string, k: number, seed: number, o: { rot?: number; a?: number } = {}) {
  if (k <= 0 || (o.a ?? 1) <= 0.003) return;
  const g = ease.outCubic(clamp(k)), A = o.a ?? 1;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = col; ctx.strokeStyle = col;
  for (let L = 0; L < 3; L++) {
    ctx.globalAlpha = A * 0.2;
    ctx.save(); ctx.translate((hash(seed, L, 1) - 0.5) * rx * 0.12, (hash(seed, L, 2) - 0.5) * ry * 0.12);
    blob(ctx, rx * g * (1 - L * 0.13), ry * g * (1 - L * 0.13), seed + L * 31); ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = A * 0.32; ctx.lineWidth = 2.2; blob(ctx, rx * g, ry * g, seed); ctx.stroke();
  // granulation: a few pigment specks
  ctx.globalAlpha = A * 0.25;
  for (let i = 0; i < 14; i++) {
    const a = hash(seed, i, 5) * TAU, r = Math.sqrt(hash(seed, i, 6)) * 0.85 * g;
    ctx.beginPath(); ctx.arc(Math.cos(a) * rx * r, Math.sin(a) * ry * r, 1.5 + 2.5 * hash(seed, i, 7), 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A highlighter swipe behind text: a flat wash band from x0 to x0 + w*k, centred on y. World coords. */
export function swipe(ctx: CanvasRenderingContext2D, c: Cam, x0: number, y: number, w: number, h: number, k: number, col = OCHRE, a = 0.55, rot = -0.015) {
  if (k <= 0) return;
  setWorld(ctx, c, x0, y, 1, rot);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = col;
  const L = w * ease.outCubic(clamp(k));
  ctx.beginPath(); ctx.moveTo(0, -h / 2 + 4); ctx.quadraticCurveTo(L * 0.5, -h / 2 - 3, L, -h / 2 + 2);
  ctx.lineTo(L + 6, h / 2 - 3); ctx.quadraticCurveTo(L * 0.5, h / 2 + 4, -4, h / 2); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ pencil marks
/** A hand-drawn quadratic arrow a → (via) → b, drawn to k; the head appears at the end. */
export function arrow(ctx: CanvasRenderingContext2D, c: Cam, a: [number, number], via: [number, number], b: [number, number], k: number, o: { col?: string; lw?: number; a?: number } = {}) {
  if (k <= 0) return;
  const q = (u: number): [number, number] => [lerp(lerp(a[0], via[0], u), lerp(via[0], b[0], u), u), lerp(lerp(a[1], via[1], u), lerp(via[1], b[1], u), u)];
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.strokeStyle = o.col ?? GRAPHITE; ctx.lineWidth = o.lw ?? 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const kk = clamp(k), n = 40;
  ctx.beginPath();
  for (let i = 0; i <= n * kk; i++) { const p = q(i / n); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
  ctx.stroke();
  if (kk >= 1) {
    const p1 = q(1), p0 = q(0.93), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), L = 26;
    ctx.beginPath(); ctx.moveTo(p1[0] - L * Math.cos(ang - 0.45), p1[1] - L * Math.sin(ang - 0.45)); ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p1[0] - L * Math.cos(ang + 0.5), p1[1] - L * Math.sin(ang + 0.5)); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A hand-drawn double strike-through over (x, y, w), each stroke drawn left to right in turn as k runs 0..1. */
export function scribble(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, _h: number, k: number, seed: number, col = GRAPHITE) {
  if (k <= 0) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const kk = clamp(k * 2 - i);
    if (kk <= 0) break;
    const y0 = (i ? 14 : -10) + (hash(seed, i) - 0.5) * 10, y1 = (i ? 2 : 6) + (hash(seed, i, 2) - 0.5) * 10;
    const x0 = -w / 2 - 10, x1 = x0 + (w + 20) * ease.outCubic(kk);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + lerp(y0, y1, kk)) / 2 - 10, x1, lerp(y0, y1, kk)); ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A doodled five-point star, filled with an ochre wash, popping in with k. */
export function star(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, k: number, seed: number) {
  if (k <= 0) return;
  const s = ob(k);
  wash(ctx, c, x, y, r * 0.75 * s, r * 0.75 * s, OCHRE, clamp(k * 1.5), seed);
  setWorld(ctx, c, x, y, s, (hash(seed, 2) - 0.5) * 0.5);
  ctx.strokeStyle = GRAPHITE; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = (i % 2 ? 0.45 : 1) * r * (0.95 + 0.1 * hash(seed, i));
    if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Washi tape: a translucent strip with torn ends, centred at (x, y). */
export function tapeBit(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, rot: number, a = 1, col = 'rgba(224,106,74,0.55)') {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, rot);
  ctx.globalAlpha = a; ctx.fillStyle = col;
  const h = 46, z = 6;
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
  for (let i = 0; i <= 8; i++) ctx.lineTo(-w / 2 + (i % 2 ? z : 0), -h / 2 + (h * i) / 8);
  for (let i = 0; i <= 8; i++) ctx.lineTo(w / 2 - (i % 2 ? z : 0), h / 2 - (h * i) / 8);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = -3; i <= 3; i++) ctx.fillRect(i * (w / 7) - 4, -h / 2, 8, h);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The pencil, its graphite point at screen (x, y). */
export function pencil(ctx: CanvasRenderingContext2D, x: number, y: number, a = 1) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.setTransform(1, 0, 0, 1, x, y); ctx.rotate(-0.95);
  // shadow on the paper
  ctx.save(); ctx.translate(16, 22); ctx.filter = 'blur(8px)'; ctx.fillStyle = 'rgba(40,30,20,0.25)'; ctx.fillRect(30, -13, 320, 26); ctx.restore();
  // graphite point, the sharpened wood, the painted body, the ferrule and the eraser
  ctx.fillStyle = '#2C2C30'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, -4.5); ctx.lineTo(16, 4.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E9CFA6'; ctx.beginPath(); ctx.moveTo(16, -4.5); ctx.lineTo(52, -13); ctx.lineTo(52, 13); ctx.lineTo(16, 4.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F2B84B'; ctx.beginPath(); ctx.moveTo(52, -13); for (let i = 0; i < 3; i++) ctx.quadraticCurveTo(52 + 4, -13 + 4.3 + i * 8.7, 52, -13 + 8.7 * (i + 1)); ctx.lineTo(300, 13); ctx.lineTo(300, -13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#D9952F'; ctx.fillRect(56, 4, 244, 9);
  ctx.fillStyle = '#FFD98A'; ctx.fillRect(56, -9, 244, 4);
  ctx.fillStyle = '#B8B8C0'; ctx.fillRect(300, -13.5, 30, 27);
  ctx.strokeStyle = '#8A8A92'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(305 + i * 7, -13); ctx.lineTo(305 + i * 7, 13); ctx.stroke(); }
  ctx.fillStyle = '#E58F8F'; ctx.beginPath(); ctx.roundRect(330, -13, 30, 26, [0, 9, 9, 0]); ctx.fill();
  ctx.restore();
}
/** The wire spiral along the top edge, screen-fixed. */
export function spiral(ctx: CanvasRenderingContext2D) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2B2A2E'; ctx.fillRect(0, 0, W, 22);
  for (let x = 46; x < W - 20; x += 46) {
    ctx.strokeStyle = '#6E6E76'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 6, 62); ctx.bezierCurveTo(x - 10, 20, x + 14, 4, x + 12, -6); ctx.stroke();
    ctx.strokeStyle = '#C8C8D0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 7, 50); ctx.bezierCurveTo(x - 9, 22, x + 10, 8, x + 10, -4); ctx.stroke();
  }
}
/** The punched holes of a page under the spiral (they move with the page). */
export function holes(ctx: CanvasRenderingContext2D, c: Cam) {
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.fillStyle = '#2B2A2E';
  for (let x = 46; x < W - 20; x += 46) { ctx.beginPath(); ctx.ellipse(x - W / 2 - 4, 64 - H / 2, 9, 7, 0, 0, TAU); ctx.fill(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ the set (the same blocking as the main video)
/** A room: floor, a back wall and a left wall with a window. Centred on the origin, 500 x 400, 260 high. */
export function room(): Face[] {
  const wall = '#ECE6DA', floor = '#E2DBCD';
  return join(
    box(520, 420, 4, { at: [0, 0, -4], col: floor }),
    box(520, 10, 260, { at: [0, 205, 0], col: wall }),
    extrude(rect(410, 260, 0, 130), [rect(120, 130, 30, 150)], 10, { plane: 'yz', w0: -265, col: wall }),
  );
}
export interface Figure { pose: Pose; xf: Xf }
export function figures(fs: Figure[]): Face[] {
  return join(...fs.map((f) => xform(mannequin(f.pose, '#EFE6D6', '#D9CBB5'), f.xf)));
}
export function rig(xf: Xf): Face[] { return xform(cameraRig('#E3DED4', '#C9C4BA'), xf); }
/** What the virtual camera on the tripod sees. */
export const POV: View = { yaw: 0.16, pitch: 0.05, dist: 430, s: 2.15, target: [5, 40, 112] };
/** The rig's place: in front of the room, facing in. */
export const RIG_XF = { at: [-30, -250, 0] as [number, number, number], rz: Math.PI };
/** The cast, posed by k (0 = standing, 1 = posed): A points, B thinks. */
export function cast(k: number): Figure[] {
  return [
    { pose: mixPose(POSES.stand, POSES.point, k), xf: { at: [-75, 40, 0], rz: -0.35 } },
    { pose: mixPose(POSES.stand, POSES.think, k), xf: { at: [85, 70, 0], rz: 0.55 } },
  ];
}
/**
 * Pencil line art of 3D parts: a faint construction pass slightly off register, then the clean line; `reveal`
 * 0..1 sketches it in from the top (a clip with a ragged lower edge). Returns the projector.
 */
export function sketch(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, view: View, objs: Obj[], o: { a?: number; reveal?: number; box?: [number, number]; lw?: number } = {}): Proj {
  const rv = o.reveal ?? 1, A = o.a ?? 1;
  const [bw, bh] = o.box ?? [W, 1400];
  if (rv < 1) {
    setWorld(ctx, c, x, y, 1, 0);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-bw / 2, -bh / 2);
    const yb = -bh / 2 + bh * ease.inOutCubic(clamp(rv));
    for (let i = 0; i <= 24; i++) ctx.lineTo(-bw / 2 + (bw * i) / 24, yb + 18 * Math.sin(i * 1.7) * (1 - rv));
    ctx.lineTo(bw / 2, -bh / 2); ctx.closePath(); ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const ghost: Obj[] = objs.map((ob) => ({ ...ob, wire: 1, edge: LEAD, a: (ob.a ?? 1) * 0.35 }));
  drawParts(ctx, c, x + 3, y - 2, { ...view, yaw: view.yaw + 0.012 }, ghost, { look: 'line', shadow: 0, edgeW: 1.4, a: A });
  const P = drawParts(ctx, c, x, y, view, objs.map((ob) => ({ ...ob, edge: ob.edge ?? GRAPHITE })), { look: 'line', shadow: 0.6, edgeW: o.lw ?? 2.6, a: A });
  if (rv < 1) ctx.restore();
  return P;
}
/** Dashed pencil lines of the camera's field of view, from the lens towards the cast. */
export function frustumP(ctx: CanvasRenderingContext2D, c: Cam, vx: number, vy: number, P: Proj, lens: [number, number, number], k: number) {
  if (k <= 0) return;
  const corners: [number, number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [lens[0] + 140 * u! * k, lens[1] + 240 * k, lens[2] + 80 * v! * k]);
  const L = project(P, lens), cs = corners.map((p) => project(P, p));
  setWorld(ctx, c, vx, vy, 1, 0);
  ctx.strokeStyle = VERMILION; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.globalAlpha = 0.9;
  ctx.beginPath(); cs.forEach((p) => { ctx.moveTo(L[0], L[1]); ctx.lineTo(p[0], p[1]); }); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); cs.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/**
 * The "generated" shot as a watercolour painted from the blocking, in the rect (cx, cy, w, h), through projector P:
 * blue wall, ochre floor, the window light and its shaft, and each figure as an indigo silhouette where it was
 * posed. `reveal` sweeps a wet edge across it.
 */
export function paintWash(ctx: CanvasRenderingContext2D, c: Cam, cx: number, cy: number, w: number, h: number, P: Proj, fs: Figure[], o: { a?: number; reveal?: number; seed?: number } = {}) {
  const a = o.a ?? 1, rv = o.reveal ?? 1, seed = o.seed ?? 3;
  if (a <= 0.003 || rv <= 0) return;
  setWorld(ctx, c, cx, cy, 1, 0);
  ctx.save();
  const edge = (yy: number) => -w / 2 - 60 + (w + 120) * rv + 26 * Math.sin(yy * 0.021 + seed) + 12 * Math.sin(yy * 0.07 + seed * 2);
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
  for (let i = 0; i <= 30; i++) { const yy = -h / 2 + (h * i) / 30; ctx.lineTo(Math.min(w / 2, edge(yy)), yy); }
  ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = a * 0.92;
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#7FA6BF'); g.addColorStop(0.55, '#A9C2CC'); g.addColorStop(0.56, '#E2B27E'); g.addColorStop(1, '#C98A58');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  const win = [[-258, 90, 215], [-258, 90, 85], [-258, -30, 85], [-258, -30, 215]].map(([x, y, z]) => project(P, [x!, y!, z!]));
  ctx.fillStyle = '#FFF4D6'; ctx.beginPath(); win.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
  const fl = [[-258, -30, 0], [-258, 90, 0], [80, 170, 0], [80, 10, 0]].map(([x, y, z]) => project(P, [x!, y!, z!]));
  const sg = ctx.createLinearGradient(win[0]![0], win[0]![1], fl[2]![0], fl[2]![1]);
  sg.addColorStop(0, 'rgba(255,240,200,0.7)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(win[0]![0], win[0]![1]); ctx.lineTo(win[3]![0], win[3]![1]); ctx.lineTo(fl[3]![0], fl[3]![1]); ctx.lineTo(fl[2]![0], fl[2]![1]); ctx.closePath(); ctx.fill();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const f of fs) {
    const j = (k: keyof Pose) => project(P, xpt(f.pose[k], f.xf));
    const bones: [keyof Pose, keyof Pose, number][] = [['pelvis', 'chest', 26], ['shL', 'shR', 13], ['hipL', 'hipR', 16], ['shL', 'elL', 10], ['elL', 'haL', 9], ['shR', 'elR', 10], ['elR', 'haR', 9], ['hipL', 'knL', 14], ['knL', 'ftL', 11], ['hipR', 'knR', 14], ['knR', 'ftR', 11], ['neck', 'head', 9]];
    ctx.strokeStyle = '#2F3550'; ctx.fillStyle = '#2F3550';
    for (const [p, q, r] of bones) {
      const A = j(p), B = j(q), k = (P.dist / A[2]) * P.s;
      ctx.lineWidth = r * k * 0.9; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    const hd = j('head'), k = (P.dist / hd[2]) * P.s;
    ctx.beginPath(); ctx.arc(hd[0], hd[1], 11 * k, 0, TAU); ctx.fill();
  }
  ctx.restore();
  // the wet edge, pooling darker as it moves
  if (rv < 1) {
    ctx.strokeStyle = 'rgba(74,127,181,0.5)'; ctx.lineWidth = 6; ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const yy = -h / 2 + (h * i) / 30, xx = Math.min(w / 2, edge(yy)); if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ the plate
interface CapWord { w: Word; text: string; s: StrokeText; x: number }
interface CapChunk { words: CapWord[]; width: number; start: number; end: number }
const CAP = { font: 'readable' as StrokeFontName, size: 92, lw: 8, y: 560, maxW: 940, maxWords: 3, gap: 38 };

export abstract class SketchPlate extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(SKETCH_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: CapChunk[] = [];
  /** where the pencil is this frame (screen px), set by whatever is being written */
  head: { x: number; y: number } | null = null;
  override init() {
    super.init();
    this.chunks = makeChunks(this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2), this.ctx.end);
  }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    this.paperPass.u.uTime!.value = f.t;
    return super.render(f, out);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.head = null; this.stage(ctx, t, c); }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    const h = drawChunks(ctx, this.chunks, t);
    if (!this.head && h && this.capPen(t)) this.head = h;
    if (this.head) pencil(ctx, this.head.x, this.head.y);
    spiral(ctx);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  /** whether the pencil follows the captions at t */
  capPen(_t: number) { return true; }
  /** write() that also hands the pencil its position */
  pen(ctx: CanvasRenderingContext2D, c: Cam, text: string, f: StrokeFontName, size: number, x: number, y: number, t: number, t0: number, t1: number, o: WriteOpts = {}) {
    const h = write(ctx, c, text, f, size, x, y, t, t0, t1, o);
    if (h && !this.head) this.head = h;
  }
  override postFX(t: number) {
    return { bloom: 0.08, bloomThreshold: 1.5, vignette: 0.16, grain: 0.035, halation: 0, ca: 0.15, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

function makeChunks(lines: Line[], plateEnd: number): CapChunk[] {
  const out: CapChunk[] = [];
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      let x = 0;
      const words = cur.map((w) => { const text = w.w.toUpperCase(); const s = st(text, CAP.font, CAP.size); const cw = { w, text, s, x }; x += s.width + CAP.gap; return cw; });
      out.push({ words, width: x - CAP.gap, start: cur[0]!.start, end: cur[cur.length - 1]!.end });
      cur = [];
    };
    for (const w of l.words) {
      const trial = [...cur, w].map((x) => x.w.toUpperCase()).join(' ');
      if (cur.length && (cur.length >= CAP.maxWords || textW(trial, CAP.font, CAP.size) > CAP.maxW)) flush();
      cur.push(w);
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 2) flush();
    }
    flush();
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.06, c.end + 0.9) : Math.min(plateEnd + 0.05, c.end + 1.2); });
  return out;
}
/** Draw the captions; returns the pencil's point if a word is being written. */
function drawChunks(ctx: CanvasRenderingContext2D, chunks: CapChunk[], t: number): { x: number; y: number } | null {
  let head: { x: number; y: number } | null = null;
  for (const ch of chunks) {
    if (t < ch.start - 0.06 || t > ch.end) continue;
    const a = clamp((ch.end - t) / 0.06);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAP.y;
    ch.words.forEach((cw, i) => {
      const w = cw.w, t0 = w.start - 0.05, dur = clamp((w.end - w.start) * 0.85, 0.12, 0.36);
      const k = clamp((t - t0) / dur);
      if (k <= 0) return;
      const on = t >= w.start - 0.05 && t < (ch.words[i + 1]?.w.start ?? ch.end) - 0.05;
      // the highlighter under the spoken word
      if (on) {
        ctx.setTransform(1, 0, 0, 1, x0 + cw.x - 10, y - CAP.size * 0.36);
        ctx.rotate(-0.012); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.6 * a; ctx.fillStyle = OCHRE;
        const L = (cw.s.width + 20) * ease.outCubic(clamp((t - w.start + 0.05) / 0.18));
        ctx.beginPath(); ctx.moveTo(0, -38); ctx.quadraticCurveTo(L / 2, -44, L, -36); ctx.lineTo(L + 4, 36); ctx.quadraticCurveTo(L / 2, 42, -3, 38); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.setTransform(1, 0, 0, 1, x0 + cw.x, y);
      ctx.globalAlpha = a; ctx.strokeStyle = GRAPHITE; ctx.lineWidth = CAP.lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const hd = drawStrokeText(ctx, cw.s, cw.s.total * k);
      if (hd && k < 1) head = { x: x0 + cw.x + hd.x, y: y + hd.y };
    });
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  return head;
}
