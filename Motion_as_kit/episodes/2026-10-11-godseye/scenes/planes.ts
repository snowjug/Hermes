// 01 PLANES: "This is every plane in the sky, live, right now."
// Cold open on the night globe over the Atlantic, already alive: aircraft pour onto their great circles, the track
// count races to 11,000+, a slow push in. (An illustration of the flights layer.)
import type { Cam } from '@kit/_vo';
import { Feed, globe, mono, fmt, count, clamp, ease } from '@ep/sat';

export default class Planes extends Feed {
  build() {
    this.take('This is every plane', ['every', 'plane', 'sky,', 'live,', 'right', 'now.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 0.92); K.key(e - 0.2, 0, 0, 1.08, 0, ease.inOutQuad); K.key(e, 0, 0, 1.25, 0, ease.inExpo);
  }
  override staticAt(t: number) { return clamp((t - (this.ctx.end - 0.08)) / 0.08); }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const fl = 0.35 + 0.65 * ease.outCubic(clamp((t - 0.1) / 1.8));
    globe(ctx, c, 0, -20, 470, { lon: -35 + t * 2.5, lat: 28 }, t, { flights: fl, lights: 1, grat: 0.8 }, this.pal(t));
  }
  override hudInfo(t: number) { return { trk: `TRK ${fmt(count(11284, t, 0, 2.6))} AIRCRAFT`, alt: 'ALT 20,200 KM', loc: '28.0°N  35.0°W' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    mono(ctx, c, '● LIVE', 0, -500, { a: clamp((t - this.s('live')) / 0.2) * (Math.floor(t * 3) % 2 ? 1 : 0.5), align: 'center', size: 26, bold: true, col: '#FF3B30' });
  }
}
