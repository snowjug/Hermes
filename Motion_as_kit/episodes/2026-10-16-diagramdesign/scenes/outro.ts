// 22 OUTRO: "That's today's tool. Subscribe, there's a new one every day."
// Diagram Design in serif with the repo address in mono, the clean diagram faint behind; on "Subscribe" the channel's
// subscribe graphic plays (dark card); TOOL MAN · A NEW TOOL EVERY DAY as a chip.
import type { Cam } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { subscribe } from '@kit/_subscribe';
import { Dgm, serif, mono, chip, appDiagram, subCam, TEXT, clamp } from '@ep/dgm';

export default class Outro extends Dgm {
  build() {
    this.take("That's today's tool", ["today's", 'tool.', 'Subscribe,', 'new', 'every', 'day.']);
    this.frame(0, 0, 1, { from: [0, 0, 0.6], to: [0, 0, 1], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    appDiagram(ctx, subCam(c, 0, 40, 0.9), 0, 0, 1, { a: 0.16, t });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    serif(ctx, c, 'Diagram Design', 0, -170, 140, t, this.ctx.start + 0.05, { glow: 'rgba(255,106,69,0.25)' });
    mono(ctx, c, 'github.com/cathrynlavery/diagram-design', 0, -90, { a: clamp((t - this.ctx.start - 0.3) / 0.3), align: 'center', size: 24, col: TEXT });
    chip(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 250, { a: clamp((t - this.s('new') + 0.1) / 0.3), size: 18 });
    subscribe(ctx, t, this.s('subscribe') - 0.15, this.ctx.end - 0.3, { x: W / 2, y: H / 2 + 90, s: 1, dark: true });
  }
}
