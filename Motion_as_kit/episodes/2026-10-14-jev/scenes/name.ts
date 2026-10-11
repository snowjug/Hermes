// 03 NAME: "It's called Jev, from a San Francisco lab called TypeSafe, and it's gone viral."
// A giant "Jev" rises out of its mask with the red dot as its full stop. The right column fills like a
// masthead: TYPESAFE AI · SAN FRANCISCO, the lab's name, and on "gone viral" a red curve shoots up the grid.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { measure, font } from '@engine/type';
import { Swiss, ob, kinetic, dot, label, rule, HEAD, BOLD, RED, INK, clamp, ease, lerp } from '@ep/swiss';

export default class Name extends Swiss {
  override section = 3;
  override wipeOut = '#121212';
  build() {
    this.take("It's called Jev", ['called', 'Jev,', 'San', 'lab', 'TypeSafe,', 'gone', 'viral.']);
    const K = this.cam;
    K.key(this.ctx.start, -80, 0, 1.06, 0);
    K.key(this.w.san!.start, -40, 0, 1.03, 0);
    K.key(this.ctx.end, 30, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the viral curve
    const vk = ease.inOutCubic(clamp((t - w.gone!.start + 0.05) / 0.7));
    if (vk > 0) {
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      const N = 60;
      let ex = 0, ey = 0;
      for (let i = 0; i <= N * vk; i++) {
        const u = i / N, x = lerp(240, 860, u), y = 300 - 560 * Math.pow(u, 3.2) + 14 * Math.sin(u * 20) * (1 - u);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        ex = x; ey = y;
      }
      ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      dot(ctx, c, ex, ey, 16, { pulse: (t * 1.4) % 1 });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    label(ctx, c, "IT'S CALLED", -820, -230, { a: clamp((t - w.called!.start) / 0.2), rule: true });
    const t0 = w.jev!.start - 0.06;
    kinetic(ctx, c, 'Jev', -830, 150, 400, t, t0);
    // the red full stop is the decision dot
    const jw = measure('Jev', HEAD, 400);
    const dk = ob(clamp((t - t0 - 0.3) / 0.35));
    dot(ctx, c, -830 + jw + 52, 118, 40 * dk);
    // masthead column
    rule(ctx, c, 120, -300, 120, 120, ease.outCubic(clamp((t - w.san!.start + 0.1) / 0.4)), { w: 2 });
    label(ctx, c, 'AN AI LAB · SAN FRANCISCO', 170, -260, { a: clamp((t - w.san!.start) / 0.2), size: 26 });
    if (t > w.typesafe!.start - 0.1) {
      kinetic(ctx, c, 'TypeSafe', 168, -150, 110, t, w.typesafe!.start - 0.1, { f: BOLD });
    }
    label(ctx, c, 'GONE VIRAL', 640, -280, { a: clamp((t - w.viral!.start) / 0.2), col: RED, size: 30 });
    void INK; void font;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.jev!.start, 0.02) }; }
}
