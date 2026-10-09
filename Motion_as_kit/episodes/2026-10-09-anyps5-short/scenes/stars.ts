// STARS: "16,000 GitHub stars in two months."
// The star count runs to 16,380 in huge type; GITHUB STARS in cyan; IN 2 MONTHS in red.
import { Screen, gtext, fit, rgba, setWorld, font, HEAVY, clamp } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease } from '@engine/util';

export default class Stars extends Screen {
  build() {
    this.take('GitHub stars in two months', ['16,000', 'GitHub', 'stars', 'two', 'months.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.12, 0);
    K.key(w.two!.start, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 0, 1.03, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w['16000']!.start, w.two!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w['16000']!.start - 0.1;
    if (t > t0) {
      const n = Math.round(16380 * ease.outCubic(clamp((t - t0) / 0.9)));
      const s = n.toLocaleString('en-US');
      setWorld(ctx, c, 0, -180);
      ctx.font = font(HEAVY(100), 250); ctx.textAlign = 'center';
      ctx.fillStyle = rgba('acid', 0.85); ctx.fillText(s, -8, 0);
      ctx.fillStyle = rgba('signal', 0.85); ctx.fillText(s, 8, 0);
      ctx.fillStyle = rgba('bone', 1); ctx.fillText(s, 0, 0);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    gtext(ctx, c, 'GITHUB STARS', 0, 30, fit('GITHUB STARS', 960, 150), t, w.github!.start, { align: 'center', col: 'acid' });
    gtext(ctx, c, 'IN 2 MONTHS', 0, 300, fit('IN 2 MONTHS', 960, 190), t, w.two!.start, { align: 'center', col: 'signal' });
  }
}
