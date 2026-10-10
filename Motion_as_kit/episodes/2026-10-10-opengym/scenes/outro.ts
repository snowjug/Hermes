// OUTRO: "That's today's tool. There's a new one every day."
// The desk, tidied: the muscle man, the barbell, the stopwatch, the Raspberry Pi and the phone land
// around the edges; openGym in ransom letters in the middle with its address, and the channel's tag.
import { drawCut, tag, ransom, ease, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

export default class Outro extends Desk {
  override uses = ['vesalius', 'barbell', 'watch', 'pi', 's_home'];
  override wipeIn = true;
  override wipeFrom: 'left' | 'right' = 'left';

  build() {
    this.take("That's today's tool", ["today's", 'tool.', 'new', 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.06, -0.004);
    K.key(this.ctx.end, 0, 10, 0.98, 0.004, ease.inOutCubic);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w, s = this.ctx.start;
    drawCut(ctx, c, this.cuts.vesalius!, -720, 0, t, { t0: s + 0.1, scale: 0.6, rot: -0.06, seed: 131 });
    drawCut(ctx, c, this.cuts.barbell!, -330, 300, t, { t0: s + 0.25, scale: 0.42, rot: 0.05, seed: 132 });
    drawCut(ctx, c, this.cuts.watch!, 370, 300, t, { t0: s + 0.4, scale: 0.4, rot: -0.07, seed: 133 });
    drawCut(ctx, c, this.cuts.pi!, 360, -330, t, { t0: s + 0.55, scale: 0.42, rot: 0.06, seed: 134 });
    drawCut(ctx, c, this.cuts.s_home!, 730, 20, t, { t0: s + 0.7, scale: 0.5, rot: 0.05, seed: 135 });
    tag(ctx, c, 'github.com/DuarteSantos8/openGym', 0, 60, 34, { a: prog(t, w.tool!.start, w.tool!.start + 0.15), rot: -0.01, seed: 136 });
    tag(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 170, 28, { a: prog(t, w.new!.start, w.new!.start + 0.15), rot: 0.02, seed: 137, bg: '#E8F7B8' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const t0 = this.ctx.start + 0.15;
    const wd = ransom(ctx, c, 'openGym', 0, -110, 170, t, t0, 0.5, 17, 0);
    ransom(ctx, c, 'openGym', -wd / 2, -110, 170, t, t0, 0.5, 17);
  }
}
