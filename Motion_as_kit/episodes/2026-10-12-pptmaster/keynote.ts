// The PPT Master video's look (theme `keynote`): the video is itself a keynote being built live. A dark stage
// with a slow spotlight and drifting bokeh; glossy 16:9 slides that fly in from depth, fan out, stack and
// tilt; big gradient headline type; frosted glass panels; a chat window; a cursor with selection handles.
// Captions are the modern kind: the current phrase, centred low, with the spoken word lit in an orange pill.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export const WHITE = '#F4F5FF';
export const ORANGE = '#FF5B3A';
export const PEACH = '#FFB37A';
export const VIOLET = '#7B5CFF';
export const TEAL = '#2ED3C0';
export const NAVY = '#0B0F24';
export const SOFT = '#A3ABD1';
export const HEAD = F.archivo(100, 900);
export const BODY = F.archivo(100, 600);

const STAGE_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
float bokeh(vec2 sp, float t, float k) {
  float s = 0.0;
  for (int i = 0; i < 14; i++) {
    float fi = float(i) + k * 31.0;
    vec2 c = vec2(fract(sin(fi * 12.9898) * 43758.5453), fract(sin(fi * 78.233) * 12345.678)) * uRes;
    c += vec2(sin(t * 0.13 + fi) * 60.0, -mod(t * (12.0 + 9.0 * fract(fi * 0.37)) + fi * 90.0, uRes.y + 300.0) + uRes.y * 0.5);
    c.y = mod(c.y, uRes.y + 300.0) - 150.0;
    float r = 18.0 + 46.0 * fract(fi * 0.731);
    s += smoothstep(r, r * 0.55, length(sp - c)) * (0.25 + 0.75 * fract(fi * 0.917));
  }
  return s;
}
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 deep = vec3(0.012, 0.016, 0.045), mid = vec3(0.05, 0.06, 0.17);
  float spot = smoothstep(1.1, 0.0, length((q - vec2(0.5 + 0.08 * sin(uTime * 0.21), -0.05)) * vec2(1.0, 1.45)));
  vec3 col = mix(deep, mid, spot);
  // light beams
  float beam = smoothstep(0.08, 0.0, abs(fract((q.x - q.y * 0.55) * 1.6 + uTime * 0.012) - 0.5)) * 0.06 * spot;
  col += vec3(0.35, 0.3, 0.9) * beam;
  // warm glow from below
  col += vec3(0.5, 0.17, 0.08) * 0.10 * smoothstep(0.9, 0.0, length((q - vec2(0.5, 1.15)) * vec2(0.8, 1.6)));
  // bokeh
  col += vec3(0.42, 0.38, 1.0) * 0.045 * bokeh(sp, uTime, 0.0) + vec3(1.0, 0.45, 0.3) * 0.03 * bokeh(sp, uTime * 0.8, 1.0);
  col *= 1.0 - 0.35 * dot(q - 0.5, q - 0.5);
  fragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ the plate
interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Keynote extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(STAGE_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
  override init() {
    super.init();
    this.chunks = makeChunks(this.captionLines(), this.ctx.end);
  }
  captionLines(): Line[] {
    return this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2);
  }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    this.paperPass.u.uTime!.value = f.t;
    return super.render(f, out);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.stage(ctx, t, c); }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    drawChunks(ctx, this.chunks, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.55, bloomThreshold: 0.72, vignette: 0.35, grain: 0.03, halation: 0.12, ca: 0.4, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.015) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

// ------------------------------------------------------------------ captions: phrase chunks, the spoken word lit
const CAPS = { size: 62, maxW: 1500, y: 420, maxWords: 5 };
const CAPF = F.archivo(100, 800);
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
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 2) flush();
    }
    flush();
  }
  // each chunk stays until the next starts (or a beat after it ends)
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.02, c.end + 1.2) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  for (const ch of chunks) {
    if (t < ch.start - 0.08 || t > ch.end) continue;
    const k = springStep(t - ch.start + 0.08, 4, 0.55);
    const a = clamp((t - ch.start + 0.08) / 0.06) * clamp((ch.end - t) / 0.08);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    ctx.font = font(CAPF, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      const x = x0 + ch.xs[i]!, tw = measure(ch.texts[i]!, CAPF, size);
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const said = t >= w.start - 0.03;
      const pop = on ? 1 + 0.08 * (1 - ease.outCubic(clamp((t - w.start + 0.03) / 0.12))) : 1;
      ctx.save();
      ctx.translate(x + tw / 2, y - size * 0.34 + (1 - k) * 24);
      ctx.scale(pop, pop);
      if (on) {
        ctx.fillStyle = ORANGE;
        ctx.beginPath(); ctx.roundRect(-tw / 2 - 14, -size * 0.62, tw + 28, size * 1.18, 14); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(ch.texts[i]!, -tw / 2 + 3, size * 0.36 + 4);
      ctx.fillStyle = said ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
      ctx.fillText(ch.texts[i]!, -tw / 2, size * 0.36);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ slides
export type SlideKind = 'title' | 'bullets' | 'chart' | 'image' | 'table' | 'quote' | 'blank' | 'agenda' | 'big';
export interface SlideOpts {
  kind?: SlideKind;
  title?: string;
  sub?: string;
  accent?: string;
  bg?: string;
  rot?: number;
  /** horizontal shear for a fake 3D tilt */
  shear?: number;
  a?: number;
  seed?: number;
  img?: HTMLImageElement | null;
  glow?: number;
  /** 0..1 how much of the content has been built */
  build?: number;
  dark?: boolean;
}
/** A 16:9 slide centred at world (x, y), w wide. Content is drawn by kind. */
export function slide(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, o: SlideOpts = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const h = w * 9 / 16;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  if (o.shear) ctx.transform(1, o.shear * 0.35, 0, 1, 0, 0);
  ctx.globalAlpha = a;
  // shadow and glow
  ctx.save();
  ctx.shadowColor = o.glow ? `rgba(255,91,58,${0.6 * o.glow})` : 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = o.glow ? 60 * o.glow : 40; ctx.shadowOffsetY = o.glow ? 0 : 18;
  ctx.fillStyle = o.bg ?? (o.dark ? '#151A33' : '#FFFFFF');
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.018); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.018); ctx.clip();
  const u = w / 100; // content unit
  const ink = o.dark ? '#F4F5FF' : '#141833', mute = o.dark ? 'rgba(244,245,255,0.35)' : 'rgba(20,24,51,0.18)';
  const acc = o.accent ?? ORANGE, b = clamp(o.build ?? 1);
  const kind = o.kind ?? 'bullets';
  if (o.img) {
    ctx.drawImage(o.img, -w / 2, -h / 2, w, h);
  } else if (kind === 'title' || kind === 'big') {
    ctx.fillStyle = acc; ctx.fillRect(-w / 2, -h / 2, w * 0.035, h);
    ctx.font = font(HEAD, u * (kind === 'big' ? 11 : 7.5)); ctx.fillStyle = ink;
    if (o.title) ctx.fillText(o.title, -w / 2 + u * 8, -u * 2);
    ctx.font = font(BODY, u * 3.2); ctx.fillStyle = o.dark ? SOFT : '#5A6080';
    if (o.sub) ctx.fillText(o.sub, -w / 2 + u * 8, u * 6);
  } else {
    ctx.fillStyle = acc; ctx.fillRect(-w / 2 + u * 6, -h / 2 + u * 6, u * 6, u * 0.9);
    ctx.font = font(HEAD, u * 4.4); ctx.fillStyle = ink;
    if (o.title) ctx.fillText(o.title, -w / 2 + u * 6, -h / 2 + u * 13);
    const top = -h / 2 + u * 18;
    if (kind === 'bullets' || kind === 'agenda') {
      for (let i = 0; i < 4; i++) {
        const k = clamp(b * 4 - i);
        if (k <= 0) continue;
        ctx.fillStyle = kind === 'agenda' ? acc : ink; ctx.beginPath(); ctx.arc(-w / 2 + u * 8, top + u * (3 + i * 7.5), u * 1.1, 0, TAU); ctx.fill();
        ctx.fillStyle = mute; ctx.fillRect(-w / 2 + u * 12, top + u * (2 + i * 7.5), u * (58 - (hash(o.seed ?? 1, i) * 22)) * k, u * 2.2);
      }
      ctx.fillStyle = o.dark ? 'rgba(123,92,255,0.5)' : 'rgba(123,92,255,0.18)';
      ctx.beginPath(); ctx.roundRect(w / 2 - u * 30, top, u * 24, u * 26, u * 2); ctx.fill();
    } else if (kind === 'chart') {
      const vals = [0.45, 0.62, 0.38, 0.8, 0.95, 0.7];
      vals.forEach((v, i) => {
        const k = clamp(b * 6 - i);
        const bh = u * 30 * v * ease.outCubic(k);
        ctx.fillStyle = i === 4 ? acc : (o.dark ? 'rgba(244,245,255,0.6)' : '#C9CDE0');
        ctx.fillRect(-w / 2 + u * (10 + i * 13), h / 2 - u * 8 - bh, u * 8, bh);
      });
      ctx.fillStyle = mute; ctx.fillRect(-w / 2 + u * 8, h / 2 - u * 8, u * 84, u * 0.5);
    } else if (kind === 'image') {
      const g = ctx.createLinearGradient(-w / 2, top, w / 2, h / 2);
      g.addColorStop(0, VIOLET); g.addColorStop(1, acc);
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2 + u * 6, top, u * 50, u * 34, u * 1.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-w / 2 + u * 20, top + u * 12, u * 5, 0, TAU); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = mute; ctx.fillRect(w / 2 - u * 38, top + u * (4 + i * 7), u * 30 - i * u * 5, u * 2.2); }
    } else if (kind === 'table') {
      for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
        if (clamp(b * 4 - r) <= 0) continue;
        ctx.fillStyle = r === 0 ? acc : (q % 2 ? mute : (o.dark ? 'rgba(244,245,255,0.18)' : 'rgba(20,24,51,0.08)'));
        ctx.fillRect(-w / 2 + u * (8 + q * 21.5), top + u * r * 7, u * 20.5, u * 6.2);
      }
    } else if (kind === 'quote') {
      ctx.font = font(HEAD, u * 16); ctx.fillStyle = acc; ctx.fillText('“', -w / 2 + u * 6, top + u * 10);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = mute; ctx.fillRect(-w / 2 + u * 16, top + u * (4 + i * 7), u * (66 - i * 12), u * 2.8); }
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A slide flying in from depth at t0 (scale 0.4 → 1 with a little overshoot and rise). Returns its build 0..1. */
export function flyIn(t: number, t0: number, dur = 0.5) {
  if (t < t0) return 0;
  return springStep(t - t0, 2.8, 0.62) * clamp((t - t0) / Math.max(0.01, dur * 0.2));
}

/** Big headline in gradient fill with a soft glow, centred at world (x, baseline y). */
export function headline(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { from?: string; to?: string; align?: CanvasTextAlign; a?: number; glow?: number } = {}) {
  if (t < t0) return 0;
  const age = t - t0;
  const k = ease.outCubic(clamp(age / 0.35));
  const tw = measure(text, HEAD, size);
  setWorld(ctx, c, x, y + (1 - k) * 30, 1, 0);
  ctx.globalAlpha = clamp(age / 0.12) * (o.a ?? 1);
  ctx.font = font(HEAD, size); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'alphabetic';
  const x0 = o.align === 'left' ? 0 : o.align === 'right' ? -tw : -tw / 2;
  const g = ctx.createLinearGradient(x0, -size, x0 + tw, 0);
  g.addColorStop(0, o.from ?? '#FFFFFF'); g.addColorStop(1, o.to ?? '#C9C2FF');
  ctx.shadowColor = `rgba(123,92,255,${0.55 * (o.glow ?? 1)})`; ctx.shadowBlur = 40;
  ctx.fillStyle = g; ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return tw;
}

/** A pill chip centred at world (x, y). */
export function pill(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { bg?: string; fg?: string; a?: number; rot?: number; stroke?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const tw = measure(text, BODY, size), w = tw + size * 1.4, h = size * 1.75;
  setWorld(ctx, c, x, y, 0.85 + 0.15 * a, o.rot ?? 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.bg ?? 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = o.stroke ?? 'rgba(255,255,255,0.25)'; ctx.stroke();
  ctx.font = font(BODY, size); ctx.fillStyle = o.fg ?? WHITE; ctx.textAlign = 'center'; ctx.fillText(text, 0, size * 0.36); ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A frosted glass panel (world, top-left x, y). */
export function glass(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, o: { a?: number; r?: number; tint?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  ctx.fillStyle = o.tint ?? 'rgba(30,36,72,0.82)'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, o.r ?? 26); ctx.fill(); ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, o.r ?? 26); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The PDF: a stack of pages with a red PDF tab, centred at world (x, y), scale s; `spread` fans the pages. */
export function pdf(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s: number, o: { a?: number; spread?: number; rot?: number; label?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, s, o.rot ?? 0);
  ctx.globalAlpha = a;
  const n = 6, sp = o.spread ?? 0;
  for (let i = n - 1; i >= 0; i--) {
    ctx.save(); ctx.translate(i * (8 + sp * 40), i * (6 - sp * 10)); ctx.rotate(i * sp * 0.08);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-150, -200, 300, 400, 10); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(20,24,51,0.14)';
    for (let r = 0; r < 9; r++) ctx.fillRect(-110, -120 + r * 32, 220 - (r % 3) * 40, 12);
    ctx.restore();
  }
  ctx.fillStyle = '#E2342D'; ctx.beginPath(); ctx.roundRect(-150, -200, 130, 64, [10, 0, 14, 0]); ctx.fill();
  ctx.font = font(HEAD, 40); ctx.fillStyle = '#FFFFFF'; ctx.fillText('PDF', -138, -153);
  if (o.label) { ctx.font = font(BODY, 30); ctx.fillStyle = '#5A6080'; ctx.fillText(o.label, -110, 175); }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A mouse pointer at world (x, y); `click` 0..1 shows a click ripple. */
export function pointer(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, click = 0, a = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  if (click > 0 && click < 1) { ctx.strokeStyle = `rgba(255,255,255,${1 - click})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 10 + 40 * click, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(21, 54); ctx.lineTo(29, 50); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Selection handles around a box (world, top-left), like an editor shows on a selected shape. */
export function handles(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, a = 1, col = TEAL) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.strokeRect(0, 0, w, h); ctx.setLineDash([]);
  ctx.fillStyle = '#FFFFFF';
  for (const [hx, hy] of [[0, 0], [w / 2, 0], [w, 0], [0, h / 2], [w, h / 2], [0, h], [w / 2, h], [w, h]]) { ctx.beginPath(); ctx.rect(hx! - 7, hy! - 7, 14, 14); ctx.fill(); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A glass chat window (world top-left) with messages; each [text, from 'me'|'ai', t0] types in. */
export function chat(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, msgs: [string, 'me' | 'ai', number][], t: number, o: { a?: number; size?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  glass(ctx, c, x, y, w, h, { a });
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(0, 0, w, 64, [26, 26, 0, 0]); ctx.fill();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(34 + i * 30, 32, 9, 0, TAU); ctx.fill(); });
  ctx.font = font(BODY, 26); ctx.fillStyle = SOFT; ctx.textAlign = 'center'; ctx.fillText(title, w / 2, 41); ctx.textAlign = 'left';
  const size = o.size ?? 34;
  let yy = 100;
  for (const [text, from, t0] of msgs) {
    if (t < t0) continue;
    const n = from === 'me' ? Math.ceil(text.length * clamp((t - t0) / Math.max(0.3, text.length * 0.035))) : text.length;
    const shown = text.slice(0, n);
    const lines = wrap(shown, BODY, size, w * 0.7);
    const bw = Math.max(...lines.map((l) => measure(l, BODY, size)), 40) + size * 1.2, bh = lines.length * size * 1.3 + size * 0.9;
    const bx = from === 'me' ? w - bw - 30 : 30;
    const k = springStep(t - t0, 4, 0.6);
    ctx.save(); ctx.translate(bx + (from === 'me' ? bw : 0), yy); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); ctx.translate(from === 'me' ? -bw : 0, 0);
    ctx.fillStyle = from === 'me' ? ORANGE : 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect(0, 0, bw, bh, 22); ctx.fill();
    ctx.font = font(BODY, size); ctx.fillStyle = '#FFFFFF';
    lines.forEach((l, i) => ctx.fillText(l, size * 0.6, size * 1.2 + i * size * 1.3));
    ctx.restore();
    yy += bh + 22;
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function wrap(s: string, fam: string, size: number, maxW: number) {
  const out: string[] = []; let cur = '';
  for (const word of s.split(' ')) {
    const trial = cur ? cur + ' ' + word : word;
    if (cur && measure(trial, fam, size) > maxW) { out.push(cur); cur = word; } else cur = trial;
  }
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

/** Sparkle burst at world (x, y) from t0. */
export function sparkles(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, t: number, t0: number, n = 18, seed = 1, col = PEACH) {
  if (t < t0 || t > t0 + 1.2) return;
  const k = (t - t0) / 1.2;
  setWorld(ctx, c, x, y, 1, 0);
  for (let i = 0; i < n; i++) {
    const an = hash(seed, i) * TAU, d = (120 + 260 * hash(seed, i + 9)) * ease.outCubic(k), r = (6 + 8 * hash(seed, i + 3)) * (1 - k);
    ctx.fillStyle = col; ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(Math.cos(an) * d, Math.sin(an) * d, r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Load an image from the episode's img/ folder (served by Vite through @ep? no: fetched by URL). */
const IMGS = new Map<string, Promise<HTMLImageElement>>();
export function loadImg(src: string) {
  if (!IMGS.has(src)) IMGS.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`missing ${src}`)); i.src = src; }));
  return IMGS.get(src)!;
}

export { clamp, ease, hash, lerp, springStep, TAU };
