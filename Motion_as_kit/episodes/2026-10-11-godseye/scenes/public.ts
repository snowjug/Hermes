// 20 ALL AT ONCE: "All of this data was already public. It's just never been this easy to see it all at once."
// The widest shot: the whole globe with every layer on (flights, ships, orbits, quakes, fires, weather, cameras),
// turning; PUBLIC DATA decodes on "public", then ALL AT ONCE.
import type { Cam } from '@kit/_vo';
import { Feed, globe, decode, clamp, ease, type Mode } from '@ep/sat';

export default class Public extends Feed {
  build() {
    this.take('All of this data', ['data', 'already', 'public.', 'never', 'easy', 'see', ['all2', 'all', 1], 'once.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.3); K.key(s + 1.5, 0, 0, 1.0, 0, ease.outCubic); K.key(e, 0, 0, 0.95, 0, ease.inOutQuad);
  }
  override mode(_t: number): Mode { return 'eo'; }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    globe(ctx, c, 0, 110, 380, { lon: -60 + (t - this.ctx.start) * 12, lat: 20 }, t, { flights: 1, mil: 1, ships: 1, sats: 1, orbits: 1, quakes: 1, fires: 1, weather: 0.7, cams: 1, lights: 1, grat: 0.7 }, this.pal(t));
  }
  override hudInfo(_t: number) { return { trk: 'ALL LAYERS', alt: 'ALT 36,000 KM', loc: 'GLOBAL CONTEXT' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    decode(ctx, c, 'PUBLIC DATA.', 0, -420, 58, t, this.s('public') - 0.1, { dur: 0.4, col: '#FFFFFF' });
    decode(ctx, c, 'ALL AT ONCE.', 0, -340, 58, t, this.s('all2') - 0.05, { dur: 0.4, col: P.accent, glow: 'rgba(59,232,255,0.6)' });
    void clamp;
  }
}
