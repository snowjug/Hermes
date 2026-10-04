// METER: "Ten hours of AI voice a month? On ElevenLabs, that's the $99 plan. This app does it on your
// own computer. No meter, no subscription."
// A. The first thing on screen is the voice itself: a phosphor trace of the narration, live, with the
//    pen sitting at its writing head. A credit meter runs up while the line is said (one character,
//    one credit) and $99/mo lands on "$99".
// B. A whip down: the pen draws a laptop and the same trace keeps running inside it. "No meter": the
//    pen strikes the credit readout out; "no subscription": $0.
import { type LineBatch } from '@engine/lines';
import { placeRow, fitRow, rectPts, rowWidth } from '@kit/_vo';
import { Plate, ARCH, slam, chip, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, label, font, F, burst, type Cam } from '@kit/_mp';
import { waveTrace, voiceEnv, odometer, lin } from '@ep/vs';

const BY = 1500; // act B's centre (world y)
const TR = { x0: -880, x1: 860, y: 10, h: 120 };
const LAP = { x: -560, y: BY - 300, w: 1120, h: 600 };

export default class Meter extends Plate {
  tB = 0;

  build() {
    const w = this.w;
    const L1 = this.take('Ten hours of AI voice', ['Ten', 'hours', 'of', 'AI', 'voice', 'a', 'month?', ['on1', 'On'], 'ElevenLabs,', "that's", 'the', '$99', 'plan.']);
    const L2 = this.take('This app does it', ['This', 'app', 'does', 'it', ['on2', 'on'], 'your', 'own', 'computer.', 'No', 'meter,', ['no2', 'no', 1], 'subscription.']);
    const fam = ARCH(100, 800);
    const r1 = this.span(L1, 'Ten', 'month?');
    const s1 = fitRow(r1.map((x) => x.w), 1640, fam, 116);
    this.kw.push(...placeRow(r1, -880, -330, s1, fam, 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L1, 'On', 'plan.'), -880, -215, 62, ARCH(100, 700), 'A', { ant: 0.2 }).words);
    // act B: the line above the laptop, the rest below it
    const famB = ARCH(100, 800);
    const rb1 = this.span(L2, 'This', 'computer.');
    const sb = 64;
    this.kw.push(...placeRow(rb1, -rowWidth(rb1.map((x) => x.w), sb, famB) / 2, BY - 380, sb, famB, 'B', { ant: 0.2 }).words);
    const rb2 = this.span(L2, 'No', 'subscription.');
    this.kw.push(...placeRow(rb2, -rowWidth(rb2.map((x) => x.w), 76, famB) / 2, BY + 470, 76, famB, 'B', { ant: 0.2 }).words);
    this.tB = L2.start;

    // the pen: at the trace's writing head, then it draws the laptop
    const P = this.plot;
    P.wp(pt(TR.x1, TR.y), 0, Math.max(0.05, this.tB - 0.45));
    const tl = w.app!.start;
    P.add(rectPts(LAP.x, LAP.y, LAP.w, LAP.h), tl, tl + 0.9, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.6, group: 'B' });
    P.add([pt(LAP.x - 90, LAP.y + LAP.h + 14), pt(LAP.x + LAP.w + 90, LAP.y + LAP.h + 14), pt(LAP.x + LAP.w + 40, LAP.y + LAP.h + 64), pt(LAP.x - 40, LAP.y + LAP.h + 64), pt(LAP.x - 90, LAP.y + LAP.h + 14)], tl + 0.92, w.computer!.start + 0.1, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4, group: 'B' });
    P.add([pt(-70, LAP.y + LAP.h + 40), pt(70, LAP.y + LAP.h + 40)], w.computer!.start + 0.12, w.computer!.start + 0.24, 'plot', { pen: true, width: 2, group: 'B' });
    P.note('your computer', LAP.x, LAP.y + LAP.h + 110, w.computer!.end, { size: 22, col: 'ash', group: 'B' });
    // "No meter": strike the readout
    const m = this.meterB();
    P.add([pt(m.x - 20, m.y - 18), pt(m.x + 330, m.y - 30)], w.meter!.start, w.meter!.start + 0.22, 'signal', { pen: true, ez: ease.inOutQuad, width: 5, group: 'B' });
    P.wp(pt(LAP.x + LAP.w - 80, BY), w.subscription!.start, 0.2);

    const K = this.cam;
    K.key(0, 520, TR.y - 10, 1.9, 0.02);
    K.key(w.ten!.start - 0.05, 520, TR.y - 10, 1.9, 0.02);
    K.key(w.hours!.start + 0.15, 0, -40, 1.0, 0.0, ease.inOutCubic);
    K.key(w.plan!.end, 30, -20, 1.03, -0.004, ease.linear);
    K.key(this.tB - 0.05, 30, -20, 1.03, -0.004, ease.linear);
    K.key(this.tB + 0.32, 0, BY - 10, 0.94, 0.006, ease.inOutExpo);
    K.key(w.no!.start, 0, BY + 40, 0.9, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, BY + 40, 0.93, -0.004, ease.linear);
  }

  meterB() { return { x: LAP.x + LAP.w - 420, y: LAP.y + 74 }; }

  alpha(g: string, t: number) {
    if (g === 'A') return 1 - prog(t, this.tB + 0.1, this.tB + 0.3);
    if (g === 'B') return prog(t, this.tB - 0.1, this.tB + 0.1);
    return 1;
  }

  /** credits on the meter: one per character of the line as it is said, then racing to the Pro plan's 600,000 */
  credits(t: number) {
    const w = this.w;
    const typedChars = prog(t, w.ten!.start, w.month!.end) * 31;
    const race = ease.inOutCubic(prog(t, w.on1!.start, w['99']!.start)) * 600000;
    return Math.max(typedChars, race);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const aA = 1 - prog(t, this.tB + 0.1, this.tB + 0.3);
    if (aA > 0) {
      // the credit meter
      const ma = prog(t, w.ten!.start - 0.1, w.ten!.start + 0.25) * aA;
      setWorld(ctx, c, -880, 170);
      ctx.globalAlpha = ma;
      ctx.fillStyle = rgba('ink2', 0.95); ctx.fillRect(0, 0, 640, 200);
      ctx.strokeStyle = mixCss('bone', 'acid', pulse(t, w['99']!.start, 0.3), 0.6); ctx.lineWidth = 1.4; ctx.strokeRect(0, 0, 640, 200);
      label(ctx, 'CREDITS USED', 26, 42, { size: 20, col: rgba('ash', 1), spacing: 4 });
      label(ctx, '1 CHARACTER = 1 CREDIT', 26, 178, { size: 17, col: rgba('ash', 0.85), spacing: 3 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      odometer(ctx, c, this.credits(t), -854, 300, 96, { a: ma, col: t > w['99']!.start ? 'acid' : 'bone', fam: F.mono(600) });
      // the price
      slam(ctx, c, '$99', -150, 360, 250, t, w['99']!.start, { wt: 900, col: 'acid', hotCol: 'acid', a: aA });
      const pa = prog(t, w['99']!.start + 0.1, w['99']!.start + 0.3) * aA;
      if (pa > 0) {
        setWorld(ctx, c, 300, 360);
        ctx.globalAlpha = pa;
        ctx.font = font(F.mono(500), 54); ctx.fillStyle = rgba('acid', 1); ctx.fillText('/month', 0, 0);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        chip(ctx, c, 'PRO PLAN  ·  600,000 CREDITS  ≈  10 HOURS', 130, 440, { a: pa, size: 21, border: rgba('acid', 0.7), col: rgba('bone', 0.95) });
      }
      // the brand, small, under the second row
      const ea = prog(t, w.elevenlabs!.start, w.elevenlabs!.start + 0.2) * aA;
      if (ea > 0) chip(ctx, c, 'elevenlabs.io/pricing', 620, -228, { a: ea * 0.9, size: 18 });
    }
    // act B
    const aB = prog(t, this.tB - 0.1, this.tB + 0.1);
    if (aB > 0) {
      const m = this.meterB();
      const ra = prog(t, w.your!.start, w.your!.start + 0.2) * aB;
      if (ra > 0) {
        const struck = prog(t, w.meter!.start, w.meter!.start + 0.25);
        setWorld(ctx, c, m.x, m.y - 56);
        ctx.globalAlpha = ra * (1 - 0.55 * struck);
        label(ctx, 'CREDITS USED', 0, 0, { size: 18, col: rgba('ash', 1), spacing: 4 });
        ctx.font = font(F.mono(600), 52); ctx.fillStyle = rgba(struck > 0.5 ? 'ash' : 'bone', 1); ctx.fillText('0', 0, 56);
        ctx.font = font(F.mono(400), 22); ctx.fillStyle = rgba('ash', 1); ctx.fillText('nothing to count', 60, 52);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      slam(ctx, c, '$0', LAP.x + LAP.w + 60, BY + 150, 230, t, w.subscription!.start, { wt: 900, col: 'signal', hotCol: 'signal', a: aB });
      const za = prog(t, w.subscription!.start + 0.1, w.subscription!.start + 0.3);
      if (za > 0) {
        setWorld(ctx, c, LAP.x + LAP.w + 66, BY + 210);
        ctx.globalAlpha = za; ctx.font = font(F.mono(500), 40); ctx.fillStyle = rgba('signal', 1); ctx.fillText('/month', 0, 0);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // the screen's own labels
      const sa = prog(t, w.app!.start + 0.6, w.app!.start + 0.9) * aB;
      if (sa > 0) {
        setWorld(ctx, c, LAP.x + 34, LAP.y + 52);
        label(ctx, 'LOCAL  ·  OFFLINE', 0, 0, { size: 20, col: rgba('signal', 0.9 * sa), spacing: 5 });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const au = this.ctx.audio;
    const env = (u: number) => voiceEnv(au, t - (1 - u) * 1.3);
    const aA = 1 - prog(t, this.tB + 0.15, this.tB + 0.35);
    if (aA > 0) waveTrace(X, c, TR.x0, TR.x1, TR.y, TR.h, 520, env, { cycles: 70, phase: t * 40, alpha: aA, I: 1.5, width: 2.2 });
    const aB = prog(t, this.tB - 0.15, this.tB + 0.1);
    if (aB > 0) waveTrace(X, c, LAP.x + 60, LAP.x + LAP.w - 80, BY, 150, 420, env, { cycles: 56, phase: t * 40, alpha: aB, I: 1.5, width: 2.2 });
    burst(X, c, pt(-20, 280), t, this.w['99']!.start, 40, 3, 0.8);
    burst(X, c, pt(LAP.x + LAP.w + 160, BY + 80), t, this.w.subscription!.start, 40, 5, 0.8);
    void lin; void clamp;
  }

  penScale(t: number) { return 0.75 + 0.25 * Math.min(1, voiceEnv(this.ctx.audio, t) * 1.5); }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w['99']!.start, 0.08) + pulse(t, w.subscription!.start, 0.08);
    const sh = 7 * hit;
    return { zoom: 1 + 0.02 * hit, shake: [sh * noise1(t * 50, 1), sh * noise1(t * 50, 2)] as [number, number],
      frame: 1 - prog(t, w.ten!.start - 0.05, w.ten!.start + 0.4, ease.inOutCubic) };
  }
}
