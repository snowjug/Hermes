// LIBRARY: "Pick a muscle: over 5,600 exercises, each with a demo."
// The Vesalius muscle man fills the court; PICK A MUSCLE slams in and the lime marker rings his chest.
// On "5,600" the number slams in over him with EXERCISES, and on "demo" the app's exercise list slides in.
import { drawCut, ring, ease, prog, tag } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Court, cslam, fitSize, LIME } from '@ep/court';

const VS = { x: -140, y: 190, s: 1.22 };

export default class Library extends Court {
  override uses = ['vesalius', 's_library'];

  build() {
    this.take('Pick a muscle', ['Pick', 'muscle:', 'over', '5,600', 'exercises,', 'demo.']);
    const w = this.w;
    this.plot.add(ring(VS.x + 9, VS.y - 308, 150, 92, 11), w.muscle!.start, w.muscle!.start + 0.35, 'signal', { pen: true, ez: ease.inOutQuad, width: 11 });
    const K = this.cam;
    K.key(this.ctx.start, -60, 0, 1.08, -0.01);
    K.key(w.over!.start, 0, -40, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 20, -30, 1.04, 0.01, ease.linear);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.vesalius!, VS.x, VS.y, t, { t0: this.ctx.start, scale: VS.s, rot: -0.04, seed: 21 });
    drawCut(ctx, c, this.cuts.s_library!, 250, 330, t, { t0: w.demo!.start - 0.1, scale: 0.78, rot: 0.07, seed: 22 });
    tag(ctx, c, 'EACH WITH A DEMO', 250, 40, 34, { a: prog(t, w.demo!.start, w.demo!.start + 0.12), rot: -0.05, seed: 23 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (t < w.over!.start - 0.05) {
      cslam(ctx, c, 'PICK A', 0, -720, fitSize('PICK A', 700, 160), t, this.ctx.start + 0.02, { align: 'center' });
      cslam(ctx, c, 'MUSCLE', 0, -560, fitSize('MUSCLE', 860, 200), t, w.muscle!.start - 0.05, { align: 'center', col: LIME });
    } else {
      cslam(ctx, c, '5,600+', 0, -600, fitSize('5,600+', 900, 260), t, w.over!.start - 0.05, { align: 'center', col: LIME });
      cslam(ctx, c, 'EXERCISES', 0, -440, fitSize('EXERCISES', 760, 120), t, w.exercises!.start, { align: 'center' });
    }
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.muscle!.start, 0.02) * this.punch(t, w.over!.start, 0.03) };
  }
}
