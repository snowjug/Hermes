// 15 OUTRO: "That's today's tool. Subscribe, there's a new one every day."
// "Jev" with its red full stop, typesafe.ai underneath; on "Subscribe" the channel's subscribe graphic plays:
// the card rises, the cursor clicks SUBSCRIBE and rings the bell. TOOL MAN · A NEW TOOL EVERY DAY.
import type { Cam } from '@kit/_vo';
import { measure } from '@engine/type';
import { W, H } from '@engine/gl';
import { subscribe } from '@kit/_subscribe';
import { Swiss, ob, kinetic, dot, label, HEAD, clamp, ease } from '@ep/swiss';

export default class Outro extends Swiss {
  override section = 15;
  build() {
    this.take("That's today's tool", ["today's", 'tool.', 'Subscribe,', 'new', 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.05, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = this.ctx.start + 0.05;
    const jw = measure('Jev', HEAD, 260);
    kinetic(ctx, c, 'Jev', -jw / 2 - 20, -120, 260, t, t0);
    dot(ctx, c, jw / 2 + 14, -140, 26 * ob(clamp((t - t0 - 0.3) / 0.35)));
    label(ctx, c, 'typesafe.ai · docs.typesafe.ai', 0, -40, { a: clamp((t - t0 - 0.3) / 0.3), align: 'center', size: 28 });
    label(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 300, { a: clamp((t - w.new!.start + 0.1) / 0.3), align: 'center', size: 26, rule: true });
    subscribe(ctx, t, w.subscribe!.start - 0.15, this.ctx.end - 0.3, { x: W / 2, y: H / 2 + 120, s: 1 });
  }
}
