// OUTRO: "That's today's tool. There's a new one every day."
// The cleaned-up home folder recedes; today's tool and the channel's promise; then everything gives way
// to the spark at rest inside the crop marks (the video's first frame).
import { type LineBatch } from '@engine/lines';
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, typed, pt, ease, prog, pulse, rgba, setWorld, label, type Cam } from '@kit/_mp';

export default class Outro extends Plate {
  build() {
    const w = this.w;
    const L = this.take("That's today's tool", ["That's", "today's", 'tool.', "There's", 'new', 'every', 'day.']);
    this.kw.push(...placeRow(this.span(L, "That's", 'tool.'), -620, -20, 124, ARCH(100, 800), 'K', { ant: 0.25 }).words);
    this.kw.push(...placeRow(this.span(L, "There's", 'day.'), -620, 100, 76, ARCH(100, 700), 'K', { ant: 0.25 }).words);
    this.plot.wp(pt(-800, -282), this.ctx.end - 1.0, 1.1);
    const K = this.cam;
    K.key(this.ctx.start, -60, 20, 1.08, -0.006);
    K.key(this.ctx.end - 1.0, -40, 30, 1.04, -0.004, ease.inOutCubic);
    K.key(this.ctx.end, -800, -260, 2.0, 0.02, ease.inOutCubic);
  }
  alpha(g: string, t: number) { return g === 'K' ? 1 - prog(t, this.ctx.end - 1.0, this.ctx.end - 0.5) : 1; }
  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const a = prog(t, this.ctx.start + 0.1, this.ctx.start + 0.4) * (1 - prog(t, this.ctx.end - 1.0, this.ctx.end - 0.5));
    typed(ctx, c, 'disktree  ·  github.com/tobi/disktree', -616, -190, t, this.ctx.start + 0.1, 0.5, { size: 30, col: 'ash', a });
    setWorld(ctx, c, -616, 220);
    label(ctx, 'TOOL MAN  ·  ONE NEW TOOL, EVERY DAY', 0, 0, { size: 24, col: rgba('signal', a * prog(t, this.w.every!.start, this.w.every!.start + 0.3)), spacing: 5, weight: 600 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  drawFX(_X: LineBatch, _t: number, _c: Cam) {}
  penScale(t: number) { return 0.8 + 0.5 * prog(t, this.ctx.end - 1.2, this.ctx.end - 0.4); }
  postFX(t: number) { return { zoom: 1 + 0.01 * pulse(t, this.w.tool!.start, 0.1), frame: prog(t, this.ctx.end - 0.9, this.ctx.end - 0.2, ease.inOutCubic) }; }
}
