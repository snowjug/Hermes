// 12 CATCH: "The catch: it only answers what you ask, from the options you give, and it can still be wrong."
// THE CATCH. in red. A box holds the three options you gave; a question from outside bounces off its wall
// (it can't answer outside them). On "still be wrong" a confident 0.91 gets a red cross: calibrated across many
// answers, not right every time.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, kinetic, chip, label, MONOB, HEAD, INK, RED, CREAM, clamp, ease, lerp } from '@ep/swiss';

export default class Catch extends Swiss {
  override dark = true;
  override wipeIn = '#121212';
  override section = 12;
  override label = 'THE CATCH';
  build() {
    this.take('The catch', ['catch:', 'only', 'ask,', 'options', 'give,', 'still', 'wrong.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the box of options
    const bk = ease.outCubic(clamp((t - w.only!.start) / 0.4));
    if (bk > 0) {
      setWorld(ctx, c, -560, 70, 1, 0);
      ctx.globalAlpha = bk; ctx.strokeStyle = CREAM; ctx.lineWidth = 4; ctx.strokeRect(-260, -190 * bk, 520, 380 * bk);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      ['A', 'B', 'C'].forEach((s, i) => chip(ctx, c, `option ${s}`, -560, -60 + i * 110, 34, { a: clamp((t - w.options!.start - i * 0.08) / 0.15), dark: true }));
      // the outside question bounces off the wall
      const qk = clamp((t - w.ask!.start) / 1.1);
      if (qk > 0) {
        const hit = 0.45;
        const x = qk < hit ? lerp(200, -270, qk / hit) : lerp(-270, -40, ease.outCubic((qk - hit) / (1 - hit)));
        const y = -40 - Math.sin(Math.min(1, qk / hit) * Math.PI) * 60;
        setWorld(ctx, c, x, y, 1, qk > hit ? (qk - hit) * 2 : 0);
        ctx.fillStyle = RED; ctx.font = font(HEAD, 120); ctx.textAlign = 'center'; ctx.fillText('?', 0, 40);
        ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // a confident wrong answer
    const wk = clamp((t - w.still!.start + 0.1) / 0.25);
    if (wk > 0) {
      setWorld(ctx, c, 420, 40, 1, 0);
      ctx.globalAlpha = wk; ctx.fillStyle = CREAM; ctx.font = font(HEAD, 200); ctx.fillText('0.91', -60, 60);
      const xk = ob(clamp((t - w.wrong!.start) / 0.25));
      if (xk > 0) {
        ctx.strokeStyle = RED; ctx.lineWidth = 18; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-80, -120 * xk); ctx.lineTo(420 * xk - 80, 120 * xk); ctx.moveTo(420 * xk - 80, -120 * xk); ctx.lineTo(-80, 120 * xk); ctx.stroke();
      }
      ctx.font = font(MONOB, 24); ctx.fillStyle = '#8C877E'; ctx.fillText('CALIBRATED OVER MANY ANSWERS, NOT RIGHT EVERY TIME', -60, 190);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'THE CATCH.', -840, -230, 150, t, this.ctx.start + 0.05, { col: RED });
    label(ctx, c, 'ONLY THE OPTIONS YOU GIVE', -800, 330, { a: clamp((t - w.give!.start) / 0.2), col: '#8C877E', size: 24 });
    void INK;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.ctx.start + 0.1, 0.02) * this.punch(t, this.w.wrong!.start, 0.015) }; }
}
