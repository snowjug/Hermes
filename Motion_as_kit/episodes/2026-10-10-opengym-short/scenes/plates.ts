// PLATES: "It even does the plate math for your bar."
// PLATE MATH slams in word by word; the plates you own land as stickers in two rows; on "bar" a drawn
// bar fills the court, the 25 and the 15 slide onto each side, and 100 KG slams in.
import { prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { disc, barDiagram } from '@ep/kit';
import { Court, cslam, fitSize, LIME } from '@ep/court';

const OWN: [string, number, number][] = [['25', -300, -250], ['20', 0, -250], ['15', 300, -250], ['10', -150, -60], ['5', 150, -60]];

export default class Plates extends Court {
  build() {
    this.take('It even does the plate math', ['even', 'plate', 'math', 'for', 'bar.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -60, 1.04, 0.006);
    K.key(this.ctx.end, 0, 0, 1.0, -0.004);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    OWN.forEach(([kg, x, y], i) => disc(ctx, c, x, y, 105 - i * 6, kg, t, this.ctx.start + 0.05 + i * 0.07, { rot: (i % 2 ? 1 : -1) * 0.1 }));
    const k = [prog(t, w.for!.start, w.for!.start + 0.35), prog(t, w.for!.start + 0.15, w.for!.start + 0.5)];
    barDiagram(ctx, c, 0, 260, 1000, ['25', '15'], k, { a: prog(t, w.math!.end, w.math!.end + 0.12) });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    cslam(ctx, c, 'PLATE', 0, -720, fitSize('PLATE', 760, 200), t, w.plate!.start - 0.05, { align: 'center' });
    cslam(ctx, c, 'MATH', 0, -540, fitSize('MATH', 700, 200), t, w.math!.start - 0.05, { align: 'center', col: LIME });
    cslam(ctx, c, '100 KG', 0, 560, fitSize('100 KG', 760, 190), t, w.bar!.start - 0.05, { align: 'center', col: LIME });
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.math!.start, 0.025) * this.punch(t, w.bar!.start, 0.035) };
  }
}
