// STARS: "It's open source, not even six months old, and just passed 52,000 GitHub stars. Nearly a third
// of them arrived in the last seven days."
// The pen plots the repository's life on graph paper: a time axis from the day it was created
// (9 Apr 2026) to today, with month ticks. The star counter rolls to 52,915. Then only the facts we
// have: 36,140 stars after 171 days (a dashed line: we don't know the path), and +16,775 in the last 7
// (GitHub's weekly trending count): a near-vertical stroke, bracketed as a third of the total.
import { type LineBatch } from '@engine/lines';
import { placeRow, arc } from '@kit/_vo';
import { Plate, ARCH, lineRows, chip, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, burst, type Cam } from '@kit/_mp';
import { odometer } from '@ep/vs';

const X0 = -760, X1 = 760, Y0 = 300, DAYS = 178, PER = 0.0105; // y px per star
const xd = (d: number) => X0 + ((X1 - X0) * d) / DAYS;
const ys = (s: number) => Y0 - s * PER;
const MONTHS: [string, number][] = [['APR', 0], ['MAY', 22], ['JUN', 53], ['JUL', 83], ['AUG', 114], ['SEP', 145], ['OCT', 175]];

export default class Stars extends Plate {
  tB = 0;

  build() {
    const w = this.w;
    const L4 = this.take("It's open source, not even", ['open', 'source,', 'not', 'even', 'six', 'months', 'old,', 'just', 'passed', '52,000', 'GitHub', 'stars.']);
    const L5 = this.take('Nearly a third of them', ['Nearly', 'third', 'them', 'arrived', 'last', 'seven', 'days.']);
    this.tB = L5.start;
    this.kw.push(...lineRows(L4.words, -760, 430, 46, ARCH(100, 700), 'A', 1600).words);
    this.screenKw.push(...lineRows(L5.words, -860, -420, 60, ARCH(100, 800), 'B', 1000).words);
    const P = this.plot;
    // axes on "not even six months old"
    const ta = w.not!.start;
    P.add([pt(X0, Y0), pt(X1 + 40, Y0)], ta, ta + 0.45, 'axis', { pen: true, ez: ease.inOutQuad, width: 1.6 });
    P.add([pt(X0, Y0), pt(X0, ys(58000))], ta + 0.47, ta + 0.75, 'axis', { pen: true, ez: ease.inOutQuad, width: 1.6 });
    MONTHS.forEach(([m, d], i) => {
      const tt = w.six!.start + i * 0.07;
      P.add([pt(xd(d), Y0), pt(xd(d), Y0 + 16)], tt, tt + 0.05, 'axis', { width: 1.4 });
      P.note(m, xd(d), Y0 + 50, tt, { size: 20, col: 'ash', align: 'center', dur: 0.05 });
    });
    for (const s of [10000, 20000, 30000, 40000, 50000]) {
      P.add([pt(X0 - 14, ys(s)), pt(X0, ys(s))], ta + 0.6, ta + 0.65, 'axis', { width: 1.4 });
      P.note(`${s / 1000}k`, X0 - 24, ys(s) + 7, ta + 0.65, { size: 18, col: 'ash', align: 'right', dur: 0.05 });
    }
    P.note('created 9 Apr 2026', X0 + 10, Y0 + 92, w.old!.start, { size: 20, col: 'ash', group: 'main' });
    P.note('today', X1, Y0 + 92, w.old!.start + 0.1, { size: 20, col: 'signal', align: 'center', dur: 0.05 });
    // the known points
    const tp = w.passed!.start;
    P.add([pt(xd(0), ys(0)), pt(xd(171), ys(36140))], tp, tp + 0.6, 'plot', { pen: true, ez: ease.inOutQuad, width: 2, dash: 14 });
    P.add([pt(xd(171), ys(36140)), pt(xd(178), ys(52915))], tp + 0.62, w.stars!.end, 'signal', { pen: true, ez: ease.inQuad, width: 5 });
    P.note('day 171:  36,140', xd(171) - 30, ys(36140) + 46, tp + 0.6, { size: 20, col: 'ash', align: 'right', dur: 0.1 });
    P.note('path unknown', xd(80), ys(17500) + 40, tp + 0.4, { size: 18, col: 'graphite', align: 'center', rot: -0.2, dur: 0.1 });
    // L5: a bracket on the star axis for the last week's share, and one on the time axis for 7 days
    const tb = w.third!.start;
    const bx = X1 + 70;
    P.add([pt(bx - 16, ys(36140)), pt(bx, ys(36140)), pt(bx, ys(52915)), pt(bx - 16, ys(52915))], tb - 0.1, tb + 0.35, 'signal', { pen: true, ez: ease.inOutQuad, width: 3.5, group: 'B' });
    P.add([pt(xd(171), Y0 + 130), pt(xd(171), Y0 + 146), pt(xd(178), Y0 + 146), pt(xd(178), Y0 + 130)], w.last!.start, w.seven!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 3.5, group: 'B' });
    P.wp(pt(bx + 40, ys(44000)), this.ctx.end - 0.1, 0.1);

    const K = this.cam;
    K.key(this.ctx.start, -200, 0, 1.12, -0.008);
    K.key(w.not!.start, -60, 40, 0.98, 0, ease.inOutCubic);
    K.key(w.passed!.start, 0, 30, 0.95, 0.004, ease.inOutCubic);
    K.key(this.tB - 0.05, 0, 30, 0.95, 0.004, ease.linear);
    K.key(this.tB + 0.5, 470, 40, 1.3, -0.01, ease.inOutCubic);
    K.key(w.last!.start, 560, 140, 1.45, -0.012, ease.inOutCubic);
    K.key(this.ctx.end, 580, 150, 1.5, -0.014, ease.linear);
  }

  alpha(g: string, t: number) {
    if (g === 'A') return 1 - prog(t, this.tB - 0.15, this.tB + 0.05);
    if (g === 'B') return prog(t, this.tB - 0.1, this.tB + 0.1);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the counter
    const ca = prog(t, this.ctx.start, this.ctx.start + 0.3);
    const v = 52915 * ease.outCubic(prog(t, w.passed!.start, w.stars!.end + 0.2));
    odometer(ctx, c, v, X0, -400, 150, { a: ca, col: t > w.stars!.start ? 'signal' : 'bone' });
    setWorld(ctx, c, X0 + 4, -330);
    label(ctx, 'GITHUB STARS  ·  debpalash/VoiceStudio  ·  4 OCT 2026', 0, 0, { size: 19, col: rgba('ash', ca), spacing: 4 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the facts as chips
    const oa = prog(t, w.open!.start, w.open!.start + 0.15);
    if (oa > 0) chip(ctx, c, 'OPEN SOURCE  ·  AGPL-3.0', 420, -440, { a: oa, size: 22, border: rgba('signal', 0.8) });
    const ma = prog(t, w.six!.start, w.six!.start + 0.15);
    if (ma > 0) chip(ctx, c, '178 DAYS OLD', 420, -380, { a: ma, size: 22 });
    // L5: the share
    const ba = prog(t, w.third!.start + 0.1, w.third!.start + 0.35);
    if (ba > 0) {
      setWorld(ctx, c, X1 + 100, ys(44500));
      ctx.globalAlpha = ba;
      ctx.font = font(ARCH(100, 900), 74); ctx.fillStyle = rgba('signal', 1); ctx.fillText('+16,775', 0, 10);
      ctx.font = font(F.mono(500), 22); ctx.fillStyle = rgba('bone', 0.9); ctx.fillText('32% of all its stars', 4, 50);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const la = prog(t, w.seven!.start, w.seven!.start + 0.2);
    if (la > 0) {
      setWorld(ctx, c, (xd(171) + xd(178)) / 2, Y0 + 186);
      ctx.globalAlpha = la;
      label(ctx, 'LAST 7 DAYS', 0, 0, { size: 24, col: rgba('signal', 1), spacing: 4, align: 'center', weight: 600 });
      label(ctx, "GITHUB'S WEEKLY TRENDING COUNT", 0, 30, { size: 14, col: rgba('ash', 1), spacing: 2, align: 'center' });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void mixCss; void clamp;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    burst(X, c, pt(xd(178), ys(52915)), t, w.stars!.end - 0.05, 50, 4, 0.8);
    burst(X, c, pt(X1 + 70, ys(44500)), t, w.third!.start + 0.2, 30, 6, 0.6);
    void arc; void placeRow;
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.stars!.end - 0.05, 0.08);
    return { zoom: 1 + 0.018 * hit, shake: [6 * hit * noise1(t * 50, 1), 6 * hit * noise1(t * 50, 2)] as [number, number] };
  }
}
