// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// The title already says "PS5 games on PC with no emulator", so the thumbnail adds what it doesn't: the PS5
// photo is pinned to a laptop with red string, GAME.EXE in ransom letters says the game became a Windows
// program, and a 60 FPS sticker says it runs. Two words and a number, and room around them.
import { drawCut, pin, stringPts, drawString, ransom, pt } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, badge } from '@ep/kit';

export default class Thumb extends Desk {
  override uses = ['ps5', 'laptop'];

  build() {
    this.cam.key(this.ctx.start, 0, 0, 1, 0);
  }
  override captionLines() { return []; }

  override desk(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    drawCut(ctx, c, this.cuts.ps5!, -540, 190, t, { t0: 0, scale: 0.68, rot: -0.08, seed: 2 });
    drawCut(ctx, c, this.cuts.laptop!, 470, 230, t, { t0: 0, scale: 0.78, rot: 0.05, seed: 6 });
    const a = pt(-330, 20), b = pt(440, 30);
    drawString(ctx, c, stringPts(a, b, 0.12), 1, { width: 6 });
    pin(ctx, c, a.x, a.y, t, -1);
    pin(ctx, c, b.x, b.y, t, -1);
    badge(ctx, c, 770, -10, 135, '60', 'FPS', t, 0);
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    const size = 210;
    const w = ransom(ctx, c, 'GAME.EXE', 0, 0, size, t, 0, 0.1, 7, 0);
    ransom(ctx, c, 'GAME.EXE', -w / 2, -292, size, t, 0, 0.1, 7);
  }
}
