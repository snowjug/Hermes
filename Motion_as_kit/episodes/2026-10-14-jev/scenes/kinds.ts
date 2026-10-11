// 05 KINDS: "Pick an option, give a score, or say yes or no, and how sure it is."
// Three columns of the grid, one per question type in TypeSafe's docs. CHOICE: three chips, the dot lands on
// one. SCORE: a 0 to 2 scale, the marker slides to 1.4. NOUL: YES / NO, a bar fills to 0.95 on "how sure".
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, kinetic, chip, dot, label, rule, bar, MONOB, HEAD, INK, RED, GREY, clamp, ease, lerp } from '@ep/swiss';

export default class Kinds extends Swiss {
  override section = 5;
  override label = 'THREE QUESTION TYPES';
  build() {
    this.take('Pick an option', ['Pick', 'option,', 'score,', 'yes', 'no,', 'how', 'sure']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    for (const [x, tk] of [[-320, w.score!.start], [320, w.yes!.start]] as [number, number][]) rule(ctx, c, x, -330, x, 330, ease.outCubic(clamp((t - tk + 0.3) / 0.4)), { col: GREY, w: 1.5 });
    // CHOICE
    const ca = clamp((t - w.pick!.start) / 0.2);
    ['billing', 'technical', 'account'].forEach((s, i) => chip(ctx, c, s, -640, -30 + i * 125, 40, { a: ca * clamp((t - w.pick!.start - i * 0.08) / 0.15), on: clamp((t - w.option!.end - 0.1) / 0.15) * (i === 1 ? 1 : 0) }));
    const dk = ob(clamp((t - w.option!.end + 0.05) / 0.3));
    if (dk > 0) dot(ctx, c, -455, lerp(-200, 95, dk), 18);
    // SCORE
    const sa = clamp((t - w.score!.start + 0.1) / 0.2);
    if (sa > 0) {
      setWorld(ctx, c, 0, 70, 1, 0);
      ctx.globalAlpha = sa; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-220, 0); ctx.lineTo(220, 0); ctx.stroke();
      ctx.font = font(MONOB, 26); ctx.fillStyle = INK; ctx.textAlign = 'center';
      for (const [v, x] of [['0', -220], ['1', 0], ['2', 220]] as [string, number][]) { ctx.beginPath(); ctx.moveTo(x, -16); ctx.lineTo(x, 16); ctx.stroke(); ctx.fillText(v, x, 56); }
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      const mk = ease.outCubic(clamp((t - w.score!.start - 0.1) / 0.5));
      dot(ctx, c, lerp(-220, 88, mk), 70, 20, { a: sa });
      kinetic(ctx, c, (1.4 * mk).toFixed(1), 0, 10, 100, t, w.score!.start, { align: 'center', col: RED });
    }
    // NOUL
    const na = clamp((t - w.yes!.start + 0.1) / 0.2);
    if (na > 0) {
      kinetic(ctx, c, 'YES', 470, 10, 100, t, w.yes!.start - 0.05, { col: INK });
      kinetic(ctx, c, 'NO', 470, 120, 100, t, w.no!.start - 0.05, { col: GREY });
      bar(ctx, c, 470, 190, 300, 18, 0.95, clamp((t - w.how!.start) / 0.6), { a: clamp((t - w.how!.start + 0.1) / 0.2) });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    label(ctx, c, 'CHOICE', -840, -250, { a: clamp((t - w.pick!.start) / 0.2), rule: true, size: 30 });
    label(ctx, c, 'SCORE', -220, -250, { a: clamp((t - w.score!.start + 0.1) / 0.2), rule: true, size: 30 });
    label(ctx, c, 'NOUL · YES OR NO', 420, -250, { a: clamp((t - w.yes!.start + 0.1) / 0.2), rule: true, size: 30 });
    kinetic(ctx, c, 'PICK', -840, -140, 80, t, w.pick!.start - 0.05, { f: HEAD });
    kinetic(ctx, c, 'SCORE', -220, -140, 80, t, w.score!.start - 0.05);
    kinetic(ctx, c, 'DECIDE', 420, -140, 80, t, w.yes!.start - 0.05);
    label(ctx, c, 'HOW SURE', 470, 250, { a: clamp((t - w.sure!.start) / 0.2), col: RED });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.sure!.start, 0.012) }; }
}
