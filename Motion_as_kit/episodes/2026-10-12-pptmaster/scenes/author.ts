// AUTHOR: "It was built by a finance professional who was tired of AI slides he couldn't edit."
// A finance slide (a stock-style line chart) and a profile card: BUILT BY HUGO HE · FINANCE PROFESSIONAL. On
// "couldn't edit" a flat image-slide with a padlock is shown, the padlock breaks open, and the slide's parts
// come apart into editable pieces with handles.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, handles, headline, pill, HEAD, BODY, WHITE, SOFT, ORANGE, TEAL, VIOLET, clamp, ease } from '@ep/keynote';

export default class Author extends Keynote {
  build() {
    this.take('It was built by', ['built', 'finance', 'professional', 'tired', 'slides', "couldn't", 'edit.']);
    const K = this.cam;
    K.key(this.ctx.start, -200, 0, 1.02, 0);
    K.key(this.w.tired!.start - 0.1, 200, 0, 1.0, 0);
    K.key(this.ctx.end, 220, 0, 1.02, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a0 = clamp((t - this.ctx.start) / 0.25);
    // finance chart card
    glass(ctx, c, -900, -230, 640, 400, { a: a0 });
    setWorld(ctx, c, -900, -230, 1, 0); ctx.globalAlpha = a0;
    ctx.font = font(BODY, 26); ctx.fillStyle = SOFT; ctx.fillText('INVESTMENT REVIEW', 40, 56);
    const k = ease.outCubic(clamp((t - this.ctx.start) / 1.2));
    ctx.strokeStyle = TEAL; ctx.lineWidth = 6; ctx.beginPath();
    for (let i = 0; i <= 40 * k; i++) { const x = 40 + i * 14, y = 300 - i * 4 - Math.sin(i * 0.7) * 26; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    pill(ctx, c, 'BUILT BY HUGO HE · FINANCE PROFESSIONAL', -580, 240, 28, { a: clamp((t - w.finance!.start) / 0.2), bg: 'rgba(30,36,72,0.95)' });
    // the flat slide with a padlock that breaks open
    const ks = clamp((t - w.slides!.start + 0.1) / 0.25);
    if (ks > 0) {
      const open = ease.outBack(clamp((t - w.edit!.start) / 0.4));
      const parts: [number, number, number, number, string][] = [[-260, -150, 520, 70, ORANGE], [-260, -50, 240, 180, VIOLET], [20, -50, 240, 180, TEAL]];
      setWorld(ctx, c, 420, 0, 1, 0); ctx.globalAlpha = ks;
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-300, -190, 600, 340, 12); ctx.fill();
      parts.forEach(([x, y, pw, ph, col], i) => { ctx.fillStyle = col; ctx.globalAlpha = ks * (0.85 + 0.15 * open); ctx.fillRect(x + (i - 1) * 40 * open, y - 20 * open * (i === 0 ? 1 : 0), pw, ph); });
      ctx.globalAlpha = ks * (1 - open);
      // padlock
      ctx.fillStyle = '#1C2330'; ctx.beginPath(); ctx.roundRect(-60, -10, 120, 100, 14); ctx.fill();
      ctx.strokeStyle = '#1C2330'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, -10, 42, Math.PI, 0); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (open > 0.3) parts.forEach(([x, y, pw, ph], i) => handles(ctx, c, 420 + x + (i - 1) * 40 * open, y - 20 * open * (i === 0 ? 1 : 0), pw, ph, clamp(open * 2 - 0.6)));
      if (t > w.couldnt!.start && open < 0.5) pill(ctx, c, 'FLAT IMAGE · CAN\'T EDIT', 420, 220, 26, { a: 1 - open * 2, bg: 'rgba(226,52,45,0.9)' });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'WHY IT EXISTS', -200, -360, 80, t, this.ctx.start + 0.05, { from: '#FFFFFF', to: '#C9C2FF' });
    void HEAD; void WHITE;
  }
}
