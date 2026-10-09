// RELINK: "So AnyPS5 rewrites the game into an ordinary Windows or Linux program, and reconnects those calls
// to its own versions of Sony's libraries."
// The same pinboard. The game's card is rewritten: on "Windows" it becomes app.exe, on "Linux" a second
// card, app.elf, slides out with Tux beside it. On "reconnects" new string runs from the program to each
// library card, and on "own versions" the ghosts fill in as solid cards with a tick. A stat bar lands
// at the end: 2,575 of the 3,038 system functions it knows are rebuilt.
import { drawCut, pin, stringPts, drawString, indexCard, prog, ease, pt, clamp } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk, fileCard, statBar, LIBS, CARD } from '@ep/kit';

const GAME = { x: -420, y: 40 };

export default class Relink extends Desk {
  override uses = ['tux'];
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take('So AnyPS5 rewrites', ['AnyPS5', 'rewrites', 'game', 'ordinary', 'Windows', 'Linux', 'program,', 'reconnects', 'calls', 'own', 'versions', "Sony's", 'libraries.']);
    this.stamp = makeStamp('REWRITTEN', 'BY THE RELINKER', 'A NATIVE PROGRAM, NO EMULATOR', HEX.signal, 13);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 40, 40, 0.96, 0.004);
    K.key(w.rewrites!.start, -320, 40, 1.08, -0.006, ease.inOutCubic);
    K.key(w.reconnects!.start, -40, 20, 0.92, 0.0, ease.inOutCubic);
    K.key(w.libraries!.start, 40, 60, 0.88, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 50, 70, 0.9, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tw = w.windows!.start, tl = w.linux!.start;
    const outW = ease.outBack(clamp((t - tw) / 0.4)), outL = ease.outBack(clamp((t - tl) / 0.4));
    // the game card, stamped, then two programs fanning out of it
    fileCard(ctx, c, GAME.x, GAME.y, 'GAME', 'a PS5 executable (ELF)', { rot: -0.04, w: 320, a: 1 - 0.6 * outW });
    if (this.stamp) drawStamp(ctx, c, this.stamp, GAME.x, GAME.y - 20, t, w.rewrites!.start + 0.1, 0.3, -0.18, 0.92);
    if (t > tw) fileCard(ctx, c, GAME.x - 40 - 200 * outW, GAME.y - 250 * outW, 'app.exe', 'Windows program', { rot: -0.1, w: 260, col: 'acid' });
    if (t > tl) fileCard(ctx, c, GAME.x - 20 - 150 * outL, GAME.y + 290 * outL, 'app.elf', 'Linux program', { rot: 0.06, w: 260, col: 'acid' });
    drawCut(ctx, c, this.cuts.tux!, GAME.x - 440, GAME.y + 230, t, { t0: tl + 0.1, scale: 0.42, rot: -0.08, seed: 51 });
    pin(ctx, c, GAME.x - 20, GAME.y - 180, t, -1);
    // the library cards: ghosts until "own versions", then solid with a tick
    const tr = w.reconnects!.start, to = w.own!.start;
    LIBS.forEach((L, i) => {
      const solid = t > to + i * 0.12;
      indexCard(ctx, c, L.x, L.y, CARD.w, CARD.h, L.title, solid ? `AnyPS5's ${L.sub}` : L.sub, { rot: (i - 1) * 0.04, state: solid ? 'ok' : 'missing', hot: solid ? 1 : 0 });
      const k = prog(t, tr + i * 0.15, tr + 0.5 + i * 0.15, ease.inOutCubic);
      const from = i === 1 ? pt(GAME.x - 40 - 200 + 120, GAME.y - 250 + 40) : pt(GAME.x - 20 - 150 + 120, GAME.y + 290 - 40);
      drawString(ctx, c, stringPts(i === 0 ? pt(GAME.x - 120, GAME.y - 330) : from, pt(L.x + 20, L.y + CARD.h / 2), 0.07), k);
      pin(ctx, c, L.x + 20, L.y + CARD.h / 2, t, -1);
    });
    // the stat, visual only
    const ts = w.libraries!.start;
    statBar(ctx, c, 570, 262, 380, 'FUNCTIONS REBUILT', '2,575 / 3,038', 0.8476, prog(t, ts, ts + 0.8, ease.outCubic), { a: prog(t, ts - 0.1, ts + 0.1), rot: -0.02 });
  }
}
