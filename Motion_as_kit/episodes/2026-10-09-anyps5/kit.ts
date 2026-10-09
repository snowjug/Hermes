// The AnyPS5 video's desk: a CollagePlate that captions its own lines on torn paper strips and can
// wipe in/out with a sheet of paper, plus the paper props several plates share (a typed document, a
// stat bar, an FPS sticker, a file card).
import type { Line } from '@engine/lyrics';
import { CollagePlate, captions, captionAlpha, captionStrips, sheet, wipeCover, tag, type Caption } from '@kit/_collage';
import { rgba, setWorld, font, F, clamp, ease, prog, springStep, hash, measure } from '@kit/_collage';
import type { Cam } from '@kit/_vo';

export abstract class Desk extends CollagePlate {
  caps: Caption[] = [];
  /** wipe a sheet off at the start / on at the end, and from which side */
  wipeIn = false;
  wipeOut = false;
  wipeFrom: 'left' | 'right' = 'right';

  override async init() {
    await super.init();
    this.caps = captions(this, this.captionLines());
  }
  captionLines(): Line[] {
    return this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2);
  }
  override alpha(g: string, t: number) {
    const a = captionAlpha(this.caps, g, t);
    return a >= 0 ? a : this.galpha(g, t);
  }
  galpha(_g: string, _t: number) { return 1; }
  /** paper on the desk: drawn under the marker strokes */
  override hasUnder = true;
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.desk(ctx, t, c); }
  desk(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    const cover = wipeCover(t, this.ctx.start, this.ctx.end, { inn: this.wipeIn, out: this.wipeOut });
    sheet(ctx, cover, this.wipeFrom, Math.round(this.ctx.start * 10));
    captionStrips(ctx, this.caps, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { vignette: 0.3, grain: 0.05, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
}

/** A typed sheet of paper (a file, a list), top-left at world (x, y). `lines` typed in from t0 over dur. */
export function doc(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, lines: string[], t: number, t0: number, dur: number, o: { a?: number; rot?: number; size?: number; hot?: number[] } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003 || t < t0 - 0.05) return;
  const pop = springStep(t - t0 + 0.05, 3, 0.5);
  setWorld(ctx, c, x + w / 2, y + h / 2, 0.85 + 0.15 * pop, o.rot ?? 0);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = a * clamp((t - t0 + 0.05) / 0.08);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(7, 10, w, h);
  ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, 0, w, h);
  const size = o.size ?? 26;
  ctx.font = font(F.archivo(87.5, 800), size * 1.3); ctx.fillStyle = rgba('ink', 1);
  ctx.fillText(title, size * 1.1, size * 2.1);
  ctx.fillStyle = rgba('signal', 0.8); ctx.fillRect(size * 1.1, size * 2.6, w - size * 2.2, 3);
  ctx.font = font(F.mono(500), size);
  const total = lines.reduce((s, l) => s + l.length, 0) || 1;
  let shown = Math.floor(total * clamp((t - t0) / Math.max(0.05, dur)));
  lines.forEach((l, i) => {
    const n = Math.min(l.length, shown);
    shown -= l.length;
    if (n <= 0) return;
    ctx.fillStyle = (o.hot ?? []).includes(i) ? rgba('signal', 1) : rgba('ink', 0.88);
    ctx.fillText(l.slice(0, n), size * 1.1, size * (4.3 + i * 1.55));
  });
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A paper stat bar: a label, the value large, and a marker-filled bar to frac·k. Top-left at world (x, y). */
export function statBar(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, label: string, value: string, frac: number, k: number, o: { a?: number; rot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const h = 200;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(6, 9, w, h);
  ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, 0, w, h);
  ctx.font = font(F.mono(600), 22); ctx.fillStyle = rgba('graphite', 1); ctx.fillText(label, 26, 40);
  ctx.font = font(F.archivo(87.5, 900), 58); ctx.fillStyle = rgba('ink', 1); ctx.fillText(value, 24, 104);
  const bx = 26, by = 132, bw = w - 52, bh = 40;
  ctx.strokeStyle = rgba('ink', 0.8); ctx.lineWidth = 2.5; ctx.strokeRect(bx, by, bw, bh);
  ctx.save(); ctx.beginPath(); ctx.rect(bx + 3, by + 3, (bw - 6) * frac * clamp(k), bh - 6); ctx.clip();
  ctx.fillStyle = rgba('signal', 0.9); ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
  for (let xx = bx - bh; xx < bx + bw; xx += 14) { ctx.beginPath(); ctx.moveTo(xx, by + bh); ctx.lineTo(xx + bh, by); ctx.stroke(); }
  ctx.restore();
  ctx.font = font(F.mono(700), 22); ctx.fillStyle = rgba('signal', 1); ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(frac * 100 * clamp(k))}%`, w - 26, 104); ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A round sticker with a big number (e.g. "60" / "FPS"), landing at t0. */
export function badge(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, big: string, small: string, t: number, t0: number, o: { col?: string; rot?: number } = {}) {
  if (t < t0) return;
  const sp = springStep(t - t0, 3.2, 0.42);
  setWorld(ctx, c, x, y, 0.3 + 0.7 * sp, (o.rot ?? -0.12) + (1 - sp) * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(6, 9, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FBF8F0'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(o.col ?? 'signal', 1); ctx.beginPath(); ctx.arc(0, 0, r - 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FBF8F0'; ctx.textAlign = 'center';
  ctx.font = font(F.archivo(87.5, 900), r * 0.8); ctx.fillText(big, 0, r * 0.18);
  ctx.font = font(F.mono(700), r * 0.24); ctx.fillText(small, 0, r * 0.55);
  ctx.textAlign = 'left';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A file card ("input.elf", "app.exe"): a folded-corner page with a big extension. Centred at world (x, y). */
export function fileCard(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, name: string, sub: string, o: { a?: number; rot?: number; col?: string; w?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const w = o.w ?? 300, h = w * 1.25, f = w * 0.2;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(7, 10); ctx.lineTo(w - f + 7, 10); ctx.lineTo(w + 7, f + 10); ctx.lineTo(w + 7, h + 10); ctx.lineTo(7, h + 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FBF8F0';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w - f, 0); ctx.lineTo(w, f); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E2D8C4'; ctx.beginPath(); ctx.moveTo(w - f, 0); ctx.lineTo(w - f, f); ctx.lineTo(w, f); ctx.closePath(); ctx.fill();
  const fs = Math.min(w * 0.26, (w * 0.82) / Math.max(1, measure(name, F.archivo(87.5, 900), 1)));
  ctx.font = font(F.archivo(87.5, 900), fs); ctx.fillStyle = rgba(o.col ?? 'ink', 1); ctx.textAlign = 'center';
  ctx.fillText(name, w / 2, h * 0.55);
  ctx.font = font(F.mono(500), w * 0.07); ctx.fillStyle = rgba('graphite', 1);
  ctx.fillText(sub, w / 2, h * 0.7);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The three Sony libraries the pinboard plates use, and where their cards sit. */
export const LIBS = [
  { key: 'graphics', title: 'GRAPHICS', sub: 'libSceAgcDriver', x: 140, y: -330 },
  { key: 'sound', title: 'SOUND', sub: 'libSceAudioOut', x: 400, y: -40 },
  { key: 'controllers', title: 'CONTROLLERS', sub: 'libScePad', x: 140, y: 250 },
];
export const CARD = { w: 400, h: 230 };

export { tag, hash, ease, prog, clamp };
