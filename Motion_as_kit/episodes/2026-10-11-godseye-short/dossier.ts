// The God's Eye View Short's look (theme `dossier`): a classified file on a desk under a lamp. A manila folder that
// opens, typewritten pages, satellite "prints" paper-clipped on (the globe of sat.ts, drawn as photographs), contact
// sheets of camera stills, redaction bars that peel away as things are said, and rubber stamps in red ink. The twist
// is the last stamp: it's all public data. Captions are typewritten slips, the spoken word underlined in red.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export { clamp, ease, hash, lerp, TAU };
export const TYPE = F.mono(500);
export const TYPEB = F.mono(700);
export const STAMPF = F.archivo(75, 900);
export const INKC = '#1E1B18';
export const RED = '#C8102E';
export const MANILA = '#E2CF9F';
export const PAGE = '#F3EEE2';
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));

const DESK_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  // dark walnut: long grain with a few knots
  float g = fbm(vec2(sp.x * 0.002, sp.y * 0.03) + 4.0, 4);
  float ring = sin((sp.y * 0.05 + g * 9.0)) * 0.5 + 0.5;
  vec3 col = mix(vec3(0.10, 0.06, 0.035), vec3(0.17, 0.10, 0.06), ring * 0.6 + g * 0.4);
  // the lamp: a warm pool from the top
  float pool = smoothstep(0.95, 0.0, length((q - vec2(0.5, 0.35)) * vec2(1.0, 0.7)));
  col *= 0.35 + 1.1 * pool;
  col += vec3(0.09, 0.06, 0.02) * pool * pool;
  col += (hash12(sp + floor(uTime * 24.0) * 7.0) - 0.5) * 0.02;
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Desk extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(DESK_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
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
    drawChunks(ctx, this.chunks, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.2, bloomThreshold: 1.0, vignette: 0.45, grain: 0.05, halation: 0.1, ca: 0.25, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
  s(k: string, d = 0) { return this.w[k]!.start + d; }
  e(k: string, d = 0) { return this.w[k]!.end + d; }
}

// ------------------------------------------------------------------ captions: typewritten slips
const CAPS = { size: 62, maxW: 900, y: 680, maxWords: 4 };
const CAPF = F.mono(700);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size);
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      const texts = cur.map((w) => w.w.toUpperCase());
      const xs: number[] = []; let x = 0;
      texts.forEach((s, i) => { xs.push(x); x += measure(s, CAPF, CAPS.size) + (i < texts.length - 1 ? sp : 0); });
      out.push({ words: cur, texts, xs, width: x, start: cur[0]!.start, end: cur[cur.length - 1]!.end });
      cur = [];
    };
    for (const w of l.words) {
      const trial = [...cur, w].map((x) => x.w.toUpperCase()).join(' ');
      if (cur.length && (cur.length >= CAPS.maxWords || measure(trial, CAPF, CAPS.size) > CAPS.maxW)) flush();
      cur.push(w);
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 2) flush();
    }
    flush();
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.06, c.end + 0.9) : Math.min(plateEnd + 0.05, c.end + 1.2); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  for (const ch of chunks) {
    if (t < ch.start - 0.04 || t > ch.end) continue;
    const a = clamp((ch.end - t) / 0.06);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.setTransform(1, 0, 0, 1, W / 2, y - size * 0.3); ctx.rotate(-0.012); ctx.translate(-W / 2, -(y - size * 0.3));
    ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#F7F3EA'; ctx.fillRect(x0 - 26, y - size * 0.95, ch.width + 52, size * 1.4);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.font = font(CAPF, size); ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      // each word strikes in letter by letter as it is said
      const n = Math.floor(clamp((t - w.start + 0.04) / clamp((w.end - w.start) * 0.4, 0.06, 0.16)) * ch.texts[i]!.length);
      if (t < w.start - 0.04) return;
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      ctx.fillStyle = INKC; ctx.fillText(ch.texts[i]!.slice(0, Math.max(1, n)), x0 + ch.xs[i]!, y);
      if (on) { ctx.fillStyle = RED; ctx.fillRect(x0 + ch.xs[i]! - 2, y + 10, measure(ch.texts[i]!, CAPF, size) + 4, 6); }
    });
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

// ------------------------------------------------------------------ the file
/** A sheet of paper (or the folder) with a soft shadow, centred at (x, y), rotated. Leaves the transform set. */
export function sheet(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, rot: number, col = PAGE, a = 1) {
  setWorld(ctx, c, x, y, 1, rot);
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // fibres
  ctx.fillStyle = 'rgba(120,100,70,0.06)';
  for (let i = 0; i < 40; i++) ctx.fillRect(-w / 2 + hash(i, 1) * w, -h / 2 + hash(i, 2) * h, 30 + 60 * hash(i, 3), 1);
}
/** A rubber stamp: double border, slightly patchy ink, popping down with k. */
export function stamp(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, rot: number, k: number, col = RED, sub?: string) {
  if (k <= 0) return;
  const s = 1 + 0.6 * (1 - ob(clamp(k * 1.4)));
  ctx.font = font(STAMPF, size);
  const tw = measure(text, STAMPF, size), w = tw + size * 0.9, h = size * (sub ? 1.9 : 1.45);
  setWorld(ctx, c, x, y, s, rot);
  ctx.globalAlpha = clamp(k * 3) * 0.88; ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.lineWidth = size * 0.08; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.lineWidth = size * 0.03; ctx.strokeRect(-w / 2 + size * 0.12, -h / 2 + size * 0.12, w - size * 0.24, h - size * 0.24);
  ctx.textAlign = 'center'; ctx.fillText(text, 0, sub ? -size * 0.05 : size * 0.36);
  if (sub) { ctx.font = font(TYPEB, size * 0.36); ctx.fillText(sub, 0, size * 0.55); }
  // patchy ink: knock out a few specks
  ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 0.55;
  for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(-w / 2 + hash(i, 7, text.length) * w, -h / 2 + hash(i, 8, text.length) * h, 2 + 5 * hash(i, 9), 0, TAU); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Typewritten text, struck in at cps characters a second from t0, at (x, y) in the current sheet's frame. */
export function typeOn(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { cps?: number; col?: string; bold?: boolean; rot?: number; ox?: number; oy?: number } = {}) {
  if (t < t0) return;
  const n = Math.floor(clamp((t - t0) * (o.cps ?? 40), 0, text.length));
  setWorld(ctx, c, o.ox ?? 0, o.oy ?? 0, 1, o.rot ?? 0);
  ctx.font = font(o.bold ? TYPEB : TYPE, size); ctx.fillStyle = o.col ?? INKC; ctx.textAlign = 'left';
  ctx.fillText(text.slice(0, n), x, y);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A black redaction bar over (x, y, w, h) in a sheet's frame that peels away left to right as k goes 0 → 1. */
export function redact(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, k: number, o: { rot?: number; ox?: number; oy?: number } = {}) {
  if (k >= 1) return;
  setWorld(ctx, c, o.ox ?? 0, o.oy ?? 0, 1, o.rot ?? 0);
  ctx.fillStyle = '#0D0D0D';
  const kk = ease.inOutCubic(clamp(k));
  ctx.fillRect(x + w * kk, y, w * (1 - kk), h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A photo print with a white border, centred at (x, y), rotated; draw() paints the picture in world coords inside a clip. */
export function photo(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, rot: number, a: number, draw: () => void) {
  if (a <= 0.003) return;
  const s = 0.9 + 0.1 * ob(clamp(a * 1.3));
  setWorld(ctx, c, x, y, s, rot);
  ctx.globalAlpha = clamp(a);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FAFAF6'; ctx.fillRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 52);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#060A10'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  draw();
  ctx.restore();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A paper clip at (x, y). */
export function clip(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, rot: number) {
  setWorld(ctx, c, x, y, 1, rot);
  ctx.strokeStyle = '#B9BEC4'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, 40); ctx.lineTo(-8, -30); ctx.arc(4, -30, 12, Math.PI, 0); ctx.lineTo(16, 30); ctx.arc(8, 30, 8, 0, Math.PI); ctx.lineTo(0, -20); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, 30); ctx.lineTo(-9, -28); ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A red pen tick at (x, y). */
export function tick(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, k: number, rot = 0) {
  if (k <= 0) return;
  const kk = ease.outCubic(clamp(k));
  setWorld(ctx, c, x, y, 1, rot);
  ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-16 + 12 * clamp(kk * 2), 14 * clamp(kk * 2)); if (kk > 0.5) ctx.lineTo(-4 + 30 * clamp(kk * 2 - 1), 14 - 36 * clamp(kk * 2 - 1)); ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
