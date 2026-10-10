// SESSION: "In the gym, it fills in last time's weights, runs your rest timer, and catches new records as
// they happen."
// The app's workout screen lands on the left. On "last time's weights" a tag (PRE-FILLED: LAST TIME'S
// 77.5 KG × 8) lands and a marker arrow points at the set rows. On "rest timer" the stopwatch print lands
// with a slip that counts the rest down, and on "new records" a NEW PR sticker slams in.
import { drawCut, tag, arrow, ease, prog, setWorld, font, F, rgba, clamp } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, badge, PAPER } from '@ep/kit';

const SH = { x: -470, y: 0, s: 0.92, r: -0.03 };

export default class Session extends Desk {
  override uses = ['s_workout', 'watch'];

  build() {
    this.take('In the gym', ['gym,', 'fills', 'last', "time's", 'weights,', 'rest', 'timer,', 'catches', 'new', 'records', 'happen.']);
    const w = this.w;
    const ar = arrow({ x: -40, y: -150 }, { x: SH.x + 90, y: SH.y + 280 }, 3, 0.25);
    this.plot.add(ar.shaft, w.weights!.start, w.weights!.end + 0.1, 'signal', { pen: true, width: 7 });
    this.plot.add(ar.head, w.weights!.end + 0.1, w.weights!.end + 0.2, 'signal', { pen: true, width: 7 });
    const K = this.cam;
    K.key(this.ctx.start, -380, 40, 1.12, -0.006);
    K.key(w.last!.start, -200, 20, 1.0, -0.002, ease.inOutCubic);
    K.key(w.rest!.start, 60, -20, 0.98, 0.004, ease.inOutCubic);
    K.key(w.new!.start, 120, 10, 1.0, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, 130, 20, 1.03, 0.008, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.s_workout!, SH.x, SH.y, t, { t0: this.ctx.start + 0.05, scale: SH.s, rot: SH.r, seed: 51 });
    tag(ctx, c, "PRE-FILLED: 77.5 KG × 8", 120, -230, 32, { a: prog(t, w.last!.start, w.last!.start + 0.15), rot: 0.03, seed: 52, sub: 'LAST TIME 75 KG × 8, NOW +2.5 KG' });
    const tw = w.rest!.start - 0.1;
    drawCut(ctx, c, this.cuts.watch!, 330, 70, t, { t0: tw, scale: 0.68, rot: 0.05, seed: 53 });
    if (t > w.timer!.start - 0.05) {
      // a slip with the rest counting down
      const left = Math.max(0, 90 - Math.floor((t - w.timer!.start) * 1));
      const txt = `REST  ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      const k = clamp((t - w.timer!.start + 0.05) / 0.15);
      setWorld(ctx, c, 330, 330, 0.7 + 0.3 * k, -0.04);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-170 + 6, -48 + 9, 340, 96);
      ctx.fillStyle = PAPER; ctx.fillRect(-170, -48, 340, 96);
      ctx.font = font(F.mono(700), 52); ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center';
      ctx.fillText(txt, 0, 18); ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    badge(ctx, c, 690, -170, 140, 'PR', 'NEW RECORD', t, this.w.records!.start - 0.05, { rot: 0.14 });
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.records!.start, 0.02) };
  }
}
