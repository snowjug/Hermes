// RIP: "AnyPS5 doesn't pretend."
// The same laptop wearing its PS5 mask. ANYPS5 slams over the top; on "doesn't" the mask is torn off
// and flies away, the tape with it; on "pretend." a red NO EMULATOR rubber stamp lands on the bare
// laptop.
import { drawCut, tape, prog, ease, rgba, setWorld, font, F, springStep } from '@kit/_collage';
import { makeStamp, drawStamp, noise1 } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const LP = { x: 330, y: 120, s: 0.78 };

export default class Rip extends Desk {
  override uses = ['laptop', 'ps5'];
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take("doesn't pretend", ['AnyPS5', "doesn't", 'pretend.']);
    this.stamp = makeStamp('NO EMULATOR', 'HOW ANYPS5 WORKS', 'THE GAME RUNS AS A NATIVE PROGRAM', HEX.signal, 5);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 150, -20, 0.97, -0.004);
    K.key(w.doesnt!.start, 200, 0, 1.02, 0, ease.outCubic);
    K.key(w.pretend!.start + 0.1, 240, 40, 1.1, 0.012, ease.outExpo);
    K.key(this.ctx.end, 240, 40, 1.12, 0.012, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.laptop!, LP.x, LP.y, t, { t0: this.ctx.start - 1, scale: LP.s, rot: 0.03, seed: 3 });
    const tr = w.doesnt!.start;
    drawCut(ctx, c, this.cuts.ps5!, LP.x + 20, LP.y - 120, t, { t0: this.ctx.start - 1, scale: 0.42, rot: -0.12, seed: 9, t1: tr, flyDir: -1.9 });
    if (t < tr + 0.3) {
      const k = ease.inCubic(prog(t, tr, tr + 0.4));
      tape(ctx, c, LP.x - 120 - 900 * k, LP.y - 300 - 1300 * k, 140, -0.7 - k, { seed: 21 });
      tape(ctx, c, LP.x + 170 - 600 * k, LP.y - 290 - 1500 * k, 140, 0.6 + k, { seed: 22 });
    }
    if (this.stamp) drawStamp(ctx, c, this.stamp, LP.x, LP.y - 40, t, w.pretend!.start, 0.5, -0.1, 0.95);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.anyps5!.start;
    if (t < t0 - 0.05) return;
    const sp = springStep(t - t0 + 0.05, 3.2, 0.45);
    setWorld(ctx, c, 120, -330, 0.7 + 0.3 * sp, -0.04 + (1 - sp) * 0.2);
    ctx.font = font(F.archivo(87.5, 900), 210);
    ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center';
    ctx.fillText('AnyPS5', 0, 60);
    ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override pfx(t: number) {
    const w = this.w;
    const hit = t > w.pretend!.start ? Math.pow(0.5, (t - w.pretend!.start) / 0.07) : 0;
    const rip = t > w.doesnt!.start ? Math.pow(0.5, (t - w.doesnt!.start) / 0.1) : 0;
    return { zoom: 1 + 0.03 * hit + 0.01 * rip, shake: [9 * hit * noise1(t * 60, 1), 9 * hit * noise1(t * 60, 2)] as [number, number] };
  }
}
