// MISSING: "What's missing is Sony's system software: the libraries every game calls for graphics, sound
// and controllers."
// A pinboard. The game file is pinned in the middle; on each of graphics, sound and controllers an
// index card for that Sony library appears as a dashed ghost (it isn't on a PC) and red string runs
// to it from the game. The controller sticker lands by its card. A MISSING stamp across the lot.
import { drawCut, pin, stringPts, drawString, indexCard, prog, ease, pt, ransom } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk, fileCard, LIBS, CARD } from '@ep/kit';

const GAME = { x: -420, y: 40 };

export default class Missing extends Desk {
  override uses = ['dualsense'];
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take("What's missing", [['whats', "What's"], 'missing', "Sony's", 'system', 'software:', 'libraries', 'every', 'game', 'calls', 'graphics,', 'sound', 'controllers.']);
    this.stamp = makeStamp('MISSING ON A PC', "SONY'S SYSTEM LIBRARIES", 'A GAME CALLS THEM ALL THE TIME', HEX.signal, 9);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -300, 20, 1.15, -0.008);
    K.key(w.libraries!.start, -60, 0, 0.98, 0, ease.inOutCubic);
    K.key(w.controllers!.start, 40, 40, 0.94, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 50, 40, 0.96, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    fileCard(ctx, c, GAME.x, GAME.y, 'GAME', 'a PS5 executable (ELF)', { a: prog(t, this.ctx.start, this.ctx.start + 0.2), rot: -0.04, w: 320 });
    pin(ctx, c, GAME.x - 20, GAME.y - 180, t, this.ctx.start + 0.1);
    const tag0 = w.sonys!.start;
    ransom(ctx, c, "SONY'S", -760, -400, 64, t, tag0, 0.35, 21);
    LIBS.forEach((L, i) => {
      const tw = w[L.key]!.start - 0.1;
      const a = prog(t, tw, tw + 0.2);
      indexCard(ctx, c, L.x, L.y, CARD.w, CARD.h, L.title, L.sub, { a, rot: (i - 1) * 0.04, state: 'missing' });
      const k = prog(t, tw - 0.05, tw + 0.35, ease.inOutCubic);
      drawString(ctx, c, stringPts(pt(GAME.x + 120, GAME.y - 120 + i * 90), pt(L.x + 20, L.y + CARD.h / 2), 0.06), k);
      pin(ctx, c, L.x + 20, L.y + CARD.h / 2, t, tw + 0.3);
    });
    drawCut(ctx, c, this.cuts.dualsense!, 720, 380, t, { t0: w.controllers!.start + 0.05, scale: 0.42, rot: -0.15, seed: 41 });
    if (this.stamp) drawStamp(ctx, c, this.stamp, 330, -10, t, w.controllers!.end + 0.15, 0.5, -0.12, 0.92);
  }
}
