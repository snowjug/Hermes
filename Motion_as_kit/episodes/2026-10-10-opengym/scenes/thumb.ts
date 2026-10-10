// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// The title ("This Free Workout Tracker Knows You Skipped Leg Day") carries the joke; the thumbnail shows
// it and adds the price: a drawn body map with grey, hatched legs, the Vesalius muscle man with his legs ringed in red marker, the app's phone
// screen, and NO SUBSCRIPTION in ransom letters. Two words.
import { drawCut, ransom, tape } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, bodyMap, heat } from '@ep/kit';

export default class Thumb extends Desk {
  override uses = ['vesalius', 's_home'];

  build() {
    this.cam.key(this.ctx.start, 0, 0, 1, 0);
  }
  override captionLines() { return []; }

  override desk(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    const legs = ['quads', 'calves', 'hamstrings', 'glutes'];
    const vol: Record<string, number> = { chest: 0.95, delts: 0.85, biceps: 0.7, triceps: 0.8, abs: 0.55, forearms: 0.45 };
    bodyMap(ctx, c, 70, 160, 1.0, 'front', (p) => (legs.includes(p) ? '#A9A49B' : heat(vol[p] ?? 0.4)), { hatch: (p) => (legs.includes(p) ? 1 : 0), label: 'MUSCLE MAP', rot: 0.04 });
    drawCut(ctx, c, this.cuts.vesalius!, -560, 120, t, { t0: 0, scale: 0.98, rot: -0.04, seed: 2 });
    drawCut(ctx, c, this.cuts.s_home!, 640, 150, t, { t0: 0, scale: 0.86, rot: 0.06, seed: 6 });
    tape(ctx, c, 640, -200, 180, 0.1, { seed: 4 });
    // the marker ring around the legs, drawn straight onto the paper (the thumb's camera is fixed)
    ctx.save();
    ctx.strokeStyle = '#D2302A'; ctx.lineWidth = 13; ctx.lineCap = 'round';
    const [cx, cy] = [-560 + 960, 300 + 540];
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const an = -Math.PI * 0.6 + (i / 120) * Math.PI * 2.15;
      const r = 1 + 0.04 * Math.sin(i * 0.31);
      ctx.lineTo(cx + Math.cos(an) * 160 * r, cy + Math.sin(an) * 230 * r);
    }
    ctx.stroke(); ctx.restore();
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    const size = 150;
    const wd = ransom(ctx, c, 'NO SUBSCRIPTION', 0, 0, size, t, 0, 0.1, 31, 0);
    const s2 = Math.min(size, (size * 1780) / wd);
    const wd2 = ransom(ctx, c, 'NO SUBSCRIPTION', 0, 0, s2, t, 0, 0.1, 31, 0);
    ransom(ctx, c, 'NO SUBSCRIPTION', -wd2 / 2, -330, s2, t, 0, 0.1, 31);
  }
}
