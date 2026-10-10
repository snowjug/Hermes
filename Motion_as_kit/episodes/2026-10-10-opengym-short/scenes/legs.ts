// LEGS: "So be honest. When did you last train legs?"
// BE HONEST. slams in; then WHEN DID YOU / LAST TRAIN / LEGS? builds up word by word over front and back
// body maps whose legs are grey and hatched, each ringed in lime. It ends on the body map the hook opened
// with, so the loop back to the first frame is seamless.
import { ring, ease, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { bodyMap, heat } from '@ep/kit';
import { Court, cslam, fitSize, LIME } from '@ep/court';

const FR = { x: -238, y: 250, s: 1.22 };
const BK = { x: 238, y: 250, s: 1.22 };
const LEGS = ['quads', 'calves', 'hamstrings', 'glutes'];
const VOL: Record<string, number> = { chest: 0.95, delts: 0.85, biceps: 0.7, triceps: 0.8, lats: 0.7, traps: 0.6, abs: 0.6, forearms: 0.45 };

export default class Legs extends Court {
  build() {
    this.take('So be honest', ['be', 'honest.', 'When', 'last', 'train', 'legs?']);
    const w = this.w;
    this.plot.add(ring(FR.x, FR.y + 110 * FR.s, 100 * FR.s, 195 * FR.s, 21), w.legs!.start, w.legs!.start + 0.3, 'signal', { pen: true, ez: ease.inOutQuad, width: 11 });
    this.plot.add(ring(BK.x, BK.y + 110 * BK.s, 100 * BK.s, 195 * BK.s, 22), w.legs!.start + 0.15, w.legs!.start + 0.45, 'signal', { pen: true, ez: ease.inOutQuad, width: 11 });
    const K = this.cam;
    K.key(this.ctx.start, 0, -40, 1.04, 0);
    K.key(w.when!.start, 0, -20, 1.0, 0);
    K.key(this.ctx.end, 0, 30, 1.06, 0);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const fill = (p: string) => (LEGS.includes(p) ? '#A9A49B' : heat(VOL[p] ?? 0.3));
    const hatch = (p: string) => (LEGS.includes(p) ? 0.4 + 0.6 * prog(t, w.legs!.start, w.legs!.start + 0.3) : 0);
    bodyMap(ctx, c, FR.x, FR.y, FR.s, 'front', fill, { hatch, label: 'FRONT', rot: -0.03 });
    bodyMap(ctx, c, BK.x, BK.y, BK.s, 'back', fill, { hatch, label: 'BACK', rot: 0.03 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (t < w.when!.start - 0.05) {
      cslam(ctx, c, 'BE', 0, -720, fitSize('BE', 400, 180), t, w.be!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'HONEST.', 0, -540, fitSize('HONEST.', 900, 210), t, w.honest!.start - 0.05, { align: 'center', col: LIME });
    } else {
      cslam(ctx, c, 'WHEN DID YOU', 0, -760, fitSize('WHEN DID YOU', 900, 130), t, w.when!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'LAST TRAIN', 0, -620, fitSize('LAST TRAIN', 900, 150), t, w.last!.start - 0.05, { align: 'center' });
      cslam(ctx, c, 'LEGS?', 0, -330, fitSize('LEGS?', 860, 280), t, w.legs!.start - 0.05, { align: 'center', col: LIME });
    }
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.when!.start, 0.02) * this.punch(t, w.legs!.start, 0.045) };
  }
}
