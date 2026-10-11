// 20 THE ONE THAT CONVINCES: "But for the one diagram that has to convince someone, this is it."
// The clean app diagram on a slide in a review (ARCHITECTURE REVIEW · Q4), packets flowing; on "convince someone" a
// reviewer's comment pins to it: "Clear. Approved." with a tick; on "this is it" the coral box glows and the camera
// pushes in.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Dgm, appDiagram, subCam, header, mono, mark, TEXT, MUTED, HAIR, CORAL, SANS, MONO, clamp, ease, ob } from '@ep/dgm';

export default class Convince extends Dgm {
  build() {
    this.take('But for the one diagram', ['one', 'diagram', 'convince', 'someone,', 'this', 'it.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 0.6);
    K.key(s + 0.5, 0, 0, 0.92, 0, ease.outExpo);
    K.key(this.s('this') - 0.1, 0, 0, 0.98, 0, ease.inOutQuad);
    K.key(this.s('this') + 0.6, -60, 20, 1.12, 0, ease.inOutCubic);
    K.key(e - 0.26, -60, 20, 1.15, 0, ease.inOutQuad);
    K.key(e, 840, 20, 1.15, 0, ease.inExpo);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const fk = ease.outExpo(clamp((t - this.ctx.start) / 0.5));
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.globalAlpha = fk; ctx.fillStyle = 'rgba(16,21,29,0.96)'; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(-900, -470, 1800, 900, 12); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    header(ctx, c, -820, -340, 'ARCHITECTURE REVIEW · Q4', 'How a request flows', t, this.ctx.start + 0.1, { size: 56 });
    appDiagram(ctx, subCam(c, 40, 40, 0.92), 0, 0, 1, { t, hot: clamp((t - this.s('this')) / 0.3) });
    mono(ctx, c, 'SLIDE 4 / 12', 820, 400, { a: fk, align: 'right', size: 16 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const k = clamp((t - this.s('convince') + 0.1) / 0.35);
    if (k <= 0) return;
    setWorld(ctx, c, 560, -300, 0.9 + 0.1 * ob(k), 0);
    ctx.globalAlpha = k; ctx.fillStyle = '#ECEFF3'; ctx.beginPath(); ctx.roundRect(-190, -50, 380, 100, 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-120, 50); ctx.lineTo(-150, 80); ctx.lineTo(-90, 50); ctx.fill();
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(-140, 0, 26, 0, Math.PI * 2); ctx.fill();
    ctx.font = font(SANS, 22); ctx.fillStyle = '#0B0E13'; ctx.textAlign = 'center'; ctx.fillText('VP', -140, 8);
    ctx.textAlign = 'left'; ctx.font = font(SANS, 26); ctx.fillText('Clear. Approved.', -96, -2);
    ctx.font = font(MONO, 15); ctx.fillStyle = '#5A6070'; ctx.fillText('engineering review · now', -96, 26);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    mark(ctx, c, 720, -300, true, clamp((t - this.s('someone')) / 0.3), 1.4);
    void TEXT; void MUTED;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('this'), 0.012) }; }
}
