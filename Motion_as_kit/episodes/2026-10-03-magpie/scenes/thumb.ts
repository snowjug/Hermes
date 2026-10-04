// THUMB: the video's thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// ANY AGENT. / ANY MODEL. in heavy Archivo, and the idea underneath it: CODEX → magpie → DEEPSEEK.
import { type LineBatch } from '@engine/lines';
import { Plate, ARCH, drawNode, packets, chip, slam, pt, rgba, type Cam } from '@kit/_mp';

export default class Thumb extends Plate {
  build() {
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1, 0);
    this.showPen = false;
  }

  gridOpts() { return { ink: 1.3 }; }

  drawUI(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10; // everything settled
    slam(ctx, c, 'ANY AGENT.', -860, -170, 214, t, 0, { wt: 900, col: 'bone' });
    slam(ctx, c, 'ANY MODEL.', -860, 60, 214, t, 0, { wt: 900, col: 'signal' });
    chip(ctx, c, 'FREE  ·  OPEN SOURCE  ·  15 MB', 470, -400, { size: 30, border: rgba('signal', 0.9), col: rgba('bone', 1) });
    const y = 300;
    drawNode(ctx, c, -600, y, 'CODEX', '', { w: 400, h: 150, size: 46 });
    drawNode(ctx, c, 0, y, 'MAGPIE', '', { w: 360, h: 150, size: 46, hot: 1 });
    drawNode(ctx, c, 600, y, 'DEEPSEEK', '', { w: 420, h: 150, size: 46 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = rgba('bone', 0.8); ctx.lineWidth = 3;
    for (const [a, b] of [[-400, -180], [180, 390]]) { ctx.beginPath(); ctx.moveTo(960 + a!, 540 + y); ctx.lineTo(960 + b!, 540 + y); ctx.stroke(); }
  }

  drawFX(X: LineBatch, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    packets(X, c, [pt(-400, 300), pt(-180, 300)], t, { t0: t - 3, speed: 300, gap: 0.24, size: 1.6 });
    packets(X, c, [pt(180, 300), pt(390, 300)], t, { t0: t - 3, speed: 300, gap: 0.24, size: 1.6 });
  }

  postFX() { return { bloom: 0.8, vignette: 0.5, grain: 0.04 }; }
}
void ARCH;
