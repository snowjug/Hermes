// HOOK: "This free gym app shows the muscles you've been skipping."
// The court is already set at frame one: a big body map lit green. FREE GYM APP slams in with a $0
// sticker, SHOWS THE MUSCLES replaces it, and on "skipping" the legs go grey and hatched, a lime marker
// rings them, and YOU'VE BEEN / SKIPPING slams in.
import { ring, ease, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { bodyMap, heat, badge } from '@ep/kit';
import { Court, cslam, fitSize, LIME, PINK } from '@ep/court';

const BM = { x: 0, y: 90, s: 1.85 };
const VOL: Record<string, number> = { chest: 0.95, delts: 0.85, biceps: 0.7, forearms: 0.45, abs: 0.6, quads: 0.04, calves: 0.03 };
const LEGS = ['quads', 'calves'];

export default class Hook extends Court {
  build() {
    this.take('This free gym app', ['free', 'gym', 'app', 'shows', 'muscles', "you've", 'been', 'skipping.']);
    const w = this.w;
    this.plot.add(ring(BM.x, BM.y + 110 * BM.s, 100 * BM.s, 195 * BM.s, 7), w.skipping!.start, w.skipping!.start + 0.35, 'signal', { pen: true, ez: ease.inOutQuad, width: 12, col: [0.56, 0.9, 0.03] });
    const K = this.cam;
    K.key(0, 0, -40, 1.04, 0);
    K.key(w.shows!.start, 0, -20, 1.0, 0, ease.inOutCubic);
    K.key(w.skipping!.start, 0, 60, 1.06, 0, ease.outCubic);
    K.key(this.ctx.end, 0, 70, 1.08, 0, ease.linear);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const grey = t >= w.skipping!.start;
    bodyMap(ctx, c, BM.x, BM.y, BM.s, 'front', (p) => (grey && LEGS.includes(p) ? '#A9A49B' : heat(VOL[p] ?? 0.3)), {
      hatch: (p) => (grey && LEGS.includes(p) ? prog(t, w.skipping!.start, w.skipping!.start + 0.3) : 0), label: 'MUSCLE MAP',
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const s1 = fitSize('FREE GYM APP', 900, 170);
    if (t < w.shows!.start) cslam(ctx, c, 'FREE GYM APP', 0, -640, s1, t, Math.min(0, w.free!.start - 0.05), { align: 'center' });
    else if (t < w.skipping!.start - 0.05) {
      cslam(ctx, c, 'SHOWS THE', 0, -720, fitSize('SHOWS THE', 820, 150), t, w.shows!.start, { align: 'center' });
      cslam(ctx, c, 'MUSCLES', 0, -560, fitSize('MUSCLES', 900, 200), t, w.muscles!.start, { align: 'center', col: LIME });
    } else {
      cslam(ctx, c, "YOU'VE BEEN", 0, -720, fitSize("YOU'VE BEEN", 820, 150), t, w.skipping!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'SKIPPING', 0, -550, fitSize('SKIPPING', 940, 210), t, w.skipping!.start + 0.05, { align: 'center', col: LIME });
    }
    badge(ctx, c, 360, -380, 120, '$0', 'A MONTH', t, Math.min(0.05, w.free!.start), { rot: 0.14, col: 'blood' });
    void PINK;
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.shows!.start, 0.02) * this.punch(t, w.skipping!.start, 0.035) };
  }
}
