// FPS: "One game works so far: 60 frames per second on a GTX 1050 Ti."
// 1 GAME slams in red, WORKS under it; the graphics card glitches in and a counter runs to 60 FPS.
import { Screen, gtext, gimage, fit, rgba, setWorld, font, HEAVY, clamp } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease, prog } from '@engine/util';

export default class Fps extends Screen {
  override uses = ['gtx'];

  build() {
    this.take('One game works', ['One', 'game', 'works', 'far:', '60', 'frames', 'GTX', '1050', 'Ti.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.06, 0);
    K.key(w['60']!.start, 0, 40, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 60, 1.03, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w.one!.start, w['60']!.start, w.gtx!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    gtext(ctx, c, '1 GAME', 0, -560, fit('1 GAME', 960, 300), t, w.one!.start - 0.03, { align: 'center', col: 'signal' });
    gtext(ctx, c, 'WORKS SO FAR', 0, -380, fit('WORKS SO FAR', 960, 130), t, w.works!.start, { align: 'center' });
    gimage(ctx, c, this.cuts.gtx!, 0, 40, 0.98, t, w.frames!.start - 0.4, { rot: 0.03 });
    const t6 = w['60']!.start;
    if (t > t6 - 0.05) {
      const n = Math.round(60 * ease.outCubic(clamp((t - t6) / 0.6)));
      setWorld(ctx, c, 0, 470);
      ctx.font = font(HEAVY(112.5), 250); ctx.textAlign = 'center';
      ctx.fillStyle = rgba('bone', 1); ctx.fillText(`${n} FPS`, 0, 0);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    gtext(ctx, c, 'GTX 1050 Ti', 0, 650, fit('GTX 1050 Ti', 760, 110), t, w.gtx!.start, { align: 'center', col: 'acid' });
    void prog;
  }
}
