// 07–08 SHIPS, THEN SATELLITES: "Ships stream in from AIS, the radio beacons vessels broadcast at sea." "838
// satellites, each one moving along its real orbit."
// The globe turns to the Indian Ocean and the Strait of Malacca: ships light up along the lanes, one of them pinging
// out AIS rings; then the camera pulls far back and the orbits wrap the planet, the count runs to 838, and one
// satellite trails its ground track. (Illustrations of the vessel and satellite layers.)
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Feed, globe, globeAt, mono, target, fmt, count, clamp, ease, TAU } from '@ep/sat';

export default class Seas extends Feed {
  build() {
    this.take('Ships stream in', ['Ships', 'stream', 'AIS,', 'radio', 'beacons', 'vessels', 'broadcast', 'sea.']);
    this.take('838 satellites', ['838', 'satellites,', 'moving', 'real', 'orbit.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.25); K.key(s + 0.45, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.s('838') - 0.3, 0, 0, 1.03, 0, ease.inOutQuad);
    K.key(this.s('838') + 0.7, 0, 0, 1.0, 0, ease.inOutCubic);
    K.key(e, 0, 0, 1.04, 0, ease.inOutQuad);
  }
  pull(t: number) { return ease.inOutCubic(clamp((t - this.s('838') + 0.3) / 1.0)); }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const p = this.pull(t), R = 1500 - p * 1150;
    const v = { lon: 88 + p * 20 + t * 1.5 * p, lat: -14 + p * 34 };
    globe(ctx, c, 0, 620 - p * 640, R, v, t, { flights: 0.5, lights: 1, grat: 0.7, ships: 1, sats: p, orbits: p }, this.pal(t));
  }
  override hudInfo(t: number) { return { trk: this.pull(t) > 0.5 ? `LAYER SATELLITES · CELESTRAK · SGP4` : 'LAYER VESSELS · SRC AISSTREAM', alt: this.pull(t) > 0.5 ? 'ALT 42,000 KM' : 'ALT 1,800 KM', loc: '8.0°N  88.0°E' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t), p = this.pull(t);
    if (p < 0.2) {
      // one ship pinging AIS
      const [x, y, z] = globeAt(0, 620, 1500, { lon: 88, lat: -14 }, 5.5, 82);
      if (z > 0) {
        const pk = clamp((t - this.s('ais')) / 0.3) * (1 - p * 5);
        target(ctx, c, x, y, 34, P.ship, pk, 'MMSI 563 012 940');
        for (let k = 0; k < 3; k++) {
          const ph = ((t - this.s('radio')) * 0.9 + k / 3) % 1;
          if (t < this.s('radio')) break;
          setWorld(ctx, c, x, y, 1, 0); ctx.globalAlpha = (1 - ph) * pk; ctx.strokeStyle = P.ship; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 20 + ph * 140, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        mono(ctx, c, 'AIS · VHF 161.975 MHZ', x + 60, y + 70, { a: clamp((t - this.s('broadcast')) / 0.3) * (1 - p * 5), size: 20, bold: true, col: P.ship });
      }
    }
    const sk = clamp((t - this.s('838') + 0.1) / 0.2);
    if (sk > 0) {
      mono(ctx, c, fmt(count(838, t, this.s('838') - 0.1, 1.0)), -620, 40, { a: sk, size: 120, bold: true, col: P.sat });
      mono(ctx, c, 'SATELLITES TRACKED', -620, 90, { a: sk, size: 22, bold: true, col: P.text });
      mono(ctx, c, 'POSITIONS PROPAGATED WITH SGP4', -620, 124, { a: clamp((t - this.s('real') + 0.1) / 0.3), size: 18, col: P.dim });
    }
  }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('838'), 0.015) }; }
}
