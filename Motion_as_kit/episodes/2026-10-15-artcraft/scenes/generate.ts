// 08 GENERATE: "Then you generate, and your posed mannequins guide where the characters stand."
// The clapper claps scene 3 open on the shot through the virtual camera: grey blocking in a 16:9 frame. On
// "generate" the GENERATE button presses and an amber scan line paints the shot: window light, haze, and the
// characters as rim-lit silhouettes. On "guide where the characters stand" the mannequins' blocking is laid over
// them in dashed outline: they stand exactly on their marks. (An illustration, labelled.)
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts } from '@kit/_cad3d';
import { Cinema, room, figures, paintShot, mono, MONOB, AMBER, IVORY, clamp, ease, ob } from '@ep/cinema';
import { POV, cast } from '@ep/set';

export default class Generate extends Cinema {
  override slateIn = true;
  override scene = 3;
  build() {
    this.take('Then you generate', ['generate,', 'posed', 'mannequins', 'guide', 'characters', 'stand.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 0.92, 0);
    K.key(this.ctx.end, 0, 0, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const fs = cast(1);
    const W2 = 1440, H2 = 810;
    setWorld(ctx, c, 0, -20, 1, 0);
    ctx.fillStyle = '#111114'; ctx.fillRect(-W2 / 2, -H2 / 2, W2, H2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the blocking
    const P = drawParts(ctx, c, 0, -20, POV, [{ mesh: room() }, { mesh: figures(fs) }], { shadow: 1 });
    // the paint
    const rv = clamp((t - w.generate!.start - 0.15) / 0.8);
    if (rv > 0) paintShot(ctx, c, 0, -20, W2, H2, P, fs, { reveal: rv, t });
    // the blocking laid over it, dashed
    const gk = clamp((t - w.guide!.start) / 0.3) * (1 - clamp((t - w.stand!.end - 0.3) / 0.4));
    if (gk > 0) drawParts(ctx, c, 0, -20, POV, [{ mesh: figures(fs), wire: 1, edge: AMBER, a: gk * 0.9 }], { shadow: 0, edgeW: 1.4 });
    // frame
    setWorld(ctx, c, 0, -20, 1, 0);
    ctx.strokeStyle = 'rgba(241,236,226,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(-W2 / 2, -H2 / 2, W2, H2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the GENERATE button, pressed on the word
    const ba = clamp((t - this.ctx.start - 0.3) / 0.25) * (1 - clamp((t - w.generate!.end - 0.4) / 0.3));
    if (ba > 0) {
      const press = t > w.generate!.start && t < w.generate!.start + 0.12 ? 0.9 : 1;
      setWorld(ctx, c, 0, 330, press * (0.9 + 0.1 * ob(ba)), 0);
      ctx.globalAlpha = ba; ctx.fillStyle = t > w.generate!.start ? AMBER : 'rgba(245,179,66,0.2)'; ctx.strokeStyle = AMBER; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-170, -42, 340, 84, 42); ctx.fill(); ctx.stroke();
      ctx.fillStyle = t > w.generate!.start ? '#141416' : AMBER; ctx.font = font(MONOB, 32); ctx.textAlign = 'center'; ctx.fillText('GENERATE', 0, 11);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    mono(ctx, c, 'ILLUSTRATION · PAINTED FROM THE BLOCKING', 700, 370, { a: clamp((t - w.generate!.start - 0.6) / 0.3), align: 'right', size: 18, col: IVORY });
    mono(ctx, c, 'POSED MANNEQUINS → WHERE THEY STAND', -700, -390, { a: clamp((t - w.guide!.start) / 0.3), size: 22, col: AMBER });
    void ease;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.generate!.start, 0.02) }; }
}
