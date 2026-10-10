// PLATES: "It even does the plate math: tell it your plates, and it tells you what goes on the bar."
// PLATE MATH lands in ransom letters over a barbell print. On "your plates" the plates you own land as
// stickers in a row (25 to 2.5 kg). On "what goes on the bar" a drawn bar appears and the 25 and the
// 15 slide onto each side while the marker rings those two stickers: 100 KG = 20 KG BAR + 25 + 15 A SIDE.
import { drawCut, tag, ring, ransom, ease, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, disc, barDiagram } from '@ep/kit';

const OWN = ['25', '20', '15', '10', '5', '2.5'];
const DX = (i: number) => -560 + i * 224;
const DY = -110;

export default class Plates extends Desk {
  override uses = ['barbell'];

  build() {
    this.take('It even does the plate math', ['even', 'plate', 'math:', 'tell', 'your', 'plates,', 'tells', 'goes', 'bar.']);
    const w = this.w;
    [0, 2].forEach((i, j) => this.plot.add(ring(DX(i), DY, 105, 105, 60 + i), w.goes!.start + j * 0.15, w.goes!.start + 0.35 + j * 0.15, 'signal', { pen: true, ez: ease.inOutQuad, width: 7 }));
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.05, -0.004);
    K.key(w.your!.start, 0, -80, 0.98, 0.0, ease.inOutCubic);
    K.key(w.tells!.start, 0, 20, 0.96, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 0, 30, 0.98, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.barbell!, 700, 330, t, { t0: this.ctx.start, scale: 0.32, rot: 0.07, seed: 61 });
    OWN.forEach((kg, i) => disc(ctx, c, DX(i), DY, 82 - i * 5, kg, t, w.your!.start + i * 0.09, { rot: (i % 2 ? 1 : -1) * 0.08 }));
    tag(ctx, c, 'THE PLATES YOU OWN', -560, DY - 150, 28, { a: prog(t, w.plates!.start, w.plates!.start + 0.15), rot: -0.04, seed: 62 });
    const tb = w.tells!.start - 0.1;
    const k = [prog(t, w.goes!.start, w.goes!.start + 0.4), prog(t, w.goes!.start + 0.15, w.goes!.start + 0.55)];
    barDiagram(ctx, c, 0, 150, 1300, ['25', '15'], k, { a: prog(t, tb, tb + 0.15) });
    tag(ctx, c, '100 KG  =  20 KG BAR  +  25 + 15 A SIDE', 0, 320, 32, { a: prog(t, w.bar!.start, w.bar!.start + 0.15), rot: 0.01, seed: 63 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.plate!.start, dur = Math.max(0.35, w.math!.end - t0);
    const wd = ransom(ctx, c, 'PLATE MATH', 0, -330, 128, t, t0, dur, 23, 0);
    ransom(ctx, c, 'PLATE MATH', -wd / 2 - 120, -330, 128, t, t0, dur, 23);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.plate!.start, 0.012) * this.punch(t, this.w.bar!.start, 0.012) };
  }
}
