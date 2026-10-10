// LIBRARY: "Over 5,600 exercises, each with an animated demo. Tap a muscle on the body map to see what
// trains it."
// A Vesalius muscle man is pasted on the left. A counter card climbs to 5,600+; on "animated demo" the
// app's exercise list lands on the right. On "Tap a muscle" the marker rings his chest, and on "trains
// it" an arrow runs to three index cards (bench press, push-up, cable fly) that fan out. On "equipment"
// the camera moves to the exercise list and the marker rings its equipment filter.
import { drawCut, tag, ring, arrow, indexCard, ease, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, counter } from '@ep/kit';

const VS = { x: -600, y: -10, s: 0.82, r: -0.03 };
const CHEST = { x: VS.x + 6, y: VS.y - 205 };
const CARDS = [
  { title: 'Bench press', sub: 'CHEST · BARBELL', x: -130, y: -10, r: -0.05 },
  { title: 'Push-up', sub: 'CHEST · BODY WEIGHT', x: -110, y: 150, r: 0.03 },
  { title: 'Cable fly', sub: 'CHEST · CABLE', x: -150, y: 310, r: -0.02 },
];

export default class Library extends Desk {
  override uses = ['vesalius', 's_library'];

  build() {
    this.take('Over 5,600 exercises', ['Over', '5,600', 'exercises,', 'animated', 'demo.', 'Tap', 'muscle', 'body', 'map', 'trains', 'Filter', 'equipment', 'own.']);
    const w = this.w;
    this.plot.add(ring(CHEST.x, CHEST.y, 120, 70, 9), w.tap!.start, w.muscle!.end + 0.1, 'signal', { pen: true, ez: ease.inOutQuad, width: 7 });
    const ar = arrow({ x: CHEST.x + 130, y: CHEST.y + 10 }, { x: -170, y: -60 }, 4, -0.2);
    this.plot.add(ar.shaft, w.trains!.start - 0.3, w.trains!.start, 'signal', { pen: true, width: 7 });
    this.plot.add(ar.head, w.trains!.start, w.trains!.start + 0.1, 'signal', { pen: true, width: 7 });
    this.plot.add(ring(560, -178, 230, 40, 12), w.equipment!.start, w.equipment!.end + 0.15, 'signal', { pen: true, ez: ease.inOutQuad, width: 6 });
    const K = this.cam;
    K.key(this.ctx.start, -120, -80, 1.04, -0.004);
    K.key(w.animated!.start, 60, -40, 0.98, 0.002, ease.inOutCubic);
    K.key(w.tap!.start, -300, -60, 1.04, -0.004, ease.inOutCubic);
    K.key(w.trains!.start, -200, 20, 0.98, 0.0, ease.inOutCubic);
    K.key(w.filter!.start - 0.1, 200, -60, 1.02, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 220, -50, 1.04, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.vesalius!, VS.x, VS.y, t, { t0: this.ctx.start + 0.05, scale: VS.s, rot: VS.r, seed: 41 });
    counter(ctx, c, 120, -330, 5600, ease.outCubic(prog(t, w.over!.start, w.exercises!.end)), 'EXERCISES', t, w.over!.start - 0.1, { suffix: '+', rot: 0.02 });
    drawCut(ctx, c, this.cuts.s_library!, 560, 60, t, { t0: w.animated!.start - 0.1, scale: 0.78, rot: 0.04, seed: 42 });
    tag(ctx, c, 'EACH WITH AN ANIMATED DEMO', 560, -300, 28, { a: prog(t, w.demo!.start, w.demo!.start + 0.15), rot: -0.03, seed: 43 });
    tag(ctx, c, 'FILTER BY THE EQUIPMENT YOU OWN', 560, -400, 28, { a: prog(t, w.equipment!.start, w.equipment!.start + 0.15), rot: 0.02, seed: 45, bg: '#E8F7B8' });
    tag(ctx, c, 'BODY MAP', VS.x + 40, VS.y + 400, 30, { a: prog(t, w.body!.start, w.body!.start + 0.15), rot: 0.04, seed: 44 });
    CARDS.forEach((cd, i) => {
      const t0 = w.trains!.start + 0.05 + i * 0.14;
      if (t < t0) return;
      const k = ease.outCubic(prog(t, t0, t0 + 0.3));
      indexCard(ctx, c, cd.x, cd.y - 30 * (1 - k), 440, 150, cd.title, cd.sub, { rot: cd.r, a: prog(t, t0, t0 + 0.08), state: 'plain' });
    });
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.tap!.start, 0.012) };
  }
}
