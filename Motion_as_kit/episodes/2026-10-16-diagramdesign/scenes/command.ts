// 21 ONE COMMAND: "One command, and your next diagram looks like you hired a designer."
// The install command types fast in a terminal and enters; the clean diagram assembles under it in a cascade (borders
// trace, edges run); on "hired a designer" a badge lands: DESIGNER · HIRED.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Dgm, card, typed, appDiagram, subCam, chip, CORAL, MONOB, clamp, ob } from '@ep/dgm';

export default class Command extends Dgm {
  build() {
    this.take('One command', [['onecmd', 'One'], 'command,', 'next', 'diagram', 'looks', 'hired', 'designer.']);
    this.frame(0, 0, 1, { from: [0, 0, 1.7], to: [0, 0, 0.6], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    card(ctx, c, 0, -300, 1100, 120, { k: clamp((t - this.ctx.start) / 0.35), title: 'terminal' });
    typed(ctx, c, '$ npx skills add cathrynlavery/diagram-design', -500, -270, t, this.ctx.start + 0.15, 70, { size: 28, caret: t < this.s('next') });
    const show = clamp((t - this.s('next') + 0.1) / 1.0);
    if (show > 0) appDiagram(ctx, subCam(c, 0, 70, 0.78), 0, 0, 1, { show: 1, edgesK: show, a: clamp(show * 3), t, hot: clamp((t - this.s('hired')) / 0.3) * 0.6 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const k = clamp((t - this.s('hired') + 0.05) / 0.35);
    if (k <= 0) return;
    setWorld(ctx, c, 560, -150, 0.6 + 0.4 * ob(k), -0.08);
    ctx.globalAlpha = k; ctx.strokeStyle = CORAL; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(-190, -46, 380, 92, 10); ctx.stroke();
    ctx.font = font(MONOB, 34); ctx.fillStyle = CORAL; ctx.textAlign = 'center'; ctx.fillText('DESIGNER · HIRED', 0, 12);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    void chip;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('hired'), 0.02) }; }
}
