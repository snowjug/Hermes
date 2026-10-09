// Collage toolkit: a documentary desk made of paper (on top of _mp.ts's Plate).
//  - CollagePlate: a warm paper ground with fibres (no graph grid), ink type, no plotter spark.
//  - Cutouts (analysis/cutouts.py makes them from real images): pop in on a spring, turn and settle,
//    and their shadow lands under them; they sway a hair while they sit and leave by flying off.
//  - Masking tape, push pins, red string, hand-drawn marker paths (for Plot strokes), highlighter
//    swipes, ransom-note letters, typed tags, index cards.
//  - Captions on a torn paper strip, and page wipes for cuts.
import { FSPass, W, H } from '../engine/gl';
import { rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import type { Line } from '../engine/lyrics';
import { clamp, ease, hash, lerp, noise1, prog, springStep, TAU } from '../engine/util';
import { Plate } from './_mp';
import { setWorld, w2s, mixCss, pt, placeRow, rowWidth, type Cam, type P } from './_vo';

export const COLLAGE_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 d = sp - 0.5 * uRes;
  float c = cos(-uCam.w), s = sin(-uCam.w);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / uCam.z;
  vec2 p = uCam.xy + d;
  vec3 col = C_BONE;
  float m = fbm(p * 0.0014 + uSeed, 4);
  float f1 = fbm(vec2(p.x * 0.0018 + p.y * 0.011, p.y * 0.0008) * 3.0 + uSeed * 1.7, 3);
  float g = fbm(p * 0.09 + uSeed * 3.1, 2);
  col *= 0.975 - 0.06 * m;
  col *= 1.0 - 0.03 * smoothstep(0.5, 0.95, f1);
  col *= 1.0 - 0.025 * g;
  vec2 q = sp / uRes - 0.5;
  col *= 1.0 - 0.22 * dot(q, q);
  fragColor = vec4(col, 1.0);
}`;

export abstract class CollagePlate extends Plate {
  override paper = true;
  override showPen = false;
  override paperPass = new FSPass(COLLAGE_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 } });
  cuts: Record<string, Cut> = {};
  /** cutouts this plate uses (loaded before build) */
  uses: string[] = [];
  override async init() {
    this.cuts = await loadCuts(this.uses);
    super.init();
  }
}

// ================================================================== cutouts
export interface Cut { img: HTMLImageElement; sh: HTMLImageElement; w: number; h: number; sw: number; shh: number }
let META: Record<string, { w: number; h: number; sw: number; sh: number }> | null = null;
const IMG = new Map<string, Promise<HTMLImageElement>>();
const loadImg = (src: string) => {
  if (!IMG.has(src)) IMG.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`missing ${src}`)); i.src = src; }));
  return IMG.get(src)!;
};
export async function loadCuts(names: string[]): Promise<Record<string, Cut>> {
  if (!names.length) return {};
  if (!META) META = await (await fetch('data/cut/meta.json')).json();
  const out: Record<string, Cut> = {};
  for (const n of names) {
    const m = META![n];
    if (!m) throw new Error(`no cutout ${n}`);
    out[n] = { img: await loadImg(`data/cut/${n}.png`), sh: await loadImg(`data/cut/${n}_sh.png`), w: m.w, h: m.h, sw: m.sw, shh: m.sh };
  }
  return out;
}

export interface CutOpts {
  /** pop-in time */
  t0: number;
  /** world px per image px */
  scale?: number;
  rot?: number;
  a?: number;
  /** leave from t1: fly off along flyDir (radians) or fade */
  t1?: number;
  exit?: 'fly' | 'fade';
  flyDir?: number;
  /** resting shadow offset (world px) */
  lift?: number;
  seed?: number;
  /** extra offset (world px), e.g. for a nudge */
  dx?: number;
  dy?: number;
}
/** A cutout centred at world (x, y). Returns false while hidden. */
export function drawCut(ctx: CanvasRenderingContext2D, c: Cam, cut: Cut, x: number, y: number, t: number, o: CutOpts) {
  if (t < o.t0) return false;
  const age = t - o.t0;
  const seed = o.seed ?? 1;
  const sp = springStep(age, 2.4, 0.45);
  const sc = (o.scale ?? 1) * (0.6 + 0.4 * sp);
  const side = hash(seed, 3) > 0.5 ? 1 : -1;
  const rot = (o.rot ?? 0) + (1 - sp) * 0.3 * side + 0.006 * noise1(t * 0.6, seed);
  let a = clamp(age / 0.05) * (o.a ?? 1);
  let dx = o.dx ?? 0, dy = o.dy ?? 0;
  if (o.t1 !== undefined && t > o.t1) {
    const k = ease.inCubic(clamp((t - o.t1) / 0.4));
    if (o.exit === 'fade') a *= 1 - k;
    else { const an = o.flyDir ?? -1.2; dx += Math.cos(an) * 2200 * k; dy += Math.sin(an) * 2200 * k; }
  }
  if (a <= 0.003) return false;
  const air = 1 - clamp(age / 0.3);
  const lift = (o.lift ?? 9) + 30 * air;
  const [sx, sy] = w2s(c, x + dx, y + dy);
  const k = c.z * sc, r = rot + c.roll, co = Math.cos(r), si = Math.sin(r);
  ctx.setTransform(k * co, k * si, -k * si, k * co, sx + lift * 0.55 * c.z, sy + lift * c.z);
  ctx.globalAlpha = a * (0.9 - 0.35 * air);
  ctx.drawImage(cut.sh, -cut.sw / 2, -cut.shh / 2);
  ctx.setTransform(k * co, k * si, -k * si, k * co, sx, sy);
  ctx.globalAlpha = a;
  ctx.drawImage(cut.img, -cut.w / 2, -cut.h / 2);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return true;
}

// ================================================================== desk things
/** A strip of masking tape centred at world (x, y). */
export function tape(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, rot: number, o: { seed?: number; a?: number; h?: number } = {}) {
  const a = o.a ?? 1, h = o.h ?? 40, seed = o.seed ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, rot);
  ctx.globalAlpha = a;
  ctx.beginPath();
  const n = 7;
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  for (let i = 1; i <= n; i++) ctx.lineTo(w / 2 + (hash(seed, i) - 0.5) * 9, -h / 2 + (h * i) / n);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(-w / 2 + (hash(seed, 50 + i) - 0.5) * 9, -h / 2 + (h * i) / n);
  ctx.closePath();
  ctx.fillStyle = 'rgba(232, 216, 170, 0.74)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const yy = -h / 2 + h * (0.2 + 0.2 * i);
    ctx.beginPath(); ctx.moveTo(-w / 2 + 5, yy); ctx.lineTo(w / 2 - 5, yy + (hash(seed, 90 + i) - 0.5) * 3); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A push pin at world (x, y), pressed in at t0 (pass -1 to show it always). */
export function pin(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, t: number, t0: number, col = 'signal') {
  if (t < t0) return;
  const k = t0 < 0 ? 1 : springStep(t - t0, 4, 0.5);
  setWorld(ctx, c, x, y, 0.6 + 0.4 * k);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(6, 8, 14, 10, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 15);
  g.addColorStop(0, mixCss(col, 'bone', 0.55, 1));
  g.addColorStop(0.45, rgba(col, 1));
  g.addColorStop(1, mixCss(col, 'ink', 0.45, 1));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Points of a slack string from a to b. */
export function stringPts(a: P, b: P, sag = 0.07, n = 48): P[] {
  const L = Math.hypot(b.x - a.x, b.y - a.y), out: P[] = [];
  for (let i = 0; i <= n; i++) { const u = i / n; out.push(pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u) + Math.sin(u * Math.PI) * L * sag)); }
  return out;
}
/** Red string along pts, drawn to fraction k, with its shadow. */
export function drawString(ctx: CanvasRenderingContext2D, c: Cam, pts: P[], k: number, o: { col?: string; width?: number } = {}) {
  if (k <= 0) return;
  const n = Math.max(2, Math.min(pts.length, Math.ceil(pts.length * clamp(k))));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass ? rgba(o.col ?? 'signal', 0.95) : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = (o.width ?? 3) * c.z * (pass ? 1 : 1.2);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const q = pts[i]!;
      const p = w2s(c, q.x + (pass ? 0 : 4), q.y + (pass ? 0 : 7));
      if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
}

// ================================================================== marker paths (for Plot.add)
/** A hand-drawn loop around (x, y): a little more than one turn, wobbling. */
export function ring(x: number, y: number, rx: number, ry: number, seed = 1, turns = 1.12): P[] {
  const out: P[] = [], n = 80, a0 = -2.4 + hash(seed, 1);
  for (let i = 0; i <= n; i++) {
    const u = i / n, an = a0 + u * TAU * turns;
    const wob = 1 + 0.05 * noise1(u * 5, seed) + 0.05 * u;
    out.push(pt(x + Math.cos(an) * rx * wob, y + Math.sin(an) * ry * wob));
  }
  return out;
}
/** A wobbling line from a to b. */
export function wobble(a: P, b: P, seed = 1, amp = 3.5, n = 24): P[] {
  const out: P[] = [], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) { const u = i / n, j = amp * noise1(u * 3.3, seed); out.push(pt(a.x + dx * u + nx * j, a.y + dy * u + ny * j)); }
  return out;
}
/** A hand-drawn arrow: a bent shaft from a to b and a two-stroke head. */
export function arrow(a: P, b: P, seed = 1, bend = 0.18): { shaft: P[]; head: P[] } {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
  const cx = mx - dy * bend, cy = my + dx * bend;
  const shaft: P[] = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30, v = 1 - u;
    shaft.push(pt(v * v * a.x + 2 * v * u * cx + u * u * b.x + noise1(u * 4, seed) * 2, v * v * a.y + 2 * v * u * cy + u * u * b.y + noise1(u * 4, seed + 1) * 2));
  }
  const p1 = shaft[shaft.length - 2]!, an = Math.atan2(b.y - p1.y, b.x - p1.x), s = 26;
  const head = [pt(b.x + Math.cos(an + 2.55) * s, b.y + Math.sin(an + 2.55) * s), pt(b.x, b.y), pt(b.x + Math.cos(an - 2.55) * s, b.y + Math.sin(an - 2.55) * s)];
  return { shaft, head };
}
/** A cross-out scribble over a box. */
export function crossOut(x: number, y: number, w: number, h: number, seed = 1): P[][] {
  return [wobble(pt(x, y), pt(x + w, y + h), seed, 4), wobble(pt(x + w, y), pt(x, y + h), seed + 3, 4)];
}

// ================================================================== type on paper
/** A marker-highlighter swipe (multiply) over world rect, drawn left to right to k. */
export function highlight(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, k: number, o: { col?: string; a?: number; seed?: number } = {}) {
  if (k <= 0) return;
  const seed = o.seed ?? 1, j = (i: number, s: number) => (hash(seed, i) - 0.5) * s;
  setWorld(ctx, c, x, y);
  ctx.globalAlpha = o.a ?? 0.85;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = rgba(o.col ?? 'signal', 1);
  const ww = w * clamp(k);
  ctx.beginPath();
  ctx.moveTo(j(1, 10), h * 0.08 + j(2, 8));
  ctx.lineTo(ww + j(3, 10), j(4, 8));
  ctx.lineTo(ww + j(5, 14), h + j(6, 8));
  ctx.lineTo(j(7, 10), h * 0.94 + j(8, 8));
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const RFONT = [(s: number) => font(F.archivo(125, 900), s), (s: number) => font(F.serif(600), s * 1.18), (s: number) => font(F.mono(700), s * 0.95),
  (s: number) => font(F.archivo(62, 900), s * 1.12), (s: number) => font(F.archivoItalic(100, 800), s), (s: number) => font(F.archivo(100, 700), s)];
const RBG = ['#FBF8F0', '#1C1915', '#D2302A', '#F0CF55', '#2E5EA6', '#E9DFC9', '#FBF8F0'];
/**
 * Ransom-note letters: each its own scrap of paper, its own face and colour, landing one by one from t0
 * over dur. (x, baseline y) world; returns the total width.
 */
export function ransom(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, dur: number, seed = 1, a = 1) {
  const chars = Array.from(text);
  let cx = x;
  chars.forEach((ch, i) => {
    if (ch === ' ') { cx += size * 0.42; return; }
    const h1 = hash(seed, i), h2 = hash(seed, i + 100), h3 = hash(seed, i + 200);
    const f = RFONT[Math.floor(h1 * RFONT.length)]!(size * (0.86 + 0.28 * h2));
    ctx.font = f;
    const gw = ctx.measureText(ch).width;
    const bg = RBG[Math.floor(h3 * RBG.length)]!;
    const dark = bg === '#1C1915' || bg === '#D2302A' || bg === '#2E5EA6';
    const fg = dark ? '#FBF8F0' : h2 > 0.62 ? '#D2302A' : '#1C1915';
    const bw = gw + size * 0.26, bh = size * 1.12;
    const ti = t0 + (i / Math.max(1, chars.length)) * dur;
    if (t >= ti && a > 0.003) {
      const sp = springStep(t - ti, 3.4, 0.45);
      const rot = (h1 - 0.5) * 0.18 + (1 - sp) * 0.5 * (h2 > 0.5 ? 1 : -1);
      const sc = 0.4 + 0.6 * sp;
      const lx = cx + bw / 2, ly = y - size * 0.36 + (h3 - 0.5) * size * 0.14;
      const [sx, sy] = w2s(c, lx, ly);
      const k = c.z * sc, r = rot + c.roll, co = Math.cos(r), si = Math.sin(r);
      ctx.globalAlpha = a;
      ctx.setTransform(k * co, k * si, -k * si, k * co, sx + 4 * c.z, sy + 7 * c.z);
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.setTransform(k * co, k * si, -k * si, k * co, sx, sy);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-bw / 2 + (h1 - 0.5) * 6, -bh / 2); ctx.lineTo(bw / 2, -bh / 2 + (h2 - 0.5) * 6);
      ctx.lineTo(bw / 2 + (h3 - 0.5) * 6, bh / 2); ctx.lineTo(-bw / 2, bh / 2 + (h1 - 0.5) * 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch, 0, size * 0.05);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    cx += bw + size * 0.05;
  });
  return cx - x;
}

/** A typed paper tag (mono) centred at world (x, y), with a strip of tape. */
export function tag(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { a?: number; rot?: number; bg?: string; col?: string; tape?: boolean; seed?: number; sub?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const fam = F.mono(600), tw = measure(text, fam, size), sw = o.sub ? measure(o.sub, F.mono(400), size * 0.62) : 0;
  const w = Math.max(tw, sw) + size * 1.2, h = size * (o.sub ? 2.4 : 1.7);
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-w / 2 + 5, -h / 2 + 8, w, h);
  ctx.fillStyle = o.bg ?? '#FBF8F0'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.font = font(fam, size); ctx.fillStyle = o.col ?? rgba('ink', 1); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, o.sub ? -h * 0.06 : size * 0.36);
  if (o.sub) { ctx.font = font(F.mono(400), size * 0.62); ctx.fillStyle = rgba('graphite', 1); ctx.fillText(o.sub, 0, h * 0.32); }
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (o.tape ?? true) tape(ctx, c, x - w / 2 + 10, y - h / 2 + 4, Math.min(110, w * 0.45), -0.6 + (o.rot ?? 0), { seed: o.seed ?? 3, a: a * 0.95, h: 30 });
}

/** A lined index card, top-left at world (x, y). `state`: 'missing' (dashed ghost) or 'ok' (green tick). */
export function indexCard(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, sub: string, o: { a?: number; rot?: number; state?: 'missing' | 'ok' | 'plain'; hot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x + w / 2, y + h / 2, 1, o.rot ?? 0);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = a;
  const missing = o.state === 'missing';
  if (!missing) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(6, 9, w, h); }
  ctx.fillStyle = missing ? 'rgba(251,248,240,0.35)' : '#FBF8F0';
  ctx.fillRect(0, 0, w, h);
  if (missing) { ctx.setLineDash([12, 9]); ctx.strokeStyle = rgba('graphite', 0.8); ctx.lineWidth = 2.5; ctx.strokeRect(0, 0, w, h); ctx.setLineDash([]); }
  else {
    ctx.strokeStyle = rgba('signal', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, h * 0.26); ctx.lineTo(w, h * 0.26); ctx.stroke();
    ctx.strokeStyle = 'rgba(46,94,166,0.25)'; ctx.lineWidth = 1.2;
    for (let yy = h * 0.42; yy < h - 8; yy += h * 0.16) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }
  }
  ctx.font = font(F.archivo(87.5, 800), h * 0.17); ctx.fillStyle = missing ? rgba('graphite', 0.9) : rgba(o.hot ? 'signal' : 'ink', 1);
  ctx.fillText(title, w * 0.07, h * 0.2);
  ctx.font = font(F.mono(500), h * 0.1); ctx.fillStyle = rgba(missing ? 'graphite' : 'acid', 0.95);
  ctx.fillText(sub, w * 0.07, h * 0.52);
  if (o.state === 'ok') {
    ctx.strokeStyle = '#2F8F4E'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(w - 74, h - 50); ctx.lineTo(w - 54, h - 30); ctx.lineTo(w - 20, h - 74); ctx.stroke(); ctx.lineCap = 'butt';
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ================================================================== captions and wipes
export interface Caption { group: string; x0: number; x1: number; start: number; end: number }
/**
 * Bottom captions for the given lines (screen space, centred, one row each, the plate's screenKw), and
 * where each line's paper strip goes. Visible from just before the line until the next one starts.
 */
export function captions(plate: Plate, lines: Line[], o: { y?: number; size?: number; maxW?: number } = {}): Caption[] {
  const y = o.y ?? 455, size0 = o.size ?? 44, maxW = o.maxW ?? 1640;
  const fam = F.archivo(100, 700);
  return lines.map((l, i) => {
    const texts = l.words.map((w) => w.w);
    const size = Math.min(size0, (size0 * maxW) / Math.max(1, rowWidth(texts, size0, fam)));
    const w = rowWidth(texts, size, fam);
    const group = `cap${i}`;
    plate.screenKw.push(...placeRow(l.words, -w / 2, y, size, fam, group, { ant: 0.25 }).words);
    return { group, x0: -w / 2, x1: w / 2, start: l.start, end: lines[i + 1] ? lines[i + 1]!.start - 0.12 : l.end + 2 };
  });
}
export function captionAlpha(cs: Caption[], g: string, t: number) {
  const cp = cs.find((x) => x.group === g);
  if (!cp) return -1;
  return prog(t, cp.start - 0.3, cp.start - 0.1) * (1 - prog(t, cp.end - 0.05, cp.end + 0.08));
}
/** The torn paper strips behind the captions (call from drawTop). */
export function captionStrips(ctx: CanvasRenderingContext2D, cs: Caption[], t: number, o: { y?: number; size?: number } = {}) {
  const y = o.y ?? 455, size = o.size ?? 44;
  for (const cp of cs) {
    const a = captionAlpha(cs, cp.group, t);
    if (a <= 0.003) continue;
    const x0 = W / 2 + cp.x0 - 28, x1 = W / 2 + cp.x1 + 28, top = H / 2 + y - size * 1.05, bot = H / 2 + y + size * 0.42;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    tornRect(ctx, x0 + 5, top + 8, x1 + 5, bot + 8, 7);
    ctx.fill();
    ctx.fillStyle = '#FBF8F0';
    tornRect(ctx, x0, top, x1, bot, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
function tornRect(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, seed: number) {
  ctx.beginPath();
  const n = Math.max(8, Math.round((x1 - x0) / 26));
  ctx.moveTo(x0, y0);
  for (let i = 1; i <= n; i++) ctx.lineTo(x0 + ((x1 - x0) * i) / n, y0 + (hash(seed, i) - 0.5) * 6);
  ctx.lineTo(x1 + (hash(seed, 99) - 0.5) * 8, y1);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(x0 + ((x1 - x0) * i) / n, y1 + (hash(seed, i + 40) - 0.5) * 6);
  ctx.closePath();
}

/**
 * A sheet of paper sliding across the frame (screen space, call from drawTop): `cover` 0..1 is how
 * much of the frame it covers; `from` the side it comes from. Its leading edge is torn, with a shadow.
 */
export function sheet(ctx: CanvasRenderingContext2D, cover: number, from: 'left' | 'right', seed = 5) {
  if (cover <= 0.001) return;
  const edge = from === 'left' ? W * cover : W * (1 - cover);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const path = () => {
    ctx.beginPath();
    const n = 26;
    if (from === 'left') {
      ctx.moveTo(-10, -10);
      for (let i = 0; i <= n; i++) ctx.lineTo(edge + (hash(seed, i) - 0.5) * 34 + 14 * Math.sin(i * 0.9), -10 + ((H + 20) * i) / n);
      ctx.lineTo(-10, H + 10);
    } else {
      ctx.moveTo(W + 10, -10);
      for (let i = 0; i <= n; i++) ctx.lineTo(edge + (hash(seed, i) - 0.5) * 34 + 14 * Math.sin(i * 0.9), -10 + ((H + 20) * i) / n);
      ctx.lineTo(W + 10, H + 10);
    }
    ctx.closePath();
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 24; ctx.shadowOffsetX = from === 'left' ? 10 : -10;
  ctx.fillStyle = '#EFE6D3';
  path(); ctx.fill();
  ctx.restore();
  // the torn fibre edge
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) { const yy = -10 + ((H + 20) * i) / 26, xx = edge + (hash(seed, i) - 0.5) * 34 + 14 * Math.sin(i * 0.9); if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
  ctx.stroke();
}
/** Cover amount for a plate that wipes in at its start (sheet leaves) and/or out at its end (sheet arrives). */
export function wipeCover(t: number, start: number, end: number, o: { inn?: boolean; out?: boolean; dIn?: number; dOut?: number } = {}) {
  const a = o.inn ? 1 - ease.inOutCubic(prog(t, start, start + (o.dIn ?? 0.34))) : 0;
  const b = o.out ? ease.inOutCubic(prog(t, end - (o.dOut ?? 0.3), end)) : 0;
  return Math.max(a, b);
}

export { lerp, ease, prog, clamp, hash, noise1, springStep, TAU, pt, w2s, setWorld, mixCss, rgba, F, font, measure };
