// HOOK: "This tool has one PlayStation 5 game running on a PC. Exactly one."
// A desk. The PS5 photo lands first, taped down; on "PC" a laptop sticker lands across the desk and a
// red string runs between them, pinned at both ends. On "Exactly one." the words land as ransom-note
// letters over the top and a marker loop rings the one game.
import { drawCut, tape, pin, stringPts, drawString, ransom, tag, ring, ease, prog, springStep, pt } from '@kit/_collage';
import { noise1 } from '@kit/_mp';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const PS = { x: -470, y: 40, s: 0.62, r: -0.07 };
const LP = { x: 500, y: 90, s: 0.62, r: 0.05 };

export default class Hook extends Desk {
  override uses = ['ps5', 'laptop'];
  override wipeOut = false;

  build() {
    const w = this.w;
    this.take('This tool has one', ['This', 'tool', 'one', 'PlayStation', 'game', 'running', 'PC.', 'Exactly', ['one2', 'one.', 1]]);
    // a marker loop around the PS5 photo on "Exactly", a second pass on "one."
    const P = this.plot;
    P.add(ring(PS.x, PS.y, 300, 330, 4), w.exactly!.start + 0.05, w.one2!.end + 0.1, 'signal', { pen: true, ez: ease.inOutQuad, width: 6.5 });
    const K = this.cam;
    K.key(0, PS.x + 60, PS.y - 10, 1.35, -0.015);
    K.key(w.playstation!.start, PS.x + 140, PS.y - 20, 1.22, -0.01, ease.inOutCubic);
    K.key(w.pc!.start, 120, 40, 1.0, 0.006, ease.inOutCubic);
    K.key(w.exactly!.start, 0, -20, 0.92, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, -30, 0.9, -0.004, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.ps5!, PS.x, PS.y, t, { t0: 0.05, scale: PS.s, rot: PS.r, seed: 2 });
    if (t > 0.3) tape(ctx, c, PS.x - 10, PS.y - 280, 170, 0.08, { seed: 3, a: prog(t, 0.3, 0.4) });
    tag(ctx, c, 'ONE PS5 GAME', PS.x + 20, PS.y + 330, 30, { a: prog(t, w.game!.start, w.game!.start + 0.15), rot: 0.03, seed: 5 });
    drawCut(ctx, c, this.cuts.laptop!, LP.x, LP.y, t, { t0: w.pc!.start - 0.12, scale: LP.s, rot: LP.r, seed: 6 });
    tag(ctx, c, 'A PC', LP.x - 40, LP.y + 270, 30, { a: prog(t, w.pc!.start + 0.15, w.pc!.start + 0.3), rot: -0.04, seed: 8 });
    // the string: from the photo's corner to the laptop's
    const a = pt(PS.x + 200, PS.y - 200), b = pt(LP.x - 230, LP.y - 120);
    const k = prog(t, w.running!.start, w.pc!.start + 0.15, ease.inOutCubic);
    drawString(ctx, c, stringPts(a, b, 0.09), k);
    pin(ctx, c, a.x, a.y, t, w.running!.start);
    pin(ctx, c, b.x, b.y, t, w.pc!.start + 0.1);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.exactly!.start;
    const dur = Math.max(0.5, w.one2!.end - t0);
    const wd = ransom(ctx, c, 'EXACTLY ONE.', 0, -330, 104, t, t0, dur, 7, 0);
    ransom(ctx, c, 'EXACTLY ONE.', -wd / 2, -330, 104, t, t0, dur, 7);
    void springStep; void noise1;
  }

  override pfx(t: number) {
    const w = this.w;
    const hit = Math.pow(0.5, Math.max(0, t - w.pc!.start) / 0.08) * (t > w.pc!.start ? 1 : 0);
    return { zoom: 1 + 0.012 * hit };
  }
}
