// Glitch kit for the AnyPS5 Short: a dark screen, type in RGB split that tears into slices when it lands,
// images shown as glitching screens, scanlines, and bursts of broken blocks on cuts.
import { Plate } from '@kit/_mp';
import { rgba } from '@engine/palette';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, prog, springStep } from '@engine/util';
import { setWorld, w2s, type Cam } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { loadCuts, type Cut } from '@kit/_collage';

export const HEAVY = (wd = 112.5) => F.archivo(wd, 900);

export abstract class Screen extends Plate {
  override showPen = false;
  cuts: Record<string, Cut> = {};
  uses: string[] = [];
  override async init() {
    this.cuts = await loadCuts(this.uses);
    super.init();
  }
  override camAt(t: number): Cam { return this.cam.at(t); }
  override gridOpts() { return { ink: 0.6 }; }
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    blocks(ctx, t, this.ctx.start, Math.round(this.ctx.start * 13));
    scanlines(ctx);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  /** times of hits: each kicks the RGB split, a zoom punch and a shake */
  hits(): number[] { return []; }
  override postFX(t: number) {
    let h = 0;
    for (const x of this.hits()) if (t >= x) h = Math.max(h, Math.pow(0.5, (t - x) / 0.07));
    const s = 10 * h;
    return { bloom: 0.5, ca: 2 + 7 * h, grain: 0.07, vignette: 0.45, zoom: 1 + 0.03 * h, shake: [s * (hash(Math.round(t * 60), 1) - 0.5), s * (hash(Math.round(t * 60), 2) - 0.5)] as [number, number] };
  }
}

/**
 * Big type in RGB split: a cyan and a red copy offset either side of the white one; for 0.2 s after t0
 * (and after each extra hit) it tears into horizontal slices that jump sideways. (x, baseline y) world.
 */
export function gtext(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; align?: 'left' | 'center'; hits?: number[]; wd?: number; a?: number } = {}) {
  if (t < t0) return;
  const fam = HEAVY(o.wd ?? 112.5);
  const tw = measure(text, fam, size);
  const x0 = o.align === 'center' ? x - tw / 2 : x;
  const sp = springStep(t - t0, 3.6, 0.5);
  const sc = 1.25 - 0.25 * sp;
  let g = Math.pow(0.5, (t - t0) / 0.08);
  for (const hh of o.hits ?? []) if (t >= hh) g = Math.max(g, Math.pow(0.5, (t - hh) / 0.08));
  const split = 5 + 22 * g;
  const fr = Math.round(t * 30);
  const draw = (col: string, dx: number, comp: GlobalCompositeOperation) => {
    ctx.globalCompositeOperation = comp;
    ctx.fillStyle = col;
    const bands = g > 0.15 ? 6 : 1;
    for (let b = 0; b < bands; b++) {
      const by = -size * 0.95 + (b * size * 1.2) / bands;
      const jx = bands > 1 ? (hash(fr, b, 3) - 0.5) * 60 * g : 0;
      ctx.save();
      ctx.beginPath(); ctx.rect(-50, by, tw + 100, (size * 1.2) / bands + 1); ctx.clip();
      ctx.fillText(text, dx + jx, 0);
      ctx.restore();
    }
  };
  const cx = x0 + tw / 2, cy = y - size * 0.35;
  setWorld(ctx, c, cx, cy, sc);
  ctx.translate(-tw / 2, size * 0.35);
  ctx.globalAlpha = (o.a ?? 1) * clamp((t - t0) / 0.03);
  ctx.font = font(fam, size);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  draw(rgba('acid', 0.9), -split, 'lighter');
  draw(rgba('signal', 0.9), split, 'lighter');
  draw(rgba(o.col ?? 'bone', 1), 0, 'source-over');
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** An image as a glitching screen: RGB ghosts and torn slices while it lands. Centred at world (x, y). */
export function gimage(ctx: CanvasRenderingContext2D, c: Cam, cut: Cut, x: number, y: number, scale: number, t: number, t0: number, o: { rot?: number; t1?: number } = {}) {
  if (t < t0 || (o.t1 !== undefined && t > o.t1 + 0.15)) return;
  let g = Math.pow(0.5, (t - t0) / 0.1);
  if (o.t1 !== undefined && t > o.t1) g = Math.max(g, prog(t, o.t1, o.t1 + 0.15));
  const out = o.t1 !== undefined && t > o.t1 ? 1 - prog(t, o.t1, o.t1 + 0.15) : 1;
  const [sx, sy] = w2s(c, x, y);
  const k = c.z * scale, r = (o.rot ?? 0) + c.roll;
  const fr = Math.round(t * 30);
  const slices = g > 0.1 ? 10 : 1;
  for (let s = 0; s < slices; s++) {
    const y0 = -cut.h / 2 + (s * cut.h) / slices, hh = cut.h / slices + 1;
    const jx = slices > 1 ? (hash(fr, s, 9) - 0.5) * 120 * g : 0;
    ctx.setTransform(k * Math.cos(r), k * Math.sin(r), -k * Math.sin(r), k * Math.cos(r), sx, sy);
    ctx.save(); ctx.beginPath(); ctx.rect(-cut.w / 2 - 200, y0, cut.w + 400, hh); ctx.clip();
    ctx.globalAlpha = out;
    ctx.drawImage(cut.img, -cut.w / 2 + jx, -cut.h / 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22 * out + 0.4 * g;
    ctx.drawImage(cut.img, -cut.w / 2 + jx - 10 - 30 * g, -cut.h / 2);
    ctx.drawImage(cut.img, -cut.w / 2 + jx + 10 + 30 * g, -cut.h / 2);
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Mono "terminal" line, typed in from t0 over dur, world (x, baseline y). */
export function term(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, dur: number, col = 'bone') {
  if (t < t0) return;
  const n = Math.ceil(text.length * clamp((t - t0) / Math.max(0.05, dur)));
  setWorld(ctx, c, x, y);
  ctx.font = font(F.mono(600), size); ctx.fillStyle = rgba(col, 1);
  const s = text.slice(0, n);
  ctx.fillText(s, 0, 0);
  if (n < text.length || Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = rgba('signal', 1); ctx.fillRect(ctx.measureText(s).width + 6, -size * 0.8, size * 0.55, size); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Broken blocks for the first 0.25 s of a plate (screen space). */
export function blocks(ctx: CanvasRenderingContext2D, t: number, t0: number, seed: number) {
  const k = 1 - prog(t, t0, t0 + 0.25);
  if (k <= 0) return;
  const fr = Math.round(t * 30);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 14; i++) {
    if (hash(i, fr, seed) > k) continue;
    const x = hash(i, 1, fr) * W, y = hash(i, 2, fr) * H, w = 80 + 500 * hash(i, 3, seed), h = 8 + 60 * hash(i, 4, fr);
    ctx.fillStyle = [rgba('signal', 0.8), rgba('acid', 0.8), rgba('bone', 0.7), rgba('ink', 0.9)][Math.floor(hash(i, 5, fr) * 4)]!;
    ctx.fillRect(x - w / 2, y, w, h);
  }
}

/** Fine scanlines over the frame. */
export function scanlines(ctx: CanvasRenderingContext2D) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
}

/** A width-fitting helper: the size at which text fills maxW (capped). */
export const fit = (s: string, maxW: number, max: number, wd = 112.5) => Math.min(max, maxW / measure(s, HEAVY(wd), 1));
export { ease, prog, clamp, springStep, hash, rgba, font, F, setWorld };
