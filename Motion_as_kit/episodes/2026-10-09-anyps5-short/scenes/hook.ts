// HOOK: "PS5 games on a PC, with no emulator."
// A glitching PS5 screen from the first frame, PS5 GAMES torn into place; on "PC" the picture tears into
// a laptop and ON A PC lands in cyan; on "emulator" NO EMULATOR slams in red.
import { Screen, gtext, gimage, fit } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease } from '@engine/util';

export default class Hook extends Screen {
  override uses = ['ps5', 'laptop'];

  build() {
    this.take('PS5 games on a PC', ['PS5', 'games', 'PC,', 'no', 'emulator.']);
    const w = this.w;
    const K = this.cam;
    K.key(0, 0, -60, 1.08, 0);
    K.key(w.pc!.start, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 20, 1.03, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w.pc!.start, w.emulator!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    gimage(ctx, c, this.cuts.ps5!, 0, -430, 0.62, t, -0.4, { rot: -0.03, t1: w.pc!.start - 0.08 });
    gimage(ctx, c, this.cuts.laptop!, 0, -400, 0.95, t, w.pc!.start, { rot: 0.02 });
    gtext(ctx, c, 'PS5 GAMES', 0, 230, fit('PS5 GAMES', 960, 220), t, -0.4, { align: 'center', hits: [w.ps5!.start] });
    gtext(ctx, c, 'ON A PC', 0, 420, fit('ON A PC', 960, 200), t, w.pc!.start, { align: 'center', col: 'acid' });
    gtext(ctx, c, 'NO EMULATOR', 0, 640, fit('NO EMULATOR', 980, 190), t, w.emulator!.start, { align: 'center', col: 'signal' });
  }
}
