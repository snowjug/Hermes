// CATCH: "The catch: it's one game, on Windows. Linux is still a question mark."
// THE CATCH as ransom letters. "one game": a typed tag with a red 1. "on Windows": a Windows tag gets a
// tick. On "Linux" Tux lands, and the pen draws a huge red question mark beside him.
import { drawCut, tag, ransom, prog, ease, pt, wobble } from '@kit/_collage';
import { strokeText } from '@engine/stroke';
import type { Cam } from '@kit/_vo';
import { Desk, badge } from '@ep/kit';

const TUX = { x: 380, y: 90, s: 0.62 };

export default class Catch extends Desk {
  override uses = ['tux'];

  build() {
    this.take('The catch', ['catch:', 'one', 'game,', 'Windows.', 'Linux', 'still', 'question', 'mark.']);
    const w = this.w;
    // a big question mark in marker, written as "question mark" is said
    const st = strokeText('?', 'hscript', 520);
    const t0 = w.question!.start, t1 = w.mark!.end;
    st.strokes.forEach((s, i) => {
      const pts = s.map((p) => pt(TUX.x + 260 + p.x, TUX.y + 160 + p.y));
      if (pts.length >= 2) this.plot.add(pts, t0 + i * 0.15, i === 0 ? t1 : t1 + 0.12, 'signal', { pen: true, ez: ease.inOutQuad, width: 12 });
      else this.plot.add([pts[0]!, pt(pts[0]!.x + 1, pts[0]!.y)], t1, t1 + 0.1, 'signal', { pen: true, width: 22 });
    });
    void wobble;
    const K = this.cam;
    K.key(this.ctx.start, -300, -40, 1.05, -0.006);
    K.key(w.linux!.start, 160, 30, 0.97, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, 170, 40, 0.98, 0.008, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const wd = ransom(ctx, c, 'THE CATCH', 0, -300, 112, t, this.ctx.start + 0.05, 0.45, 31, 0);
    ransom(ctx, c, 'THE CATCH', -wd / 2 - 120, -300, 112, t, this.ctx.start + 0.05, 0.45, 31);
    tag(ctx, c, 'ONE GAME', -560, -40, 44, { a: prog(t, w.one!.start, w.one!.start + 0.15), rot: -0.05, seed: 91 });
    badge(ctx, c, -300, -90, 70, '1', 'GAME', t, w.game!.start);
    tag(ctx, c, 'WINDOWS: PLAYABLE', -520, 160, 34, { a: prog(t, w.windows!.start, w.windows!.start + 0.15), rot: 0.03, seed: 92, col: '#2F8F4E' });
    drawCut(ctx, c, this.cuts.tux!, TUX.x, TUX.y, t, { t0: w.linux!.start - 0.08, scale: TUX.s, rot: 0.05, seed: 93 });
    tag(ctx, c, 'LINUX: ?', TUX.x - 40, TUX.y + 250, 34, { a: prog(t, w.still!.start, w.still!.start + 0.15), rot: -0.04, seed: 94, col: '#D2302A' });
  }

  override pfx(t: number) {
    const k = t > this.w.linux!.start ? Math.pow(0.5, (t - this.w.linux!.start) / 0.08) : 0;
    return { zoom: 1 + 0.012 * k };
  }
}
