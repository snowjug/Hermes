// IMPORTS: "Coming from Strong, Hevy or FitNotes? It imports your history."
// Three export files land one per app name (strong.csv, hevy.csv, fitnotes.csv). On "imports" they fly
// in an arc into the openGym phone screen on the right, a marker arrow drawn ahead of them, and on
// "history" a stamp lands: IMPORTED, YOUR HISTORY COMES WITH YOU.
import { drawCut, arrow, ease, prog, lerp, clamp } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk, fileCard } from '@ep/kit';

const PH = { x: 560, y: 0, s: 0.8 };
const FILES = [
  { name: 'strong.csv', sub: 'from Strong', key: 'strong', x: -700, y: -150, r: -0.07 },
  { name: 'hevy.csv', sub: 'from Hevy', key: 'hevy', x: -420, y: -110, r: 0.04 },
  { name: 'fitnotes.csv', sub: 'from FitNotes', key: 'fitnotes', x: -140, y: -160, r: -0.03 },
];

export default class Imports extends Desk {
  override uses = ['s_home'];
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take('Coming from Strong', ['Coming', 'Strong,', 'Hevy', 'FitNotes?', 'imports', 'history.']);
    this.stamp = makeStamp('IMPORTED', 'STRONG · HEVY · FITNOTES', 'YOUR HISTORY COMES WITH YOU', HEX.signal, 41);
    const w = this.w;
    const ar = arrow({ x: -300, y: 170 }, { x: PH.x - 230, y: PH.y + 80 }, 5, -0.25);
    this.plot.add(ar.shaft, w.imports!.start - 0.1, w.imports!.end, 'signal', { pen: true, width: 7 });
    this.plot.add(ar.head, w.imports!.end, w.imports!.end + 0.1, 'signal', { pen: true, width: 7 });
    const K = this.cam;
    K.key(this.ctx.start, -380, -80, 1.06, -0.004);
    K.key(w.imports!.start - 0.1, 40, -20, 0.95, 0.002, ease.inOutCubic);
    K.key(this.ctx.end, 80, -10, 0.98, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.s_home!, PH.x, PH.y, t, { t0: this.ctx.start + 0.05, scale: PH.s, rot: 0.03, seed: 91 });
    FILES.forEach((f, i) => {
      const t0 = w[f.key]!.start - 0.1;
      if (t < t0) return;
      const tf = w.imports!.start + 0.05 + i * 0.12;
      const k = ease.inOutCubic(prog(t, tf, tf + 0.55));
      const x = lerp(f.x, PH.x, k), y = lerp(f.y, PH.y, k) - Math.sin(Math.PI * k) * 220;
      const a = clamp((t - t0) / 0.08) * (1 - prog(t, tf + 0.45, tf + 0.6));
      fileCard(ctx, c, x, y, f.name, f.sub, { w: 250 * (1 - 0.6 * k), rot: f.r + k * 0.6, a });
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    if (this.stamp) drawStamp(ctx, c, this.stamp, PH.x - 40, PH.y + 120, t, this.w.history!.start, 0.58, -0.12, 0.95);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.history!.start, 0.018) };
  }
}
