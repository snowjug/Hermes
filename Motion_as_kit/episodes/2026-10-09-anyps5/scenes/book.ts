// BOOK: "Emulation is an interpreter whispering every line. This is translating the book once."
// Two clippings. Left, the old reader: EMULATION over him, and as "whispering every line" is said,
// small speech slips come out of him one at a time, line... by... line. Right, an 1876 newspaper
// engraving of a printing press: on "translating the book once" a stack of printed pages flies out of
// it at once and fans across the desk, ANYPS5 over it.
import { drawCut, tag, prog, ease, clamp, springStep, rgba, setWorld, font, F, hash } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const RD = { x: -560, y: 60, s: 0.82 };
const PR = { x: 470, y: 30, s: 0.84 };

export default class Book extends Desk {
  override uses = ['reader', 'press'];
  override wipeIn = true;
  override wipeFrom: 'left' | 'right' = 'left';

  build() {
    this.take('Emulation is an interpreter', ['Emulation', 'interpreter', 'whispering', 'every', 'line.', 'This', 'translating', 'book', 'once.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, RD.x + 160, 20, 1.18, -0.01);
    K.key(w.line!.end, RD.x + 220, 20, 1.12, -0.008, ease.linear);
    K.key(w.this!.start + 0.25, 60, 10, 0.92, 0.004, ease.inOutExpo);
    K.key(this.ctx.end, 90, 10, 0.95, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.reader!, RD.x, RD.y, t, { t0: this.ctx.start + 0.05, scale: RD.s, rot: -0.04, seed: 71 });
    tag(ctx, c, 'EMULATION', RD.x, RD.y - 300, 40, { a: prog(t, w.emulation!.start, w.emulation!.start + 0.15), rot: -0.05, seed: 72, col: '#D2302A' });
    // line... by... line: one slip at a time
    const words = ['line', '...by...', 'line', '...by...', 'line'];
    const tw = w.whispering!.start;
    words.forEach((s, i) => {
      const ti = tw + i * 0.42;
      if (t < ti) return;
      const sp = springStep(t - ti, 3, 0.5);
      const x = RD.x + 260 + i * 34, y = RD.y - 170 + i * 70;
      setWorld(ctx, c, x, y, 0.5 + 0.5 * sp, (hash(i, 3) - 0.5) * 0.2);
      ctx.font = font(F.serif(600, true), 40);
      const tww = ctx.measureText(s).width;
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(5, -34, tww + 30, 50);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, -38, tww + 30, 50);
      ctx.fillStyle = rgba('ink', 1); ctx.fillText(s, 15, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // the press, and the pages it prints all at once
    drawCut(ctx, c, this.cuts.press!, PR.x, PR.y, t, { t0: w.this!.start - 0.05, scale: PR.s, rot: 0.03, seed: 73 });
    tag(ctx, c, 'ANYPS5', PR.x + 40, PR.y - 300, 40, { a: prog(t, w.this!.start + 0.1, w.this!.start + 0.3), rot: 0.04, seed: 74, col: '#2E5EA6' });
    const tb = w.book!.start;
    for (let i = 0; i < 9; i++) {
      const ti = tb + i * 0.03;
      if (t < ti) break;
      const k = ease.outCubic(clamp((t - ti) / 0.5));
      const x = PR.x + 120 + k * (180 + 60 * i) * Math.cos(-0.5 + i * 0.13), y = PR.y + 120 + k * (140 + 30 * i) * Math.sin(0.2 + i * 0.16);
      setWorld(ctx, c, x, y, 1, -0.3 + i * 0.09 + k * 0.2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-72, -96, 150, 196);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(-78, -102, 150, 196);
      ctx.fillStyle = rgba('ink', 0.25);
      for (let r = 0; r < 9; r++) ctx.fillRect(-62, -82 + r * 19, 118 - (r % 3) * 16, 5);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    tag(ctx, c, 'TRANSLATED ONCE', PR.x + 120, PR.y + 330, 30, { a: prog(t, w.once!.start, w.once!.start + 0.15), rot: -0.03, seed: 75 });
  }
}
