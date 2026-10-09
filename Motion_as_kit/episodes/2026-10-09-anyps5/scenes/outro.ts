// OUTRO: "That's today's tool. There's a new one every day."
// The whole desk from above: every cutout from the video lying where it landed, the name in big type
// with the address under it, and the sign-off on a tag. The camera pulls back slowly.
import { drawCut, tag, prog, ease, rgba, setWorld, font, F, springStep } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const LAYOUT: [string, number, number, number, number][] = [
  ['ps5', -1180, -420, 0.42, -0.12], ['board', 1150, -380, 0.5, 0.08], ['dualsense', -1250, 380, 0.4, 0.1],
  ['gtx', 1180, 420, 0.4, -0.06], ['tux', -620, 560, 0.34, -0.05], ['laptop', 640, 580, 0.36, 0.06],
  ['reader', -1500, 20, 0.36, 0.05], ['press', 1520, 40, 0.38, -0.04],
];

export default class Outro extends Desk {
  override uses = ['ps5', 'board', 'dualsense', 'gtx', 'tux', 'laptop', 'reader', 'press'];
  override wipeIn = true;
  override wipeFrom: 'left' | 'right' = 'left';

  build() {
    this.take("That's today's tool", [['thats', "That's"], 'tool.', ['theres', "There's"], 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 20, 0.86, 0);
    K.key(this.ctx.end, 0, 40, 0.62, 0.01, ease.inOutCubic);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    LAYOUT.forEach(([n, x, y, s, r], i) => drawCut(ctx, c, this.cuts[n]!, x, y, t, { t0: this.ctx.start - 0.6 + i * 0.05, scale: s, rot: r, seed: 120 + i }));
    const t0 = this.ctx.start + 0.2;
    const sp = springStep(t - t0, 2.6, 0.5);
    setWorld(ctx, c, 0, -40, 0.7 + 0.3 * Math.max(0, sp), -0.03);
    ctx.globalAlpha = prog(t, t0, t0 + 0.15);
    ctx.font = font(F.archivo(87.5, 900), 230); ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center';
    ctx.fillText('AnyPS5', 0, 0);
    ctx.font = font(F.mono(600), 40); ctx.fillStyle = rgba('acid', 1); ctx.fillText('github.com/boykopovar/AnyPS5', 0, 80);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    tag(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 210, 34, { a: prog(t, w.theres!.start, w.theres!.start + 0.2), rot: -0.02, seed: 131, col: '#D2302A' });
  }

  override pfx(t: number) {
    return { fade: prog(t, this.ctx.end - 0.5, this.ctx.end, ease.inCubic) * 0.0 };
  }
}
