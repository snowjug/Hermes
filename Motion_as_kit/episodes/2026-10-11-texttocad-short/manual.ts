// The text-to-cad Short's look (theme `manual`): a flat-pack assembly manual. Off-white paper, black line
// drawings of real 3D parts (the 'line' look of app/src/scenes/_cad3d.ts), numbered steps in circles, "1x" parts
// callouts, fat arrows, page numbers. Each spoken line is a page that swipes in. Captions are bold black type
// with the spoken word under a yellow highlighter stroke.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export { clamp, ease, lerp, TAU };
export const INK = '#111111';
export const PAPER = '#FAFAF7';
export const GREY = '#9A9A9A';
export const BLUE = '#0058A3';
export const YELLOW = '#FFDA1A';
export const RED = '#E4312B';
export const GREEN = '#1E9E5A';
export const HEAD = F.archivo(100, 900);
export const BODY = F.archivo(100, 700);
export const MONO = F.mono(600);

const PAPER_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 col = vec3(0.98, 0.98, 0.965);
  col -= 0.025 * vn(sp * 0.02) + 0.018 * vn(sp * 0.35);
  col -= 0.05 * dot(q - 0.5, q - 0.5);
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class ManualPlate extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(PAPER_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
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
    drawChunks(ctx, this.chunks, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.08, bloomThreshold: 1.5, vignette: 0.12, grain: 0.03, halation: 0.0, ca: 0.15, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

// ------------------------------------------------------------------ captions: the spoken word highlighted
const CAPS = { size: 80, maxW: 940, y: 640, maxWords: 4 };
const CAPF = F.archivo(100, 900);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size) + 6;
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
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const ch of chunks) {
    if (t < ch.start - 0.08 || t > ch.end) continue;
    const k = springStep(t - ch.start + 0.08, 4, 0.5);
    const a = clamp((t - ch.start + 0.08) / 0.06) * clamp((ch.end - t) / 0.08);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.globalAlpha = a;
    ctx.font = font(CAPF, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      const x = x0 + ch.xs[i]!, tw = measure(ch.texts[i]!, CAPF, size);
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const said = t >= w.start - 0.03;
      ctx.save();
      ctx.translate(x, y + (1 - k) * 26);
      if (on) {
        // a highlighter stroke swiped left to right, a little crooked
        const sk = ease.outCubic(clamp((t - w.start + 0.03) / 0.12));
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        ctx.moveTo(-12, -size * 0.62); ctx.lineTo(-12 + (tw + 24) * sk, -size * 0.66); ctx.lineTo(-10 + (tw + 24) * sk, size * 0.16); ctx.lineTo(-14, size * 0.2);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = said ? INK : 'rgba(17,17,17,0.32)';
      ctx.fillText(ch.texts[i]!, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ manual pieces (world coords)
/** A step number in a black circle. */
export function stepNo(ctx: CanvasRenderingContext2D, c: Cam, n: string, x: number, y: number, a = 1, r = 74) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.7 + 0.3 * ease.outBack(clamp(a)), 0);
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(HEAD, r * 1.25); ctx.textAlign = 'center'; ctx.fillText(n, 0, r * 0.44);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Bold manual text, centred or left. */
export function say(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { a?: number; col?: string; align?: CanvasTextAlign; f?: string; rot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a; ctx.fillStyle = o.col ?? INK; ctx.font = font(o.f ?? HEAD, size); ctx.textAlign = o.align ?? 'center';
  ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A fat manual arrow from a to b. */
export function arrow(ctx: CanvasRenderingContext2D, c: Cam, ax: number, ay: number, bx: number, by: number, k = 1, col = INK) {
  if (k <= 0.003) return;
  const ex = lerp(ax, bx, k), ey = lerp(ay, by, k);
  const ang = Math.atan2(by - ay, bx - ax);
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex - Math.cos(ang) * 30, ey - Math.sin(ang) * 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang - 0.5) * 56, ey - Math.sin(ang - 0.5) * 56); ctx.lineTo(ex - Math.cos(ang + 0.5) * 56, ey - Math.sin(ang + 0.5) * 56); ctx.closePath(); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A parts-list callout: a box with "Nx" and a label. */
export function callout(ctx: CanvasRenderingContext2D, c: Cam, qty: string, label: string, x: number, y: number, w: number, a = 1, o: { fill?: string } = {}) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.8 + 0.2 * ease.outBack(clamp(a)), 0);
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = o.fill ?? '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(-w / 2, -70, w, 140, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = font(HEAD, 72); ctx.textAlign = 'left'; ctx.fillText(qty, -w / 2 + 30, 26);
  const qw = measure(qty, HEAD, 72);
  ctx.font = font(BODY, 46); ctx.fillText(label, -w / 2 + 52 + qw, 18);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A speech bubble with text typed in (k = 0..1 of the text), centred at (x, y). */
export function bubble(ctx: CanvasRenderingContext2D, c: Cam, lines: string[], x: number, y: number, w: number, k: number, o: { a?: number; size?: number; fill?: string; col?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const size = o.size ?? 50, lh = size * 1.25, h = lines.length * lh + 60;
  setWorld(ctx, c, x, y, 0.85 + 0.15 * ease.outBack(clamp(a)), 0);
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = o.fill ?? '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 36); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w / 2 + 90, h / 2 - 3); ctx.lineTo(-w / 2 + 60, h / 2 + 56); ctx.lineTo(-w / 2 + 150, h / 2 - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = o.fill ?? '#FFFFFF'; ctx.fillRect(-w / 2 + 88, h / 2 - 8, 60, 10);
  const total = lines.join('').length; let n = Math.ceil(total * clamp(k));
  ctx.fillStyle = o.col ?? INK; ctx.font = font(BODY, size);
  lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, n)); n -= ln.length; ctx.fillText(s, -w / 2 + 40, -h / 2 + 30 + size + i * lh - size * 0.15); });
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A check mark (or a cross) in a circle. */
export function tick(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, a: number, ok = true, r = 44) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.6 + 0.4 * ease.outBack(clamp(a)), 0);
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = ok ? GREEN : RED; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.beginPath();
  if (ok) { ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.1, r * 0.35); ctx.lineTo(r * 0.5, -r * 0.35); }
  else { ctx.moveTo(-r * 0.35, -r * 0.35); ctx.lineTo(r * 0.35, r * 0.35); ctx.moveTo(r * 0.35, -r * 0.35); ctx.lineTo(-r * 0.35, r * 0.35); }
  ctx.stroke(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The manual's little person: round head, body, arms; `pose` 0 standing, 1 thumbs up. */
export function person(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s: number, pose = 0, a = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, s, 0);
  ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -150, 44, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-46, -100, 92, 130, 36); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-22, 30); ctx.lineTo(-26, 120); ctx.moveTo(22, 30); ctx.lineTo(26, 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-46, -80); ctx.lineTo(-90, -10); ctx.stroke();
  if (pose > 0.5) { ctx.beginPath(); ctx.moveTo(46, -80); ctx.lineTo(96, -120); ctx.stroke(); ctx.beginPath(); ctx.roundRect(84, -168, 26, 46, 10); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(46, -80); ctx.lineTo(90, -10); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-14, -156, 5, 0, TAU); ctx.arc(14, -156, 5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -142, 16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A line-art laptop centred at (x, y), screen w x h; returns the screen centre. */
export function laptop(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, a = 1): [number, number] {
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, 18); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-w / 2 + 22, -h + 22, w - 44, h - 44, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w / 2 - 40, 0); ctx.lineTo(w / 2 + 40, 0); ctx.lineTo(w / 2 + 70, 36); ctx.lineTo(-w / 2 - 70, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  return [x, y - h / 2];
}
/** A line-art 3D printer centred at (x, y). `p` 0..1 grows a print inside. */
export function printerArt(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s: number, p: number, a = 1) {
  setWorld(ctx, c, x, y, s, 0);
  ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(-200, -230, 400, 460, 24); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-160, -190, 320, 320, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-150, -110 + 70 * (1 - p)); ctx.lineTo(150, -110 + 70 * (1 - p)); ctx.stroke();
  const hx = Math.sin(p * 30) * 70;
  ctx.beginPath(); ctx.rect(hx - 26, -150 + 70 * (1 - p), 52, 40); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx - 8, -110 + 70 * (1 - p)); ctx.lineTo(hx, -96 + 70 * (1 - p)); ctx.lineTo(hx + 8, -110 + 70 * (1 - p)); ctx.stroke();
  ctx.fillStyle = YELLOW; ctx.fillRect(-60, 100 - 160 * p, 120, 160 * p); ctx.strokeRect(-60, 100 - 160 * p, 120, 160 * p);
  ctx.beginPath(); ctx.moveTo(-140, 104); ctx.lineTo(140, 104); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-60, 160, 120, 34, 8); ctx.fill();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
