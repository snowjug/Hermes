// 05–06 THE LAYERS, THEN FLIGHTS: "Here's what you're actually looking at." "Over 11,000 live aircraft from public
// flight trackers, with military flights on their own layer."
// A LAYERS panel slides in with the project's layers and their switches; then the camera dives onto the North
// Atlantic corridor: dense traffic, one aircraft locked in target brackets with an ADS-B readout (example values),
// and on "military" a separate red layer of tracks switches on. (Flights here are an illustration.)
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Feed, globe, globeAt, panel, target, mono, MONO, MONOB, clamp, ease } from '@ep/sat';

const LAYERS = ['FLIGHTS', 'MILITARY', 'VESSELS', 'SATELLITES', 'QUAKES', 'FIRES', 'RAIN RADAR', 'LIGHTNING', 'CYCLONES', 'WIND', 'TRAFFIC', 'CCTV', 'TRANSIT', 'RADIO', 'LAUNCHES'];

export default class Layers extends Feed {
  build() {
    this.take("Here's what you're", ['actually', 'looking']);
    this.take('Over 11,000', ['11,000', 'live', 'aircraft', 'public', 'flight', 'trackers,', 'military', 'flights', 'layer.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.2); K.key(s + 0.45, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.s('11000') - 0.35, 0, 0, 1.02, 0, ease.inOutQuad);
    K.key(this.s('11000') + 0.5, 0, 0, 1.0, 0, ease.inOutCubic);
    K.key(e, 0, 0, 1.06, 0, ease.inOutQuad);
  }
  dive(t: number) { return ease.inOutCubic(clamp((t - this.s('11000') + 0.35) / 0.85)); }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const d = this.dive(t), R = 470 + d * 1500;
    const v = { lon: -38, lat: 50 - 18 * d };
    globe(ctx, c, 200 - d * 200, -20 + d * 700, R, v, t, { flights: 1, lights: 1, grat: 0.8, mil: clamp((t - this.s('military') + 0.1) / 0.4) }, this.pal(t));
  }
  override hudInfo(t: number) { return { trk: t > this.s('11000') ? 'LAYER FLIGHTS · SRC OPENSKY / ADSB.LOL' : 'LAYERS 20', alt: this.dive(t) > 0.5 ? 'ALT 2,400 KM' : 'ALT 20,200 KM', loc: '50.0°N  38.0°W' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    const pk = clamp((t - this.ctx.start - 0.1) / 0.35) * (1 - clamp((t - this.s('11000') + 0.2) / 0.3));
    if (pk > 0) {
      panel(ctx, c, -560, 0, 460, 700, 'LAYERS', P, pk);
      LAYERS.forEach((name, i) => {
        const k = clamp((t - this.ctx.start - 0.25 - i * 0.07) / 0.2) * pk, y = -300 + i * 42;
        if (k <= 0) return;
        mono(ctx, c, name, -760, y + 6, { size: 20, bold: true, col: P.text, a: k });
        setWorld(ctx, c, -380, y, 1, 0);
        ctx.globalAlpha = k; ctx.fillStyle = i < 4 || i === 11 ? P.accent : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.roundRect(-26, -12, 52, 24, 12); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(i < 4 || i === 11 ? 12 : -12, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
      mono(ctx, c, '+ 5 MORE', -760, 360, { size: 18, col: P.dim, a: pk });
    }
    // lock onto one aircraft
    const d = this.dive(t);
    if (d > 0.9) {
      const lk = clamp((t - this.s('public')) / 0.4);
      const [x, y] = globeAt(0, -20 + 700, 1970, { lon: -38, lat: 32 }, 52.5, -30.5 + (t - this.s('public')) * 0.4);
      setWorld(ctx, c, x, y, 1, 0); ctx.fillStyle = P.plane; ctx.fillRect(-4, -4, 8, 8); ctx.setTransform(1, 0, 0, 1, 0, 0);
      target(ctx, c, x, y, 40, P.accent, lk, 'TRK 4CA2F1');
      if (lk > 0.6) {
        setWorld(ctx, c, x + 60, y + 40, 1, 0);
        ctx.globalAlpha = clamp((lk - 0.6) / 0.4); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 300, 110);
        ctx.font = font(MONO, 17); ctx.fillStyle = P.text;
        ['ADS-B   EXAMPLE', 'ALT     FL360', 'GS      478 KT', 'HDG     092°'].forEach((s, i) => ctx.fillText(s, 14, 26 + i * 24));
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      const mk = clamp((t - this.s('military') + 0.05) / 0.3);
      mono(ctx, c, '■ MILITARY LAYER', 560, -380, { a: mk, size: 24, bold: true, col: P.mil });
    }
    void MONOB;
  }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('military'), 0.015) }; }
}
