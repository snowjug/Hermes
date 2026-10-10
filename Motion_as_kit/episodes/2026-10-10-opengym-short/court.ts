// The openGym Short's look (theme `court`): electric-blue sports paper with chalk court lines, giant
// chalk-white and lime type slammed in word by word, and the main video's paper cutouts and props
// (body map, plates, counters) blown up to fill the vertical frame. Every line has a big headline and a
// picture that explains it; nothing sits on an empty half-frame.
import { CollagePlate } from '@kit/_collage';
import { setWorld, font, F, clamp, ease, measure, springStep, hash } from '@kit/_collage';
import type { Cam } from '@kit/_vo';

export const CHALK = '#F7F9FF';
export const LIME = '#C6F432';
export const PINK = '#FF3D7F';
export const NAVY = '#0B1230';

export abstract class Court extends CollagePlate {
  override hasUnder = true;
  override showPen = false;
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    courtLines(ctx, c);
    this.under(ctx, t, c);
  }
  under(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.top(ctx, t, c); }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { vignette: 0.34, grain: 0.06, bloom: 0.1, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.07) : 1; }
  shake(t: number, t0: number, amt = 6) { return t > t0 ? amt * Math.pow(0.5, (t - t0) / 0.06) : 0; }
}

/** Chalk court markings on the paper: a centre circle, the half-way line, a key. */
export function courtLines(ctx: CanvasRenderingContext2D, c: Cam) {
  setWorld(ctx, c, 0, 0, 1, 0);
  ctx.strokeStyle = 'rgba(247,249,255,0.16)'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(0, 0, 260, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2000, 0); ctx.lineTo(2000, 0); ctx.stroke();
  ctx.strokeRect(-300, 560, 600, 900);
  ctx.beginPath(); ctx.arc(0, 560, 180, Math.PI, 0); ctx.stroke();
  ctx.strokeRect(-300, -1460, 600, 900);
  ctx.beginPath(); ctx.arc(0, -560, 180, 0, Math.PI); ctx.stroke();
  ctx.strokeRect(-500, -2000, 1000, 4000);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * A giant word slammed in at t0 (scale from 1.4, a quick shake), chalk white or lime, with a navy
 * offset shadow. (x, baseline y) in world px. Returns its width.
 */
export function cslam(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; align?: 'left' | 'center' | 'right'; rot?: number; a?: number; wd?: number; under?: string } = {}) {
  const fam = F.archivo(o.wd ?? 112, 900);
  const tw = measure(text, fam, size);
  if (t < t0) return tw;
  const age = t - t0;
  const sc = 1 + 0.4 * (1 - ease.outExpo(clamp(age / 0.16)));
  const ax = o.align === 'center' ? -tw / 2 : o.align === 'right' ? -tw : 0;
  const cx = x + ax + tw / 2, cy = y - 0.36 * size;
  setWorld(ctx, c, cx, cy, sc, o.rot ?? 0);
  ctx.globalAlpha = (o.a ?? 1) * clamp(age / 0.04);
  ctx.font = font(fam, size); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (o.under) { ctx.fillStyle = o.under; ctx.fillRect(-tw / 2 - size * 0.12, -size * 0.52, tw + size * 0.24, size * 1.0); }
  ctx.fillStyle = NAVY; ctx.fillText(text, -tw / 2 + size * 0.05, 0.36 * size + size * 0.06);
  ctx.fillStyle = o.col ?? CHALK; ctx.fillText(text, -tw / 2, 0.36 * size);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return tw;
}

/** Size that makes `text` exactly `w` wide (capped at max). */
export function fitSize(text: string, w: number, max: number, wd = 112) {
  return Math.min(max, w / Math.max(1e-3, measure(text, F.archivo(wd, 900), 1)));
}

/** A lime marker swipe under (or through) a word: width w, drawn over [t0, t0+0.18]. Centre (x, y). */
export function swipe(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, t: number, t0: number, o: { col?: string; rot?: number; seed?: number } = {}) {
  if (t < t0) return;
  const k = ease.outCubic(clamp((t - t0) / 0.18));
  setWorld(ctx, c, x, y, 1, o.rot ?? -0.03);
  ctx.fillStyle = o.col ?? LIME;
  ctx.beginPath();
  const x0 = -w / 2, x1 = -w / 2 + w * k, s = o.seed ?? 1;
  ctx.moveTo(x0, -h / 2 + (hash(s, 1) - 0.5) * 8);
  for (let i = 1; i <= 8; i++) ctx.lineTo(x0 + ((x1 - x0) * i) / 8, -h / 2 + (hash(s, i + 2) - 0.5) * 8);
  for (let i = 8; i >= 0; i--) ctx.lineTo(x0 + ((x1 - x0) * i) / 8, h / 2 + (hash(s, i + 20) - 0.5) * 8);
  ctx.closePath(); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Pop-in scale for things that land at t0. */
export const pop = (t: number, t0: number) => (t < t0 ? 0 : springStep(t - t0, 3.2, 0.45));
