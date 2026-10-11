// 10–11 THE CAMERAS: "And then it gets a little unsettling." "Nearly 4,000 public traffic cameras, from Texas to London
// to Finland, pinned right onto the globe."
// The feed drops into night vision and pushes in slowly, the HUD flickering; then the camera pins light up over Texas,
// London and Finland, the count runs to ~3,900, and a wall of six traffic-camera feeds slides in beside the globe.
// (The feeds are illustrations, not real camera images.)
import type { Cam } from '@kit/_vo';
import { Feed, globe, globeAt, cctv, target, mono, fmt, count, clamp, ease, type Mode } from '@ep/sat';

export default class Cameras extends Feed {
  build() {
    this.take('And then it gets', ['then', 'gets', 'little', 'unsettling.']);
    this.take('Nearly 4,000', ['Nearly', '4,000', 'public', 'traffic', 'cameras,', 'Texas', 'London', 'Finland,', 'pinned', 'globe.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.0); K.key(this.s('nearly') - 0.1, 0, 0, 1.12, 0, ease.inOutQuad);
    K.key(this.s('nearly') + 0.5, 0, 0, 1.0, 0, ease.outExpo); K.key(e, 0, 0, 1.03, 0, ease.inOutQuad);
  }
  override mode(_t: number): Mode { return 'nvg'; }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const sl = ease.inOutCubic(clamp((t - this.s('nearly') + 0.2) / 0.6));
    const v = { lon: -40, lat: 42 };
    globe(ctx, c, -380 * sl, 10, 470, v, t, { flights: 0.35, lights: 1, grat: 0.7, cams: clamp((t - this.s('4000')) / 1.2) }, this.pal(t));
  }
  override hudInfo(t: number) { return { trk: t > this.s('4000') ? `LAYER CCTV · ${fmt(count(3900, t, this.s('4000') - 0.1, 1.4))} CAMERAS` : 'SIGNAL ⚠', alt: 'ALT 12,000 KM', loc: '42.0°N  40.0°W' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    // the flicker before the reveal
    if (t < this.s('nearly')) mono(ctx, c, '⚠', 0, -360, { a: Math.floor(t * 6) % 2 ? 0.9 : 0.25, align: 'center', size: 70, bold: true, col: P.accent });
    // the places, on their words
    const v = { lon: -40, lat: 42 };
    ([['texas', 30.3, -97.7, 'AUSTIN · TX'], ['london', 51.5, -0.1, 'LONDON'], ['finland', 60.2, 24.9, 'HELSINKI']] as [string, number, number, string][]).forEach(([k, la, lo, lab]) => {
      const [x, y, z] = globeAt(-380, 10, 470, v, la, lo);
      if (z > 0) target(ctx, c, x, y, 18, P.accent, clamp((t - this.s(k) + 0.05) / 0.3), lab);
    });
    // the wall of feeds
    const labels = ['CAM 0412 · AUSTIN TX', 'CAM 2210 · LONDON', 'CAM 0098 · HELSINKI', 'CAM 1873 · TORONTO', 'CAM 0551 · SAN JOSE', 'CAM 3301 · SYDNEY'];
    labels.forEach((lab, i) => {
      const k = clamp((t - this.s('texas') - i * 0.12) / 0.3);
      cctv(ctx, c, 330 + (i % 2) * 330, -250 + Math.floor(i / 2) * 210, 310, 190, i + 3, t, lab, P, k);
    });
    mono(ctx, c, 'PUBLIC DOT / CITY FEEDS · ILLUSTRATION', 495, 390, { a: clamp((t - this.s('pinned')) / 0.3), align: 'center', size: 16, col: P.dim });
  }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('nearly'), 0.02) }; }
}
