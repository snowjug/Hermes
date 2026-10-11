// The Jev video's look (theme `swiss`): Swiss editorial motion design. Warm paper with a faint 12-column grid,
// giant black grotesk type that rises out of masks word by word, one vermilion accent, and the motif of the
// video: chat AIs are walls of grey text, Jev is a single red dot that lands on an answer.
// Scenes cut behind wiping slabs (red or ink), a section counter and mono labels sit in the corners like a
// magazine spread, and captions run left-aligned on the grid with a red underline that slides from word to word.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export { clamp, ease, hash, lerp, springStep, TAU };
/** outBack that is exactly 0 at 0 (ease.outBack(0) is 4e-16, which slips past `> 0` checks). */
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));
export const PAPER = '#EFEBE3';
export const INK = '#121212';
export const RED = '#F23A1D';
export const GREY = '#9A958C';
export const LIGHT = '#D9D3C7';
export const NIGHT = '#141414';
export const CREAM = '#F4F0E8';
export const HEAD = F.archivo(100, 900);
export const BOLD = F.archivo(100, 700);
export const BODY = F.archivo(100, 500);
export const MONO = F.mono(500);
export const MONOB = F.mono(700);

const PAPER_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 col = vec3(0.937, 0.922, 0.890);
  // 12 columns with gutters, faint
  float cw = (uRes.x - 240.0) / 12.0;
  float gx = mod(sp.x - 120.0, cw);
  col -= 0.022 * (step(gx, 1.2) + step(cw - 1.2, gx)) * step(120.0, sp.x) * step(sp.x, uRes.x - 120.0);
  col -= 0.03 * (1.0 - smoothstep(0.0, 1.0, 1.0 - dot(q - 0.5, q - 0.5) * 1.3));
  col += (h21(sp + floor(uTime * 24.0)) - 0.5) * 0.018;
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Swiss extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(PAPER_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
  /** ink background (cream type) */
  dark = false;
  /** the slab that uncovers this plate as it starts, and covers it as it ends */
  wipeIn: string | null = null;
  wipeOut: string | null = null;
  /** section number for the corner counter */
  section = 0;
  label = '';
  override init() {
    super.init();
    this.chunks = makeChunks(this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2), this.ctx.end);
  }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    this.paperPass.u.uTime!.value = f.t;
    return super.render(f, out);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    if (this.dark) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1.2;
      const cw = (W - 240) / 12;
      for (let i = 0; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(120 + i * cw, 0); ctx.lineTo(120 + i * cw, H); ctx.stroke(); }
    }
    this.stage(ctx, t, c);
  }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    furniture(ctx, this, t, this.ctx.start);
    drawChunks(ctx, this.chunks, t, this.dark);
    // slabs
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.wipeIn) {
      const k = ease.inOutCubic(clamp((t - this.ctx.start) / 0.32));
      if (k < 1) { ctx.fillStyle = this.wipeIn; ctx.fillRect(-k * W * 1.05, 0, W, H); }
    }
    if (this.wipeOut) {
      const k = ease.inOutCubic(clamp((t - (this.ctx.end - 0.28)) / 0.28));
      if (k > 0) { ctx.fillStyle = this.wipeOut; ctx.fillRect(W - k * W, 0, W, H); }
    }
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.06, bloomThreshold: 1.5, vignette: 0.14, grain: 0.035, halation: 0.0, ca: 0.12, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.015) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
  fg() { return this.dark ? CREAM : INK; }
}

/** Corner furniture: the label top-left, the section counter top-right, the channel bottom-right. */
function furniture(ctx: CanvasRenderingContext2D, p: Swiss, t: number, start: number) {
  const a = clamp((t - start - 0.2) / 0.3);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a * 0.75;
  ctx.fillStyle = p.dark ? '#8C877E' : '#7A756C';
  ctx.font = font(MONO, 22); ctx.textAlign = 'left';
  ctx.fillText(`JEV · SYSTEM ONE${p.label ? ' · ' + p.label : ''}`, 120, 76);
  ctx.textAlign = 'right';
  if (p.section) ctx.fillText(`${String(p.section).padStart(2, '0')} / 15`, W - 120, 76);
  ctx.textAlign = 'left';
  ctx.fillStyle = RED; ctx.fillRect(120, 90, 34 * a, 3);
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ captions: left on the grid, a sliding underline
const CAPS = { size: 54, maxW: 1240, x: 120, y: 470, maxWords: 6 };
const CAPF = F.archivo(100, 700);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size) + 4;
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
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 2) flush();
    }
    flush();
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.02, c.end + 1.0) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number, dark: boolean) {
  const size = CAPS.size;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const ch of chunks) {
    if (t < ch.start - 0.08 || t > ch.end) continue;
    const a = clamp((t - ch.start + 0.08) / 0.06) * clamp((ch.end - t) / 0.08);
    const x0 = CAPS.x, y = H / 2 + CAPS.y;
    // every word rises out of its own mask
    ctx.font = font(CAPF, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    let ux0 = 0, ux1 = 0, found = false;
    ch.words.forEach((w, i) => {
      const x = x0 + ch.xs[i]!, tw = measure(ch.texts[i]!, CAPF, size);
      const k = ease.outCubic(clamp((t - ch.start + 0.08 - i * 0.03) / 0.22));
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const said = t >= w.start - 0.03;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - size, tw + 12, size * 1.28); ctx.clip();
      ctx.globalAlpha = a;
      ctx.fillStyle = on ? RED : said ? (dark ? CREAM : INK) : (dark ? 'rgba(244,240,232,0.38)' : 'rgba(18,18,18,0.32)');
      ctx.fillText(ch.texts[i]!, x, y + (1 - k) * size * 1.1);
      ctx.restore();
      if (on) { ux0 = x; ux1 = x + tw; found = true; }
    });
    if (found) {
      // the underline glides between words: ease from the previous word's span
      ctx.globalAlpha = a; ctx.fillStyle = RED; ctx.fillRect(ux0, y + 14, ux1 - ux0, 6);
    }
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ type and shapes (world coords of the plate camera)
/** Words rising out of masks, staggered. x is the left edge (align left) or the centre. */
export function kinetic(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number,
  o: { col?: string; align?: 'left' | 'center' | 'right'; f?: string; stagger?: number; out?: number; track?: number; hi?: string[]; hiCol?: string } = {}) {
  if (t < t0) return;
  const f = o.f ?? HEAD;
  const words = text.split(' ');
  const sp = measure(' ', f, size) * 0.9;
  const ws = words.map((w) => measure(w, f, size));
  const total = ws.reduce((s, w) => s + w, 0) + sp * (words.length - 1);
  let xx = (o.align ?? 'left') === 'left' ? 0 : (o.align === 'center' ? -total / 2 : -total);
  const outK = o.out !== undefined ? ease.inCubic(clamp((t - o.out) / 0.25)) : 0;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.font = font(f, size); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  words.forEach((w, i) => {
    const k = ease.outQuart(clamp((t - t0 - i * (o.stagger ?? 0.06)) / 0.38));
    ctx.save(); ctx.beginPath(); ctx.rect(xx - size * 0.05, -size * 0.95, ws[i]! + size * 0.12, size * 1.22); ctx.clip();
    ctx.fillStyle = o.hi?.includes(w) ? (o.hiCol ?? RED) : (o.col ?? INK);
    ctx.fillText(w, xx, (1 - k) * size * 1.05 - outK * size * 1.1);
    ctx.restore();
    xx += ws[i]! + sp;
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A small mono label, optionally with a short red rule before it. */
export function label(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, o: { a?: number; size?: number; col?: string; align?: CanvasTextAlign; rule?: boolean } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a; ctx.font = font(MONO, o.size ?? 24); ctx.textAlign = o.align ?? 'left';
  ctx.fillStyle = o.col ?? '#6F6A61';
  if (o.rule) { ctx.fillStyle = RED; ctx.fillRect(o.align === 'center' ? -18 : 0, -30, 36, 4); ctx.fillStyle = o.col ?? '#6F6A61'; }
  ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The red decision dot, with an optional pulse ring. */
export function dot(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, o: { a?: number; pulse?: number; col?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003 || r <= 0.1) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  if (o.pulse !== undefined && o.pulse > 0 && o.pulse < 1) {
    ctx.strokeStyle = o.col ?? RED; ctx.lineWidth = 3; ctx.globalAlpha = a * (1 - o.pulse);
    ctx.beginPath(); ctx.arc(0, 0, r * (1 + 1.6 * o.pulse), 0, TAU); ctx.stroke(); ctx.globalAlpha = a;
  }
  ctx.fillStyle = o.col ?? RED; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A hairline rule that draws itself from (x0, y0) to (x1, y1). */
export function rule(ctx: CanvasRenderingContext2D, c: Cam, x0: number, y0: number, x1: number, y1: number, k: number, o: { col?: string; w?: number } = {}) {
  if (k <= 0) return;
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.strokeStyle = o.col ?? INK; ctx.lineWidth = o.w ?? 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A wall of grey "text": lines of rounded word-blocks, filling in from t0 at `rate` lines a second. */
export function textWall(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, t: number, t0: number,
  o: { rate?: number; seed?: number; col?: string; lh?: number; a?: number; scroll?: boolean } = {}) {
  if (t < t0) return;
  const lh = o.lh ?? 34, rows = Math.floor(h / lh);
  const n = (t - t0) * (o.rate ?? 9);
  const off = o.scroll && n > rows ? (n - rows) * lh : 0;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  ctx.globalAlpha = o.a ?? 1; ctx.fillStyle = o.col ?? LIGHT;
  for (let r = 0; r < Math.ceil(n); r++) {
    const yy = r * lh - off;
    if (yy < -lh || yy > h) continue;
    let xx = 0; const full = r < Math.floor(n) ? 1 : n - Math.floor(n);
    const lineW = (0.62 + 0.38 * hash(r, o.seed ?? 1)) * w * full;
    let j = 0;
    while (xx < lineW) {
      const ww = 24 + 70 * hash(r, j, o.seed ?? 1);
      ctx.beginPath(); ctx.roundRect(xx, yy + lh * 0.25, Math.min(ww, lineW - xx), lh * 0.42, 5); ctx.fill();
      xx += ww + 12; j++;
    }
  }
  ctx.restore(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** An option chip: outlined, or filled when chosen. Centred at (x, y). */
export function chip(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { on?: number; a?: number; dark?: boolean } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const on = o.on ?? 0, tw = measure(text, BOLD, size);
  const w = tw + size * 1.4, h = size * 1.7;
  setWorld(ctx, c, x, y, 1 + 0.06 * Math.sin(Math.PI * clamp(on)) , 0);
  ctx.globalAlpha = a;
  ctx.lineWidth = 3; ctx.strokeStyle = on > 0.5 ? RED : (o.dark ? CREAM : INK);
  ctx.fillStyle = on > 0.5 ? RED : 'rgba(0,0,0,0)';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = on > 0.5 ? '#FFFFFF' : (o.dark ? CREAM : INK); ctx.font = font(BOLD, size); ctx.textAlign = 'center';
  ctx.fillText(text, 0, size * 0.36);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A horizontal probability bar, left edge at x, filling to v (0..1) as k goes 0..1, with its value. */
export function bar(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, v: number, k: number, o: { col?: string; track?: string; a?: number; label?: string; dark?: boolean; size?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.track ?? (o.dark ? 'rgba(244,240,232,0.12)' : 'rgba(18,18,18,0.08)'); ctx.fillRect(0, -h / 2, w, h);
  ctx.fillStyle = o.col ?? RED; ctx.fillRect(0, -h / 2, w * v * ease.outCubic(clamp(k)), h);
  const size = o.size ?? 30;
  ctx.font = font(MONOB, size); ctx.fillStyle = o.dark ? CREAM : INK; ctx.textAlign = 'left';
  ctx.fillText((v * ease.outCubic(clamp(k))).toFixed(2), w + 20, size * 0.36);
  if (o.label) { ctx.font = font(BOLD, size); ctx.textAlign = 'right'; ctx.fillText(o.label, -20, size * 0.36); }
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A card with a mono header, top-left at (x, y). */
export function card(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, head: string, o: { a?: number; fill?: string; ink?: string; rise?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y + (o.rise ?? 0), 1, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.fill ?? '#FBF9F5'; ctx.strokeStyle = o.ink ?? INK; ctx.lineWidth = 3;
  ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = o.ink ?? INK; ctx.fillRect(0, 0, w, 50);
  ctx.fillStyle = o.fill ?? '#FBF9F5'; ctx.font = font(MONOB, 22); ctx.fillText(head, 20, 33);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A count-up number, formatted by fmt, centred or left at (x, y). */
export function counter(ctx: CanvasRenderingContext2D, c: Cam, v: number, fmt: (v: number) => string, x: number, y: number, size: number, t: number, t0: number, dur: number, o: { col?: string; align?: CanvasTextAlign; f?: string } = {}) {
  if (t < t0) return;
  const k = ease.outExpo(clamp((t - t0) / dur));
  setWorld(ctx, c, x, y, 1, 0);
  ctx.font = font(o.f ?? HEAD, size); ctx.textAlign = o.align ?? 'left'; ctx.fillStyle = o.col ?? INK;
  ctx.fillText(fmt(v * k), 0, 0);
  ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A chat bubble shell filled with grey word-blocks (a "talking" AI), centred at (x, y). */
export function bubble(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, t: number, t0: number, o: { seed?: number; a?: number; s?: number } = {}) {
  if (t < t0) return;
  const k = springStep(t - t0, 4, 0.55);
  setWorld(ctx, c, x, y, (o.s ?? 1) * (0.6 + 0.4 * k), 0);
  ctx.globalAlpha = (o.a ?? 1) * clamp((t - t0) / 0.08);
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = LIGHT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = LIGHT;
  const rows = Math.max(1, Math.floor((h - 30) / 26));
  for (let r = 0; r < rows; r++) {
    const lw = (r === rows - 1 ? 0.55 : 0.9) * (w - 44) * (0.8 + 0.2 * hash(r, o.seed ?? 3));
    ctx.beginPath(); ctx.roundRect(-w / 2 + 22, -h / 2 + 20 + r * 26, lw, 12, 6); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
