// LIBS: "It just swaps in its own versions of Sony's system libraries."
// SWAPS IN tears in. Three terminal rows list Sony libraries a game calls, each marked SONY; on "own
// versions" each row's owner glitches over to ANYPS5 in cyan, one after another.
import { Screen, gtext, term, fit, hash, rgba, setWorld, font, F } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease } from '@engine/util';

const ROWS = ['libSceAgcDriver', 'libSceAudioOut', 'libScePad'];

export default class Libs extends Screen {
  build() {
    this.take('It just swaps', ['swaps', 'own', 'versions', "Sony's", 'system', 'libraries.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -60, 1.05, 0);
    K.key(w.own!.start, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 20, 1.03, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w.swaps!.start, w.own!.start, w.libraries!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    gtext(ctx, c, 'SWAPS IN', 0, -560, fit('SWAPS IN', 960, 230), t, w.swaps!.start - 0.05, { align: 'center' });
    gtext(ctx, c, 'ITS OWN', 0, -380, fit('ITS OWN', 900, 170), t, w.own!.start, { align: 'center', col: 'acid' });
    ROWS.forEach((r, i) => {
      const y = -120 + i * 150;
      term(ctx, c, r, -480, y, 46, t, this.ctx.start + 0.1 + i * 0.12, 0.35, 'bone');
      const ts = w.versions!.start + i * 0.22;
      const flip = t >= ts;
      const g = flip && t < ts + 0.2;
      setWorld(ctx, c, 470, y);
      ctx.font = font(F.mono(700), 44); ctx.textAlign = 'right';
      const label = g ? 'A?YP#5'.split('').map((ch, k) => (hash(k, Math.round(t * 30), i) > 0.5 ? ch : '#')).join('') : flip ? 'ANYPS5' : 'SONY';
      ctx.fillStyle = rgba(flip ? 'acid' : 'signal', 1);
      if (t > this.ctx.start + 0.3 + i * 0.12) ctx.fillText(label, 0, 0);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    gtext(ctx, c, "OF SONY'S LIBRARIES", 0, 470, fit("OF SONY'S LIBRARIES", 980, 110), t, w.sonys!.start, { align: 'center', col: 'signal' });
  }
}
