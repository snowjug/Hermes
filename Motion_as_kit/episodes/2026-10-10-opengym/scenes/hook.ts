// HOOK: "Most gym apps keep your workouts on their servers, and push you toward a subscription."
// Kraft desk. The dumbbells print lands first (YOUR WORKOUTS); on "their servers" a data-centre print
// lands across the desk and red string pins one to the other. On "push" three receipts flutter in
// (BILLED MONTHLY in red), and on "subscription" a rubber stamp lands over them.
import { drawCut, tape, pin, stringPts, drawString, tag, ring, ease, prog, pt } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk, receipt } from '@ep/kit';

const DB = { x: -500, y: -40, s: 0.62, r: -0.06 };
const DC = { x: 470, y: -150, s: 0.6, r: 0.05 };

export default class Hook extends Desk {
  override uses = ['dumbbells', 'dc'];
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take('Most gym apps', ['gym', 'apps', 'workouts', 'their', 'servers,', 'push', 'subscription.']);
    this.stamp = makeStamp('SUBSCRIPTION', 'BILLED EVERY MONTH', 'YOUR DATA, THEIR SERVER', HEX.signal, 21);
    const w = this.w;
    // a marker loop around the red receipt line
    this.plot.add(ring(425, 190, 230, 46, 5), w.subscription!.start - 0.25, w.subscription!.start + 0.2, 'signal', { pen: true, ez: ease.inOutQuad, width: 6 });
    const K = this.cam;
    K.key(0, DB.x + 40, DB.y, 1.32, -0.012);
    K.key(w.workouts!.start, DB.x + 160, DB.y - 20, 1.18, -0.008, ease.inOutCubic);
    K.key(w.their!.start - 0.1, 0, -60, 0.98, 0.004, ease.inOutCubic);
    K.key(w.push!.start, 120, 40, 0.96, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, 150, 60, 0.98, 0.01, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.dumbbells!, DB.x, DB.y, t, { t0: 0.0, scale: DB.s, rot: DB.r, seed: 2 });
    if (t > 0.25) tape(ctx, c, DB.x - 30, DB.y - 230, 180, 0.06, { seed: 3, a: prog(t, 0.25, 0.35) });
    tag(ctx, c, 'YOUR WORKOUTS', DB.x + 10, DB.y + 260, 32, { a: prog(t, w.workouts!.start, w.workouts!.start + 0.15), rot: 0.03, seed: 5 });
    drawCut(ctx, c, this.cuts.dc!, DC.x, DC.y, t, { t0: w.their!.start - 0.12, scale: DC.s, rot: DC.r, seed: 6 });
    tag(ctx, c, 'THEIR SERVERS', DC.x - 20, DC.y - 230, 32, { a: prog(t, w.servers!.start, w.servers!.start + 0.15), rot: -0.03, seed: 8 });
    const a = pt(DB.x + 230, DB.y - 150), b = pt(DC.x - 250, DC.y + 40);
    drawString(ctx, c, stringPts(a, b, 0.12), prog(t, w.workouts!.start + 0.1, w.servers!.start + 0.2, ease.inOutCubic));
    pin(ctx, c, a.x, a.y, t, w.workouts!.start + 0.1);
    pin(ctx, c, b.x, b.y, t, w.servers!.start + 0.15);
    const tp = w.push!.start - 0.1;
    receipt(ctx, c, 0, 235, 380, ['WORKOUT APP PRO', 'PLAN ........ PREMIUM', 'BILLED MONTHLY', 'AUTO-RENEW ....... ON'], t, tp, { rot: -0.08, hot: [2] });
    receipt(ctx, c, 425, 190, 380, ['WORKOUT APP PRO', 'STATS ...... LOCKED', 'BILLED MONTHLY', 'NEXT CHARGE ... SOON'], t, tp + 0.18, { rot: 0.05, hot: [2] });
    receipt(ctx, c, 850, 245, 380, ['WORKOUT APP PRO', 'EXPORT ..... PREMIUM', 'BILLED MONTHLY', 'CANCEL ......... ?'], t, tp + 0.36, { rot: 0.1, hot: [2] });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    if (this.stamp) drawStamp(ctx, c, this.stamp, 420, -10, t, this.w.subscription!.start + 0.15, 0.62, -0.12, 0.95);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.subscription!.start + 0.15, 0.02) * this.punch(t, this.w.their!.start, 0.01) };
  }
}
