// 12 PRICE: "The app is free. Generating isn't: bring your own subscriptions, or buy credits, from 8 dollars a
// month billed yearly."
// Two cinema tickets. ADMIT ONE · THE APP · FREE tears in on "free". The second, GENERATING, prints its lines:
// BRING YOUR OWN SUBSCRIPTIONS, or CREDITS FROM $8/MO, with the fine print *BILLED YEARLY ($96).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Cinema, SERIF, HEAD, MONOB, AMBER, IVORY, clamp, ease, ob } from '@ep/cinema';

function ticket(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, rot: number, a: number, col: string, lines: [string, string, number][]) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.85 + 0.15 * ob(clamp(a * 1.2)), rot);
  ctx.globalAlpha = clamp(a);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-360, -170); ctx.lineTo(360, -170); ctx.arc(360, -170, 0, 0, 0); ctx.lineTo(360, -30); ctx.arc(360, 0, 30, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(360, 170); ctx.lineTo(-360, 170); ctx.lineTo(-360, 30); ctx.arc(-360, 0, 30, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(20,20,22,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(220, -160); ctx.lineTo(220, 160); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#141416'; ctx.textAlign = 'left';
  // each baseline sits one cap height (≈0.8 em) plus a gap below the previous one
  let yy = -130;
  lines.forEach(([text, f, size], i) => { yy += size * 0.8 + (i ? 22 : 0); ctx.font = font(f, size); ctx.fillText(text, -320, yy); });
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Price extends Cinema {
  override scene = 4;
  build() {
    this.take('The app is free', ['app', 'free.', 'Generating', 'bring', 'subscriptions,', 'credits,', '8', 'yearly.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.03, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    ticket(ctx, c, -430, -60, -0.06, clamp((t - this.ctx.start - 0.05) / 0.3), IVORY, [['ADMIT ONE', MONOB, 30], ['THE APP', HEAD, 64], ['FREE', SERIF, 120]]);
    const g = clamp((t - w.generating!.start) / 0.3);
    const lines: [string, string, number][] = [['GENERATING', MONOB, 30]];
    if (t > w.bring!.start) lines.push(['BRING YOUR OWN SUBS', HEAD, 50]);
    if (t > w.credits!.start) lines.push(['OR CREDITS', HEAD, 50]);
    if (t > w['8']!.start) lines.push(['FROM $8/MO*', SERIF, 80]);
    ticket(ctx, c, 430, 40, 0.05, g, AMBER, lines);
    if (t > w.yearly!.start - 0.1) {
      setWorld(ctx, c, 430, 260, 1, 0.05);
      ctx.globalAlpha = clamp((t - w.yearly!.start + 0.1) / 0.3); ctx.font = font(MONOB, 22); ctx.fillStyle = IVORY; ctx.textAlign = 'center';
      ctx.fillText('* BILLED YEARLY ($96) · BASIC, 1,000 CREDITS A MONTH', 0, 0);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void ease;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.free!.start, 0.015) }; }
}
