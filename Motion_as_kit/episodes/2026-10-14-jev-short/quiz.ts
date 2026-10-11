// The Jev Short's look (theme `quiz`): a TV quiz show. A deep indigo stage with sweeping spotlight beams, a
// glowing floor and twinkles; gold-edged hexagonal answer panels that slide in, lock orange and turn green;
// the red decision dot is the contestant. Captions are big white type with a black outline, the spoken word
// in gold, popping.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export { clamp, ease, hash, lerp, springStep, TAU };
export const GOLD = '#FFC94A';
export const GOLD2 = '#E8A23A';
export const NAVY = '#0B1640';
export const WHITE = '#FFFFFF';
export const ORANGE = '#F28C18';
export const GREEN = '#2FBF71';
export const RED = '#F23A1D';
export const HEAD = F.archivo(100, 900);
export const BOLD = F.archivo(100, 800);
export const MONOB = F.mono(700);
/** outBack that is exactly 0 at 0 */
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));

const STAGE_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 col = mix(vec3(0.10, 0.06, 0.28), vec3(0.015, 0.01, 0.06), smoothstep(0.0, 1.1, length((q - vec2(0.5, 0.18)) * vec2(1.0, 0.9))));
  // beams from the top, sweeping
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 o = vec2(0.15 + 0.23 * fi, -0.05);
    float ang = -0.5 + 0.35 * sin(uTime * (0.35 + 0.08 * fi) + fi * 1.7) + 0.3 * (fi - 1.5) * 0.4;
    vec2 d = vec2(sin(ang), cos(ang));
    vec2 r = q - o;
    float along = dot(r, d), across = abs(r.x * d.y - r.y * d.x);
    float beam = smoothstep(0.035 + along * 0.12, 0.0, across) * smoothstep(0.0, 0.2, along) * smoothstep(1.3, 0.3, along);
    col += mix(vec3(0.35, 0.3, 1.0), vec3(1.0, 0.75, 0.35), step(1.5, mod(fi, 3.0))) * 0.13 * beam;
  }
  // the floor glow
  col += vec3(0.25, 0.16, 0.7) * 0.18 * smoothstep(0.35, 0.0, length((q - vec2(0.5, 1.02)) * vec2(0.7, 2.4)));
  // twinkles
  vec2 g = floor(sp / 40.0);
  float s = h21(g);
  float tw = step(0.985, s) * (0.5 + 0.5 * sin(uTime * (2.0 + 6.0 * h21(g + 7.0)) + s * 40.0));
  col += vec3(1.0, 0.9, 0.7) * tw * 0.6 * smoothstep(3.0, 0.0, length(fract(sp / 40.0) - 0.5) * 6.0);
  col += (h21(sp + floor(uTime * 24.0)) - 0.5) * 0.02;
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class QuizPlate extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(STAGE_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
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
    return { bloom: 0.55, bloomThreshold: 0.7, vignette: 0.3, grain: 0.03, halation: 0.15, ca: 0.3, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

// ------------------------------------------------------------------ captions: outlined white, the spoken word gold
const CAPS = { size: 82, maxW: 960, y: 640, maxWords: 4 };
const CAPF = F.archivo(100, 900);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size) + 6;
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
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.02, c.end + 0.9) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const ch of chunks) {
    if (t < ch.start - 0.08 || t > ch.end) continue;
    const k = springStep(t - ch.start + 0.08, 4.5, 0.5);
    const a = clamp((t - ch.start + 0.08) / 0.05) * clamp((ch.end - t) / 0.08);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.globalAlpha = a;
    ctx.font = font(CAPF, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    ch.words.forEach((w, i) => {
      const x = x0 + ch.xs[i]!, tw = measure(ch.texts[i]!, CAPF, size);
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const pop = on ? 1 + 0.12 * (1 - ease.outCubic(clamp((t - w.start + 0.03) / 0.14))) : 1;
      ctx.save(); ctx.translate(x + tw / 2, y - size * 0.35 + (1 - k) * 30); ctx.scale(pop * (0.9 + 0.1 * k), pop * (0.9 + 0.1 * k));
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 12; ctx.strokeText(ch.texts[i]!, -tw / 2, size * 0.35);
      ctx.fillStyle = on ? GOLD : WHITE; ctx.fillText(ch.texts[i]!, -tw / 2, size * 0.35);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ the show's pieces (world coords)
function hexPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const p = h * 0.42;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 + p, -h / 2); ctx.lineTo(w / 2 - p, -h / 2); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 - p, h / 2); ctx.lineTo(-w / 2 + p, h / 2); ctx.closePath();
}
export type PanelState = 'idle' | 'locked' | 'right' | 'wrong' | 'dim';
/** An answer panel centred at (x, y): "A:" in gold and the answer; its state colours it. `pct` shows a share. */
export function panel(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, letter: string, text: string,
  o: { state?: PanelState; a?: number; pct?: number | null; size?: number; flash?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const st = o.state ?? 'idle', size = o.size ?? 52;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  // the rail behind the panel
  ctx.strokeStyle = 'rgba(232,162,58,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-W, 0); ctx.lineTo(-w / 2, 0); ctx.moveTo(w / 2, 0); ctx.lineTo(W, 0); ctx.stroke();
  hexPath(ctx, w, h);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (st === 'locked') { g.addColorStop(0, '#FFB347'); g.addColorStop(1, '#E06A00'); }
  else if (st === 'right') { g.addColorStop(0, '#5BE39A'); g.addColorStop(1, '#14894B'); }
  else if (st === 'wrong') { g.addColorStop(0, '#3A1020'); g.addColorStop(1, '#1A0610'); }
  else { g.addColorStop(0, '#1C2A6E'); g.addColorStop(1, '#070D2E'); }
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowColor = st === 'right' ? 'rgba(47,191,113,0.9)' : st === 'locked' ? 'rgba(242,140,24,0.9)' : 'rgba(255,201,74,0.6)';
  ctx.shadowBlur = st === 'idle' || st === 'dim' ? 14 : 34;
  ctx.strokeStyle = st === 'dim' ? 'rgba(232,162,58,0.4)' : GOLD; ctx.lineWidth = 5; ctx.stroke(); ctx.shadowBlur = 0;
  if (o.flash && o.flash > 0) { ctx.globalAlpha = a * o.flash; ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.globalAlpha = a; }
  ctx.font = font(BOLD, size); ctx.textAlign = 'left';
  const lx = -w / 2 + h * 0.55;
  if (letter) { ctx.fillStyle = st === 'locked' || st === 'right' ? '#1A0E00' : GOLD; ctx.fillText(`${letter}:`, lx, size * 0.36); }
  ctx.fillStyle = st === 'locked' || st === 'right' ? '#1A0E00' : st === 'dim' || st === 'wrong' ? 'rgba(255,255,255,0.45)' : WHITE;
  if (letter) ctx.fillText(text, lx + measure(`${letter}: `, BOLD, size), size * 0.36);
  else { ctx.textAlign = 'center'; ctx.fillText(text, 0, size * 0.36); ctx.textAlign = 'left'; }
  if (o.pct !== undefined && o.pct !== null) {
    ctx.textAlign = 'right'; ctx.font = font(MONOB, size * 0.85);
    ctx.fillStyle = st === 'locked' || st === 'right' ? '#1A0E00' : GOLD;
    ctx.fillText(`${Math.round(o.pct)}%`, w / 2 - h * 0.5, size * 0.33);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The question panel: a wider hexagon, one or two lines of white text. */
export function question(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, lines: string[], o: { a?: number; size?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const size = o.size ?? 56, h = lines.length * size * 1.2 + 70;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(232,162,58,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-W, 0); ctx.lineTo(-w / 2, 0); ctx.moveTo(w / 2, 0); ctx.lineTo(W, 0); ctx.stroke();
  hexPath(ctx, w, h);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#22307A'); g.addColorStop(1, '#090F36');
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowColor = 'rgba(255,201,74,0.7)'; ctx.shadowBlur = 24; ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = WHITE; ctx.font = font(BOLD, size); ctx.textAlign = 'center';
  lines.forEach((s, i) => ctx.fillText(s, 0, (i - (lines.length - 1) / 2) * size * 1.2 + size * 0.36));
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Gold show title text with a glow, centred. */
export function title(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, a = 1, col = GOLD) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.85 + 0.15 * ob(clamp(a * 1.2)), 0);
  ctx.globalAlpha = clamp(a);
  ctx.font = font(HEAD, size); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000000'; ctx.lineWidth = size * 0.12; ctx.strokeText(text, 0, 0);
  ctx.shadowColor = 'rgba(255,201,74,0.8)'; ctx.shadowBlur = 30;
  const g = ctx.createLinearGradient(0, -size, 0, 0); g.addColorStop(0, '#FFF1B8'); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The red decision dot (the contestant). */
export function dot(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, a = 1) {
  if (a <= 0.003 || r <= 0.1) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a; ctx.shadowColor = 'rgba(242,58,29,0.9)'; ctx.shadowBlur = 30;
  ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A lifeline: a gold ring with an icon drawn inside and a label under it. */
export function lifeline(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, icon: 'mail' | 'shield', lab: string, k: number) {
  if (k <= 0.003) return;
  setWorld(ctx, c, x, y, 0.7 + 0.3 * ob(clamp(k)), 0);
  ctx.globalAlpha = clamp(k);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, '#2A3A9A'); g.addColorStop(1, '#0A1240');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.shadowColor = 'rgba(255,201,74,0.9)'; ctx.shadowBlur = 30; ctx.strokeStyle = GOLD; ctx.lineWidth = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = WHITE; ctx.fillStyle = WHITE; ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (icon === 'mail') { ctx.strokeRect(-r * 0.5, -r * 0.32, r, r * 0.64); ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.32); ctx.lineTo(0, r * 0.08); ctx.lineTo(r * 0.5, -r * 0.32); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.42, -r * 0.38); ctx.lineTo(r * 0.38, r * 0.12); ctx.quadraticCurveTo(r * 0.28, r * 0.42, 0, r * 0.58); ctx.quadraticCurveTo(-r * 0.28, r * 0.42, -r * 0.38, r * 0.12); ctx.lineTo(-r * 0.42, -r * 0.38); ctx.closePath(); ctx.stroke(); }
  ctx.font = font(BOLD, 46); ctx.textAlign = 'center'; ctx.fillStyle = WHITE; ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
  ctx.strokeText(lab, 0, r + 70); ctx.fillText(lab, 0, r + 70);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
