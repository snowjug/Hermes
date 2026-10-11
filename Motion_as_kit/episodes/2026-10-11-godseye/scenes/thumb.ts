// THUMB: the thumbnail, rendered as a still after the end of the timeline. The night-vision globe over Europe and the
// Atlantic, thick with flights, orbits wrapping it, a target locked on a plane, and THE DATA IS REAL in big type.
import type { Cam } from '@kit/_vo';
import { Feed, globe, globeAt, target, decode, mono, WIDE, type Mode } from '@ep/sat';

export default class Thumb extends Feed {
  override caps = false;
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }
  override mode(_t: number): Mode { return 'nvg'; }
  override staticAt(_t: number) { return 0; }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    globe(ctx, c, 330, 120, 560, { lon: -20, lat: 38 }, 40, { flights: 1, mil: 1, lights: 1, grat: 0.8, sats: 1, orbits: 1 }, this.pal(t));
  }
  override hudInfo(_t: number) { return { trk: 'TRK 11,284 AIRCRAFT', alt: 'LIVE' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    const [x, y] = globeAt(330, 120, 560, { lon: -20, lat: 38 }, 48, -12);
    target(ctx, c, x, y, 46, '#FFFFFF', 1, 'TRK 4CA2F1');
    decode(ctx, c, 'THE DATA', -440, -170, 150, t, -10, { f: WIDE, col: '#FFFFFF', glow: 'rgba(0,0,0,0.9)' });
    decode(ctx, c, 'IS REAL.', -440, 0, 150, t, -10, { f: WIDE, col: P.accent, glow: 'rgba(0,0,0,0.9)' });
    mono(ctx, c, '11,284 AIRCRAFT · 838 ORBITS · LIVE', -440, 80, { align: 'center', size: 34, bold: true, col: '#FFFFFF' });
  }
}
