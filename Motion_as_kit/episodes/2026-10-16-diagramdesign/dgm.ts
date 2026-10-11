// The Diagram Design video's look (theme `axon`): the video is drawn the way the skill draws. A dark drafting canvas
// with a dot grid on a 4 px rhythm that travels with the camera; nodes are hairline rounded boxes with a mono tag
// chip, a title and a mono sublabel; edges route at right angles and draw themselves with an arrowhead; one coral
// accent marks the one thing that matters, with a single blue for secondary flow. Titles are a serif with a mono
// eyebrow, like the skill's own headers. Scenes hand over with whip pans (the 4 sub-frames per frame blur them);
// captions sit in a hairline caption node at the bottom, the spoken word in coral.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export { clamp, ease, hash, lerp, springStep, TAU };
export const BG = '#0B0E13';
export const PANEL = '#121720';
export const PANEL2 = '#181F2A';
export const TEXT = '#E8EDF4';
export const MUTED = '#8A94A6';
export const HAIR = 'rgba(214,222,235,0.55)';
export const FAINT = 'rgba(214,222,235,0.18)';
export const CORAL = '#FF6A45';
export const BLUE = '#5B8CFF';
export const GREEN = '#3DDC97';
export const SERIF = F.serif(400);
export const SERIFB = F.serif(600);
export const SERIFI = F.serif(400, true);
export const SANS = F.archivo(100, 600);
export const SANSB = F.archivo(100, 800);
export const MONO = F.mono(400);
export const MONOB = F.mono(600);
/** outBack that is exactly 0 at 0 */
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));
export type XY = [number, number];

// ------------------------------------------------------------------ the canvas
const CANVAS_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 d = sp - 0.5 * uRes;
  float c = cos(-uCam.w), s = sin(-uCam.w);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / uCam.z;
  vec2 p = uCam.xy + d;
  vec2 q = sp / uRes;
  vec3 col = vec3(0.043, 0.055, 0.075);
  // a soft lift in the middle of the frame
  col += vec3(0.03, 0.035, 0.05) * smoothstep(0.75, 0.0, length((q - vec2(0.5, 0.45)) * vec2(1.0, 1.3)));
  // the dot grid every 24 px, the major lines every 96 px
  vec2 g = abs(fract(p / 24.0 + 0.5) - 0.5) * 24.0 * uCam.z;
  float dotm = 1.0 - smoothstep(0.6, 1.6, length(g));
  col += vec3(0.55, 0.6, 0.7) * 0.10 * dotm;
  vec2 G = abs(fract(p / 96.0 + 0.5) - 0.5) * 96.0 * uCam.z;
  float gl = max(1.0 - smoothstep(0.0, 1.0, G.x), 1.0 - smoothstep(0.0, 1.0, G.y));
  col += vec3(0.55, 0.6, 0.7) * 0.022 * gl;
  col *= 1.0 - 0.45 * dot(q - 0.5, q - 0.5);
  col += (hash12(sp + floor(uTime * 24.0) * 13.0) - 0.5) * 0.018;
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Dgm extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(CANVAS_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
  caps = true;
  override init() {
    super.init();
    this.chunks = makeChunks(this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2), this.ctx.end);
  }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    this.paperPass.u.uTime!.value = f.t;
    return super.render(f, out);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.stage(ctx, t, c); }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.caps) drawChunks(ctx, this.chunks, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.38, bloomThreshold: 0.72, vignette: 0.3, grain: 0.03, halation: 0.12, ca: 0.2, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.015) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
  /** start / end of a taken word */
  s(k: string, d = 0) { return this.w[k]!.start + d; }
  e(k: string, d = 0) { return this.w[k]!.end + d; }
  /** 0..1 over dur seconds from word k's start (+ d) */
  on(t: number, k: string, dur = 0.3, d = 0) { return clamp((t - this.w[k]!.start - d) / dur); }
  /**
   * The plate's camera: whip in from `from` (offset x, y and a zoom factor), settle on (x, y, z), drift by `drift`
   * (a zoom factor over the hold), and whip out towards `to`.
   */
  frame(x: number, y: number, z: number, o: { from?: [number, number, number]; to?: [number, number, number]; drift?: number; hold?: [number, number] } = {}) {
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    const f = o.from ?? [-900, 0, 1], to = o.to ?? [900, 0, 1], d = o.drift ?? 0.03;
    K.key(s, x + f[0], y + f[1], z * f[2]);
    K.key(s + 0.5, x, y, z, 0, ease.outExpo);
    const [hx, hy] = o.hold ?? [0, 0];
    K.key(e - 0.26, x + hx, y + hy, z * (1 + d), 0, ease.inOutQuad);
    K.key(e, x + hx + to[0], y + hy + to[1], z * (1 + d) * to[2], 0, ease.inExpo);
  }
}

// ------------------------------------------------------------------ captions: a hairline caption node
const CAPS = { size: 46, maxW: 1300, y: 446, maxWords: 7 };
const CAPF = F.archivo(100, 600);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size);
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      const texts = cur.map((w) => w.w);
      const xs: number[] = []; let x = 0;
      texts.forEach((s, i) => { xs.push(x); x += measure(s, CAPF, CAPS.size) + (i < texts.length - 1 ? sp : 0); });
      out.push({ words: cur, texts, xs, width: x, start: cur[0]!.start, end: cur[cur.length - 1]!.end });
      cur = [];
    };
    for (const w of l.words) {
      const trial = [...cur, w].map((x) => x.w).join(' ');
      if (cur.length && (cur.length >= CAPS.maxWords || measure(trial, CAPF, CAPS.size) > CAPS.maxW)) flush();
      cur.push(w);
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 3) flush();
    }
    flush();
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.1, c.end + 1.0) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  for (const ch of chunks) {
    if (t < ch.start - 0.1 || t > ch.end) continue;
    const a = clamp((t - ch.start + 0.1) / 0.12) * clamp((ch.end - t) / 0.08);
    const pad = 30, tagW = 58, bw = ch.width + pad * 2 + tagW, bh = 84;
    const cx = W / 2, cy = H / 2 + CAPS.y;
    const grow = ease.outExpo(clamp((t - ch.start + 0.1) / 0.25));
    ctx.setTransform(1, 0, 0, 1, cx, cy);
    ctx.globalAlpha = a;
    // the node
    ctx.fillStyle = 'rgba(14,18,25,0.88)'; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-(bw / 2) * (0.94 + 0.06 * grow), -bh / 2, bw * (0.94 + 0.06 * grow), bh, 8); ctx.fill(); ctx.stroke();
    // the tag
    const x0 = -bw / 2 + pad;
    ctx.strokeStyle = 'rgba(214,222,235,0.35)'; ctx.beginPath(); ctx.roundRect(x0 - 8, -15, 44, 30, 4); ctx.stroke();
    ctx.font = font(MONO, 15); ctx.fillStyle = MUTED; ctx.textAlign = 'center'; ctx.fillText('VO', x0 + 14, 5);
    ctx.textAlign = 'left'; ctx.font = font(CAPF, size);
    ch.words.forEach((w, i) => {
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const said = t >= w.start - 0.03;
      ctx.fillStyle = on ? CORAL : said ? TEXT : 'rgba(232,237,244,0.38)';
      ctx.fillText(ch.texts[i]!, x0 + tagW + ch.xs[i]!, size * 0.36);
    });
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ diagram primitives (world coords of the plate camera)
export interface NodeOpts {
  title?: string; sub?: string; tag?: string; num?: string;
  /** 0..1: the border traces itself, then the fill and the text arrive */
  k?: number; a?: number; accent?: boolean; blue?: boolean; dim?: number;
  titleSize?: number; fill?: string; r?: number; lw?: number; glow?: number;
}
/** A hairline node centred at (x, y), w x h. */
export function node(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, o: NodeOpts = {}) {
  const k = o.k ?? 1, A = (o.a ?? 1) * (1 - (o.dim ?? 0) * 0.7);
  if (k <= 0 || A <= 0.003) return;
  const r = o.r ?? 8, col = o.accent ? CORAL : o.blue ? BLUE : null;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = A;
  const fk = clamp((k - 0.45) / 0.4), tk = clamp((k - 0.6) / 0.4);
  // fill
  if (fk > 0) {
    ctx.globalAlpha = A * fk;
    ctx.fillStyle = o.fill ?? (col ? (o.accent ? 'rgba(255,106,69,0.10)' : 'rgba(91,140,255,0.10)') : PANEL);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fill();
  }
  // the border, traced
  ctx.globalAlpha = A;
  const per = 2 * (w + h);
  ctx.strokeStyle = col ?? HAIR; ctx.lineWidth = o.lw ?? 1.6;
  if ((o.glow ?? 0) > 0 && col) { ctx.shadowColor = col; ctx.shadowBlur = 24 * (o.glow ?? 0); }
  ctx.setLineDash([per * ease.inOutCubic(clamp(k / 0.6)), per * 2]);
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur = 0;
  if (tk > 0) {
    ctx.globalAlpha = A * tk;
    let ty = 0;
    if (o.tag) {
      ctx.font = font(MONO, 14); const tw = measure(o.tag, MONO, 14) + 16;
      ctx.strokeStyle = col ?? 'rgba(214,222,235,0.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(-w / 2 + 12, -h / 2 + 12, tw, 24, 4); ctx.stroke();
      ctx.fillStyle = col ?? MUTED; ctx.textAlign = 'left'; ctx.fillText(o.tag, -w / 2 + 20, -h / 2 + 29);
      ty = 10;
    }
    ctx.textAlign = 'center';
    const ts = o.titleSize ?? 26;
    if (o.title) { ctx.font = font(SANS, ts); ctx.fillStyle = TEXT; ctx.fillText(o.title, 0, ty + (o.sub ? -2 : ts * 0.35)); }
    if (o.sub) { ctx.font = font(MONO, 16); ctx.fillStyle = MUTED; ctx.fillText(o.sub, 0, ty + 26); }
    if (o.num) { ctx.font = font(MONOB, 40); ctx.fillStyle = 'rgba(214,222,235,0.08)'; ctx.textAlign = 'right'; ctx.fillText(o.num, w / 2 - 10, h / 2 - 10); }
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The length of a polyline. */
export function polyLen(p: XY[]) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]); return L; }
/** The point at distance s along a polyline, with its direction. */
export function along(p: XY[], s: number): [number, number, number] {
  let acc = 0;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!, b = p[i]!, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + L >= s || i === p.length - 1) { const u = L > 0 ? clamp((s - acc) / L) : 0; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
    acc += L;
  }
  return [p[0]![0], p[0]![1], 0];
}
export interface EdgeOpts { col?: string; dash?: boolean; label?: string; head?: boolean; a?: number; lw?: number; dot?: number; labelAt?: number }
/** An edge along the polyline `pts`, drawn to k with its arrowhead riding the tip; `dot` (0..1) sends a packet along. */
export function edge(ctx: CanvasRenderingContext2D, c: Cam, pts: XY[], k: number, o: EdgeOpts = {}) {
  if (k <= 0 || (o.a ?? 1) <= 0.003) return;
  const L = polyLen(pts), s = L * ease.inOutCubic(clamp(k));
  const col = o.col ?? HAIR;
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.strokeStyle = col; ctx.lineWidth = o.lw ?? 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (o.dash) ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.moveTo(pts[0]![0], pts[0]![1]);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!, sl = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + sl >= s) { const u = sl > 0 ? (s - acc) / sl : 0; ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); break; }
    ctx.lineTo(b[0], b[1]); acc += sl;
  }
  ctx.stroke(); ctx.setLineDash([]);
  if (o.head !== false) {
    const [hx, hy, ang] = along(pts, s);
    ctx.fillStyle = col; ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(-11, -5.5); ctx.lineTo(-11, 5.5); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (o.dot !== undefined && o.dot > 0 && o.dot < 1 && k >= 1) {
    const [px, py] = along(pts, L * o.dot);
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (o.label && k > 0.6) {
    const [lx, ly] = along(pts, L * (o.labelAt ?? 0.5));
    ctx.globalAlpha = (o.a ?? 1) * clamp((k - 0.6) / 0.3);
    ctx.font = font(MONO, 14); const tw = measure(o.label, MONO, 14);
    ctx.fillStyle = BG; ctx.fillRect(lx - tw / 2 - 6, ly - 22, tw + 12, 18);
    ctx.fillStyle = o.col && o.col !== HAIR ? col : MUTED; ctx.textAlign = 'center'; ctx.fillText(o.label, lx, ly - 8); ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A right-angled route from a to b: out horizontally, across at the middle (or at `mx`), in horizontally. */
export function orth(a: XY, b: XY, mx?: number): XY[] {
  if (Math.abs(a[1] - b[1]) < 0.5) return [a, b];
  const m = mx ?? (a[0] + b[0]) / 2;
  return [a, [m, a[1]], [m, b[1]], b];
}
/** A mono eyebrow over a serif title, rising in from t0 (the skill's header). */
export function header(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, eyebrow: string, title: string, t: number, t0: number, o: { size?: number; align?: CanvasTextAlign; a?: number; col?: string } = {}) {
  const k = ease.outCubic(clamp((t - t0) / 0.6)), k2 = ease.outCubic(clamp((t - t0 - 0.12) / 0.6));
  if (k <= 0) return;
  const size = o.size ?? 64, al = o.align ?? 'left';
  setWorld(ctx, c, x, y, 1, 0);
  ctx.textAlign = al; ctx.globalAlpha = (o.a ?? 1) * k;
  ctx.font = font(MONO, 16); ctx.fillStyle = MUTED; ctx.letterSpacing = '3px';
  ctx.fillText(eyebrow.toUpperCase(), 0, -size * 0.95 + (1 - k) * 10);
  ctx.letterSpacing = '0px';
  ctx.globalAlpha = (o.a ?? 1) * k2;
  ctx.font = font(SERIF, size); ctx.fillStyle = o.col ?? TEXT; ctx.fillText(title, 0, (1 - k2) * 16);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Serif type revealed by a rising mask from t0. */
export function serif(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; align?: CanvasTextAlign; italic?: boolean; a?: number; dur?: number; glow?: string } = {}) {
  const k = ease.outExpo(clamp((t - t0) / (o.dur ?? 0.7)));
  if (k <= 0) return;
  const f = o.italic ? SERIFI : SERIF;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(-4000, -size * 1.05, 8000, size * 1.4); ctx.clip();
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(f, size); ctx.fillStyle = o.col ?? TEXT; ctx.textAlign = o.align ?? 'center';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; }
  ctx.fillText(text, 0, (1 - k) * size * 1.1);
  ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
}
/** Mono text. */
export function mono(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, o: { size?: number; col?: string; a?: number; align?: CanvasTextAlign; bold?: boolean; track?: number } = {}) {
  if ((o.a ?? 1) <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(o.bold ? MONOB : MONO, o.size ?? 18); ctx.fillStyle = o.col ?? MUTED; ctx.textAlign = o.align ?? 'left';
  if (o.track) ctx.letterSpacing = `${o.track}px`;
  ctx.fillText(text, 0, 0);
  ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Sans text (node-name type). */
export function sans(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { col?: string; a?: number; align?: CanvasTextAlign; bold?: boolean } = {}) {
  if ((o.a ?? 1) <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(o.bold ? SANSB : SANS, size); ctx.fillStyle = o.col ?? TEXT; ctx.textAlign = o.align ?? 'center';
  ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A hairline pill with mono text, centred at (x, y). */
export function chip(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, o: { a?: number; col?: string; size?: number; fill?: string; scale?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const size = o.size ?? 18, tw = measure(text, MONO, size), w = tw + size * 1.6, h = size * 2;
  setWorld(ctx, c, x, y, o.scale ?? 1, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.fill ?? PANEL; ctx.strokeStyle = o.col ?? HAIR; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.fill(); ctx.stroke();
  ctx.font = font(MONO, size); ctx.fillStyle = o.col ?? TEXT; ctx.textAlign = 'center'; ctx.fillText(text, 0, size * 0.36);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A window card (terminal, browser or file) with a title bar, centred at (x, y); returns nothing, draws from (x, y). */
export function card(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, o: { a?: number; title?: string; k?: number } = {}) {
  const a = o.a ?? 1, k = ease.outExpo(clamp(o.k ?? 1));
  if (a <= 0.003 || k <= 0) return;
  setWorld(ctx, c, x, y, 0.94 + 0.06 * k, 0);
  ctx.globalAlpha = a * k;
  ctx.fillStyle = 'rgba(16,21,29,0.96)'; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = FAINT; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 40); ctx.lineTo(w / 2, -h / 2 + 40); ctx.stroke();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((cc, i) => { ctx.fillStyle = 'rgba(214,222,235,0.25)'; ctx.beginPath(); ctx.arc(-w / 2 + 22 + i * 20, -h / 2 + 20, 6, 0, TAU); ctx.fill(); void cc; });
  if (o.title) { ctx.font = font(MONO, 15); ctx.fillStyle = MUTED; ctx.textAlign = 'center'; ctx.fillText(o.title, 0, -h / 2 + 26); ctx.textAlign = 'left'; }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Text typed from t0 at cps characters a second, left-aligned at (x, y), with a block caret while typing. */
export function typed(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, t: number, t0: number, cps: number, o: { size?: number; col?: string; a?: number; f?: string; caret?: boolean } = {}) {
  const n = Math.floor(clamp((t - t0) * cps, 0, text.length));
  if (t < t0) return;
  const size = o.size ?? 22, f = o.f ?? MONO;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(f, size); ctx.fillStyle = o.col ?? TEXT; ctx.textAlign = 'left';
  const s = text.slice(0, n); ctx.fillText(s, 0, 0);
  if (o.caret !== false && (n < text.length || Math.floor(t * 2) % 2 === 0)) { ctx.fillStyle = CORAL; ctx.fillRect(measure(s, f, size) + 3, -size * 0.8, size * 0.5, size); }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A check or a cross mark at (x, y), drawn in with k. */
export function mark(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, ok: boolean, k: number, s = 1) {
  if (k <= 0) return;
  setWorld(ctx, c, x, y, s, 0);
  ctx.strokeStyle = ok ? GREEN : CORAL; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const kk = ease.outCubic(clamp(k));
  ctx.beginPath();
  if (ok) { ctx.moveTo(-12, 0); ctx.lineTo(-12 + 8 * clamp(kk * 2), 8 * clamp(kk * 2)); if (kk > 0.5) ctx.lineTo(-4 + 18 * clamp(kk * 2 - 1), 8 - 20 * clamp(kk * 2 - 1)); }
  else { ctx.moveTo(-10, -10); ctx.lineTo(-10 + 20 * clamp(kk * 2), -10 + 20 * clamp(kk * 2)); if (kk > 0.5) { ctx.moveTo(10, -10); ctx.lineTo(10 - 20 * clamp(kk * 2 - 1), -10 + 20 * clamp(kk * 2 - 1)); } }
  ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A dimension line between a and b with a mono label (CAD-style call-out, in coral). */
export function dim(ctx: CanvasRenderingContext2D, c: Cam, a: XY, b: XY, label: string, k: number, col = CORAL) {
  if (k <= 0) return;
  const kk = ease.outCubic(clamp(k));
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4; ctx.globalAlpha = kk;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  ctx.beginPath(); ctx.moveTo(lerp(mx, a[0], kk), lerp(my, a[1], kk)); ctx.lineTo(lerp(mx, b[0], kk), lerp(my, b[1], kk)); ctx.stroke();
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang) * 8, ny = Math.cos(ang) * 8;
  for (const p of [a, b]) { ctx.beginPath(); ctx.moveTo(p[0] - nx, p[1] - ny); ctx.lineTo(p[0] + nx, p[1] + ny); ctx.stroke(); }
  ctx.font = font(MONO, 15); ctx.textAlign = 'center'; ctx.fillText(label, mx - nx * 2.2, my - ny * 2.2 + 5); ctx.textAlign = 'left';
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A coral ring drawn round (x, y) with k (an annotation). */
export function ring(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, rx: number, ry: number, k: number, col = CORAL) {
  if (k <= 0) return;
  setWorld(ctx, c, x, y, 1, -0.08);
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, -2.1, -2.1 + TAU * 1.04 * ease.outCubic(clamp(k))); ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A count-up number. */
export const countUp = (v: number, t: number, t0: number, dur: number) => Math.round(v * ease.outExpo(clamp((t - t0) / dur)));
export const fmt = (n: number) => n.toLocaleString('en-US');

// ------------------------------------------------------------------ the app diagram: the same eight boxes, messy and clean
export interface ANode { id: string; title: string; sub: string; tag: string; clean: XY; mess: XY; messW: number; messH: number; messRot: number; pastel: string; accent?: boolean }
export const APP: ANode[] = [
  { id: 'web', title: 'Browser', sub: 'users', tag: 'EXT', clean: [-640, 0], mess: [-520, -170], messW: 230, messH: 120, messRot: -0.06, pastel: '#FFD6E0' },
  { id: 'cdn', title: 'CDN', sub: 'edge cache', tag: 'EDGE', clean: [-340, 0], mess: [180, 210], messW: 190, messH: 104, messRot: 0.05, pastel: '#FFF1A8' },
  { id: 'api', title: 'API', sub: 'node · express', tag: 'ORIG', clean: [-40, 0], mess: [-120, 40], messW: 260, messH: 140, messRot: 0.02, pastel: '#BFD7FF', accent: true },
  { id: 'auth', title: 'Auth', sub: 'sessions', tag: 'SVC', clean: [280, -200], mess: [470, -60], messW: 200, messH: 110, messRot: -0.09, pastel: '#D9C2FF' },
  { id: 'db', title: 'Postgres', sub: 'primary db', tag: 'DB', clean: [280, 0], mess: [-460, 230], messW: 240, messH: 120, messRot: 0.07, pastel: '#C4F0C9' },
  { id: 'cache', title: 'Redis', sub: 'cache', tag: 'KV', clean: [280, 200], mess: [160, -230], messW: 210, messH: 110, messRot: 0.1, pastel: '#FFD6E0' },
  { id: 'store', title: 'S3', sub: 'uploads', tag: 'BLOB', clean: [600, -200], mess: [-80, -260], messW: 180, messH: 100, messRot: -0.04, pastel: '#FFE0B8' },
  { id: 'job', title: 'Worker', sub: 'emails · thumbs', tag: 'JOB', clean: [600, 200], mess: [560, 200], messW: 220, messH: 116, messRot: 0.04, pastel: '#C4F0C9' },
];
export const APP_EDGES: [string, string, string][] = [
  ['web', 'cdn', 'HTTPS'], ['cdn', 'api', 'ROUTE'], ['api', 'auth', ''], ['api', 'db', 'SQL'], ['api', 'cache', ''], ['auth', 'store', ''], ['cache', 'job', 'ENQUEUE'],
];
export const NW = 220, NH = 96;
const byId = (id: string) => APP.find((n) => n.id === id)!;
/** The clean route of an app edge. */
export function cleanRoute(a: string, b: string): XY[] {
  const A = byId(a).clean, B = byId(b).clean;
  return orth([A[0] + NW / 2, A[1]], [B[0] - NW / 2, B[1]]);
}
/** The messy route: a wandering curve between the messy boxes, sampled to n points. */
export function messRoute(a: string, b: string, i: number, n = 24): XY[] {
  const A = byId(a).mess, B = byId(b).mess;
  const bend = 220 * (hash(i, 3) - 0.5) * 2;
  const mx = (A[0] + B[0]) / 2 - (B[1] - A[1]) * 0.35 + bend, my = (A[1] + B[1]) / 2 + (B[0] - A[0]) * 0.3 - bend * 0.6;
  return Array.from({ length: n + 1 }, (_, j) => { const u = j / n; return [lerp(lerp(A[0], mx, u), lerp(mx, B[0], u), u), lerp(lerp(A[1], my, u), lerp(my, B[1], u), u)] as XY; });
}
/** Resample a polyline to n + 1 points evenly along its length. */
export function resample(p: XY[], n = 24): XY[] { const L = polyLen(p); return Array.from({ length: n + 1 }, (_, j) => { const q = along(p, (L * j) / n); return [q[0], q[1]] as XY; }); }
const mixHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, k));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
/**
 * The app diagram at morph m (0 = the messy default diagram, 1 = the clean one); `show` 0..1 pops the messy boxes in,
 * `stagger` spreads the morph over the boxes, `edgesK` draws the edges. Centred on (ox, oy).
 */
export function appDiagram(ctx: CanvasRenderingContext2D, c: Cam, ox: number, oy: number, m: number, o: { show?: number; stagger?: number; edgesK?: number; a?: number; hot?: number; t?: number; noAccent?: boolean; acc?: string } = {}) {
  const AC = o.acc ?? CORAL;
  const show = o.show ?? 1, st = o.stagger ?? 0.5, A = o.a ?? 1, ek = o.edgesK ?? 1;
  if (A <= 0.003) return;
  const mOf = (i: number) => ease.inOutCubic(clamp((m - (i / APP.length) * st) / (1 - st)));
  // edges first
  APP_EDGES.forEach(([a, b, lab], i) => {
    const ia = APP.findIndex((n) => n.id === a), ib = APP.findIndex((n) => n.id === b);
    const mk = Math.min(mOf(ia), mOf(ib));
    const pM = messRoute(a, b, i), pC = resample(cleanRoute(a, b));
    const pts = pM.map((p, j) => [lerp(p[0] + ox, pC[j]![0] + ox, mk), lerp(p[1] + oy, pC[j]![1] + oy, mk)] as XY);
    const primary = (a === 'cdn' && b === 'api') && !o.noAccent;
    const col = mk < 0.5 ? ['#E05A9B', '#2E9E5B', '#E0A21A', '#4D7CFE', '#9B59D0', '#E05A9B', '#2E9E5B'][i]! : primary ? AC : a === 'web' ? BLUE : HAIR;
    edge(ctx, c, pts, ek * clamp(show * 1.4 - 0.4 - i * 0.03), { col, lw: lerp(3, 1.6, mk), label: mk > 0.8 ? lab : '', a: A, dot: o.t !== undefined && mk > 0.9 ? ((o.t * 0.5 + i * 0.37) % 1) : undefined });
  });
  APP.forEach((n, i) => {
    const mk = mOf(i);
    const pk = ob(clamp(show * 1.6 - i * 0.08));
    if (pk <= 0) return;
    const x = ox + lerp(n.mess[0], n.clean[0], mk), y = oy + lerp(n.mess[1], n.clean[1], mk);
    const w = lerp(n.messW, NW, mk), h = lerp(n.messH, NH, mk), rot = lerp(n.messRot, 0, mk);
    const acc = !!n.accent && !o.noAccent;
    setWorld(ctx, c, x, y, pk, rot);
    ctx.globalAlpha = A;
    // the messy look: pastel fill, thick dark border, big radius, a drop shadow
    const sh = 1 - mk;
    if (sh > 0.01) { ctx.shadowColor = `rgba(0,0,0,${0.55 * sh})`; ctx.shadowBlur = 26 * sh; ctx.shadowOffsetY = 12 * sh; ctx.shadowOffsetX = 8 * sh; }
    ctx.fillStyle = mixHex(n.pastel, acc ? (o.acc ? '#0F2523' : '#2A1A17') : '#121720', mk);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, lerp(26, 8, mk)); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowOffsetX = 0;
    ctx.strokeStyle = acc && mk > 0.5 ? AC : mk > 0.5 ? HAIR : '#2B2B33'; ctx.lineWidth = lerp(3.5, 1.6, mk);
    if (acc && (o.hot ?? 0) > 0) { ctx.shadowColor = AC; ctx.shadowBlur = 26 * (o.hot ?? 0); }
    ctx.stroke(); ctx.shadowBlur = 0;
    // text: big bold dark type becomes the clean node type
    ctx.textAlign = 'center';
    ctx.font = font(mk < 0.5 ? SANSB : SANS, lerp(34, 26, mk)); ctx.fillStyle = mixHex('#1B1B22', '#E8EDF4', mk);
    ctx.fillText(n.title, 0, lerp(8, 8, mk));
    if (mk > 0.4) {
      ctx.globalAlpha = A * clamp((mk - 0.4) / 0.4);
      ctx.font = font(MONO, 16); ctx.fillStyle = MUTED; ctx.fillText(n.sub, 0, 34);
      ctx.font = font(MONO, 14); const tw = measure(n.tag, MONO, 14) + 16;
      ctx.strokeStyle = acc ? AC : 'rgba(214,222,235,0.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(-w / 2 + 12, -h / 2 + 12, tw, 24, 4); ctx.stroke();
      ctx.fillStyle = acc ? AC : MUTED; ctx.textAlign = 'left'; ctx.fillText(n.tag, -w / 2 + 20, -h / 2 + 29);
    }
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}
/** Where an app node sits (clean layout), offset by (ox, oy). */
export const appAt = (id: string, ox = 0, oy = 0): XY => { const n = byId(id); return [n.clean[0] + ox, n.clean[1] + oy]; };
export const appMessAt = (id: string, ox = 0, oy = 0): XY => { const n = byId(id); return [n.mess[0] + ox, n.mess[1] + oy]; };

/** A camera for drawing a sub-diagram scaled by s about world point (X, Y) of camera c. */
export const subCam = (c: Cam, X: number, Y: number, s: number): Cam => ({ cx: (c.cx - X) / s, cy: (c.cy - Y) / s, z: c.z * s, roll: c.roll });
/** Segment intersections between the messy edges (the real crossings of the messy diagram). */
export function messCrossings(ox = 0, oy = 0): XY[] {
  const routes = APP_EDGES.map(([a, b], i) => messRoute(a, b, i));
  const out: XY[] = [];
  for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++) {
    const A = routes[i]!, B = routes[j]!;
    for (let p = 1; p < A.length; p++) for (let q = 1; q < B.length; q++) {
      const a0 = A[p - 1]!, a1 = A[p]!, b0 = B[q - 1]!, b1 = B[q]!;
      const d = (a1[0] - a0[0]) * (b1[1] - b0[1]) - (a1[1] - a0[1]) * (b1[0] - b0[0]);
      if (Math.abs(d) < 1e-9) continue;
      const u = ((b0[0] - a0[0]) * (b1[1] - b0[1]) - (b0[1] - a0[1]) * (b1[0] - b0[0])) / d;
      const v = ((b0[0] - a0[0]) * (a1[1] - a0[1]) - (b0[1] - a0[1]) * (a1[0] - a0[0])) / d;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const px = a0[0] + u * (a1[0] - a0[0]), py = a0[1] + u * (a1[1] - a0[1]);
      // only the crossings out in the open: skip any hidden under a box
      if (APP.some((n) => Math.abs(px - n.mess[0]) < n.messW / 2 + 14 && Math.abs(py - n.mess[1]) < n.messH / 2 + 14)) continue;
      out.push([px + ox, py + oy]);
    }
  }
  return out;
}
/** A simple line icon: a document page with a folded corner and a label, centred at (x, y). */
export function fileIcon(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, label: string, o: { a?: number; s?: number; accent?: boolean } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, o.s ?? 1, 0);
  ctx.globalAlpha = a;
  const w = 96, h = 124, f = 26;
  ctx.fillStyle = PANEL; ctx.strokeStyle = o.accent ? CORAL : HAIR; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2 - f, -h / 2); ctx.lineTo(w / 2, -h / 2 + f); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w / 2 - f, -h / 2); ctx.lineTo(w / 2 - f, -h / 2 + f); ctx.lineTo(w / 2, -h / 2 + f); ctx.stroke();
  ctx.font = font(MONOB, 15); ctx.fillStyle = o.accent ? CORAL : TEXT; ctx.textAlign = 'center'; ctx.fillText(label, 0, 8);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The mouse pointer at (x, y) in world coords. */
export function pointer(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, o: { a?: number; press?: number; label?: string; col?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1 - 0.12 * (o.press ?? 0), 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = TEXT; ctx.strokeStyle = BG; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 36); ctx.lineTo(19, 34); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (o.label) {
    ctx.font = font(MONOB, 14); const tw = measure(o.label, MONOB, 14) + 14;
    ctx.fillStyle = o.col ?? CORAL; ctx.beginPath(); ctx.roundRect(18, 34, tw, 24, 5); ctx.fill();
    ctx.fillStyle = BG; ctx.fillText(o.label, 25, 51);
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
