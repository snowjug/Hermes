// 15 OUTRO: "That's today's tool. Subscribe, there's a new one every day."
// End credits over the dimmed stage: ArtCraft in serif, github.com/storytold/artcraft and getartcraft.com; on
// "Subscribe" the channel's subscribe graphic plays (dark card). TOOL MAN · A NEW TOOL EVERY DAY on tape.
import type { Cam } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { drawParts } from '@kit/_cad3d';
import { subscribe } from '@kit/_subscribe';
import { Cinema, room, figures, title, mono, tape, IVORY, clamp } from '@ep/cinema';
import { STAGE, cast } from '@ep/set';

export default class Outro extends Cinema {
  override scene = 5;
  build() {
    this.take("That's today's tool", ["today's", 'tool.', 'Subscribe,', 'new', 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }
  override letterbox() { return 1; }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawParts(ctx, c, 0, 160, STAGE(t, this.ctx.start, 0.6, 0.05, 1.1), [{ mesh: room() }, { mesh: figures(cast(1)) }], { a: 0.3 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'ArtCraft', 0, -150, 170, t, this.ctx.start + 0.05, { glow: 'rgba(245,179,66,0.4)' });
    mono(ctx, c, 'github.com/storytold/artcraft · getartcraft.com', 0, -60, { a: clamp((t - this.ctx.start - 0.4) / 0.3), align: 'center', size: 26, col: IVORY });
    tape(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 280, 30, { a: clamp((t - w.new!.start + 0.1) / 0.3) });
    subscribe(ctx, t, w.subscribe!.start - 0.15, this.ctx.end - 0.3, { x: W / 2, y: H / 2 + 110, s: 1, dark: true });
  }
}
