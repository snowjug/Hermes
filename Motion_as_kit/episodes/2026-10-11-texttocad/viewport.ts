// The text-to-cad video's look (theme `viewport`): the video is a live CAD viewport. A graphite gradient with a
// perspective floor grid, real 3D parts (app/src/scenes/_cad3d.ts) that orbit, print layer by layer under a
// glowing nozzle and change size when a number changes; dimension lines, an axis gizmo, code and chat panels.
// Captions: the current phrase low on screen, the spoken word inside a blue CAD selection box with grips.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';
import { proj, project, type Proj, type V3, type View } from '@kit/_cad3d';

export { clamp, ease, lerp, TAU };
export const WHITE = '#F2F5FA';
export const SOFT = '#8E9AAD';
export const ORANGE = '#FF7A1A';
export const AMBER = '#FFC24B';
export const BLUE = '#3D8BFF';
export const GREEN = '#36D399';
export const RED = '#FF5A5F';
export const PART = '#A9B6C8'; // default part colour (aluminium grey-blue)
export const HEAD = F.archivo(75, 900);
export const BODY = F.archivo(100, 600);
export const MONO = F.mono(500);
export const MONOB = F.mono(700);

const VIEWPORT_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 top = vec3(0.165, 0.196, 0.25), bot = vec3(0.045, 0.055, 0.075);
  vec3 col = mix(top, bot, smoothstep(0.0, 1.0, q.y));
  // a soft studio light behind the part, drifting slowly
  col += vec3(0.11, 0.12, 0.15) * smoothstep(0.75, 0.0, length((q - vec2(0.5 + 0.05 * sin(uTime * 0.17), 0.42)) * vec2(1.0, 1.5)));
  col += vec3(0.35, 0.16, 0.05) * 0.05 * smoothstep(0.6, 0.0, length((q - vec2(0.5, 1.05)) * vec2(0.9, 1.8)));
  col *= 1.0 - 0.4 * dot(q - 0.5, q - 0.5);
  col += (h21(sp + floor(uTime * 24.0)) - 0.5) * 0.012;
  fragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ the plate
interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Viewport extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(VIEWPORT_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
  /** the main view of the plate, for the axis gizmo */
  gizmoView: View | null = null;
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
    if (this.gizmoView) gizmo(ctx, this.gizmoView);
    drawChunks(ctx, this.chunks, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.45, bloomThreshold: 0.78, vignette: 0.3, grain: 0.025, halation: 0.1, ca: 0.3, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.015) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

// ------------------------------------------------------------------ captions: the spoken word selected
const CAPS = { size: 60, maxW: 1480, y: 418, maxWords: 5 };
const CAPF = F.archivo(100, 800);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size) + 8;
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
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.02, c.end + 1.2) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // a dark band under the captions so they read over any part
  const live = chunks.some((ch) => t >= ch.start - 0.08 && t <= ch.end);
  if (live) {
    const g = ctx.createLinearGradient(0, H - 260, 0, H);
    g.addColorStop(0, 'rgba(8,10,14,0)'); g.addColorStop(0.55, 'rgba(8,10,14,0.55)'); g.addColorStop(1, 'rgba(8,10,14,0.7)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 260, W, 260);
  }
  for (const ch of chunks) {
    if (t < ch.start - 0.08 || t > ch.end) continue;
    const k = springStep(t - ch.start + 0.08, 4, 0.55);
    const a = clamp((t - ch.start + 0.08) / 0.06) * clamp((ch.end - t) / 0.08);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.globalAlpha = a;
    ctx.font = font(CAPF, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      const x = x0 + ch.xs[i]!, tw = measure(ch.texts[i]!, CAPF, size);
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const said = t >= w.start - 0.03;
      const ki = ease.outCubic(clamp((t - w.start + 0.03) / 0.1));
      ctx.save();
      ctx.translate(x, y + (1 - k) * 22);
      if (on) {
        // the selection box grows from the word's centre, grips at the corners
        const bw = (tw + 26) * lerp(0.6, 1, ki), bh = size * 1.12 * lerp(0.6, 1, ki);
        const bx = tw / 2 - bw / 2, by = -size * 0.42 - bh / 2;
        ctx.fillStyle = 'rgba(61,139,255,0.26)'; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = BLUE; ctx.lineWidth = 2;
        for (const [gx, gy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) { ctx.fillRect(gx! - 5, gy! - 5, 10, 10); ctx.strokeRect(gx! - 5, gy! - 5, 10, 10); }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(ch.texts[i]!, 3, 4);
      ctx.fillStyle = said ? '#FFFFFF' : 'rgba(255,255,255,0.5)';
      ctx.fillText(ch.texts[i]!, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ 3D helpers
/** An orbiting view: yaw turns by `speed` rad/s from t0. */
export function orbit(t: number, t0: number, yaw0: number, speed: number, base: Omit<View, 'yaw'>): View {
  return { ...base, yaw: yaw0 + (t - t0) * speed };
}
/** Project a 3D point into plate world coords, for a viewport drawn at world (vx, vy). */
export function at3(P: Proj, vx: number, vy: number, p: V3): [number, number] {
  const q = project(P, p);
  return [vx + q[0], vy + q[1]];
}
/** The axis gizmo in the top-right corner, turning with the view. */
export function gizmo(ctx: CanvasRenderingContext2D, v: View) {
  const P = proj({ ...v, target: [0, 0, 0], dist: 1000, s: 1 });
  const cx = W - 110, cy = 110, L = 52;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(14,18,24,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, 78, 0, TAU); ctx.fill();
  const axes: [V3, string, string][] = [[[1, 0, 0], '#E5484D', 'X'], [[0, 1, 0], '#46C26B', 'Y'], [[0, 0, 1], BLUE, 'Z']];
  const items = axes.map(([d, col, lab]) => ({ d, col, lab, sx: d[0] * P.right[0] + d[1] * P.right[1] + d[2] * P.right[2], sy: -(d[0] * P.up[0] + d[1] * P.up[1] + d[2] * P.up[2]), z: d[0] * P.fwd[0] + d[1] * P.fwd[1] + d[2] * P.fwd[2] }));
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    ctx.strokeStyle = it.col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + it.sx * L, cy + it.sy * L); ctx.stroke();
    ctx.fillStyle = it.col; ctx.beginPath(); ctx.arc(cx + it.sx * L, cy + it.sy * L, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0D1117'; ctx.font = font(BODY, 17); ctx.textAlign = 'center'; ctx.fillText(it.lab, cx + it.sx * L, cy + it.sy * L + 6);
  }
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ 2D helpers (world coords of the plate camera)
/** A headline underlined by a dimension line that grows out from its centre. */
export function headline(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; align?: 'center' | 'left'; a?: number; dim?: string } = {}) {
  const k = clamp((t - t0) / 0.3);
  if (k <= 0) return;
  const s = springStep(t - t0, 3.2, 0.5);
  const tw = measure(text, HEAD, size);
  const x0 = (o.align ?? 'center') === 'center' ? -tw / 2 : 0;
  setWorld(ctx, c, x, y, 0.9 + 0.1 * s, 0);
  ctx.globalAlpha = (o.a ?? 1) * clamp((t - t0) / 0.12);
  ctx.font = font(HEAD, size); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(text, x0 + 4, 5);
  ctx.fillStyle = o.col ?? WHITE; ctx.fillText(text, x0, 0);
  // the dimension line
  const dk = ease.outCubic(clamp((t - t0 - 0.12) / 0.4));
  const yy = size * 0.3, half = (tw / 2) * dk, mid = x0 + tw / 2;
  ctx.strokeStyle = ORANGE; ctx.fillStyle = ORANGE; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(mid - half, yy); ctx.lineTo(mid + half, yy); ctx.stroke();
  if (dk > 0.98) {
    for (const [ex, dir] of [[x0, 1], [x0 + tw, -1]] as [number, number][]) {
      ctx.beginPath(); ctx.moveTo(ex, yy - 14); ctx.lineTo(ex, yy + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex, yy); ctx.lineTo(ex + dir * 16, yy - 7); ctx.lineTo(ex + dir * 16, yy + 7); ctx.closePath(); ctx.fill();
    }
  }
  if (o.dim && dk > 0.6) {
    ctx.font = font(MONOB, Math.max(20, size * 0.26)); ctx.textAlign = 'center';
    const lw = measure(o.dim, MONOB, Math.max(20, size * 0.26)) + 20;
    ctx.fillStyle = '#0D1117'; ctx.fillRect(mid - lw / 2, yy - 16, lw, 32);
    ctx.fillStyle = ORANGE; ctx.fillText(o.dim, mid, yy + 9);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export function tag(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { bg?: string; fg?: string; a?: number; rot?: number; mono?: boolean; stroke?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const f = o.mono ? MONOB : BODY;
  const tw = measure(text, f, size);
  setWorld(ctx, c, x, y, 0.85 + 0.15 * clamp(a * 1.2), o.rot ?? 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.bg ?? 'rgba(22,28,37,0.92)';
  ctx.beginPath(); ctx.roundRect(-tw / 2 - size * 0.55, -size * 0.8, tw + size * 1.1, size * 1.6, size * 0.35); ctx.fill();
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = o.fg ?? WHITE; ctx.font = font(f, size); ctx.textAlign = 'center';
  ctx.fillText(text, 0, size * 0.36);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A dark app panel with a title bar, top-left at world (x, y). */
export function panel(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, o: { a?: number; accent?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = 'rgba(18,23,31,0.96)'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 16); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(142,154,173,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.roundRect(0, 0, w, 52, [16, 16, 0, 0]); ctx.fill();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(26 + i * 22, 26, 7, 0, TAU); ctx.fill(); });
  ctx.fillStyle = SOFT; ctx.font = font(MONO, 22); ctx.fillText(title, 104, 34);
  if (o.accent) { ctx.fillStyle = o.accent; ctx.fillRect(0, 50, w, 2); }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
const KW = /^(from|import|def|return|if|for|in|as|with)$/;
/** Python with simple highlighting, typed in from t0 at `cps` characters a second; top-left at (x, y). */
export function code(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, lines: string[], t: number, t0: number, o: { size?: number; cps?: number; a?: number; hi?: number; hiCol?: string } = {}) {
  const size = o.size ?? 26, lh = size * 1.5;
  const total = Math.floor(Math.max(0, t - t0) * (o.cps ?? 60));
  let used = 0;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1;
  ctx.font = font(MONO, size);
  lines.forEach((ln, i) => {
    const show = ln.slice(0, Math.max(0, total - used));
    used += ln.length + 1;
    const yy = i * lh + size;
    if (o.hi === i) { ctx.fillStyle = o.hiCol ?? 'rgba(255,122,26,0.22)'; ctx.fillRect(-12, yy - size * 1.05, 900, lh); }
    ctx.fillStyle = 'rgba(142,154,173,0.45)'; ctx.fillText(String(i + 1).padStart(2, ' '), -2, yy);
    let xx = size * 2.2;
    for (const tok of show.split(/(\s+|[()=,:."])/).filter((s) => s.length)) {
      let col = '#D7DEE8';
      if (KW.test(tok)) col = '#C792EA';
      else if (/^\d+(\.\d+)?$/.test(tok)) col = ORANGE;
      else if (tok.startsWith('@')) col = '#82AAFF';
      else if (/^[A-Z_]{3,}$/.test(tok)) col = AMBER;
      else if (tok.startsWith('#')) col = '#6B7689';
      ctx.fillStyle = col; ctx.fillText(tok, xx, yy);
      xx += ctx.measureText(tok).width;
    }
    if (show.length < ln.length && show.length > 0 && Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = ORANGE; ctx.fillRect(xx + 2, yy - size * 0.8, 3, size); }
  });
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Chat messages typed in at their times (`me` right, blue; `ai` left). Top-left at (x, y), w wide. */
export function chat(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, msgs: [string, 'me' | 'ai', number][], t: number, o: { size?: number; a?: number; cps?: number } = {}) {
  const size = o.size ?? 28;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1;
  let yy = 0;
  for (const [text, who, t0] of msgs) {
    if (t < t0) break;
    const n = who === 'me' ? Math.ceil(text.length * clamp((t - t0) / Math.max(0.3, text.length / (o.cps ?? 45)))) : text.length;
    const shown = text.slice(0, n);
    ctx.font = font(BODY, size);
    // wrap
    const words = shown.split(' '); const rows: string[] = []; let cur = '';
    for (const wd of words) { const tr = cur ? cur + ' ' + wd : wd; if (measure(tr, BODY, size) > w * 0.78 && cur) { rows.push(cur); cur = wd; } else cur = tr; }
    rows.push(cur);
    const bw = Math.min(w * 0.82, Math.max(...rows.map((r) => measure(r, BODY, size))) + 40), bh = rows.length * size * 1.35 + 26;
    const bx = who === 'me' ? w - bw : 0;
    const pop = springStep(t - t0, 4, 0.55);
    ctx.save(); ctx.translate(bx + bw / 2, yy + bh / 2); ctx.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop); ctx.translate(-bw / 2, -bh / 2);
    ctx.fillStyle = who === 'me' ? BLUE : 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect(0, 0, bw, bh, 20); ctx.fill();
    ctx.fillStyle = WHITE;
    rows.forEach((r, i) => ctx.fillText(r, 20, 13 + size + i * size * 1.35 - size * 0.2));
    ctx.restore();
    yy += bh + 18;
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A file icon with a big extension label, centred at (x, y). */
export function fileChip(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, ext: string, o: { col?: string; a?: number; s?: number; name?: string; rot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, o.s ?? 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  const w = 150, h = 190, f = 40;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#E9EEF5';
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2 - f, -h / 2); ctx.lineTo(w / 2, -h / 2 + f); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#C3CCD8'; ctx.beginPath(); ctx.moveTo(w / 2 - f, -h / 2); ctx.lineTo(w / 2 - f, -h / 2 + f); ctx.lineTo(w / 2, -h / 2 + f); ctx.closePath(); ctx.fill();
  ctx.fillStyle = o.col ?? BLUE; ctx.fillRect(-w / 2, 10, w, 56);
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(HEAD, 40); ctx.textAlign = 'center'; ctx.fillText(ext, 0, 52);
  if (o.name) { ctx.fillStyle = '#3A4556'; ctx.font = font(MONO, 17); ctx.fillText(o.name, 0, -30); }
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A dimension between two points (world coords): extension lines, arrows and a label, offset sideways. */
export function dim(ctx: CanvasRenderingContext2D, c: Cam, a: [number, number], b: [number, number], label: string, o: { off?: number; al?: number; col?: string; size?: number; k?: number } = {}) {
  const al = o.al ?? 1;
  if (al <= 0.003) return;
  const col = o.col ?? ORANGE, off = o.off ?? 40, size = o.size ?? 28, k = o.k ?? 1;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const A: [number, number] = [a[0] + nx * off, a[1] + ny * off], B: [number, number] = [b[0] + nx * off, b[1] + ny * off];
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
  const A2: [number, number] = [mx + (A[0] - mx) * k, my + (A[1] - my) * k], B2: [number, number] = [mx + (B[0] - mx) * k, my + (B[1] - my) * k];
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.globalAlpha = al;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(a[0] + nx * 8, a[1] + ny * 8); ctx.lineTo(A[0] + nx * 12, A[1] + ny * 12);
  ctx.moveTo(b[0] + nx * 8, b[1] + ny * 8); ctx.lineTo(B[0] + nx * 12, B[1] + ny * 12);
  ctx.moveTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.stroke();
  if (k > 0.98) {
    const ux = dx / L, uy = dy / L;
    for (const [p, s] of [[A, 1], [B, -1]] as [[number, number], number][]) {
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + s * ux * 16 + nx * 6, p[1] + s * uy * 16 + ny * 6); ctx.lineTo(p[0] + s * ux * 16 - nx * 6, p[1] + s * uy * 16 - ny * 6); ctx.closePath(); ctx.fill();
    }
  }
  if (k > 0.5) {
    ctx.font = font(MONOB, size); ctx.textAlign = 'center';
    const lw = measure(label, MONOB, size) + 18;
    ctx.fillStyle = 'rgba(13,17,23,0.92)'; ctx.fillRect(mx - lw / 2, my - size * 0.72, lw, size * 1.36);
    ctx.fillStyle = col; ctx.fillText(label, mx, my + size * 0.36);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A printer hot end with its nozzle tip at world (x, y); `hot` 0..1 lights the tip and the bead. */
export function nozzle(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s = 1, hot = 1) {
  setWorld(ctx, c, x, y, s, 0);
  // carriage and heat sink
  ctx.fillStyle = '#2A313C'; ctx.beginPath(); ctx.roundRect(-70, -230, 140, 90, 10); ctx.fill();
  ctx.fillStyle = '#3B4452'; for (let i = 0; i < 7; i++) ctx.fillRect(-46, -140 + i * 9, 92, 5);
  // heat block
  ctx.fillStyle = '#B9C2CE'; ctx.fillRect(-34, -76, 68, 40);
  // nozzle
  const g = ctx.createLinearGradient(-18, 0, 18, 0); g.addColorStop(0, '#B8863B'); g.addColorStop(0.5, '#F2C66D'); g.addColorStop(1, '#9A6E2E');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-18, -36); ctx.lineTo(18, -36); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
  if (hot > 0) {
    ctx.globalAlpha = hot;
    const r = ctx.createRadialGradient(0, 0, 0, 0, 0, 46); r.addColorStop(0, 'rgba(255,170,90,0.95)'); r.addColorStop(1, 'rgba(255,122,26,0)');
    ctx.fillStyle = r; ctx.beginPath(); ctx.arc(0, 2, 46, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A check row: a green tick or a red cross and a label; left edge at (x, y). */
export function check(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, text: string, ok: boolean, o: { a?: number; size?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const size = o.size ?? 32;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  const col = ok ? GREEN : RED;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(size * 0.6, 0, size * 0.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#0D1117'; ctx.lineWidth = size * 0.14; ctx.lineCap = 'round';
  ctx.beginPath();
  if (ok) { ctx.moveTo(size * 0.32, 0); ctx.lineTo(size * 0.52, size * 0.2); ctx.lineTo(size * 0.88, -size * 0.2); }
  else { ctx.moveTo(size * 0.38, -size * 0.22); ctx.lineTo(size * 0.82, size * 0.22); ctx.moveTo(size * 0.82, -size * 0.22); ctx.lineTo(size * 0.38, size * 0.22); }
  ctx.stroke();
  ctx.fillStyle = WHITE; ctx.font = font(BODY, size); ctx.fillText(text, size * 1.6, size * 0.36);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A generic enclosed 3D printer centred at (x, y): frame, glass door, bed, and `progress` 0..1 of a print. */
export function printer(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s = 1, o: { a?: number; progress?: number; glow?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, s, 0);
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#20262F'; ctx.beginPath(); ctx.roundRect(-170, -190, 340, 380, 26); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // the glass door and the build chamber
  const g = ctx.createLinearGradient(0, -160, 0, 120);
  g.addColorStop(0, 'rgba(120,150,190,0.25)'); g.addColorStop(1, 'rgba(40,50,64,0.6)');
  ctx.fillStyle = '#0E1218'; ctx.beginPath(); ctx.roundRect(-140, -160, 280, 270, 14); ctx.fill();
  // gantry and print head
  const p = o.progress ?? 0;
  ctx.fillStyle = '#3B4452'; ctx.fillRect(-130, -110 + 40 * (1 - p), 260, 10);
  const hx = Math.sin(p * 40) * 60;
  ctx.fillStyle = '#C9CED6'; ctx.fillRect(hx - 18, -128 + 40 * (1 - p), 36, 30);
  ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.arc(hx, -94 + 40 * (1 - p), 4 + 4 * (o.glow ?? 0), 0, TAU); ctx.fill();
  // the part growing on the bed
  ctx.fillStyle = '#FF7A1A'; ctx.fillRect(-50, 70 - 110 * p, 100, 110 * p);
  ctx.fillStyle = '#556070'; ctx.fillRect(-120, 70, 240, 10);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-140, -160, 280, 270, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, -140); ctx.lineTo(-40, -140); ctx.stroke();
  // the screen
  ctx.fillStyle = '#0D1117'; ctx.beginPath(); ctx.roundRect(-60, 128, 120, 40, 8); ctx.fill();
  ctx.fillStyle = '#36D399'; ctx.fillRect(-48, 144, 96 * p, 8);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
