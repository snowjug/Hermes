// 09 RACE: "By TypeSafe's own test, it's 193 times faster than a typical LLM, and 444 times cheaper."
// Still ink. Two lanes from TypeSafe's comparison: a typical LLM typing out its answer while its clock runs to
// 8.566 s, and JEV, whose dot is already across at 0.114 s. 193.6× FASTER counts up on "193"; on "444" the
// cost line (0.013880 against 0.000081 dollars) and 444.6× CHEAPER. A footnote: the company's own test.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, kinetic, dot, label, counter, textWall, MONOB, CREAM, RED, clamp, ease, lerp } from '@ep/swiss';

export default class Race extends Swiss {
  override dark = true;
  override wipeOut = RED;
  override section = 9;
  override label = "TYPESAFE'S OWN TEST";
  build() {
    this.take("By TypeSafe's own test", ['own', 'test,', '193', 'faster', 'LLM,', '444', 'cheaper.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.05, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.test!.start;
    // lanes
    const la = clamp((t - this.ctx.start - 0.1) / 0.3);
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.globalAlpha = la; ctx.font = font(MONOB, 28); ctx.fillStyle = '#8C877E';
    ctx.fillText('TYPICAL LLM', -840, -205); ctx.fillText('JEV', -840, -45);
    ctx.fillStyle = 'rgba(244,240,232,0.08)'; ctx.fillRect(-840, -180, 860, 60); ctx.fillRect(-840, -20, 860, 60);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the LLM types its answer, slowly
    if (la > 0) textWall(ctx, c, -830, -176, 840, 52, t, this.ctx.start + 0.3, { rate: 0.32, seed: 5, col: '#5A564F', lh: 52 });
    const llmK = clamp((t - this.ctx.start - 0.3) / 4.0);
    // jev: across almost at once
    const jk = ease.outExpo(clamp((t - this.ctx.start - 0.35) / 0.12));
    if (la > 0) dot(ctx, c, lerp(-810, -10, jk), 10, 20, { a: la });
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.globalAlpha = la; ctx.font = font(MONOB, 34);
    ctx.fillStyle = '#8C877E'; ctx.fillText(`${(8.566 * llmK).toFixed(3)} s`, 40, -138);
    ctx.fillStyle = RED; ctx.fillText(`${(0.114 * jk).toFixed(3)} s`, 40, 22);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the cost line
    const ck = clamp((t - w['444']!.start + 0.1) / 0.25);
    if (ck > 0) {
      setWorld(ctx, c, -840, 170, 1, 0);
      ctx.globalAlpha = ck; ctx.font = font(MONOB, 30);
      ctx.fillStyle = '#8C877E'; ctx.fillText('COST PER WORKFLOW', 0, 0);
      ctx.fillStyle = CREAM; ctx.fillText('LLM  $0.013880', 0, 54);
      ctx.fillStyle = RED; ctx.fillText('JEV  $0.000081', 0, 104);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    counter(ctx, c, 193.6, (v) => `${v.toFixed(1)}×`, 900, -60, 185, t, w['193']!.start - 0.1, 1.0, { col: RED, align: 'right' });
    kinetic(ctx, c, 'FASTER', 900, 30, 64, t, w.faster!.start - 0.1, { align: 'right', col: CREAM });
    counter(ctx, c, 444.6, (v) => `${v.toFixed(1)}×`, 900, 270, 185, t, w['444']!.start - 0.1, 1.1, { col: RED, align: 'right' });
    kinetic(ctx, c, 'CHEAPER', 900, 360, 64, t, w.cheaper!.start - 0.1, { align: 'right', col: CREAM });
    label(ctx, c, '* COMPANY CLAIM · TYPESAFE.AI · SYSTEM ONE WORKFLOWS', -840, 360, { a: clamp((t - w.own!.start) / 0.3), col: '#8C877E', size: 20 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w['193']!.start, 0.02) * this.punch(t, this.w['444']!.start, 0.02) }; }
}
