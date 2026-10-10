// CATCH: "The catch, in the author's own words: it's a tool, not a wishing well. A cheap model gives you a
// rough draft, and you'll still polish it yourself."
// THE CATCH. A quote card types the author's line ("This is a tool, not a wishing well.") beside a drawn well
// with a coin that bounces off. On "rough draft" a slide lands with a DRAFT stamp across it; on "polish" the
// pointer nudges its pieces into line and the stamp lifts away, sparkles where it was.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, slide, pointer, sparkles, headline, HEAD, BODY, WHITE, SOFT, ORANGE, PEACH, clamp, ease, lerp, TAU } from '@ep/keynote';

export default class Catch extends Keynote {
  build() {
    this.take('The catch', ['catch,', "author's", 'own', 'words:', 'tool,', 'wishing', 'well.', 'cheap', 'rough', 'draft,', 'polish', 'yourself.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -40, 1.04, 0);
    K.key(this.w.well!.end + 0.05, 0, -30, 1.02, 0);
    K.key(this.w.cheap!.start + 0.2, 150, 0, 1.0, 0);
    K.key(this.ctx.end, 160, 0, 1.01, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the quote card
    const kq = clamp((t - w.authors!.start) / 0.25);
    if (kq > 0) {
      glass(ctx, c, -780, -200, 820, 300, { a: kq });
      setWorld(ctx, c, -780, -200, 1, 0); ctx.globalAlpha = kq;
      ctx.font = font(HEAD, 120); ctx.fillStyle = ORANGE; ctx.fillText('“', 30, 120);
      // the quote types in over two lines, so it stays inside the card
      const q1 = 'This is a tool,', q2 = 'not a wishing well.';
      const n = Math.ceil((q1.length + q2.length) * clamp((t - w.tool!.start + 0.3) / 1.2));
      ctx.font = font(HEAD, 54); ctx.fillStyle = WHITE;
      ctx.fillText(q1.slice(0, n), 110, 112); ctx.fillText(q2.slice(0, Math.max(0, n - q1.length)), 110, 180);
      ctx.font = font(BODY, 28); ctx.fillStyle = SOFT; ctx.fillText('— Hugo He, author of PPT Master', 110, 250);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the well
    const kw = clamp((t - w.wishing!.start + 0.1) / 0.3);
    if (kw > 0) {
      setWorld(ctx, c, -400, 290, 0.8 + 0.2 * kw, 0); ctx.globalAlpha = kw;
      ctx.fillStyle = '#5B6280'; ctx.beginPath(); ctx.roundRect(-130, -40, 260, 110, 14); ctx.fill();
      ctx.strokeStyle = '#3B4060'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-130 + i * 65, -40); ctx.lineTo(-130 + i * 65, 70); ctx.stroke(); }
      ctx.fillStyle = '#7A5A3A'; ctx.fillRect(-120, -150, 16, 110); ctx.fillRect(104, -150, 16, 110); ctx.fillRect(-140, -160, 280, 20);
      const ct = clamp((t - w.well!.start) / 0.8);
      ctx.fillStyle = '#FFC94A'; ctx.beginPath(); ctx.arc(lerp(-40, 160, ct), -60 - Math.sin(ct * Math.PI) * 160 + ct * 40, 18, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the draft slide and the polish
    const kd = clamp((t - w.rough!.start + 0.1) / 0.3);
    if (kd > 0) {
      const pol = ease.inOutCubic(clamp((t - w.polish!.start) / 0.8));
      setWorld(ctx, c, 0, 0, 1, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
      slide(ctx, c, 480, 20, 680, { kind: 'chart', title: 'Q3 Results', accent: ORANGE, a: kd, rot: lerp(0.06, 0, pol), build: 0.5 + 0.5 * pol, seed: 9 });
      // DRAFT stamp
      setWorld(ctx, c, 480, 20, 1 + (1 - kd) * 0.5, -0.25);
      ctx.globalAlpha = kd * (1 - pol);
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 10; ctx.strokeRect(-200, -70, 400, 140);
      ctx.font = font(HEAD, 100); ctx.fillStyle = ORANGE; ctx.textAlign = 'center'; ctx.fillText('DRAFT', 0, 36); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (t > w.polish!.start - 0.3) pointer(ctx, c, lerp(780, 360, clamp((t - w.polish!.start + 0.3) / 0.4)), lerp(320, 60, clamp((t - w.polish!.start + 0.3) / 0.4)), clamp((t - w.polish!.start) / 0.4));
      sparkles(ctx, c, 480, 20, t, w.yourself!.start, 22, 11, PEACH);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'THE CATCH', -370, -330, 100, t, this.ctx.start + 0.02, { from: '#FFFFFF', to: '#FF5B3A' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.rough!.start, 0.015) }; }
}
