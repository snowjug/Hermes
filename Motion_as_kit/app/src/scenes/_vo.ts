// Shared toolkit for the voiceover plates (generalised from the `open` plate of pdoom-video):
//  - Cam2D: a keyframed 2D camera (pan, zoom about the move's fixed point, roll). World = px, y down.
//  - Plot: the plotter. Strokes laid down by the pen (the spark) on a timetable, construction
//    lines, dimensions, mono notes. Everything precomputed in init(), drawn statelessly from t.
//  - Karaoke words in world space: unsaid glyphs as hairline outlines, the word being said wipes in
//    signal orange, said words cool to bone (or ink on paper).
//  - gridPass(): the graph-paper sheet behind a plotted plate.
import { FSPass, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { LIN, rgba } from '../engine/palette';
import { F, font, layout, measure, type TextLayout } from '../engine/type';
import { Lyrics, norm, type Line, type Word } from '../engine/lyrics';
import type { Lyrics as LyricsT } from '../engine/lyrics';
import { clamp, ease, lerp, noise1, prog, pulse, TAU, hash } from '../engine/util';
import { sparkHead, sparkParticles } from './_motifs';
import { strokeText, type StrokeFontName } from '../engine/stroke';
import * as THREE from 'three';

export type P = { x: number; y: number };
export type RGB = [number, number, number];
export type Ease = (x: number) => number;
export const pt = (x: number, y: number): P => ({ x, y });

// ================================================================== small helpers
export function mixCss(a: string, b: string, k: number, alpha = 1) {
  const pa = rgba(a).match(/\d+/g)!.map(Number), pb = rgba(b).match(/\d+/g)!.map(Number);
  k = clamp(k);
  return `rgba(${[0, 1, 2].map((i) => Math.round(pa[i]! + (pb[i]! - pa[i]!) * k)).join(',')},${alpha})`;
}
export const mixRGB = (a: RGB, b: RGB, k: number, s = 1): RGB => [lerp(a[0], b[0], k) * s, lerp(a[1], b[1], k) * s, lerp(a[2], b[2], k) * s];
export const scl = (a: RGB, s: number): RGB => [a[0] * s, a[1] * s, a[2] * s];

/** Polyline arc lengths and point at length (local copies keep scenes independent of util's typing). */
export function lengths(ps: P[]) {
  const L = new Float32Array(ps.length);
  for (let i = 1; i < ps.length; i++) L[i] = L[i - 1]! + Math.hypot(ps[i]!.x - ps[i - 1]!.x, ps[i]!.y - ps[i - 1]!.y);
  return L;
}
export function at(ps: P[], L: Float32Array, s: number): { x: number; y: number; a: number } {
  const n = ps.length;
  if (n === 1) return { x: ps[0]!.x, y: ps[0]!.y, a: 0 };
  s = clamp(s, 0, L[n - 1]!);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m]! < s) lo = m; else hi = m; }
  const a = ps[lo]!, b = ps[hi]!, seg = L[hi]! - L[lo]!;
  const u = seg > 0 ? (s - L[lo]!) / seg : 0;
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), a: Math.atan2(b.y - a.y, b.x - a.x) };
}
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 64): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push(pt(cx + r * Math.cos(a), cy + r * Math.sin(a))); }
  return out;
}
export function rectPts(x: number, y: number, w: number, h: number): P[] {
  return [pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h), pt(x, y)];
}
export function bezier(p0: P, p1: P, p2: P, p3: P, n = 32): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u;
    out.push(pt(v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x, v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y));
  }
  return out;
}
/** Resample a polyline to points spaced ~`step` apart (keeps corners). */
export function resample(ps: P[], step: number): P[] {
  const out: P[] = [ps[0]!];
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1]!, b = ps[i]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let k = 1; k <= n; k++) out.push(pt(lerp(a.x, b.x, k / n), lerp(a.y, b.y, k / n)));
  }
  return out;
}

/** Spaced mono caps label (the plates' UI voice). Returns its width. */
export function label(c: CanvasRenderingContext2D, text: string, x: number, y: number, o: { size?: number; col?: string; spacing?: number; weight?: number; align?: CanvasTextAlign } = {}) {
  const size = o.size ?? 13, sp = o.spacing ?? 3;
  c.font = font(F.mono(o.weight ?? 500), size);
  c.letterSpacing = `${sp}px`;
  c.fillStyle = o.col ?? rgba('bone', 0.6);
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
  const w = measure(text, F.mono(o.weight ?? 500), size, sp);
  c.letterSpacing = '0px';
  c.textAlign = 'left';
  return w;
}
/** A small right-pointing filled triangle centred at (x, y), half-height r (Plex Mono has no ▸). */
export function triangle(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath();
  c.moveTo(x - r * 0.8, y - r); c.lineTo(x + r * 0.9, y); c.lineTo(x - r * 0.8, y + r);
  c.closePath();
  c.fill();
}
/** The keycap's return arrow (⏎ is not in Plex Mono), centred at (x, y), half-size a. */
export function returnArrow(c: CanvasRenderingContext2D, x: number, y: number, a: number) {
  c.beginPath();
  c.moveTo(x + a, y - a); c.lineTo(x + a, y + a * 0.25); c.lineTo(x - a, y + a * 0.25);
  c.moveTo(x - a + a * 0.45, y + a * 0.25 - a * 0.45); c.lineTo(x - a, y + a * 0.25); c.lineTo(x - a + a * 0.45, y + a * 0.25 + a * 0.45);
  c.stroke();
}
/** A drawn arrow head (→ in Archivo is fine, but drawn arrows match the hairlines). */
export function arrowHead(c: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number) {
  c.beginPath();
  c.moveTo(x + Math.cos(ang + 2.6) * s, y + Math.sin(ang + 2.6) * s);
  c.lineTo(x, y);
  c.lineTo(x + Math.cos(ang - 2.6) * s, y + Math.sin(ang - 2.6) * s);
  c.stroke();
}

// ================================================================== the script
/** Line containing `q` (throws while authoring if missing). */
export const lineOf = (ly: LyricsT, q: string, nth = 0) => ly.get(q, nth);
/** Word in a line by normalised text (nth occurrence). */
export function wordOf(l: Line, q: string, nth = 0): Word {
  const n = norm(q);
  const ws = l.words.filter((w) => norm(w.w) === n);
  const w = ws[nth];
  if (!w) throw new Error(`word not found: "${q}" in "${l.text}"`);
  return w;
}
/** Times of the spoken parts of a word (its syllable spans, or the word itself). */
export const parts = (w: Word): [number, number][] => (w.syl && w.syl.length ? w.syl : [[w.start, w.end]]);

// ================================================================== camera
export interface Cam { cx: number; cy: number; z: number; roll: number }
export interface CamKey extends Cam { t: number; ez?: Ease }

export class Cam2D {
  keys: CamKey[] = [];
  /** Keyframe at t; the ease shapes the move that ARRIVES here. */
  key(t: number, cx: number, cy: number, z: number, roll = 0, ez?: Ease) {
    this.keys.push({ t, cx, cy, z, roll, ez });
    this.keys.sort((a, b) => a.t - b.t);
    return this;
  }
  at(t: number): Cam {
    const ks = this.keys;
    if (!ks.length) return { cx: W / 2, cy: H / 2, z: 1, roll: 0 };
    if (t <= ks[0]!.t) return ks[0]!;
    for (let i = 1; i < ks.length; i++) {
      const b = ks[i]!;
      if (t > b.t) continue;
      const a = ks[i - 1]!;
      const k = (b.ez ?? ease.inOutCubic)(clamp((t - a.t) / Math.max(1e-4, b.t - a.t)));
      const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), k));
      const roll = lerp(a.roll, b.roll, k);
      // zoom about the fixed point of the move: dives and pull-backs read as one gesture
      if (Math.abs(b.z - a.z) > a.z * 0.04) {
        const fx = (b.z * b.cx - a.z * a.cx) / (b.z - a.z), fy = (b.z * b.cy - a.z * a.cy) / (b.z - a.z);
        return { cx: fx - (a.z / z) * (fx - a.cx), cy: fy - (a.z / z) * (fy - a.cy), z, roll };
      }
      return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), z, roll };
    }
    return ks[ks.length - 1]!;
  }
}
export function w2s(c: Cam, x: number, y: number): [number, number] {
  const dx = (x - c.cx) * c.z, dy = (y - c.cy) * c.z;
  const co = Math.cos(c.roll), si = Math.sin(c.roll);
  return [W / 2 + co * dx - si * dy, H / 2 + si * dx + co * dy];
}
export function s2w(c: Cam, sx: number, sy: number): P {
  const dx = sx - W / 2, dy = sy - H / 2;
  const co = Math.cos(-c.roll), si = Math.sin(-c.roll);
  return pt(c.cx + (co * dx - si * dy) / c.z, c.cy + (si * dx + co * dy) / c.z);
}
/** Canvas transform so that drawing at (0,0) lands on world (x,y), 1 unit = scale world px, extra rotation. */
export function setWorld(ctx: CanvasRenderingContext2D, c: Cam, x = 0, y = 0, scale = 1, rot = 0, j: [number, number] = [0, 0]) {
  const [sx, sy] = w2s(c, x, y);
  const k = c.z * scale, a = c.roll + rot;
  ctx.setTransform(k * Math.cos(a), k * Math.sin(a), -k * Math.sin(a), k * Math.cos(a), sx + j[0], sy + j[1]);
}

// ================================================================== the plotter
export type Kind = 'axis' | 'cons' | 'prim' | 'dim' | 'hatch' | 'plot' | 'ghost' | 'ink' | 'signal';
export interface Stroke {
  pts: P[]; L: Float32Array; tot: number;
  t0: number; t1: number; kind: Kind; pen: boolean; ez: Ease;
  alpha: number; width: number; dash: number; group: string; tD: Float32Array;
  /** Optional fixed colour (linear) instead of the kind's. */
  col?: RGB;
  /** Erase: the stroke retracts from its start over [e0, e1]. */
  e0?: number; e1?: number;
}
export interface Note {
  text: string; x: number; y: number; size: number; t0: number; dur: number;
  col: string; a: number; align: CanvasTextAlign; rot: number; group: string; weight: number;
  hot: number; fam: 'mono' | 'serif' | 'serifI' | 'archivo'; spacing: number; maxPx: number; caret: boolean;
}
type AddOpts = Partial<Pick<Stroke, 'pen' | 'ez' | 'alpha' | 'width' | 'dash' | 'group' | 'col' | 'e0' | 'e1'>>;

export class Plot {
  strokes: Stroke[] = [];
  pens: Stroke[] = [];
  notes: Note[] = [];
  /** Group visibility over time (scenes override). */
  alpha: (group: string, t: number) => number = () => 1;
  /** Paper plates: ink instead of bone, blood instead of ember. */
  paper = false;

  add(pts: P[], t0: number, t1: number, kind: Kind, o: AddOpts = {}) {
    const L = lengths(pts);
    const tot = L[L.length - 1]!;
    const ez = o.ez ?? ease.linear;
    const tD = new Float32Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      const target = tot > 0 ? L[i]! / tot : 1;
      let lo = 0, hi = 1;
      for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (ez(m) < target) lo = m; else hi = m; }
      tD[i] = t0 + (t1 - t0) * hi;
    }
    const s: Stroke = { pts, L, tot, t0, t1, kind, pen: o.pen ?? false, ez, alpha: o.alpha ?? 1, width: o.width ?? 1.2, dash: o.dash ?? 0, group: o.group ?? 'main', tD, col: o.col, e0: o.e0, e1: o.e1 };
    this.strokes.push(s);
    if (s.pen) { this.pens.push(s); this.pens.sort((a, b) => a.t0 - b.t0); }
    return s;
  }
  /** A pen waypoint: the pen rests at p at time t (it travels there before). */
  wp(p: P, t: number, hold = 0.001) { return this.add([p, pt(p.x + 1e-3, p.y)], t, t + Math.max(1e-3, hold), 'ghost', { pen: true, alpha: 0 }); }
  note(text: string, x: number, y: number, t0: number, o: Partial<Omit<Note, 'text' | 'x' | 'y' | 't0'>> = {}) {
    const n: Note = {
      text, x, y, t0, size: o.size ?? 14, dur: o.dur ?? Math.min(0.45, 0.012 * text.length + 0.05), col: o.col ?? 'ash', a: o.a ?? 0.9,
      align: o.align ?? 'left', rot: o.rot ?? 0, group: o.group ?? 'main', weight: o.weight ?? 400, hot: o.hot ?? 0,
      fam: o.fam ?? 'mono', spacing: o.spacing ?? 0, maxPx: o.maxPx ?? 400, caret: o.caret ?? true,
    };
    this.notes.push(n);
    return n;
  }
  /** Engineering dimension between a and b: line, end ticks, arrowheads, the value. */
  dimension(a: P, b: P, label: string, t0: number, group: string, size = 13, side = 1) {
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    const ux = dx / l, uy = dy / l, nx = -uy * side, ny = ux * side;
    const S = (pts: P[], ta: number, tb: number) => this.add(pts, ta, tb, 'dim', { alpha: 0.8, width: 1.0, group });
    S([a, b], t0, t0 + 0.14);
    const ar = 9;
    for (const [p, s] of [[a, 1], [b, -1]] as const) {
      S([pt(p.x + s * ux * ar + nx * ar * 0.35, p.y + s * uy * ar + ny * ar * 0.35), p, pt(p.x + s * ux * ar - nx * ar * 0.35, p.y + s * uy * ar - ny * ar * 0.35)], t0 + 0.1, t0 + 0.14);
      S([pt(p.x - nx * 8, p.y - ny * 8), pt(p.x + nx * 8, p.y + ny * 8)], t0, t0 + 0.05);
    }
    const m = pt((a.x + b.x) / 2, (a.y + b.y) / 2);
    const vert = Math.abs(dy) > Math.abs(dx);
    this.note(label, m.x + (vert ? -8 : 0), m.y + (vert ? size * 0.35 : -7), t0 + 0.12, { size, align: vert ? 'right' : 'center', col: 'ash', group, dur: 0.08 });
  }

  /**
   * Write `text` in a single-stroke font with the pen, each word's strokes while that word is said.
   * `words[k]` is the Word for the k-th space-separated token. (x, y) = left end of the baseline.
   */
  writeWords(text: string, words: Word[], fontName: StrokeFontName, size: number, x: number, y: number, group: string, o: { width?: number; kind?: Kind; endEarly?: number; tracking?: number; minDur?: number } = {}) {
    const st = strokeText(text, fontName, size, o.tracking ?? 0);
    const chars = Array.from(text);
    const tokOf: number[] = [];
    let k = 0;
    for (const ch of chars) { if (ch === ' ') { tokOf.push(-1); k++; } else tokOf.push(k); }
    const byTok = new Map<number, number[]>();
    st.strokes.forEach((_, i) => { const tk = tokOf[st.charOf[i]!]!; if (tk >= 0) { if (!byTok.has(tk)) byTok.set(tk, []); byTok.get(tk)!.push(i); } });
    for (const [tk, ids] of byTok) {
      const w = words[Math.min(tk, words.length - 1)]!;
      const t0 = w.start, t1 = Math.max(t0 + (o.minDur ?? 0.12), w.end - (o.endEarly ?? 0.04));
      const lens = ids.map((i) => st.lens[i]![st.lens[i]!.length - 1] ?? 0);
      const tot = lens.reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      ids.forEach((i, j) => {
        const a = t0 + (t1 - t0) * (acc / tot), b = t0 + (t1 - t0) * ((acc + lens[j]!) / tot);
        acc += lens[j]!;
        const pts = st.strokes[i]!.map((p) => pt(x + p.x, y + p.y));
        if (pts.length >= 2) this.add(pts, a, b, o.kind ?? 'plot', { pen: true, width: o.width ?? 1.6, group });
        else if (pts.length === 1) this.add([pts[0]!, pt(pts[0]!.x + 0.5, pts[0]!.y)], a, b, o.kind ?? 'plot', { pen: true, width: (o.width ?? 1.6) * 1.6, group });
      });
    }
    return st;
  }

  /** Pen position (world) at t; between strokes it travels with a quick ease (rapid plotter moves). */
  penAt(t: number): P | null {
    const ps = this.pens;
    if (!ps.length) return null;
    let prev: Stroke | null = null;
    for (const s of ps) {
      if (t < s.t0) {
        const from = prev ? prev.pts[prev.pts.length - 1]! : s.pts[0]!;
        const to = s.pts[0]!;
        const tPrev = prev ? prev.t1 : s.t0 - 1;
        const d = Math.hypot(to.x - from.x, to.y - from.y);
        const dur = Math.min(s.t0 - tPrev, clamp(0.08 + d * 0.00035, 0.08, 0.3));
        const k = ease.inOutCubic(clamp((t - (s.t0 - dur)) / Math.max(1e-4, dur)));
        return pt(lerp(from.x, to.x, k), lerp(from.y, to.y, k));
      }
      if (t <= s.t1) {
        const k = s.ez(clamp((t - s.t0) / Math.max(1e-4, s.t1 - s.t0)));
        const q = at(s.pts, s.L, k * s.tot);
        return pt(q.x, q.y);
      }
      prev = s;
    }
    return prev ? prev.pts[prev.pts.length - 1]! : null;
  }

  /** Draw every stroke laid down by t: the fresh part glows ember and cools through signal to its kind's colour. */
  draw(t: number, c: Cam, L: LineBatch, jit?: (x: number, y: number) => [number, number], opacity = 1) {
    const J = jit ?? ((x: number, y: number) => w2s(c, x, y));
    const P = this.paper;
    const bone = P ? LIN.ink : LIN.bone, ash = P ? LIN.graphite : LIN.ash, sig = P ? LIN.blood : LIN.signal, emb = P ? LIN.signal : LIN.ember;
    for (const s of this.strokes) {
      if (t < s.t0 || s.alpha <= 0) continue;
      const ga = this.alpha(s.group, t) * opacity;
      if (ga <= 0.002) continue;
      const k = s.ez(clamp((t - s.t0) / Math.max(1e-4, s.t1 - s.t0)));
      const head = k * s.tot;
      const tail = s.e0 !== undefined && s.e1 !== undefined ? ease.inOutCubic(prog(t, s.e0, s.e1)) * s.tot : 0;
      if (tail >= head - 1e-3 && tail > 0) continue;
      let base: RGB, a0: number, hot: number;
      switch (s.kind) {
        case 'axis': base = ash; a0 = 0.6; hot = 0.8; break;
        case 'cons': base = ash; a0 = 0.5; hot = 0.6; break;
        case 'dim': base = ash; a0 = 0.85; hot = 0.5; break;
        case 'hatch': base = bone; a0 = 0.55; hot = 1; break;
        case 'plot': base = bone; a0 = 0.88; hot = 1; break;
        case 'signal': base = scl(LIN.signal, P ? 1 : 1.25); a0 = 1; hot = 1; break;
        case 'ink': base = bone; a0 = 0.95; hot = 0.7; break;
        default: base = bone; a0 = 0.85; hot = 1;
      }
      if (s.col) base = s.col;
      const A = a0 * s.alpha * ga;
      let prev: [number, number] | null = null;
      let acc = 0;
      // first point: skip to the tail
      let i0 = 0;
      while (i0 + 1 < s.pts.length && s.L[i0 + 1]! <= tail) i0++;
      for (let i = i0; i < s.pts.length; i++) {
        let p = s.pts[i]!;
        let stop = false;
        if (i === i0 && tail > 0) { const q = at(s.pts, s.L, tail); p = pt(q.x, q.y); }
        else if (s.L[i]! > head) {
          if (i === 0) break;
          const q = at(s.pts, s.L, head);
          p = pt(q.x, q.y);
          stop = true;
        }
        const cur = J(p.x, p.y);
        if (prev) {
          const segLen = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
          const age = t - Math.min(s.tD[i]!, t);
          const h1 = hot * Math.exp(-age / 0.05), h2 = hot * Math.exp(-age / 0.32);
          const col: RGB = [
            base[0] * (1 - h2) + sig[0] * 1.5 * h2 + emb[0] * (P ? 1 : 2.6) * h1,
            base[1] * (1 - h2) + sig[1] * 1.5 * h2 + emb[1] * (P ? 1 : 2.6) * h1,
            base[2] * (1 - h2) + sig[2] * 1.5 * h2 + emb[2] * (P ? 1 : 2.6) * h1,
          ];
          const al = Math.min(1, A + h2 * 0.8 * ga);
          const wd = s.width * (1 + 0.6 * h1);
          if (s.dash > 0) {
            let u0 = 0;
            while (u0 < segLen) {
              const ph = (acc + u0) % s.dash;
              const on = ph < s.dash * 0.55;
              const run = Math.min(segLen - u0, on ? s.dash * 0.55 - ph : s.dash - ph);
              if (on && run > 0.05) {
                const a1 = u0 / segLen, b1 = (u0 + run) / segLen;
                L.seg2(lerp(prev[0], cur[0], a1), lerp(prev[1], cur[1], a1), lerp(prev[0], cur[0], b1), lerp(prev[1], cur[1], b1), wd, col, al);
              }
              u0 += Math.max(run, 0.05);
            }
          } else L.seg2(prev[0], prev[1], cur[0], cur[1], wd, col, al);
          acc += segLen;
        }
        prev = cur;
        if (stop) break;
      }
    }
  }

  /** Mono (or serif) notes typed in at their times; the typing caret is a signal block. */
  drawNotes(t: number, c: Cam, ctx: CanvasRenderingContext2D, opacity = 1) {
    ctx.textBaseline = 'alphabetic';
    for (const n of this.notes) {
      if (t < n.t0) continue;
      const px = c.z * n.size;
      const sizeA = clamp(px / 6 - 0.6) * (1 - clamp((px - n.maxPx) / (n.maxPx * 0.6)));
      const ga = this.alpha(n.group, t) * sizeA * opacity;
      if (ga <= 0.003) continue;
      const shown = Math.min(n.text.length, Math.ceil(n.text.length * clamp((t - n.t0) / Math.max(0.01, n.dur)) - 1e-6));
      if (shown <= 0) continue;
      setWorld(ctx, c, n.x, n.y, n.size / 100, n.rot);
      const fam = n.fam === 'mono' ? F.mono(n.weight) : n.fam === 'serif' ? F.serif(n.weight) : n.fam === 'serifI' ? F.serif(n.weight, true) : F.archivo(100, n.weight);
      ctx.font = font(fam, 100);
      ctx.letterSpacing = `${n.spacing * 100}px`;
      ctx.textAlign = n.align;
      const hk = n.hot > 0 ? 1 - prog(t, n.t0 + n.dur, n.t0 + n.dur + n.hot) : 0;
      ctx.fillStyle = hk > 0 ? mixCss(n.col, this.paper ? 'blood' : 'signal', hk, n.a * ga) : rgba(n.col, n.a * ga);
      const s = n.align === 'left' ? n.text.slice(0, shown) : n.text;
      ctx.fillText(s, 0, 0);
      if (n.caret && shown < n.text.length && n.align === 'left') {
        ctx.fillStyle = rgba(this.paper ? 'blood' : 'signal', ga);
        ctx.fillRect(ctx.measureText(s).width + 6, -74, 54, 88);
      }
      ctx.letterSpacing = '0px';
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

// ================================================================== the spark as a pen
/**
 * The pen's head (spark) with its hot trail and sputter, drawn into an additive 2D LineBatch.
 * `headAt(t)` = screen position of the head (or null when the pen is away).
 */
export function drawPen(X: LineBatch, t: number, headAt: (t: number) => [number, number] | null, o: { scale?: number; intensity?: number; rate?: number; seed?: number; trail?: number; speed?: number; from?: number } = {}) {
  const h = headAt(t);
  if (!h) return;
  const from = o.from ?? -1e9;
  let prev = h;
  let trail = 0;
  const maxTrail = o.trail ?? 90;
  for (let i = 1; i <= 12; i++) {
    const tt = t - i * 0.007;
    if (tt < from) break;
    const s = headAt(tt);
    if (!s) break;
    const k = 1 - i / 13;
    trail += Math.hypot(s[0] - prev[0], s[1] - prev[1]);
    const fade = 1 - clamp((trail - maxTrail) / 60);
    if (fade <= 0) break;
    X.seg2(prev[0], prev[1], s[0], s[1], 2.0 * k + 0.6, [LIN.ember[0] * 3 * k * fade, LIN.ember[1] * 3 * k * fade, LIN.ember[2] * 3 * k * fade], k * fade);
    prev = s;
  }
  const I = o.intensity ?? 1;
  if (o.rate !== 0) sparkParticles(X, t, (tb) => { if (tb < from) return null; const q = headAt(tb); return q ? { x: q[0], y: q[1] } : null; }, { rate: o.rate ?? 60, intensity: 0.9 * I, speed: o.speed ?? 220, seed: o.seed ?? 17, life: 0.42 });
  sparkHead(X, h[0], h[1], t, o.scale ?? 1, I);
}

// ================================================================== karaoke words
export interface KWord {
  w: Word; text: string; x: number; y: number; size: number; fam: string; lay: TextLayout;
  group: string; tAnt: number; tracking: number;
  /** Per-word style overrides. */
  hot?: string; done?: string; outline?: boolean;
}
/** Lay out words as one row from (x, baseline y); returns the words and the row's width. */
export function placeRow(words: Word[], x: number, y: number, size: number, fam: string, group: string, o: { texts?: string[]; ant?: number; tracking?: number; gap?: number; hot?: string; done?: string } = {}) {
  const out: KWord[] = [];
  const tr = o.tracking ?? 0;
  const sp = (o.gap ?? 1) * (layout(' ', fam, 100).width / 100) * size;
  let cx = x;
  words.forEach((wd, i) => {
    const tx = o.texts?.[i] ?? wd.w;
    const lay = layout(tx, fam, 100, tr * 100);
    out.push({ w: wd, text: tx, x: cx, y, size, fam, lay, group, tAnt: wd.start - (o.ant ?? 0.3), tracking: tr, hot: o.hot, done: o.done });
    cx += (lay.width / 100) * size + sp;
  });
  return { words: out, width: cx - sp - x };
}
/** Width (world px) of a row of display strings at `size`. */
export function rowWidth(texts: string[], size: number, fam: string, tracking = 0, gap = 1) {
  const sp = gap * (layout(' ', fam, 100).width / 100) * size;
  return texts.reduce((a, s) => a + (layout(s, fam, 100, tracking * 100).width / 100) * size, 0) + sp * (texts.length - 1);
}
/** Em size at which a row of display strings is exactly `width` wide (capped at max). */
export function fitRow(texts: string[], width: number, fam: string, max = 400, tracking = 0) {
  return Math.min(max, width / Math.max(1e-3, rowWidth(texts, 1, fam, tracking)));
}

export interface KaraokeOpts {
  /** Group alpha. */
  alpha?: (g: string, t: number) => number;
  /** Paper plate: said words settle to ink, outlines in ink. */
  paper?: boolean;
  /** Per-glyph jitter (screen px). */
  jitter?: (kw: KWord, gi: number) => [number, number];
  /** Outline the unsaid glyphs (default true). */
  outline?: boolean;
  /** Extra per-glyph scale pop on each word onset. */
  pop?: number;
  /** Override the per-glyph progress (e.g. one glyph per syllable). */
  progress?: (kw: KWord, gi: number, t: number) => number | null;
}
/**
 * Karaoke in world space. Unsaid: hairline outline (ash). Being said: a left-to-right wipe in
 * signal orange. Said: cools to bone over 0.3 s (ink on paper).
 */
export function drawKaraoke(ctx: CanvasRenderingContext2D, c: Cam, t: number, kws: KWord[], o: KaraokeOpts = {}) {
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  for (const kw of kws) {
    if (t < kw.tAnt) continue;
    const ga = o.alpha ? o.alpha(kw.group, t) : 1;
    if (ga <= 0.003) continue;
    const px = c.z * kw.size;
    if (px < 3 || px > 6000) continue;
    const ant = prog(t, kw.tAnt, kw.tAnt + 0.18);
    const p = Lyrics.wordProgress(kw.w, t);
    const done = prog(t, kw.w.end, kw.w.end + 0.3);
    const n = kw.lay.glyphs.length;
    ctx.font = font(kw.fam, 100);
    ctx.letterSpacing = `${kw.tracking * 100}px`;
    const pop = o.pop ? 1 + o.pop * pulse(t, kw.w.start, 0.07) : 1;
    for (const g of kw.lay.glyphs) {
      if (g.ch === ' ') continue;
      const j = o.jitter ? o.jitter(kw, g.i) : [0, 0] as [number, number];
      const gx = kw.x + (g.x / 100) * kw.size, gy = kw.y;
      if (pop !== 1) {
        const cx = kw.x + ((g.x + g.w / 2) / 100) * kw.size, cy = kw.y - 0.36 * kw.size;
        setWorld(ctx, c, cx + (gx - cx) * pop, cy + (gy - cy) * pop, (kw.size / 100) * pop, 0, j);
      } else setWorld(ctx, c, gx, gy, kw.size / 100, 0, j);
      const custom = o.progress ? o.progress(kw, g.i, t) : null;
      const gp = custom ?? clamp(p * n - g.i);
      if (gp < 1 && (o.outline ?? true) && kw.outline !== false) {
        ctx.lineWidth = (1.1 * 100) / px;
        ctx.strokeStyle = o.paper ? rgba('ink', 0.3 * ant * ga) : rgba('ash', 0.45 * ant * ga);
        ctx.strokeText(g.ch, 0, 0);
      }
      if (gp > 0) {
        ctx.save();
        if (gp < 1) { ctx.beginPath(); ctx.rect(-20, -130, g.w * gp + 20, 190); ctx.clip(); }
        const hot = kw.hot ?? (o.paper ? 'signal' : 'signal');
        const fin = kw.done ?? (o.paper ? 'ink' : 'bone');
        ctx.fillStyle = done < 1 ? mixCss(hot, fin, done) : rgba(fin, 1);
        ctx.globalAlpha = ga;
        ctx.fillText(g.ch, 0, 0);
        ctx.restore();
      }
    }
    ctx.letterSpacing = '0px';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ================================================================== graph paper
/** Graph-paper sheet in world px (y down) under a Cam2D: minor/major lines, a reveal disc, fade. */
export function gridPass(minor = 24, major = 96) {
  return new FSPass(/* glsl */ `
    uniform vec4 uCam;      // cx, cy, zoom, roll
    uniform vec2 uRes;
    uniform vec3 uReveal;   // centre x, y (world), radius (world px)
    uniform float uFade, uMinor, uMajor, uInk, uPaper;
    uniform vec3 uPen;      // pen screen xy (px, y down), intensity
    void main() {
      vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
      vec2 d = sp - 0.5 * uRes;
      float c = cos(-uCam.w), s = sin(-uCam.w);
      d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / uCam.z;
      vec2 p = uCam.xy + d;
      vec2 g1 = abs(fract(p / uMinor + 0.5) - 0.5) * uMinor * uCam.z;
      vec2 g4 = abs(fract(p / uMajor + 0.5) - 0.5) * uMajor * uCam.z;
      float minor = max(1.0 - smoothstep(0.0, 1.0, g1.x), 1.0 - smoothstep(0.0, 1.0, g1.y));
      float major = max(1.0 - smoothstep(0.25, 1.25, g4.x), 1.0 - smoothstep(0.25, 1.25, g4.y));
      float dens = smoothstep(4.0, 12.0, uMinor * uCam.z);
      float rr = length(p - uReveal.xy);
      float rev = smoothstep(uReveal.z, uReveal.z - 600.0, rr);
      float front = exp(-abs(rr - uReveal.z) / 220.0) * step(1.0, uReveal.z) * (1.0 - smoothstep(2600.0, 4200.0, uReveal.z));
      vec3 base = mix(C_INK, C_BONE * 0.92, uPaper);
      vec3 ink = mix(C_BONE, C_INK, uPaper);
      vec3 col = base;
      col += (ink - base) * (minor * 0.011 * dens + major * 0.03) * rev * uInk * (uPaper > 0.5 ? 3.0 : 1.0);
      col += C_SIGNAL * (minor * dens * 0.5 + major) * front * 0.09 * (1.0 - uPaper);
      float pd = length(sp - uPen.xy);
      col += C_SIGNAL * 0.018 * uPen.z * exp(-pd * pd / (2.0 * 140.0 * 140.0)) * (1.0 - uPaper);
      col *= 1.0 - uFade;
      fragColor = vec4(col, 1.0);
    }`, {
    uCam: { value: new THREE.Vector4(W / 2, H / 2, 1, 0) }, uRes: { value: new THREE.Vector2(W, H) },
    uReveal: { value: new THREE.Vector3(W / 2, H / 2, 1e5) }, uFade: { value: 0 }, uMinor: { value: minor }, uMajor: { value: major },
    uInk: { value: 1 }, uPaper: { value: 0 }, uPen: { value: new THREE.Vector3(0, 0, 0) },
  });
}
export function setGrid(g: FSPass, c: Cam, o: { reveal?: [number, number, number]; fade?: number; ink?: number; pen?: [number, number, number]; paper?: number } = {}) {
  (g.u.uCam!.value as THREE.Vector4).set(c.cx, c.cy, c.z, c.roll);
  if (o.reveal) (g.u.uReveal!.value as THREE.Vector3).set(...o.reveal);
  g.u.uFade!.value = o.fade ?? 0;
  g.u.uInk!.value = o.ink ?? 1;
  g.u.uPaper!.value = o.paper ?? 0;
  (g.u.uPen!.value as THREE.Vector3).set(...(o.pen ?? [0, 0, 0]));
}

// ================================================================== misc
/** Deterministic per-frame flicker in [0,1). */
export const flick = (t: number, i: number, seed = 1) => hash(i, Math.round(t * 60), seed);
/** Quick shake vector. */
export const shake = (t: number, a: number, f = 45): [number, number] => [a * noise1(t * f, 3), a * noise1(t * f * 1.13, 4)];
export { TAU };
