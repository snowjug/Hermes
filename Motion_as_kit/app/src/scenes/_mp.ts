// Toolkit for the magpie plates, on top of _vo.ts (camera, plotter, karaoke, graph paper).
//  - Plate: the standard plate pipeline (graph paper or bone paper → plotted strokes → 2D layer with
//    panels, notes and karaoke → the pen spark and packets → post). A plate only builds its geometry
//    and timings in build() and draws its own things in drawUI()/drawFX().
//  - Drawing helpers in world space: nodes, links, packets along polylines, windows, chips, stamps,
//    typed mono text.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { FSPass, Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { HEX, LIN, rgba } from '../engine/palette';
import { F, font, measure } from '../engine/type';
import type { Line, Word } from '../engine/lyrics';
import { clamp, ease, hash, lerp, mulberry32, noise1, prog, pulse, TAU } from '../engine/util';
import {
  Plot, Cam2D, gridPass, setGrid, drawKaraoke, drawPen, w2s, setWorld, label, mixCss, lineOf, wordOf, pt, placeRow,
  lengths, at, type P, type KWord, type Cam, type RGB,
} from './_vo';

export const PAPER_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 d = sp - 0.5 * uRes;
  float c = cos(-uCam.w), s = sin(-uCam.w);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / uCam.z;
  vec2 p = uCam.xy + d;
  vec3 col = C_BONE * 0.965;
  float f = fbm(vec2(p.x * 0.004, p.y * 0.05) + uSeed, 4);
  float cloud = fbm(p * 0.0025 + 3.0 + uSeed, 4);
  col *= 1.0 - 0.035 * f - 0.03 * cloud;
  vec2 g = abs(fract(p / 24.0 + 0.5) - 0.5) * 24.0 * uCam.z;
  float gl = max(1.0 - smoothstep(0.0, 1.0, g.x), 1.0 - smoothstep(0.0, 1.0, g.y));
  col = mix(col, C_GRAPHITE, 0.035 * gl);
  fragColor = vec4(col, 1.0);
}`;

export const ARCH = (wd: number, wt: number) => F.archivo(wd, wt);
/** The identity camera: world = screen, centred. */
export const SCREEN: Cam = { cx: 0, cy: 0, z: 1, roll: 0 };

/**
 * A spoken line as one or two left-aligned karaoke rows (wrapped at maxW) with their top-left row's
 * baseline at (x, y). `group` names them for Plate.alpha. Returns the words and the rows used.
 */
export function lineRows(words: Word[], x: number, y: number, size: number, fam: string, group: string, maxW: number, o: { ant?: number; lead?: number; hot?: string; done?: string } = {}) {
  const rows: Word[][] = [[]];
  let wsum = 0;
  const sp = (measure(' ', fam, 100) / 100) * size;
  for (const wd of words) {
    const ww = (measure(wd.w, fam, 100) / 100) * size;
    if (rows[rows.length - 1]!.length && wsum + sp + ww > maxW) { rows.push([]); wsum = 0; }
    wsum += (rows[rows.length - 1]!.length ? sp : 0) + ww;
    rows[rows.length - 1]!.push(wd);
  }
  const out: KWord[] = [];
  rows.forEach((r, i) => out.push(...placeRow(r, x, y + i * size * (o.lead ?? 1.18), size, fam, group, { ant: o.ant ?? 0.2, hot: o.hot, done: o.done }).words));
  return { words: out, rows: rows.length };
}
export const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export abstract class Plate extends Scene {
  plot = new Plot();
  cam = new Cam2D();
  kw: KWord[] = [];
  /** Karaoke drawn in screen space (centre = 0,0, 1 px = 1 px): captions that stay put while the camera moves. */
  screenKw: KWord[] = [];
  ui = new Layer2D();
  glowLines = new LineBatch(60000);
  inkLines = new LineBatch(40000, { blend: 'normal' });
  fx = new LineBatch(30000);
  grid = gridPass(24, 96);
  paperPass = new FSPass(PAPER_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 } });
  /** Bone-paper plate (ink lines, no glow). */
  paper = false;
  /** Draw the plotter's pen spark (dark plates). */
  showPen = true;
  /** The plate draws panels under its strokes (drawUnder): costs one more layer upload per sub-frame. */
  hasUnder = false;
  w: Record<string, Word> = {};

  /** Look up words of the line containing `q`: 'Codex' → w.codex, or [key, word, nth]. */
  take(q: string, specs: (string | [string, string, number?])[], nthLine = 0): Line {
    const l = lineOf(this.ctx.lyrics, q, nthLine);
    for (const s of specs) {
      const [k, wq, n] = typeof s === 'string' ? [keyOf(s), s, 0] : [s[0], s[1], s[2] ?? 0];
      this.w[k] = wordOf(l, wq, n);
    }
    return l;
  }
  /** Words of a line from the first match of `a` to the first match of `b` after it (inclusive). */
  span(l: Line, a: string, b: string, nthA = 0): Word[] {
    const i = l.words.indexOf(wordOf(l, a, nthA));
    const rest = l.words.slice(i);
    const j = rest.findIndex((x, k) => k >= 0 && keyOf(x.w) === keyOf(b));
    if (j < 0) throw new Error(`span end not found: ${b} in "${l.text}"`);
    return rest.slice(0, j + 1);
  }

  abstract build(): void;
  override init() {
    this.build();
    this.plot.paper = this.paper;
    this.plot.alpha = (g, t) => this.alpha(g, t);
  }
  /** Group visibility over time. */
  alpha(_g: string, _t: number) { return 1; }
  /** Camera at t (plates add hand-held drift). */
  camAt(t: number): Cam {
    const c = this.cam.at(t);
    return { cx: c.cx + 3 * noise1(t * 0.6, 11), cy: c.cy + 3 * noise1(t * 0.5, 12), z: c.z, roll: c.roll + 0.002 * noise1(t * 0.4, 13) };
  }
  gridOpts(_t: number, _c: Cam): { reveal?: [number, number, number]; fade?: number; ink?: number } { return {}; }
  drawStrokes(_L: LineBatch, _t: number, _c: Cam) {}
  drawUnder(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  drawUI(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  drawTop(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  drawFX(_X: LineBatch, _t: number, _c: Cam) {}
  postFX(_t: number): PostOverrides { return {}; }
  penScale(_t: number) { return 0.8; }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t;
    const c = this.camAt(t);
    if (this.paper) {
      (this.paperPass.u.uCam!.value as number[]).splice(0, 4, c.cx, c.cy, c.z, c.roll);
      this.paperPass.render(renderer, out);
    } else {
      const pen = this.plot.penAt(t);
      const ps = pen ? w2s(c, pen.x, pen.y) : null;
      setGrid(this.grid, c, { ink: 1, pen: ps ? [ps[0], ps[1], 1] : [0, 0, 0], ...this.gridOpts(t, c) });
      this.grid.render(renderer, out);
    }
    // panels under the strokes
    const U = this.ui;
    if (this.hasUnder) {
      U.clear();
      this.drawUnder(U.ctx, t, c);
      comp.draw(renderer, U.upload(), out);
    }
    // strokes
    const L = this.paper ? this.inkLines : this.glowLines; L.clear();
    this.plot.draw(t, c, L);
    this.drawStrokes(L, t, c);
    L.render(renderer, out);
    // type & UI
    U.clear();
    const ctx = U.ctx;
    this.drawUI(ctx, t, c);
    this.plot.drawNotes(t, c, ctx);
    drawKaraoke(ctx, c, t, this.kw, { alpha: (g, tt) => this.alpha(g, tt), paper: this.paper });
    this.drawTop(ctx, t, c);
    if (this.screenKw.length) drawKaraoke(ctx, SCREEN, t, this.screenKw, { alpha: (g, tt) => this.alpha(g, tt), paper: this.paper });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    comp.draw(renderer, U.upload(), out);
    // the pen and other light
    const X = this.fx; X.clear();
    if (this.showPen && !this.paper) drawPen(X, t, (tt) => { const q = this.plot.penAt(tt); return q ? w2s(c, q.x, q.y) : null; }, { scale: this.penScale(t), intensity: 0.8, rate: 50 });
    this.drawFX(X, t, c);
    X.render(renderer, out);
    const base: PostOverrides = this.paper
      ? { bloom: 0.15, bloomThreshold: 1.4, vignette: 0.28, grain: 0.04, halation: 0.05, ca: 0.6, paper: 1 }
      : { bloom: 0.62, bloomThreshold: 0.82, vignette: 0.42, grain: 0.05 };
    return { ...base, ...this.postFX(t) };
  }
}

// ================================================================== drawing helpers (world space)
export interface NodeOpts { a?: number; hot?: number; w?: number; h?: number; num?: string; paper?: boolean; size?: number; fill?: string; dim?: number }
/** A labelled node box centred at (x, y): ink fill, hairline border, registration ticks, mono label. */
export function drawNode(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, title: string, sub: string, o: NodeOpts = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const bw = o.w ?? 340, bh = o.h ?? 124, P = o.paper ?? false;
  const hot = clamp(o.hot ?? 0), dim = o.dim ?? 1;
  const ink = P ? 'ink' : 'bone';
  setWorld(ctx, c, x - bw / 2, y - bh / 2);
  ctx.fillStyle = o.fill ?? (P ? rgba('bone', 0.96 * a) : rgba('ink', 0.92 * a));
  ctx.fillRect(0, 0, bw, bh);
  const hair = 1.2 / c.z;
  ctx.lineWidth = hot > 0 ? hair * (1 + 1.4 * hot) : hair;
  ctx.strokeStyle = hot > 0.01 ? mixCss(ink, P ? 'blood' : 'signal', hot, 0.95 * a) : rgba(ink, 0.5 * a * dim);
  ctx.strokeRect(0, 0, bw, bh);
  ctx.strokeStyle = rgba(ink, 0.75 * a * dim);
  ctx.lineWidth = hair;
  ctx.beginPath();
  for (const [px, py, sx, sy] of [[0, 0, -1, -1], [bw, 0, 1, -1], [0, bh, -1, 1], [bw, bh, 1, 1]] as const) {
    ctx.moveTo(px + sx * 6, py); ctx.lineTo(px + sx * 18, py);
    ctx.moveTo(px, py + sy * 6); ctx.lineTo(px, py + sy * 18);
  }
  ctx.stroke();
  const size = o.size ?? 22;
  label(ctx, title, bw / 2, bh / 2 + (sub ? -2 : size * 0.36), { size, col: hot > 0.01 ? mixCss(ink, P ? 'blood' : 'signal', hot * 0.8, 0.95 * a * dim) : rgba(ink, 0.93 * a * dim), spacing: size * 0.18, align: 'center', weight: 500 });
  if (sub) {
    ctx.font = font(F.mono(400), size * 0.6);
    ctx.fillStyle = rgba(P ? 'graphite' : 'ash', 0.85 * a * dim);
    ctx.textAlign = 'center';
    ctx.fillText(sub, bw / 2, bh / 2 + size * 1.25);
    ctx.textAlign = 'left';
  }
  if (o.num) label(ctx, o.num, 0, -12, { size: 11, col: rgba(P ? 'blood' : 'signal', 0.9 * a), spacing: 3 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A hairline link from a to b, drawn to fraction k, with an arrow head when complete. Screen-space width. */
export function drawLink(ctx: CanvasRenderingContext2D, c: Cam, a: P, b: P, k: number, o: { a?: number; col?: string; width?: number; head?: boolean; dash?: number[] } = {}) {
  if (k <= 0) return;
  const p0 = w2s(c, a.x, a.y), p1 = w2s(c, lerp(a.x, b.x, k), lerp(a.y, b.y, k));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = o.col ?? rgba('bone', 0.7 * (o.a ?? 1));
  ctx.lineWidth = o.width ?? 1.4;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  ctx.setLineDash([]);
  if (k >= 1 && (o.head ?? true)) {
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), s = 11 * Math.min(1.6, c.z);
    ctx.beginPath();
    ctx.moveTo(p1[0] + Math.cos(an + 2.6) * s, p1[1] + Math.sin(an + 2.6) * s);
    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p1[0] + Math.cos(an - 2.6) * s, p1[1] + Math.sin(an - 2.6) * s);
    ctx.stroke();
  }
}

/**
 * Packets running along a polyline (world px) from t0 (and stopping at t1): a steady stream, `gap`
 * seconds apart, at `speed` world px/s. Glowing streaks in an additive LineBatch.
 */
export function packets(X: LineBatch, c: Cam, pts: P[], t: number, o: { t0: number; t1?: number; speed?: number; gap?: number; col?: RGB; I?: number; size?: number; reverse?: boolean; fadeIn?: number }) {
  if (t < o.t0) return;
  const L = lengths(pts), len = L[L.length - 1]!;
  const speed = o.speed ?? 520, gap = o.gap ?? 0.22, col = o.col ?? LIN.signal, I = o.I ?? 1.6, sz = o.size ?? 1;
  const n0 = Math.floor((t - o.t0 - len / speed) / gap) - 1, n1 = Math.floor((t - o.t0) / gap);
  for (let n = Math.max(0, n0); n <= n1; n++) {
    const tb = o.t0 + n * gap;
    if (o.t1 !== undefined && tb > o.t1) break;
    const s = (t - tb) * speed;
    if (s < 0 || s > len) continue;
    const u = o.reverse ? len - s : s;
    const q = at(pts, L, u), q0 = at(pts, L, o.reverse ? Math.min(len, u + 14) : Math.max(0, u - 14));
    const [x1, y1] = w2s(c, q.x, q.y), [x0, y0] = w2s(c, q0.x, q0.y);
    const f = (o.fadeIn ? prog(t, o.t0, o.t0 + o.fadeIn) : 1) * clamp(Math.min(s, len - s) / 30);
    X.seg2(x0, y0, x1, y1, 3 * c.z * sz, [col[0] * I * f, col[1] * I * f, col[2] * I * f], 0.9);
    X.seg2(x1, y1, x1 + 0.01, y1, 5.5 * c.z * sz, [LIN.ember[0] * 2 * I * f, LIN.ember[1] * 2 * I * f, LIN.ember[2] * 2 * I * f], 1);
  }
}

/** A window/panel: fill, hairline border, a title bar with three dots and a mono title. (x, y) = top-left. */
export function drawWindow(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, o: { a?: number; paper?: boolean; bar?: number; fill?: string } = {}) {
  const a = o.a ?? 1, P = o.paper ?? false, bar = o.bar ?? 50;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y);
  ctx.fillStyle = o.fill ?? (P ? rgba('#FBF8F1', 0.98 * a) : rgba('ink2', 0.96 * a));
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = P ? rgba('ink', 0.06 * a) : rgba('bone', 0.05 * a);
  ctx.fillRect(0, 0, w, bar);
  const hair = 1.2 / c.z;
  ctx.lineWidth = hair;
  ctx.strokeStyle = rgba(P ? 'ink' : 'bone', (P ? 0.6 : 0.35) * a);
  ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = rgba(P ? 'ink' : 'bone', (P ? 0.25 : 0.18) * a);
  ctx.fillRect(0, bar, w, hair);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(22 + i * 22, bar / 2, 6, 0, TAU); ctx.fillStyle = rgba(i === 0 ? (P ? 'blood' : 'signal') : P ? 'graphite' : 'graphite', (i === 0 ? 0.9 : 0.6) * a); ctx.fill(); }
  label(ctx, title, w / 2, bar / 2 + 7, { size: 19, col: rgba(P ? 'ink' : 'bone', 0.75 * a), spacing: 2, align: 'center' });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Mono text typed in from t0 over dur (chars appear left to right), with a signal caret while typing. Returns chars shown. */
export function typed(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, t: number, t0: number, dur: number, o: { size?: number; /** palette key or hex */ col?: string; a?: number; weight?: number; caret?: boolean; paper?: boolean; hot?: number } = {}) {
  if (t < t0) return 0;
  const n = Math.min(text.length, Math.ceil(text.length * clamp((t - t0) / Math.max(0.01, dur)) - 1e-6));
  if (n <= 0) return 0;
  const size = o.size ?? 24, fam = F.mono(o.weight ?? 400);
  setWorld(ctx, c, x, y);
  ctx.font = font(fam, size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const s = text.slice(0, n);
  const hk = o.hot ? 1 - prog(t, t0 + dur, t0 + dur + o.hot) : 0;
  const key = o.col ?? (o.paper ? 'ink' : 'bone'), al = 0.92 * (o.a ?? 1);
  ctx.fillStyle = hk > 0 ? mixCss(o.paper ? 'blood' : 'signal', key, 1 - hk, al) : rgba(key, al);
  ctx.fillText(s, 0, 0);
  if ((o.caret ?? true) && n < text.length) {
    ctx.fillStyle = rgba(o.paper ? 'blood' : 'signal', o.a ?? 1);
    ctx.fillRect(measure(s, fam, size) + 3, -size * 0.8, size * 0.55, size * 0.95);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return n;
}

/** A rubber stamp as a canvas (knocked-out ink), drawn later with drawStamp. */
export function makeStamp(text: string, top: string, bottom: string, col: string = HEX.signal, seed = 7) {
  const cv = document.createElement('canvas');
  const SW = 1400, SH = 340;
  cv.width = SW; cv.height = SH;
  const c = cv.getContext('2d')!;
  c.strokeStyle = col; c.fillStyle = col;
  c.lineWidth = 12; c.strokeRect(16, 16, SW - 32, SH - 32);
  c.lineWidth = 4; c.strokeRect(40, 40, SW - 80, SH - 80);
  const fam = F.archivo(100, 900);
  const fs = Math.min(170, (150 * (SW - 180)) / measure(text, fam, 150));
  c.font = font(fam, fs);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(text, SW / 2, 236);
  c.font = font(F.mono(500), 28);
  (c as any).letterSpacing = '9px';
  c.fillText(bottom, SW / 2, 290);
  c.fillText(top, SW / 2, 88);
  c.globalCompositeOperation = 'destination-out';
  const r = mulberry32(seed);
  for (let i = 0; i < 3600; i++) { c.globalAlpha = 0.25 + 0.75 * r(); c.beginPath(); c.arc(r() * SW, r() * SH, 0.6 + r() * 2.4, 0, 6.3); c.fill(); }
  for (let i = 0; i < 34; i++) { c.globalAlpha = 0.18 * r(); c.fillRect(r() * SW, r() * SH, 60 + r() * 300, 2 + r() * 5); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  return cv;
}
/** Slam a stamp canvas at world (x, y) from time t0; `scale` world px per stamp px, `rot` radians. */
export function drawStamp(ctx: CanvasRenderingContext2D, c: Cam, stamp: HTMLCanvasElement, x: number, y: number, t: number, t0: number, scale = 0.44, rot = -0.07, alpha = 0.92) {
  if (t < t0) return;
  const age = t - t0;
  const sc = 1 + 0.6 * (1 - ease.outExpo(clamp(age / 0.12)));
  const a = clamp(age / 0.05);
  const [sx, sy] = w2s(c, x, y);
  const k = c.z * scale * sc;
  const r = rot + c.roll;
  ctx.setTransform(k * Math.cos(r), k * Math.sin(r), -k * Math.sin(r), k * Math.cos(r), sx, sy);
  ctx.globalAlpha = alpha * a;
  ctx.drawImage(stamp, -700, -170, 1400, 340);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A rounded chip with mono text centred at (x, y). */
export function chip(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, o: { a?: number; size?: number; fill?: string; col?: string; border?: string; padX?: number; h?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return 0;
  const size = o.size ?? 20, fam = F.mono(500);
  const tw = measure(text, fam, size), pad = o.padX ?? size * 0.8, h = o.h ?? size * 1.9;
  const w = tw + 2 * pad;
  setWorld(ctx, c, x - w / 2, y - h / 2);
  ctx.globalAlpha = a;
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, h / 2);
  ctx.fillStyle = o.fill ?? rgba('ink2', 0.95); ctx.fill();
  ctx.lineWidth = 1.2 / c.z; ctx.strokeStyle = o.border ?? rgba('bone', 0.4); ctx.stroke();
  ctx.font = font(fam, size); ctx.fillStyle = o.col ?? rgba('bone', 0.92); ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, pad, h / 2 + size * 0.35);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return w;
}

/** Big display word(s) in Archivo at world (x, baseline y), with a slam-in scale and hot→cool colour. */
export function slam(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { wd?: number; wt?: number; align?: CanvasTextAlign; a?: number; /** palette keys or hex */ col?: string; hotCol?: string; paper?: boolean; tracking?: number } = {}) {
  if (t < t0) return;
  const age = t - t0;
  const sc = 1 + 0.18 * (1 - ease.outExpo(clamp(age / 0.2)));
  const fam = ARCH(o.wd ?? 100, o.wt ?? 900);
  const tw = measure(text, fam, 100, (o.tracking ?? 0) * 100) / 100 * size;
  const ax = o.align === 'center' ? -tw / 2 : o.align === 'right' ? -tw : 0;
  const cx = x + ax + tw / 2, cy = y - 0.36 * size;
  setWorld(ctx, c, cx + (x + ax - cx) * sc, cy + (y - cy) * sc, (size / 100) * sc);
  ctx.font = font(fam, 100);
  ctx.letterSpacing = `${(o.tracking ?? 0) * 100}px`;
  const hot = Math.pow(0.5, age / 0.1), cool = prog(t, t0 + 0.05, t0 + 0.5);
  const fin = o.col ?? (o.paper ? 'ink' : 'bone');
  ctx.globalAlpha = (o.a ?? 1) * clamp(age / 0.04);
  ctx.fillStyle = hot > 0.08 ? mixCss('ember', o.hotCol ?? 'signal', 1 - hot) : mixCss(o.hotCol ?? 'signal', fin, cool);
  ctx.textAlign = 'left';
  ctx.fillText(text, 0, 0);
  ctx.globalAlpha = 1;
  ctx.letterSpacing = '0px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Burst of sparks at world p from time tb (additive). */
export function burst(X: LineBatch, c: Cam, p: P, t: number, tb: number, n = 50, seed = 1, spread = 1) {
  const age = t - tb;
  if (age < 0 || age > 0.9) return;
  for (let i = 0; i < n; i++) {
    const life = 0.3 + 0.45 * hash(i, 31, seed);
    if (age > life) continue;
    const an = hash(i, 33, seed) * TAU;
    const sp = (120 + 520 * hash(i, 34, seed) ** 2) * spread;
    const pos = (a: number) => w2s(c, p.x + Math.cos(an) * sp * a, p.y + Math.sin(an) * sp * a + 420 * a * a);
    const p1 = pos(age), p0 = pos(Math.max(0, age - 0.022));
    const k = 1 - age / life;
    X.seg2(p0[0], p0[1], p1[0], p1[1], 1.1 + k, [(LIN.signal[0] + k) * 2.2, (LIN.signal[1] + 0.6 * k * k) * 2.2, (LIN.signal[2] + 0.3 * k * k) * 2.2], Math.min(1, k * 1.5));
  }
}

export { pt, w2s, setWorld, label, mixCss, clamp, ease, lerp, prog, pulse, noise1, hash, TAU, rgba, LIN, F, font, measure };
export type { P, Cam, Word, Line };
