// The REA video's look (theme `comic`): a motion comic on newsprint. Every line gets a page of ink-bordered
// panels that land one by one while the camera travels across them; flat comic colours with Ben-Day halftone
// shading, speed lines, onomatopoeia, speech and thought balloons, and a little robot detective (the AI agent)
// with a fedora and a magnifying glass. The narration is lettered into yellow caption boxes at the bottom of
// the frame, word by word as it is spoken.
import { FSPass, W, H } from '@engine/gl';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export const INK = '#121212';
export const PAPER = '#FFFDF6';
export const RED = '#E5322B';
export const YEL = '#FFD21F';
export const BLUE = '#1F5FD1';
export const SKY = '#7EC8F2';
export const GREEN = '#18A558';
export const PINK = '#F27BA8';
export const ORANGE = '#F2862E';
export const GREY = '#B9B4A8';
export const LETTER = F.archivoItalic(80, 800);
export const BLOCK = F.archivo(75, 900);

const COMIC_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 d = sp - 0.5 * uRes;
  float c = cos(-uCam.w), s = sin(-uCam.w);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / uCam.z;
  vec2 p = uCam.xy + d;
  vec3 col = C_BONE;
  float m = fbm(p * 0.0011 + uSeed, 3);
  col *= 0.975 - 0.035 * m;
  // newsprint: a faint Ben-Day screen, angled
  vec2 q = mat2(0.966, -0.259, 0.259, 0.966) * p / 16.0;
  vec2 f = fract(q) - 0.5;
  float dt = smoothstep(0.2, 0.14, length(f));
  col = mix(col, col * vec3(0.92, 0.86, 0.80), dt * 0.32);
  vec2 v = sp / uRes - 0.5;
  col *= 1.0 - 0.2 * dot(v, v);
  fragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ the plate
export interface CapLine { words: { w: Word; x: number; row: number; text: string }[]; rows: number; width: number; start: number; end: number; size: number }

export abstract class Comic extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(COMIC_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 } });
  caps: CapLine[] = [];
  override init() {
    super.init();
    this.caps = layoutCaps(this.captionLines(), this.ctx.end);
  }
  captionLines(): Line[] {
    return this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.page(ctx, t, c); }
  page(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    drawCaps(ctx, this.caps, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { vignette: 0.22, grain: 0.035, ca: 0.3, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.015) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

// ------------------------------------------------------------------ captions: lettered caption boxes
const CAP = { size: 48, maxW: 1700, y: 420, pad: 24 };
function layoutCaps(lines: Line[], plateEnd: number): CapLine[] {
  return lines.map((l, i) => {
    const size = CAP.size, sp = measure(' ', LETTER, size);
    const out: CapLine['words'] = [];
    let x = 0, row = 0, widest = 0;
    for (const w of l.words) {
      const text = w.w.toUpperCase();
      const ww = measure(text, LETTER, size);
      if (x > 0 && x + sp + ww > CAP.maxW) { widest = Math.max(widest, x); row++; x = 0; }
      out.push({ w, x: x + (x > 0 ? sp : 0), row, text });
      x += (x > 0 ? sp : 0) + ww;
    }
    widest = Math.max(widest, x);
    const next = lines[i + 1];
    return { words: out, rows: row + 1, width: widest, start: l.start, end: next ? next.start - 0.06 : Math.min(plateEnd + 0.05, l.end + 1.2), size };
  });
}
function drawCaps(ctx: CanvasRenderingContext2D, caps: CapLine[], t: number) {
  for (const cp of caps) {
    if (t < cp.start - 0.12 || t > cp.end) continue;
    const lh = cp.size * 1.22;
    const bw = cp.width + CAP.pad * 2, bh = cp.rows * lh + CAP.pad * 1.3;
    const k = springStep(t - cp.start + 0.12, 3.6, 0.55);
    const out = clamp((cp.end - t) / 0.1);
    const cx = W / 2, cy = H / 2 + CAP.y - bh / 2 + 30;
    ctx.setTransform(0.85 + 0.15 * k, 0, 0, 0.85 + 0.15 * k, cx, cy);
    ctx.globalAlpha = clamp((t - cp.start + 0.12) / 0.06) * out;
    ctx.fillStyle = INK; ctx.fillRect(-bw / 2 + 9, -bh / 2 + 9, bw, bh);
    ctx.fillStyle = YEL; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.font = font(LETTER, cp.size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    for (const wd of cp.words) {
      // each row is centred in the box
      const rowW = rowWidthOf(cp, wd.row);
      const x0 = -rowW / 2 + wd.x;
      const y0 = -bh / 2 + CAP.pad * 0.65 + (wd.row + 1) * lh - cp.size * 0.24;
      const age = t - wd.w.start + 0.03;
      if (age < 0) continue;
      const s = 1 + 0.25 * (1 - ease.outCubic(clamp(age / 0.12)));
      ctx.save(); ctx.translate(x0, y0); ctx.scale(s, s);
      ctx.fillStyle = INK; ctx.fillText(wd.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function rowWidthOf(cp: CapLine, row: number) {
  const ws = cp.words.filter((w) => w.row === row);
  const last = ws[ws.length - 1]!;
  return last.x + measure(last.text, LETTER, cp.size);
}

// ------------------------------------------------------------------ panels
const PATTERNS = new Map<string, CanvasPattern>();
function dotPattern(ctx: CanvasRenderingContext2D, col: string, r: number, gap: number) {
  const key = `${col}|${r}|${gap}`;
  let p = PATTERNS.get(key);
  if (!p) {
    const cv = document.createElement('canvas'); cv.width = gap; cv.height = gap;
    const g = cv.getContext('2d')!;
    g.fillStyle = col; g.beginPath(); g.arc(gap / 2, gap / 2, r, 0, TAU); g.fill();
    p = ctx.createPattern(cv, 'repeat')!;
    PATTERNS.set(key, p);
  }
  return p;
}
/** Ben-Day dots over a rect (local coords). */
export function halftone(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string, r = 3.4, gap = 12, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = dotPattern(ctx, col, r, gap);
  ctx.translate(x, y); ctx.fillRect(0, 0, w, h); ctx.restore();
}

export interface PanelOpts {
  fill?: string;
  dots?: string;
  rot?: number;
  from?: 'pop' | 'left' | 'right' | 'up' | 'down';
  /** draw the content: local coords, origin at the panel's centre */
  draw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  a?: number;
}
/** An ink-bordered panel with its top-left at world (x, y), landing at t0. Returns false while hidden. */
export function panel(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, t: number, t0: number, o: PanelOpts = {}) {
  if (t < t0) return false;
  const k = springStep(t - t0, 3.2, 0.62);
  const e = ease.outCubic(clamp((t - t0) / 0.28));
  let dx = 0, dy = 0, sc = 1;
  const from = o.from ?? 'pop';
  if (from === 'pop') sc = 0.8 + 0.2 * k;
  else if (from === 'left') dx = -260 * (1 - e);
  else if (from === 'right') dx = 260 * (1 - e);
  else if (from === 'up') dy = -200 * (1 - e);
  else dy = 200 * (1 - e);
  setWorld(ctx, c, x + w / 2 + dx, y + h / 2 + dy, sc, o.rot ?? 0);
  ctx.globalAlpha = clamp((t - t0) / 0.06) * (o.a ?? 1);
  ctx.fillStyle = INK; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h);
  ctx.fillStyle = o.fill ?? PAPER; ctx.fillRect(-w / 2, -h / 2, w, h);
  if (o.dots) halftone(ctx, -w / 2, -h / 2, w, h, o.dots, 3.6, 13, 0.55);
  if (o.draw) {
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    o.draw(ctx, w, h);
    ctx.restore();
  }
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineJoin = 'miter'; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return true;
}

/** Radial speed lines around (cx, cy) between radii r0 and r1 (local coords). */
export function speedLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, r0: number, r1: number, n: number, seed: number, col = INK, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + hash(seed, i) * 0.12;
    const wdt = 0.006 + 0.012 * hash(seed, i + 50);
    const ra = r0 * (0.9 + 0.3 * hash(seed, i + 90));
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(an - wdt) * r1, cy + Math.sin(an - wdt) * r1);
    ctx.lineTo(cx + Math.cos(an) * ra, cy + Math.sin(an) * ra);
    ctx.lineTo(cx + Math.cos(an + wdt) * r1, cy + Math.sin(an + wdt) * r1);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** A spiky burst path centred at (x, y) (local coords). */
export function burstPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n = 14, seed = 1, inner = 0.68) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const an = (i / (n * 2)) * TAU - Math.PI / 2;
    const rr = i % 2 ? r * inner * (0.9 + 0.2 * hash(seed, i)) : r * (0.9 + 0.2 * hash(seed, i + 30));
    ctx.lineTo(x + Math.cos(an) * rr * 1.25, y + Math.sin(an) * rr);
  }
  ctx.closePath();
}

/** Onomatopoeia: a fat italic word with a black outline, slammed in at t0 (world coords). */
export function sfx(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { fill?: string; rot?: number; burst?: string; a?: number } = {}) {
  if (t < t0) return;
  const age = t - t0;
  const sc = 1 + 0.6 * (1 - ease.outBack(clamp(age / 0.22)));
  setWorld(ctx, c, x, y, sc, (o.rot ?? -0.12) + 0.02 * Math.sin(age * 9) * Math.exp(-age * 3));
  ctx.globalAlpha = clamp(age / 0.04) * (o.a ?? 1);
  const fam = F.archivoItalic(110, 900);
  const tw = measure(text, fam, size);
  if (o.burst) {
    ctx.fillStyle = o.burst; burstPath(ctx, 0, -size * 0.32, tw * 0.62 + size * 0.3, 13, text.length);
    ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.font = font(fam, size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.2; ctx.strokeStyle = INK; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = o.fill ?? YEL; ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A speech (or thought) balloon centred at world (x, y) with a tail pointing to (x + tx, y + ty). */
export function balloon(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, text: string[], t: number, t0: number, o: { tail?: [number, number]; size?: number; thought?: boolean; fill?: string; a?: number } = {}) {
  if (t < t0) return;
  const size = o.size ?? 42, lh = size * 1.18;
  const tw = Math.max(...text.map((s) => measure(s, LETTER, size)));
  const w = tw + size * 2.2, h = text.length * lh + size * 1.5;
  const k = springStep(t - t0, 3.4, 0.5);
  setWorld(ctx, c, x, y, 0.6 + 0.4 * k, 0);
  ctx.globalAlpha = clamp((t - t0) / 0.05) * (o.a ?? 1);
  ctx.fillStyle = o.fill ?? '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  const [tx, ty] = o.tail ?? [-w * 0.25, h * 0.9];
  if (o.thought) {
    for (let i = 1; i <= 3; i++) {
      const f = i / 4, r = size * (0.42 - i * 0.08);
      ctx.beginPath(); ctx.arc(tx * (0.45 + f * 0.6), ty * (0.45 + f * 0.6), r, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath();
    const n = 11;
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU;
      ctx.ellipse(Math.cos(an) * w * 0.44, Math.sin(an) * h * 0.4, w * 0.16, h * 0.24, 0, 0, TAU);
    }
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.47, h * 0.47, 0, 0, TAU); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-w * 0.12, h * 0.3); ctx.lineTo(tx, ty); ctx.lineTo(w * 0.06, h * 0.38); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w * 0.14, h * 0.28); ctx.lineTo(w * 0.08, h * 0.36); ctx.lineWidth = 10; ctx.strokeStyle = o.fill ?? '#FFFFFF'; ctx.stroke();
  }
  ctx.font = font(LETTER, size); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  text.forEach((s, i) => ctx.fillText(s, 0, -((text.length - 1) * lh) / 2 + i * lh + size * 0.36));
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Block letters (a title or a label) in world space, centred. */
export function title(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { fill?: string; stroke?: string; rot?: number; a?: number; fam?: string } = {}) {
  if (t < t0) return 0;
  const age = t - t0;
  const sc = 1 + 0.3 * (1 - ease.outCubic(clamp(age / 0.18)));
  const fam = o.fam ?? BLOCK;
  setWorld(ctx, c, x, y, sc, o.rot ?? 0);
  ctx.globalAlpha = clamp(age / 0.05) * (o.a ?? 1);
  ctx.font = font(fam, size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.fillStyle = INK; ctx.fillText(text, size * 0.06, size * 0.06);
  if (o.stroke) { ctx.lineWidth = size * 0.12; ctx.strokeStyle = o.stroke; ctx.strokeText(text, 0, 0); }
  ctx.fillStyle = o.fill ?? INK; ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return measure(text, fam, size);
}

// ------------------------------------------------------------------ props (local coords, inside a panel)
/**
 * The agent: a little robot detective in a fedora, holding a magnifying glass. Drawn at local (x, y),
 * scale s (about 300 px tall at 1). `look` -1..1 turns the eyes; `glass` 0..1 raises the lens to the eye.
 */
export function agent(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, o: { look?: number; glass?: number; mouth?: 'o' | 'smile' | 'flat'; flip?: boolean } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const bob = Math.sin(t * 3) * 3;
  // body
  ctx.fillStyle = '#9FB7D6';
  ctx.beginPath(); ctx.roundRect(-70, 20 + bob * 0.3, 140, 120, 24); ctx.fill(); ctx.stroke();
  halftone(ctx, -70, 80, 140, 60, 'rgba(18,18,18,0.35)', 2.6, 10);
  ctx.beginPath(); ctx.roundRect(-70, 20 + bob * 0.3, 140, 120, 24); ctx.stroke();
  // panel on the chest
  ctx.fillStyle = YEL; ctx.beginPath(); ctx.roundRect(-30, 50 + bob * 0.3, 60, 34, 6); ctx.fill(); ctx.stroke();
  // head
  ctx.save(); ctx.translate(0, bob);
  ctx.fillStyle = '#C9D8EA';
  ctx.beginPath(); ctx.roundRect(-85, -110, 170, 125, 30); ctx.fill(); ctx.stroke();
  // antenna
  ctx.beginPath(); ctx.moveTo(30, -110); ctx.lineTo(44, -150); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(46, -156, 11, 0, TAU); ctx.fill(); ctx.stroke();
  // eyes (blink every few seconds)
  const blink = (t % 3.7) < 0.12 ? 0.15 : 1;
  const lk = (o.look ?? 0) * 10;
  for (const ex of [-38, 38]) {
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(ex, -52, 26, 28 * blink, 0, 0, TAU); ctx.fill(); ctx.stroke();
    if (blink > 0.5) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + lk, -48, 11, 0, TAU); ctx.fill(); }
  }
  // mouth
  ctx.beginPath();
  if (o.mouth === 'o') { ctx.fillStyle = INK; ctx.ellipse(0, -8, 10, 12, 0, 0, TAU); ctx.fill(); }
  else if (o.mouth === 'flat') { ctx.moveTo(-22, -10); ctx.lineTo(22, -10); ctx.stroke(); }
  else { ctx.arc(0, -22, 22, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke(); }
  // fedora
  ctx.fillStyle = '#6B4A2E';
  ctx.beginPath(); ctx.ellipse(0, -112, 118, 22, -0.06, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-70, -116); ctx.quadraticCurveTo(-72, -190, 0, -186); ctx.quadraticCurveTo(72, -190, 70, -116); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(-68, -134, 136, 14);
  ctx.restore();
  // arm and magnifying glass
  const g = clamp(o.glass ?? 0);
  const gx = 120 - 60 * g, gy = 80 - 150 * g;
  ctx.beginPath(); ctx.moveTo(62, 60 + bob * 0.3); ctx.quadraticCurveTo(110, 70, gx - 10, gy + 50); ctx.lineWidth = 14; ctx.strokeStyle = '#9FB7D6'; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(gx - 10, gy + 50); ctx.lineTo(gx + 6, gy + 18); ctx.lineWidth = 12; ctx.stroke();
  ctx.lineWidth = 7;
  ctx.fillStyle = 'rgba(126,200,242,0.55)'; ctx.beginPath(); ctx.arc(gx + 18, gy - 12, 40, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(gx + 18, gy - 12, 26, -2.4, -1.6); ctx.stroke();
  ctx.restore();
}

/** A dark code card with coloured mono lines typed in from t0 over dur (local coords, top-left x, y). */
export function codeCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, lines: [string, string?][], t: number, t0: number, dur: number, o: { size?: number; title?: string } = {}) {
  const size = o.size ?? 26, lh = size * 1.45, h = lines.length * lh + size * (o.title ? 2.8 : 1.4);
  ctx.fillStyle = '#16181D'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  let yy = y + size * 1.2;
  if (o.title) { ctx.font = font(F.mono(700), size * 0.8); ctx.fillStyle = '#8C93A3'; ctx.fillText(o.title, x + size, yy); yy += size * 1.3; }
  ctx.font = font(F.mono(600), size);
  const total = lines.reduce((a, [s]) => a + s.length, 0) || 1;
  let shown = Math.floor(total * clamp((t - t0) / Math.max(0.05, dur)));
  for (const [s, col] of lines) {
    const n = Math.min(s.length, shown); shown -= s.length;
    yy += lh * 0.8;
    if (n > 0) { ctx.fillStyle = col ?? '#E6E6E6'; ctx.fillText(s.slice(0, n), x + size, yy); }
    yy += lh * 0.2;
  }
  return h;
}

/** A generic app window (local coords, top-left x, y): title bar with three dots and a title. */
export function appWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, name: string, o: { bar?: string; body?: string } = {}) {
  ctx.fillStyle = o.body ?? '#FFFFFF'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
  ctx.fillStyle = o.bar ?? SKY; ctx.beginPath(); ctx.roundRect(x, y, w, 52, [16, 16, 0, 0]); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 52); ctx.lineTo(x + w, y + 52); ctx.stroke();
  [RED, YEL, GREEN].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 30 + i * 30, y + 26, 9, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); });
  ctx.font = font(BLOCK, 28); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(name, x + w / 2, y + 36); ctx.textAlign = 'left';
}

/** A five-point star (local coords). */
export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col = YEL) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(an) * q, y + Math.sin(an) * q); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}

/** A rounded label box with block text (local coords, centred at x, y). */
export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, o: { fill?: string; col?: string; pad?: number; rot?: number } = {}) {
  const tw = measure(text, BLOCK, size), pad = o.pad ?? size * 0.5, w = tw + pad * 2, h = size * 1.4;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-w / 2 + 6, -h / 2 + 6, w, h, 10); ctx.fill();
  ctx.fillStyle = o.fill ?? '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.font = font(BLOCK, size); ctx.fillStyle = o.col ?? INK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, size * 0.36); ctx.textAlign = 'left';
  ctx.restore();
  return w;
}

/** An arrow from a to b with a filled head (local coords), drawn to fraction k. */
export function inkArrow(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, k: number, o: { col?: string; width?: number; bend?: number } = {}) {
  const kk = clamp(k);
  if (kk <= 0) return;
  const mx = (ax + bx) / 2 - (by - ay) * (o.bend ?? 0), my = (ay + by) / 2 + (bx - ax) * (o.bend ?? 0);
  const pt = (u: number) => [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by];
  ctx.strokeStyle = o.col ?? INK; ctx.lineWidth = o.width ?? 9; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) { const [px, py] = pt((i / 30) * kk); i ? ctx.lineTo(px!, py!) : ctx.moveTo(px!, py!); }
  ctx.stroke();
  if (kk > 0.95) {
    const [px, py] = pt(1), [qx, qy] = pt(0.92);
    const an = Math.atan2(py! - qy!, px! - qx!), L = (o.width ?? 9) * 3.2;
    ctx.fillStyle = o.col ?? INK; ctx.beginPath(); ctx.moveTo(px!, py!);
    ctx.lineTo(px! - Math.cos(an - 0.45) * L, py! - Math.sin(an - 0.45) * L);
    ctx.lineTo(px! - Math.cos(an + 0.45) * L, py! - Math.sin(an + 0.45) * L); ctx.closePath(); ctx.fill();
  }
  ctx.lineCap = 'butt';
}

export { clamp, ease, hash, springStep, TAU };
