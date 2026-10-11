// 04 DECIDE: "Jev only makes decisions. Give it the facts and a question, and it answers with a probability."
// ONLY DECISIONS. across the top. A FACTS card (the state) and a QUESTION card slot in on their words; an arrow
// leads to a black JEV block; the red dot runs through it and comes out as 0.93: the probability, P(YES).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, kinetic, card, dot, label, rule, counter, MONO, HEAD, INK, RED, CREAM, clamp, ease, lerp } from '@ep/swiss';

const FACTS = ['{ "customer": "Ana",', '  "msg": "charged twice",', '  "orders": 2,', '  "policy": "30 days" }'];

export default class Decide extends Swiss {
  override wipeIn = INK;
  override section = 4;
  override label = 'HOW IT WORKS';
  build() {
    this.take('Jev only makes', ['Jev', 'decisions.', 'facts', 'question,', 'answers', 'probability.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -20, 1.03, 0);
    K.key(this.ctx.end, 40, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the dot waits in the middle until the facts arrive
    const wk = ob(clamp((t - w.decisions!.start) / 0.35)) * (1 - clamp((t - w.facts!.start + 0.2) / 0.3));
    if (wk > 0) dot(ctx, c, 0, 60, 60 * wk, { pulse: (t * 1.2) % 1 });
    const fk = ease.outCubic(clamp((t - w.facts!.start + 0.1) / 0.35));
    card(ctx, c, -860, -60, 470, 250, 'STATE · THE FACTS', { a: fk, rise: (1 - fk) * 40 });
    if (fk > 0) {
      setWorld(ctx, c, -840, 20, 1, 0);
      ctx.globalAlpha = fk; ctx.font = font(MONO, 24); ctx.fillStyle = INK;
      FACTS.forEach((s, i) => ctx.fillText(s, 0, i * 38));
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const qk = ease.outCubic(clamp((t - w.question!.start + 0.1) / 0.35));
    card(ctx, c, -340, -60, 420, 250, 'QUESTION · YES/NO', { a: qk, rise: (1 - qk) * 40 });
    if (qk > 0) {
      setWorld(ctx, c, -318, 40, 1, 0);
      ctx.globalAlpha = qk; ctx.font = font(HEAD, 40); ctx.fillStyle = INK;
      ctx.fillText('Is this a', 0, 0); ctx.fillText('refund request?', 0, 52);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // arrow to the block
    const ak = ease.inOutCubic(clamp((t - w.question!.end) / 0.4));
    rule(ctx, c, 100, 65, 250, 65, ak, { w: 4 });
    // the JEV block
    const bk = clamp((t - w.question!.end - 0.2) / 0.25);
    if (bk > 0) {
      setWorld(ctx, c, 260, -50, 0.9 + 0.1 * ob(bk), 0);
      ctx.globalAlpha = bk; ctx.fillStyle = INK; ctx.fillRect(0, 0, 230, 230);
      ctx.fillStyle = CREAM; ctx.font = font(HEAD, 70); ctx.textAlign = 'center'; ctx.fillText('JEV', 115, 140);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the dot runs through and out
    const rk = clamp((t - w.answers!.start) / 0.6);
    if (rk > 0) {
      const x = rk < 0.5 ? lerp(100, 375, rk * 2) : lerp(375, 600, (rk - 0.5) * 2);
      dot(ctx, c, x, 65, 22, { a: rk < 0.45 || rk > 0.55 ? 1 : 0 });
      rule(ctx, c, 490, 65, 600, 65, clamp((rk - 0.5) * 2), { w: 4 });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'ONLY DECISIONS.', -860, -260, 150, t, w.jev!.start, { hi: ['DECISIONS.'] });
    counter(ctx, c, 0.93, (v) => v.toFixed(2), 640, 120, 190, t, w.probability!.start - 0.15, 0.5, { col: RED });
    label(ctx, c, 'P(YES)', 650, -10, { a: clamp((t - w.probability!.start) / 0.2), size: 28 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.probability!.start, 0.015) }; }
}
