// 06 EMAIL: "An email comes in: billing, technical or account? Jev picks one, with its confidence."
// An envelope slides in on the left. Three lanes on the right, BILLING / TECHNICAL / ACCOUNT, appear on their
// words; on "picks" the bars fill at once (0.07 / 0.88 / 0.05, an example) and the red dot leaves the envelope
// for the TECHNICAL lane; on "confidence" its 0.88 is ringed.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Swiss, ob, kinetic, dot, label, bar, rule, INK, RED, clamp, ease, lerp } from '@ep/swiss';

const LANES: [string, string, number][] = [['BILLING', 'billing', 0.07], ['TECHNICAL', 'technical', 0.88], ['ACCOUNT', 'account', 0.05]];

function envelope(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s: number, a: number) {
  setWorld(ctx, c, x, y, s, -0.05);
  ctx.globalAlpha = a; ctx.fillStyle = '#FBF9F5'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.fillRect(-150, -100, 300, 200); ctx.strokeRect(-150, -100, 300, 200);
  ctx.beginPath(); ctx.moveTo(-150, -100); ctx.lineTo(0, 20); ctx.lineTo(150, -100); ctx.stroke();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Email extends Swiss {
  override section = 6;
  override label = 'EXAMPLE';
  build() {
    this.take('An email comes in', ['email', 'billing,', 'technical', 'account?', 'Jev', 'picks', 'confidence.']);
    const K = this.cam;
    K.key(this.ctx.start, -60, 0, 1.05, 0);
    K.key(this.w.picks!.start, 0, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 20, 0, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const ek = ease.outCubic(clamp((t - w.email!.start + 0.15) / 0.45));
    envelope(ctx, c, lerp(-1200, -560, ek), 0, 1.0, clamp(ek * 2));
    const fill = clamp((t - w.picks!.start) / 0.35);
    LANES.forEach(([name, key, v], i) => {
      const y = -170 + i * 170;
      const a = clamp((t - w[key]!.start + 0.05) / 0.2);
      bar(ctx, c, 30, y, 560, 26, v, fill, { a, label: name, size: 34 });
      rule(ctx, c, -340, 0, -250, y, ease.inOutCubic(clamp((t - w.picks!.start - 0.05) / 0.35)) * a * (i === 1 ? 1 : 0.0), { col: RED, w: 4 });
    });
    // the dot leaves the envelope for TECHNICAL
    const dk = ease.inOutCubic(clamp((t - w.picks!.start) / 0.45));
    if (dk > 0) dot(ctx, c, lerp(-410, -250, dk), 0, 18);
    // the ring on 0.88
    const rk = clamp((t - w.confidence!.start) / 0.3);
    if (rk > 0) {
      setWorld(ctx, c, 680, 0, 1, 0);
      ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -10, 80 * ob(rk), 46 * ob(rk), -0.08, 0, Math.PI * 2); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'AN EMAIL COMES IN.', -840, -300, 90, t, w.email!.start - 0.15);
    label(ctx, c, 'CONFIDENCE', 620, 70, { a: clamp((t - w.confidence!.start) / 0.2), col: RED, size: 26 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.picks!.start, 0.015) }; }
}
