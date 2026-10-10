// STARS: "It picked up 25,000 GitHub stars in a single day."
// One full splash panel: red halftone, speed lines, a POW burst with the count racing to 25,784, star
// stickers flying out, and a label: GITHUB STARS IN ONE DAY.
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { Comic, panel, speedLines, burstPath, star, label, sfx, INK, RED, YEL, BLOCK, clamp, ease, hash } from '@ep/comic';

export default class Stars extends Comic {
  build() {
    this.take('It picked up', ['picked', '25,000', 'GitHub', 'stars', 'single', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -90, 1.1, -0.01);
    K.key(this.ctx.end, 0, -100, 0.98, 0.01, ease.outCubic);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -900, -480, 1800, 760, t, this.ctx.start, {
      fill: RED, dots: 'rgba(255,210,31,0.55)', from: 'pop',
      draw: (g) => {
        speedLines(g, 0, -30, 240, 1100, 70, 4, YEL, 0.8);
        const k = ease.outCubic(clamp((t - w.picked!.start) / Math.max(0.3, w.day!.end - w.picked!.start)));
        g.save(); g.scale(1 + 0.03 * Math.sin(t * 8), 1 + 0.03 * Math.sin(t * 8));
        g.fillStyle = '#FFFFFF'; burstPath(g, 0, -40, 330, 16, 5, 0.72); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
        g.restore();
        g.font = font(BLOCK, 190); g.textAlign = 'center'; g.lineJoin = 'round';
        const n = Math.round(25784 * k).toLocaleString('en-US');
        g.lineWidth = 22; g.strokeStyle = INK; g.strokeText(n, 0, 20);
        g.fillStyle = YEL; g.fillText(n, 0, 20); g.textAlign = 'left';
        for (let i = 0; i < 9; i++) {
          const t0 = w.github!.start + i * 0.07;
          if (t < t0) continue;
          const a = (i / 9) * Math.PI * 2 + 0.3, d = 380 + 260 * ease.outCubic(clamp((t - t0) / 0.6));
          star(g, Math.cos(a) * d * 1.3, -40 + Math.sin(a) * d * 0.62, 34 + 12 * hash(i, 2), YEL);
        }
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (t > w.stars!.start) {
      const s = 1;
      ctx.save();
      const [sx, sy] = [960 + (0 - c.cx) * c.z, 540 + (190 - c.cy) * c.z];
      ctx.setTransform(c.z * s, 0, 0, c.z * s, sx, sy);
      label(ctx, 'GITHUB STARS IN ONE DAY', 0, 0, 52, { fill: YEL, rot: -0.03 });
      ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    sfx(ctx, c, 'BOOM!', -620, -300, 130, t, w.single!.start, { fill: YEL, rot: -0.2 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.picked!.start, 0.02) * this.punch(t, this.w.single!.start, 0.025) }; }
}
