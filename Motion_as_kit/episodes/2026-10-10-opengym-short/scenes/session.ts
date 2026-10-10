// SESSION: "It fills in last time's weights, runs your rest timer, and catches new records."
// The app's workout screen fills the left of the court. The headline follows the sentence: LAST TIME'S
// WEIGHTS (with a lime tag on the pre-filled set), REST TIMER (the stopwatch lands and a slip counts
// down), NEW RECORD (a PR sticker slams in with a shake).
import { drawCut, tag, prog, setWorld, font, F, clamp } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { badge, PAPER } from '@ep/kit';
import { Court, cslam, fitSize, LIME, NAVY } from '@ep/court';

export default class Session extends Court {
  override uses = ['s_workout', 'watch'];

  build() {
    this.take('It fills in', ['fills', 'last', "time's", 'weights,', 'rest', 'timer,', 'catches', 'new', 'records.']);
    const K = this.cam;
    K.key(this.ctx.start, -40, 20, 1.06, -0.008);
    K.key(this.w.rest!.start, 40, 0, 1.0, 0.004);
    K.key(this.ctx.end, 50, 10, 1.04, 0.01);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.s_workout!, -170, 170, t, { t0: this.ctx.start, scale: 1.3, rot: -0.04, seed: 31 });
    tag(ctx, c, '77.5 KG × 8 · PRE-FILLED', -150, 640, 36, { a: prog(t, w.weights!.start, w.weights!.start + 0.12), rot: 0.03, seed: 32, bg: LIME });
    drawCut(ctx, c, this.cuts.watch!, 300, -230, t, { t0: w.rest!.start - 0.1, scale: 0.6, rot: 0.06, seed: 33 });
    if (t > w.timer!.start - 0.05) {
      const left = Math.max(0, 90 - Math.floor(t - w.timer!.start));
      const k = clamp((t - w.timer!.start + 0.05) / 0.12);
      setWorld(ctx, c, 300, 30, 0.7 + 0.3 * k, -0.05);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-150 + 6, -44 + 8, 300, 88);
      ctx.fillStyle = PAPER; ctx.fillRect(-150, -44, 300, 88);
      ctx.font = font(F.mono(700), 50); ctx.fillStyle = NAVY; ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 0, 17); ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (t < w.rest!.start - 0.05) {
      cslam(ctx, c, "LAST TIME'S", 0, -720, fitSize("LAST TIME'S", 860, 150), t, w.last!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'WEIGHTS', 0, -560, fitSize('WEIGHTS', 860, 200), t, w.weights!.start - 0.05, { align: 'center', col: LIME });
    } else if (t < w.new!.start - 0.05) {
      cslam(ctx, c, 'REST', 0, -720, fitSize('REST', 600, 170), t, w.rest!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'TIMER', 0, -560, fitSize('TIMER', 760, 200), t, w.timer!.start - 0.05, { align: 'center', col: LIME });
    } else {
      cslam(ctx, c, 'NEW', 0, -720, fitSize('NEW', 500, 170), t, w.new!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'RECORDS', 0, -560, fitSize('RECORDS', 900, 200), t, w.records!.start - 0.05, { align: 'center', col: LIME });
    }
    badge(ctx, c, 300, 380, 150, 'PR', 'NEW RECORD', t, w.records!.start, { rot: 0.14, col: 'blood' });
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.rest!.start, 0.02) * this.punch(t, w.records!.start, 0.04) };
  }
}
