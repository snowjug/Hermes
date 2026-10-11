// 01 TALKS: "Every AI you know talks. Ask it anything, and it writes you a paragraph."
// EVERY AI TALKS. rises word by word; grey chat bubbles start popping all over the page on "talks" and keep
// coming; on "writes you a paragraph" a wall of text pours down the right column and keeps scrolling. The
// camera pulls back as the page fills up. A red slab wipes it all away.
import type { Cam } from '@kit/_vo';
import { Swiss, kinetic, bubble, textWall, label, INK, RED, clamp, hash } from '@ep/swiss';

export default class Talks extends Swiss {
  override wipeOut = RED;
  override section = 1;
  build() {
    this.take('Every AI you know', ['Every', 'talks.', 'Ask', 'anything,', 'writes', 'paragraph.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.06, 0);
    K.key(this.w.writes!.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 40, 10, 0.9, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // bubbles pop in everywhere from "talks"
    const t0 = w.talks!.start;
    for (let i = 0; i < 22; i++) {
      const tb = t0 + i * 0.16 + 0.1 * hash(i, 7);
      const x = -900 + 1800 * hash(i, 1), y = -380 + 760 * hash(i, 2);
      if (x < -200 && y < 60 && y > -320) continue; // keep the headline clear
      bubble(ctx, c, x, y, 220 + 160 * hash(i, 3), 80 + 70 * hash(i, 4), t, tb, { seed: i, a: 0.95 });
    }
    // the paragraph pours down the right column
    textWall(ctx, c, 240, -400, 680, 780, t, w.writes!.start, { rate: 16, seed: 4, lh: 34, scroll: true, col: '#B9B2A5' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    label(ctx, c, 'FIG. 1 — HOW AI ANSWERS TODAY', -840, -300, { a: clamp((t - w.every!.start) / 0.2), rule: true });
    kinetic(ctx, c, 'EVERY AI', -840, -150, 170, t, w.every!.start - 0.05);
    kinetic(ctx, c, 'TALKS.', -840, 20, 170, t, w.talks!.start - 0.08, { col: RED });
    kinetic(ctx, c, 'A PARAGRAPH.', -840, 170, 96, t, w.paragraph!.start - 0.1, { col: INK });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.talks!.start, 0.02) }; }
}
