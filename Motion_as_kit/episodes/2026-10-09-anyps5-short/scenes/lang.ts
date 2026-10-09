// LANG: "The PS5's processor already speaks your PC's language."
// The PS5 motherboard glitches onto the screen. x86-64 tears in on "processor"; = YOUR PC in cyan on
// "PC's"; SAME LANGUAGE in red on "language".
import { Screen, gtext, gimage, fit } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease } from '@engine/util';

export default class Lang extends Screen {
  override uses = ['board'];

  build() {
    this.take("The PS5's processor", ["PS5's", 'processor', 'already', 'speaks', "PC's", 'language.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -380, 1.25, 0);
    K.key(w.processor!.start, 0, -100, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, -60, 1.04, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w.processor!.start, w.pcs!.start, w.language!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    gimage(ctx, c, this.cuts.board!, 0, -420, 0.95, t, this.ctx.start, { rot: -0.03 });
    gtext(ctx, c, 'x86-64', 0, 240, fit('x86-64', 900, 240), t, w.processor!.start, { align: 'center' });
    gtext(ctx, c, '= YOUR PC', 0, 430, fit('= YOUR PC', 900, 170), t, w.pcs!.start, { align: 'center', col: 'acid' });
    gtext(ctx, c, 'SAME LANGUAGE', 0, 620, fit('SAME LANGUAGE', 980, 150), t, w.language!.start, { align: 'center', col: 'signal' });
  }
}
