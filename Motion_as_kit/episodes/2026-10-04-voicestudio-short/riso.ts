// Risograph print helpers for the VoiceStudio Short (cream stock, soft black, fluoro pink, riso blue).
// Every big shape prints twice: a blue pass knocked a few pixels off register, then the top pass over
// it, so the blue peeks out along one side like a misregistered second drum.
import type { AudioData } from '@engine/audio';
import { rgba } from '@engine/palette';
import { F, font, measure } from '@engine/type';
import { clamp, ease, noise1, TAU } from '@engine/util';
import { setWorld, type Cam } from '@kit/_vo';

export const ARCHB = (wd = 125) => F.archivo(wd, 900);

/** Speech-like loudness at u seconds of a pretend recording (0..1). */
export function speechEnv(u: number, seed = 1): number {
  const word = 0.5 + 0.5 * noise1(u * 2.1, seed);
  const gate = clamp((word - 0.3) * 4.5);
  const syl = Math.pow(0.5 + 0.5 * Math.sin(u * TAU * 4.2 + 2.6 * noise1(u * 1.3, seed + 7)), 1.5);
  return clamp(gate * (0.22 + 0.78 * syl) * (0.72 + 0.28 * noise1(u * 9, seed + 3)));
}
export function voiceEnv(au: AudioData, t: number) { return Math.min(1, au.envPeak('rms', t, 0.03) * 1.1); }

/** Draw twice: `fn(colour)` once in blue, offset, then in `top` with multiply. */
export function overprint(ctx: CanvasRenderingContext2D, fn: (col: string, pass: 0 | 1) => void, o: { top?: string; under?: string; dx?: number; dy?: number; a?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = a * 0.9;
  ctx.translate(o.dx ?? 7, o.dy ?? 5);
  fn(rgba(o.under ?? 'acid', 1), 0);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = a;
  fn(rgba(o.top ?? 'ink', 1), 1);
  ctx.restore();
}

/**
 * A big word slammed in at t0: scale-in, overprinted. (x, baseline y) in world px; align left/center.
 * Returns its width.
 */
export function rslam(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { top?: string; under?: string; wd?: number; align?: 'left' | 'center' | 'right'; a?: number; off?: number } = {}) {
  const fam = ARCHB(o.wd ?? 125);
  const tw = measure(text, fam, size);
  if (t < t0) return tw;
  const age = t - t0;
  const sc = 1 + 0.35 * (1 - ease.outExpo(clamp(age / 0.18)));
  const ax = o.align === 'center' ? -tw / 2 : o.align === 'right' ? -tw : 0;
  const cx = x + ax + tw / 2, cy = y - 0.36 * size;
  setWorld(ctx, c, cx, cy, sc);
  ctx.font = font(fam, size);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const off = (o.off ?? 1) * (6 + 10 * (1 - ease.outCubic(clamp(age / 0.25))));
  overprint(ctx, (col) => { ctx.fillStyle = col; ctx.fillText(text, -tw / 2, 0.36 * size); }, { top: o.top, under: o.under, dx: off, dy: off * 0.7, a: (o.a ?? 1) * clamp(age / 0.04) });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return tw;
}

/** Halftone dots filling a rect (world), dot size ramped by `k(u, v)` in 0..1. */
export function halftone(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, step: number, k: (u: number, v: number) => number, col: string, a = 1) {
  setWorld(ctx, c, x, y);
  ctx.fillStyle = rgba(col, a);
  for (let j = 0; j * step < h; j++) for (let i = 0; i * step < w; i++) {
    const r = (step / 2) * clamp(k((i * step) / w, (j * step) / h));
    if (r < 0.4) continue;
    ctx.beginPath(); ctx.arc(i * step + (j % 2) * step * 0.5, j * step, r, 0, TAU); ctx.fill();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Mirrored waveform bars (Canvas, ink on paper) from x0 to x1 around y. */
export function bars(ctx: CanvasRenderingContext2D, c: Cam, x0: number, x1: number, y: number, h: number, n: number, amp: (u: number, i: number) => number, col: string, o: { to?: number; from?: number; a?: number; width?: number } = {}) {
  setWorld(ctx, c, 0, 0);
  ctx.fillStyle = rgba(col, o.a ?? 1);
  const bw = o.width ?? ((x1 - x0) / n) * 0.62;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    if (u > (o.to ?? 1) || u < (o.from ?? 0)) continue;
    const a = Math.max(0.03, amp(u, i));
    const x = x0 + (x1 - x0) * u;
    ctx.fillRect(x - bw / 2, y - h * a, bw, 2 * h * a);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A thick rounded box outline with an offset blue shadow box (the riso "card"). */
export function card(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, o: { a?: number; fill?: string; line?: number; r?: number; shadow?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y);
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba(o.shadow ?? 'acid', 1);
  ctx.beginPath(); ctx.roundRect(14, 14, w, h, o.r ?? 18); ctx.fill();
  ctx.fillStyle = rgba(o.fill ?? 'bone', 1);
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, o.r ?? 18); ctx.fill();
  ctx.lineWidth = o.line ?? 8; ctx.strokeStyle = rgba('ink', 1); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Mono label (caps) at world (x, baseline y). */
export function mono(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, col = 'ink', o: { a?: number; align?: CanvasTextAlign; weight?: number; spacing?: number } = {}) {
  setWorld(ctx, c, x, y);
  ctx.globalAlpha = o.a ?? 1;
  ctx.font = font(F.mono(o.weight ?? 700), size);
  ctx.letterSpacing = `${o.spacing ?? 3}px`;
  ctx.fillStyle = rgba(col, 1); ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, 0);
  ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
