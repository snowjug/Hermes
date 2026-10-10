// HOOK: "Your presentation is due tomorrow. You have a forty-page PDF, and zero slides."
// Frame one: YOUR PRESENTATION in big gradient type. On "due tomorrow" a red alarm pill (DUE TOMORROW,
// 9:00 AM) shakes in and the stage tints warm. On "forty-page PDF" the PDF stack drops in on the left with
// 40 PAGES; on "zero slides" an empty dashed slide on the right, a giant 0, and a SLIDES label.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, headline, pill, pdf, flyIn, HEAD, BODY, ORANGE, WHITE, SOFT, clamp, ease } from '@ep/keynote';

export default class Hook extends Keynote {
  build() {
    this.take('Your presentation is due', ['presentation', 'due', 'tomorrow.', 'forty-page', 'PDF,', 'zero', 'slides.']);
    const w = this.w;
    const K = this.cam;
    K.key(0, 0, -60, 1.08, 0);
    K.key(w.fortypage!.start - 0.1, 0, -20, 1.0, 0);
    K.key(this.ctx.end, 0, -10, 0.97, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // a big clock racing toward the deadline, centre stage until the PDF arrives, then up into the corner
    {
      const mv = ease.inOutCubic(clamp((t - w.fortypage!.start + 0.3) / 0.5));
      const cx = 0 + 700 * mv, cy = 60 - 330 * mv, s = 1 - 0.62 * mv;
      setWorld(ctx, c, cx, cy, s * (0.9 + 0.1 * ease.outBack(clamp(t / 0.3))), 0);
      ctx.save(); ctx.shadowColor = 'rgba(255,91,58,0.6)'; ctx.shadowBlur = 50;
      ctx.fillStyle = 'rgba(244,245,255,0.96)'; ctx.beginPath(); ctx.arc(0, 0, 190, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 190, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#141833';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.lineWidth = i % 3 ? 4 : 9; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 150, Math.sin(a) * 150); ctx.lineTo(Math.cos(a) * 172, Math.sin(a) * 172); ctx.stroke(); }
      const spin = t * 5.5;
      ctx.lineCap = 'round'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(spin / 12) * 90, -Math.cos(spin / 12) * 90); ctx.stroke();
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(spin) * 140, -Math.cos(spin) * 140); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#141833'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the PDF
    const kp = flyIn(t, w.fortypage!.start - 0.1);
    if (kp > 0) {
      pdf(ctx, c, -470, 60, 0.95 * (0.6 + 0.4 * kp), { a: clamp(kp * 2), rot: -0.06, spread: 0.2 * ease.outCubic(clamp((t - w.pdf!.start) / 0.4)) });
      pill(ctx, c, '40 PAGES', -470, 330, 34, { a: clamp((t - w.pdf!.start) / 0.2), bg: 'rgba(226,52,45,0.9)', stroke: 'rgba(255,255,255,0.4)' });
    }
    // the empty slide
    const ks = flyIn(t, w.zero!.start - 0.15);
    if (ks > 0) {
      setWorld(ctx, c, 470, 60, 0.7 + 0.3 * ks, 0.03);
      ctx.globalAlpha = clamp(ks * 2);
      ctx.setLineDash([22, 16]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(244,245,255,0.55)';
      ctx.beginPath(); ctx.roundRect(-320, -180, 640, 360, 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = font(HEAD, 260); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText('0', 0, 90);
      ctx.font = font(BODY, 40); ctx.fillStyle = SOFT; ctx.fillText('SLIDES', 0, 150); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const shift = clamp((t - w.fortypage!.start + 0.2) / 0.3);
    headline(ctx, c, 'YOUR PRESENTATION', 0, -320 - 20 * shift, 118 - 20 * shift, t, 0, { from: '#FFFFFF', to: '#D9D3FF' });
    const kd = clamp((t - w.due!.start) / 0.15);
    if (kd > 0) {
      const shake = Math.sin(t * 60) * 6 * Math.exp(-(t - w.due!.start) * 4);
      pill(ctx, c, 'DUE TOMORROW · 9:00 AM', shake, -200 - 20 * shift, 40, { a: kd, bg: ORANGE, stroke: 'rgba(255,255,255,0.5)' });
    }
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.due!.start, 0.02) * this.punch(t, w.zero!.start, 0.02) };
  }
}
