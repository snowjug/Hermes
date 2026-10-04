// QUESTION: "So how does one free app replace a voice studio?"
// The question in big type on the left. On the right the pen draws what a voice studio means: a
// condenser microphone in its shock mount on a stand, an ON AIR lamp, a desk of faders. On "app" a
// tiny app icon appears at the foot of it all, for scale; on "studio?" the lamp lights.
import { type LineBatch } from '@engine/lines';
import { placeRow, rectPts, arc } from '@kit/_vo';
import { Plate, ARCH, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, label, burst, type Cam } from '@kit/_mp';
import { waveBars, speechEnv } from '@ep/vs';

const MIC = { x: 610, y: -360, w: 190, h: 330 };

export default class Question extends Plate {
  build() {
    const w = this.w;
    const L = this.take('So how does one free app', ['So', 'how', 'does', 'one', 'free', 'app', 'replace', 'a', 'voice', 'studio?']);
    const fam = ARCH(100, 900);
    this.kw.push(...placeRow(this.span(L, 'So', 'app'), -880, -150, 92, fam, 'Q', { ant: 0.25 }).words);
    this.kw.push(...placeRow(this.span(L, 'replace', 'studio?'), -880, -30, 92, fam, 'Q', { ant: 0.25 }).words);
    const P = this.plot;
    const t0 = L.start;
    const d = Math.max(1.4, L.end - L.start);
    const T = (k: number) => t0 + d * k;
    // microphone capsule, grille, shock-mount ring, stand, base
    P.add(rectPts(MIC.x, MIC.y, MIC.w, MIC.h), T(0.0), T(0.16), 'plot', { pen: true, ez: ease.inOutQuad, width: 2.6 });
    for (let i = 1; i < 8; i++) {
      const y = MIC.y + 30 + i * 22;
      P.add([pt(MIC.x + 18, y), pt(MIC.x + MIC.w - 18, y)], T(0.16 + i * 0.012), T(0.17 + i * 0.012), 'hatch', { width: 1.3 });
    }
    P.add(arc(MIC.x + MIC.w / 2, MIC.y + MIC.h * 0.62, MIC.w * 0.92, Math.PI * 0.08, Math.PI * 0.92, 40), T(0.26), T(0.36), 'plot', { pen: true, width: 2.2 });
    P.add([pt(MIC.x + MIC.w / 2, MIC.y + MIC.h + 140), pt(MIC.x + MIC.w / 2, 420)], T(0.36), T(0.44), 'plot', { pen: true, width: 2.4 });
    P.add([pt(MIC.x - 80, 420), pt(MIC.x + MIC.w + 80, 420)], T(0.44), T(0.5), 'plot', { pen: true, width: 2.4 });
    // the desk: a slab with five fader slots
    const dx = 120, dy = 300;
    P.add(rectPts(dx - 360, dy, 300, 120), T(0.5), T(0.6), 'plot', { pen: true, ez: ease.inOutQuad, width: 2 });
    for (let i = 0; i < 5; i++) P.add([pt(dx - 330 + i * 60, dy + 18), pt(dx - 330 + i * 60, dy + 102)], T(0.6 + i * 0.015), T(0.61 + i * 0.015), 'cons', { width: 1.4 });
    // the ON AIR lamp
    P.add(rectPts(MIC.x - 50, -500, 290, 84), T(0.62), T(0.72), 'plot', { pen: true, ez: ease.inOutQuad, width: 2 });
    P.note('a voice studio', MIC.x - 50, 480, T(0.7), { size: 22, col: 'ash' });
    P.wp(pt(MIC.x + MIC.w + 120, -460), this.ctx.end - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, -220, -60, 1.1, 0.006);
    K.key(w.app!.start, -60, -40, 1.0, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 40, -30, 0.96, -0.006, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // faders
    const fa = prog(t, w.does!.start, w.does!.start + 0.4);
    for (let i = 0; i < 5; i++) {
      if (fa <= 0) break;
      const y = 300 + 30 + 50 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 1.7));
      setWorld(ctx, c, 120 - 330 + i * 60 - 14, y);
      ctx.fillStyle = rgba('bone', 0.85 * fa); ctx.fillRect(0, 0, 28, 14);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // ON AIR
    const on = prog(t, w.studio!.start, w.studio!.start + 0.08);
    const la = prog(t, w.voice!.start - 0.3, w.voice!.start);
    if (la > 0) {
      setWorld(ctx, c, MIC.x - 50 + 145, -444);
      if (on > 0) { ctx.fillStyle = rgba('acid', 0.22 * on); ctx.fillRect(-145, -56, 290, 84); }
      label(ctx, 'ON AIR', 0, 0, { size: 44, col: on > 0 ? mixCss('bone', 'acid', on, la) : rgba('graphite', la), spacing: 10, align: 'center', weight: 700 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the app, tiny, for scale
    const aa = prog(t, w.app!.start, w.app!.start + 0.15);
    if (aa > 0) {
      const pop = 1 + 0.4 * pulse(t, w.app!.start, 0.1);
      setWorld(ctx, c, 330, 360, pop);
      ctx.globalAlpha = aa;
      ctx.beginPath(); ctx.roundRect(-28, -28, 56, 56, 14); ctx.fillStyle = rgba('signal', 1); ctx.fill();
      ctx.fillStyle = rgba('ink', 1);
      for (let i = 0; i < 5; i++) { const hgt = [12, 26, 38, 22, 14][i]!; ctx.fillRect(-20 + i * 9, -hgt / 2, 5, hgt); }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, 330, 420);
      label(ctx, 'one free app', 0, 0, { size: 20, col: rgba('signal', aa), spacing: 2, align: 'center' });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    // the mic hears the question
    const a = prog(t, this.w.so!.start, this.w.so!.start + 0.3);
    if (a > 0) waveBars(X, c, MIC.x - 260, MIC.x - 40, MIC.y + MIC.h / 2, 60, 26, (u) => speechEnv(u * 2.5 + t * 0.9, 3) * (0.3 + 0.7 * Math.min(1, this.ctx.audio.env('rms', t) * 1.4)), { alpha: a, I: 0.9 });
    burst(X, c, pt(330, 360), t, this.w.app!.start, 26, 7, 0.4);
    void clamp; void noise1;
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.studio!.start, 0.08);
    return { zoom: 1 + 0.015 * hit };
  }
}
