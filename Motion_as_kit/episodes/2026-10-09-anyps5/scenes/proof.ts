// PROOF: "The only game on its list so far is Dreaming Sarah, a 2D platformer: 60 frames per second on a
// GTX 1050 Ti, 36 on a laptop's Intel graphics."
// The project's compatibility list typed out on a sheet (one row). The game's name is ringed in marker.
// On "60" the graphics card photo lands with a red 60 FPS sticker; on "36" the laptop lands with a blue
// 36 FPS one.
import { drawCut, tag, ring, prog, ease } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, doc, badge } from '@ep/kit';

const SHEET = { x: -900, y: -420, w: 900, h: 560 };
const GPU = { x: 420, y: -190, s: 0.5 };
const LAP = { x: 520, y: 250, s: 0.42 };

export default class Proof extends Desk {
  override uses = ['gtx', 'laptop'];

  build() {
    this.take('The only game on its list', ['only', 'list', 'Dreaming', 'Sarah,', '2D', 'platformer:', '60', 'frames', 'GTX', '1050', '36', "laptop's", 'Intel', 'graphics.']);
    const w = this.w;
    this.plot.add(ring(SHEET.x + 280, SHEET.y + 119, 275, 42, 9), w.dreaming!.start, w.sarah!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 6 });
    const K = this.cam;
    K.key(this.ctx.start, -420, -140, 1.12, -0.008);
    K.key(w.platformer!.end, -300, -120, 1.06, -0.004, ease.inOutCubic);
    K.key(w['60']!.start + 0.1, 60, -40, 0.94, 0.004, ease.inOutCubic);
    K.key(w['36']!.start, 120, 40, 0.92, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, 130, 50, 0.94, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    doc(ctx, c, SHEET.x, SHEET.y, SHEET.w, SHEET.h, 'Tested compatibility', [
      'Dreaming Sarah    PPSA02929',
      'Windows   In game, playable',
      'Linux     ?',
      'GTX 1050 Ti / i5-7500     60 FPS',
      'Intel HD 620 / i5-7200    36 FPS',
    ], t, this.ctx.start + 0.05, Math.max(0.8, w.platformer!.end - this.ctx.start), { rot: -0.02, size: 30, hot: [0] });
    tag(ctx, c, '2D PLATFORMER', SHEET.x + 700, SHEET.y + 120, 26, { a: prog(t, w['2d']!.start, w['2d']!.start + 0.2), rot: 0.06, seed: 81 });
    tag(ctx, c, "FROM THE PROJECT'S COMPATIBILITY.md", SHEET.x + 450, SHEET.y + SHEET.h + 40, 20, { a: prog(t, this.ctx.start + 0.4, this.ctx.start + 0.6), rot: 0.01, seed: 82, tape: false });
    drawCut(ctx, c, this.cuts.gtx!, GPU.x, GPU.y, t, { t0: w['60']!.start - 0.12, scale: GPU.s, rot: -0.05, seed: 83 });
    badge(ctx, c, GPU.x + 240, GPU.y - 150, 95, '60', 'FPS', t, w['60']!.start + 0.05);
    drawCut(ctx, c, this.cuts.laptop!, LAP.x, LAP.y, t, { t0: w['36']!.start - 0.12, scale: LAP.s, rot: 0.06, seed: 84 });
    badge(ctx, c, LAP.x + 230, LAP.y - 110, 85, '36', 'FPS', t, w['36']!.start + 0.05, { col: 'acid', rot: 0.1 });
    tag(ctx, c, 'INTEL HD GRAPHICS 620', LAP.x - 60, LAP.y + 200, 24, { a: prog(t, w.intel!.start, w.intel!.start + 0.2), rot: -0.03, seed: 85 });
  }
}
