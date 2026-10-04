// FULL: "Your disk is full. But full of what?"
// Yellow paper. YOUR / DISK / IS / FULL. slam in one word at a time, stacked to the edges; a fat disk
// gauge fills to the brim in pink. On "But" the sheet clears; on "what?" a giant question mark lands and
// the frame flashes inverted.
import { type LineBatch } from '@engine/lines';
import { Plate, slam, ease, prog, pulse, noise1, rgba, setWorld, label, type Cam } from '@kit/_mp';
import { DISK } from '@ep/home';

export default class Full extends Plate {
  paper = true;

  build() {
    this.take('Your disk is full', ['Your', 'disk', 'is', 'full.']);
    this.take('But full of what', ['But', ['full2', 'full'], 'of', 'what?']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -120, 1.0, 0);
    K.key(w.full!.start, 0, -110, 1.0, 0, ease.linear);
    K.key(w.full!.start + 0.15, 0, -60, 1.06, -0.02, ease.outExpo);
    K.key(w.but!.start - 0.05, 0, -50, 1.07, -0.02, ease.linear);
    K.key(w.but!.start + 0.1, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 0, 1.08, 0.0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const clear = prog(t, w.but!.start - 0.05, w.but!.start + 0.05);
    if (clear < 1) {
      const a = 1 - clear;
      slam(ctx, c, 'YOUR', -480, -560, 250, t, w.your!.start, { wd: 125, wt: 900, col: 'ink', a });
      slam(ctx, c, 'DISK', -480, -330, 250, t, w.disk!.start, { wd: 125, wt: 900, col: 'ink', a });
      slam(ctx, c, 'IS', -480, -100, 250, t, w.is!.start, { wd: 125, wt: 900, col: 'ink', a });
      slam(ctx, c, 'FULL.', -480, 150, 228, t, w.full!.start, { wd: 125, wt: 900, col: 'signal', hotCol: 'signal', a });
      // the gauge
      const ga = prog(t, w.your!.start, w.your!.start + 0.2) * a;
      if (ga > 0) {
        const fill = ease.outCubic(prog(t, w.your!.start, w.full!.end)) * 0.997;
        setWorld(ctx, c, -480, 300);
        ctx.globalAlpha = ga;
        ctx.lineWidth = 10; ctx.strokeStyle = rgba('ink', 1); ctx.strokeRect(0, 0, 900, 120);
        ctx.fillStyle = rgba('signal', 1); ctx.fillRect(10, 10, 880 * fill, 100);
        ctx.fillStyle = rgba('ink', 1); ctx.fillRect(900, 35, 22, 50);
        label(ctx, `${DISK.total} GiB DISK · ALMOST NOTHING FREE`, 0, -22, { size: 30, col: rgba('ink', 1), spacing: 4, weight: 700 });
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    if (clear > 0) {
      slam(ctx, c, 'BUT FULL', -480, -560, 150, t, w.but!.start, { wd: 125, wt: 900, col: 'ink' });
      slam(ctx, c, 'OF', -480, -420, 150, t, w.of!.start, { wd: 125, wt: 900, col: 'ink' });
      slam(ctx, c, 'WHAT?', -480, -280, 150, t, w.what!.start, { wd: 125, wt: 900, col: 'signal', hotCol: 'signal' });
      slam(ctx, c, '?', -330, 620, 1000, t, w.what!.start + 0.08, { wd: 125, wt: 900, col: 'ink' });
    }
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.full!.start, 0.07) + pulse(t, w.what!.start + 0.08, 0.07);
    return { zoom: 1 + 0.03 * hit, shake: [10 * hit * noise1(t * 60, 1), 10 * hit * noise1(t * 60, 2)] as [number, number], invert: 0.9 * pulse(t, w.what!.start + 0.08, 0.06), grain: 0.05 };
  }
}
