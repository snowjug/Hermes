// NAME: "It's called AnyPS5. Bring your own games, and only download it from GitHub."
// ANYPS5 tears in huge; the address types under it; BRING YOUR OWN GAMES; then ONLY FROM GITHUB in red
// between hazard stripes. The last frame cuts back to the first.
import { Screen, gtext, term, fit, rgba, setWorld } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease, prog } from '@engine/util';

export default class Name extends Screen {
  build() {
    this.take("It's called AnyPS5", ['called', 'AnyPS5.', 'Bring', 'own', 'games,', 'only', 'download', 'GitHub.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.08, 0);
    K.key(w.bring!.start, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 30, 1.04, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w.anyps5!.start, w.bring!.start, w.only!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    gtext(ctx, c, 'ANYPS5', 0, -470, fit('ANYPS5', 980, 280), t, w.anyps5!.start - 0.05, { align: 'center' });
    term(ctx, c, 'github.com/boykopovar/AnyPS5', -470, -330, 40, t, w.anyps5!.end, 0.6, 'acid');
    gtext(ctx, c, 'BRING YOUR', 0, -60, fit('BRING YOUR', 900, 170), t, w.bring!.start, { align: 'center' });
    gtext(ctx, c, 'OWN GAMES', 0, 110, fit('OWN GAMES', 900, 170), t, w.own!.start, { align: 'center' });
    const ha = prog(t, w.only!.start - 0.05, w.only!.start + 0.1);
    if (ha > 0) {
      setWorld(ctx, c, 0, 420);
      ctx.globalAlpha = ha;
      for (const yy of [-150, 110]) {
        ctx.fillStyle = rgba('signal', 1); ctx.fillRect(-540, yy, 1080, 40);
        ctx.fillStyle = rgba('ink', 1);
        for (let x = -560 + ((t * 120) % 80); x < 560; x += 80) { ctx.beginPath(); ctx.moveTo(x, yy + 40); ctx.lineTo(x + 30, yy); ctx.lineTo(x + 55, yy); ctx.lineTo(x + 25, yy + 40); ctx.closePath(); ctx.fill(); }
      }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    gtext(ctx, c, 'ONLY FROM GITHUB', 0, 480, fit('ONLY FROM GITHUB', 980, 120), t, w.only!.start, { align: 'center', col: 'signal' });
  }
}
