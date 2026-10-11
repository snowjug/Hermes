// 13 CLOSED: "And it's closed: API only, and those numbers are the company's own."
// Still ink. A padlock snaps shut; API ONLY rises; WEIGHTS: NOT RELEASED as a footnote. On "those numbers"
// the two claims come back small with an asterisk, and on "own" the asterisk turns red: * THE COMPANY'S OWN TEST.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, kinetic, label, HEAD, CREAM, RED, clamp, ease, TAU } from '@ep/swiss';

export default class Closed extends Swiss {
  override dark = true;
  override section = 13;
  override label = 'CLOSED';
  override wipeOut = RED;
  build() {
    this.take("And it's closed", ['closed:', 'API', 'only,', 'numbers', "company's", 'own.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.03, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const lk = clamp((t - w.closed!.start + 0.15) / 0.3);
    if (lk > 0) {
      const shut = ob(clamp((t - w.closed!.start) / 0.3));
      setWorld(ctx, c, -560, 40, 1, 0);
      ctx.globalAlpha = lk;
      ctx.strokeStyle = CREAM; ctx.lineWidth = 26; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(0, -70 - 40 * (1 - shut), 85, Math.PI, 0); ctx.lineTo(85, -70 - 40 * (1 - shut) + 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-85, -70 - 40 * (1 - shut)); ctx.lineTo(-85, -30); ctx.stroke();
      ctx.fillStyle = RED; ctx.fillRect(-140, -40, 280, 230);
      ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.arc(0, 50, 24, 0, TAU); ctx.fill(); ctx.fillRect(-9, 50, 18, 60);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'API ONLY.', -120, -60, 170, t, w.api!.start - 0.08, { col: CREAM });
    label(ctx, c, 'WEIGHTS: NOT RELEASED · NO SELF-HOSTING', -110, 20, { a: clamp((t - w.only!.start) / 0.3), col: '#8C877E', size: 24 });
    const nk = clamp((t - w.numbers!.start + 0.1) / 0.25);
    if (nk > 0) {
      setWorld(ctx, c, -110, 200, 1, 0);
      ctx.globalAlpha = nk; ctx.font = font(HEAD, 90); ctx.fillStyle = CREAM; ctx.fillText('193.6× · 444.6×', 0, 0);
      const own = clamp((t - w.own!.start) / 0.15);
      ctx.fillStyle = own > 0.5 ? RED : CREAM; ctx.fillText('*', 790, -10);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      label(ctx, c, "* THE COMPANY'S OWN TEST, NOT AN INDEPENDENT BENCHMARK", -110, 270, { a: clamp((t - w.companys!.start) / 0.3), col: RED, size: 22 });
    }
  }
}
