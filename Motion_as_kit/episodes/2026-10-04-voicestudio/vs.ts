// Shared drawing for the VoiceStudio video: speech waveforms (made up, or the narration's own loudness
// from data/audio.json), cassettes and the tape deck, a laptop, rolling counters.
import type { LineBatch } from '@engine/lines';
import type { AudioData } from '@engine/audio';
import { LIN, rgba } from '@engine/palette';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, noise1, TAU } from '@engine/util';
import { w2s, setWorld, label, mixCss, type Cam, type RGB } from '@kit/_vo';

// ================================================================== waveforms
/** Speech-like loudness at u seconds of a pretend recording (0..1): syllables inside words, pauses between. */
export function speechEnv(u: number, seed = 1): number {
  const word = 0.5 + 0.5 * noise1(u * 2.1, seed);
  const gate = clamp((word - 0.3) * 4.5);
  const syl = Math.pow(0.5 + 0.5 * Math.sin(u * TAU * 4.2 + 2.6 * noise1(u * 1.3, seed + 7)), 1.5);
  return clamp(gate * (0.22 + 0.78 * syl) * (0.72 + 0.28 * noise1(u * 9, seed + 3)));
}
/** The narration's loudness at song time t (peak over a short window, so bars read like a waveform). */
export function voiceEnv(au: AudioData, t: number) {
  return Math.min(1, au.envPeak('rms', t, 0.03) * 1.1);
}

export interface WaveOpts { col?: RGB; I?: number; width?: number; alpha?: number; from?: number; to?: number; gain?: (u: number) => number; min?: number }
/**
 * Mirrored bars from world x0 to x1 around y, `n` bars, half-height h·amp(u). Glow (additive batch,
 * screen px). Only bars with u in [from, to] are drawn (reveals and wipes).
 */
export function waveBars(X: LineBatch, c: Cam, x0: number, x1: number, y: number, h: number, n: number, amp: (u: number, i: number) => number, o: WaveOpts = {}) {
  const col = o.col ?? LIN.signal, I = o.I ?? 1.15, from = o.from ?? 0, to = o.to ?? 1, min = o.min ?? 0.012;
  const wd = (o.width ?? Math.max(1.2, ((x1 - x0) / n) * 0.5)) * c.z;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    if (u < from || u > to) continue;
    const a = Math.max(min, amp(u, i)) * (o.gain ? o.gain(u) : 1);
    const x = lerp(x0, x1, u);
    const p0 = w2s(c, x, y - h * a), p1 = w2s(c, x, y + h * a);
    X.seg2(p0[0], p0[1], p1[0], p1[1], wd, [col[0] * I, col[1] * I, col[2] * I], o.alpha ?? 1);
  }
}
/** An oscilloscope trace: env(u)·sin(phase) from x0 to x1 around y, as a glowing polyline. */
export function waveTrace(X: LineBatch, c: Cam, x0: number, x1: number, y: number, h: number, n: number, env: (u: number) => number, o: WaveOpts & { cycles?: number; phase?: number; jag?: number } = {}) {
  const col = o.col ?? LIN.signal, I = o.I ?? 1.4, from = o.from ?? 0, to = o.to ?? 1;
  const cyc = o.cycles ?? 60, ph = o.phase ?? 0, jag = o.jag ?? 0.35;
  let prev: [number, number] | null = null;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    if (u < from || u > to) { prev = null; continue; }
    const e = env(u) * (o.gain ? o.gain(u) : 1);
    const s = Math.sin(u * TAU * cyc + ph) * (1 - jag) + jag * (hash(i, 77) * 2 - 1);
    const p = w2s(c, lerp(x0, x1, u), y + h * e * s);
    if (prev) X.seg2(prev[0], prev[1], p[0], p[1], (o.width ?? 2.2) * Math.min(1.6, c.z), [col[0] * I, col[1] * I, col[2] * I], o.alpha ?? 1);
    prev = p;
  }
}

// ================================================================== cassettes and the deck
export interface TapeOpts { a?: number; label?: string; sub?: string; tag?: string; hot?: number; spin?: number; rot?: number; accent?: string; dim?: number; stripe?: string }
/** A cassette, width w, top-left at (x, y) (height 0.64 w). `spin` = reel angle (radians). */
export function cassette(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, o: TapeOpts = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const h = w * 0.64, hot = clamp(o.hot ?? 0), dim = o.dim ?? 1;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  // shell
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, w * 0.035);
  ctx.fillStyle = rgba('ink2', 0.97); ctx.fill();
  ctx.lineWidth = Math.max(1.2, w * 0.006);
  ctx.strokeStyle = hot > 0.01 ? mixCss('bone', 'signal', hot, 0.95) : rgba('bone', 0.55 * dim);
  ctx.stroke();
  // label
  const lx = w * 0.07, ly = w * 0.06, lw = w * 0.86, lh = h * 0.56;
  ctx.fillStyle = rgba('bone', 0.93 * dim); ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = o.stripe ? rgba(o.stripe, 1) : rgba(o.accent ?? 'signal', 0.95 * dim); ctx.fillRect(lx, ly + lh * 0.2, lw, lh * 0.07);
  // the window with the reels
  const wx = w * 0.27, wy = ly + lh * 0.42, ww = w * 0.46, wh = lh * 0.46;
  ctx.fillStyle = rgba('ink', 1); ctx.beginPath(); ctx.roundRect(wx, wy, ww, wh, wh * 0.45); ctx.fill();
  for (const rx of [wx + wh * 0.5, wx + ww - wh * 0.5]) {
    const r = wh * 0.36;
    ctx.save(); ctx.translate(rx, wy + wh / 2); ctx.rotate(o.spin ?? 0);
    ctx.strokeStyle = rgba('bone', 0.8); ctx.lineWidth = Math.max(1, w * 0.005);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r * 0.45, Math.sin(an) * r * 0.45); ctx.lineTo(Math.cos(an) * r * 0.85, Math.sin(an) * r * 0.85); ctx.stroke(); }
    ctx.restore();
  }
  // tape between the reels
  ctx.fillStyle = rgba('graphite', 0.9); ctx.fillRect(wx + wh * 0.5, wy + wh * 0.82, ww - wh, wh * 0.06);
  // text on the label
  if (o.label) {
    const fam = F.archivo(100, 800);
    const fs = Math.min(lh * 0.2, (lw * 0.9) / Math.max(1, measure(o.label, fam, 1)));
    ctx.font = font(fam, fs); ctx.fillStyle = rgba('ink', 0.95); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(o.label, lx + lw * 0.04, ly + lh * 0.17);
  }
  if (o.sub) {
    ctx.font = font(F.mono(500), lh * 0.075); ctx.fillStyle = rgba('graphite', 1);
    ctx.fillText(o.sub, lx + lw * 0.04, ly + lh * 0.38);
  }
  if (o.tag) {
    ctx.font = font(F.mono(600), lh * 0.075); ctx.textAlign = 'right'; ctx.fillStyle = rgba(o.accent ?? 'blood', 1);
    ctx.fillText(o.tag, lx + lw * 0.96, ly + lh * 0.38); ctx.textAlign = 'left';
  }
  // the lower trapezoid and screws
  ctx.strokeStyle = rgba('bone', 0.35 * dim); ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.beginPath(); ctx.moveTo(w * 0.18, h); ctx.lineTo(w * 0.24, h * 0.76); ctx.lineTo(w * 0.76, h * 0.76); ctx.lineTo(w * 0.82, h); ctx.stroke();
  for (const [sx, sy] of [[w * 0.035, w * 0.035], [w * 0.965, w * 0.035], [w * 0.035, h - w * 0.035], [w * 0.965, h - w * 0.035], [w * 0.5, h * 0.9]] as const) {
    ctx.beginPath(); ctx.arc(sx, sy, w * 0.012, 0, TAU); ctx.fillStyle = rgba('ash', 0.6); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export const TAPE_H = 0.64;

/** A VU meter (needle at level 0..1) in a box with top-left (x, y), size w × 0.6w. */
export function vu(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, level: number, o: { a?: number; name?: string } = {}) {
  const a = o.a ?? 1, h = w * 0.6;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y);
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba('bone', 0.92); ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 1.05, r = h * 0.78;
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.strokeStyle = rgba('ink', 0.85); ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke();
  ctx.strokeStyle = rgba('acid', 1); ctx.lineWidth = Math.max(2, w * 0.03); ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.32, -Math.PI * 0.22); ctx.stroke();
  for (let k = 0; k <= 10; k++) {
    const an = lerp(-Math.PI * 0.78, -Math.PI * 0.22, k / 10);
    ctx.strokeStyle = rgba('ink', 0.8); ctx.lineWidth = Math.max(1, w * 0.008);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r * 0.9, cy + Math.sin(an) * r * 0.9); ctx.lineTo(cx + Math.cos(an) * r * 1.0, cy + Math.sin(an) * r * 1.0); ctx.stroke();
  }
  const an = lerp(-Math.PI * 0.76, -Math.PI * 0.24, clamp(level));
  ctx.strokeStyle = rgba('ink', 1); ctx.lineWidth = Math.max(1.4, w * 0.012);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * r * 1.02, cy + Math.sin(an) * r * 1.02); ctx.stroke();
  ctx.font = font(F.mono(600), h * 0.14); ctx.fillStyle = rgba('ink', 0.85); ctx.textAlign = 'center';
  ctx.fillText(o.name ?? 'VU', cx, h * 0.62); ctx.textAlign = 'left';
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The deck's face (no outline: the pen draws that): name plate, cassette bay, transport keys. (x, y) = top-left; size w × 0.52 w. */
export function deckFace(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, o: { a?: number; name?: string; press?: number; play?: number } = {}) {
  const a = o.a ?? 1, h = w * 0.52;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y);
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba('ink2', 0.9); ctx.fillRect(0, 0, w, h);
  // bay
  const bx = w * 0.05, by = h * 0.16, bw = w * 0.5, bh = bw * TAPE_H * 1.06;
  ctx.fillStyle = rgba('ink', 1); ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = rgba('bone', 0.35); ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, bh);
  // name plate
  label(ctx, (o.name ?? 'VOICESTUDIO').toUpperCase(), bx, h * 0.1, { size: w * 0.028, col: rgba('bone', 0.85), spacing: w * 0.006, weight: 600 });
  // keys: REC PLAY STOP EJECT
  const keys = ['REC', 'PLAY', 'STOP', 'EJECT'];
  const kw = w * 0.085, kh = h * 0.13, ky = h * 0.8;
  keys.forEach((k, i) => {
    const kx = w * 0.6 + i * (kw + w * 0.012);
    const down = o.press === i ? 1 : 0;
    ctx.fillStyle = down ? rgba('signal', 0.95) : rgba('graphite', 0.8);
    ctx.fillRect(kx, ky + down * 4, kw, kh);
    ctx.font = font(F.mono(600), kh * 0.32); ctx.fillStyle = down ? rgba('ink', 1) : rgba('bone', 0.85); ctx.textAlign = 'center';
    ctx.fillText(k, kx + kw / 2, ky + kh * 0.62 + down * 4);
  });
  ctx.textAlign = 'left';
  // the REC lamp
  ctx.beginPath(); ctx.arc(w * 0.62, h * 0.12, w * 0.011, 0, TAU); ctx.fillStyle = (o.play ?? 0) > 0.5 ? rgba('signal', 1) : rgba('graphite', 0.8); ctx.fill();
  label(ctx, 'ON', w * 0.64, h * 0.135, { size: w * 0.018, col: rgba('ash', 0.9), spacing: 2 });
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export const DECK_H = 0.52;
/** Where the cassette sits in the deck's bay (top-left and width), for a deck at (x, y) of width w. */
export const bayOf = (x: number, y: number, w: number) => ({ x: x + w * 0.05 + w * 0.5 * 0.03, y: y + w * DECK_H * 0.16 + w * 0.5 * TAPE_H * 0.03, w: w * 0.5 * 0.94 });

// ================================================================== small things
/** A rolling counter: digits of `value` (integer) with thousands separators, each digit sliding as it changes. */
export function odometer(ctx: CanvasRenderingContext2D, c: Cam, value: number, x: number, y: number, size: number, o: { a?: number; col?: string; fam?: string; align?: 'left' | 'center' | 'right'; prefix?: string; suffix?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const v = Math.max(0, value), n = Math.floor(v), frac = v - n;
  const s = (o.prefix ?? '') + n.toLocaleString('en-US') + (o.suffix ?? '');
  const fam = o.fam ?? F.archivo(100, 900);
  const tw = measure(s, fam, size);
  const x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
  setWorld(ctx, c, x0, y);
  ctx.font = font(fam, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba(o.col ?? 'bone', 1);
  // all but the last digit static; the last digit rolls with the fraction
  const last = s.length - 1 - (o.suffix ?? '').length;
  const head = s.slice(0, last), tail = s.slice(last + 1);
  ctx.fillText(head, 0, 0);
  const hx = measure(head, fam, size);
  const d = s[last] ?? '';
  const dn = String((Number(d) + 1) % 10);
  const dw = measure(d, fam, size);
  ctx.save(); ctx.beginPath(); ctx.rect(hx - 4, -size * 0.95, dw + 8, size * 1.1); ctx.clip();
  const k = ease.inOutCubic(frac);
  ctx.fillText(d, hx, -k * size * 0.9);
  if (k > 0.001) ctx.fillText(dn, hx, (1 - k) * size * 0.9);
  ctx.restore();
  if (tail) ctx.fillText(tail, hx + dw, 0);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A thin laptop in outline (Canvas), screen top-left at (x, y), screen w × 0.62w. */
export function laptop(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, o: { a?: number; col?: string; fill?: string } = {}) {
  const a = o.a ?? 1, h = w * 0.62;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.fill ?? rgba('ink2', 0.95);
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, w * 0.02); ctx.fill();
  ctx.strokeStyle = o.col ?? rgba('bone', 0.8); ctx.lineWidth = Math.max(1.5, w * 0.006); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w * 0.08, h + w * 0.01); ctx.lineTo(w * 1.08, h + w * 0.01); ctx.lineTo(w * 1.02, h + w * 0.05); ctx.lineTo(-w * 0.02, h + w * 0.05); ctx.closePath(); ctx.stroke();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Linear colour of a palette key times s (for LineBatch). */
export const lin = (k: keyof typeof LIN, s = 1): RGB => [LIN[k][0] * s, LIN[k][1] * s, LIN[k][2] * s];
export { hash };
