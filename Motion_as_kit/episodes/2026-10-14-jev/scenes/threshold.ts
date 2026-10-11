// 07 THRESHOLD: "If it's sure, your software acts. If not, a person takes over."
// A confidence axis from 0 to 1 with YOUR THRESHOLD at 0.80. The first case lands at 0.88, past the line: an
// arrow up to AUTO, which ticks. The second lands at 0.52: an arrow down to a person, HUMAN REVIEW.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, kinetic, dot, label, rule, MONOB, BOLD, INK, RED, GREY, clamp, ease, lerp, TAU } from '@ep/swiss';

const X0 = -700, X1 = 700;
const ax = (v: number) => lerp(X0, X1, v);

export default class Threshold extends Swiss {
  override section = 7;
  override label = 'CONFIDENCE';
  override wipeOut = '#121212';
  build() {
    this.take("If it's sure", ['sure,', 'software', 'acts.', 'not,', 'person', 'over.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.03, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a0 = ease.outCubic(clamp((t - this.ctx.start - 0.05) / 0.5));
    rule(ctx, c, X0, 0, X1, 0, a0, { w: 4 });
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.globalAlpha = a0; ctx.font = font(MONOB, 26); ctx.fillStyle = INK; ctx.textAlign = 'center';
    for (const v of [0, 0.5, 1]) { ctx.fillRect(ax(v) - 2, -14, 4, 28); ctx.fillText(v.toFixed(1), ax(v), 54); }
    // the threshold
    ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.setLineDash([12, 9]);
    ctx.beginPath(); ctx.moveTo(ax(0.8), -230); ctx.lineTo(ax(0.8), 230); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    label(ctx, c, 'YOUR THRESHOLD 0.80', ax(0.8) + 16, -200, { a: a0, col: RED, size: 22 });
    // case 1: 0.88, acts
    const k1 = ob(clamp((t - w.sure!.start + 0.1) / 0.35));
    if (k1 > 0) {
      dot(ctx, c, ax(0.88), lerp(-200, 0, k1), 22, { pulse: clamp((t - w.sure!.end) / 0.6) });
      const up = ease.inOutCubic(clamp((t - w.software!.start) / 0.35));
      rule(ctx, c, ax(0.88), -30, ax(0.88), -210, up, { col: INK, w: 4 });
      if (up > 0.95) {
        gear(ctx, c, ax(0.88) - 120, -270, t, clamp((t - w.acts!.start + 0.1) / 0.2));
        label(ctx, c, 'AUTO ✓', ax(0.88) - 40, -258, { a: clamp((t - w.acts!.start) / 0.2), size: 32, col: INK });
      }
    }
    // case 2: 0.52, a person
    const k2 = ob(clamp((t - w.not!.start + 0.05) / 0.35));
    if (k2 > 0) {
      dot(ctx, c, ax(0.52), lerp(200, 0, k2), 22, { col: GREY });
      const dn = ease.inOutCubic(clamp((t - w.person!.start + 0.1) / 0.35));
      rule(ctx, c, ax(0.52), 30, ax(0.52), 200, dn, { col: INK, w: 4 });
      if (dn > 0.95) {
        person(ctx, c, ax(0.52), 290, clamp((t - w.person!.start) / 0.2));
        label(ctx, c, 'HUMAN REVIEW', ax(0.52) + 70, 300, { a: clamp((t - w.over!.start + 0.1) / 0.2), size: 30, col: INK });
      }
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'SURE? ACT.', -840, -300, 100, t, w.sure!.start - 0.15, { hi: ['ACT.'] });
    kinetic(ctx, c, 'NOT SURE? ASK.', -840, 360, 70, t, w.not!.start - 0.1, { hi: ['ASK.'] });
    void BOLD;
  }
}

function gear(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, t: number, a: number) {
  if (a <= 0) return;
  setWorld(ctx, c, x, y, 1, t * 2);
  ctx.globalAlpha = a; ctx.fillStyle = INK;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) { const ang = (i / 16) * TAU, r = i % 2 ? 30 : 38; ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#EFEBE3'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function person(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, a: number) {
  if (a <= 0) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a; ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(0, -40, 26, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-40, -8, 80, 70, [36, 36, 6, 6]); ctx.fill();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
