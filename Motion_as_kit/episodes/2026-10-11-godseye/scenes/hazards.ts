// 09 THE PLANET'S WEATHER: "Earthquakes from the last day. Fires spotted from space. Rain radar, lightning, cyclones and
// wind."
// The globe swings to the western Pacific; each layer switches on with its word and its source tag: quake rings
// around the Ring of Fire (USGS · 24H), fires (NASA FIRMS), rain cells (NOAA), lightning strikes, a cyclone spiral,
// wind streaks. (Illustrations of the layers.)
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Feed, globe, mono, clamp, ease, hash } from '@ep/sat';

export default class Hazards extends Feed {
  build() {
    this.take('Earthquakes from', ['Earthquakes', 'last', 'day.', 'Fires', 'spotted', 'space.', 'Rain', 'radar,', 'lightning,', 'cyclones', 'wind.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.25); K.key(s + 0.45, 0, 0, 1.0, 0, ease.outExpo); K.key(e, 0, 0, 1.08, 0, ease.inOutQuad);
  }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const on = (k: string, d = 0.4) => clamp((t - this.s(k) + 0.1) / d);
    const v = { lon: 150 - (t - this.ctx.start) * 6, lat: 5 };
    globe(ctx, c, 180, 0, 480, v, t, { flights: 0.4, lights: 1, grat: 0.7, quakes: on('earthquakes'), fires: on('fires'), weather: Math.max(on('rain'), on('lightning') * 0.7, on('cyclones') * 0.8) }, this.pal(t));
    // wind streaks across the disc
    const wk = on('wind');
    if (wk > 0) {
      setWorld(ctx, c, 180, 0, 1, 0);
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 480, 0, Math.PI * 2); ctx.clip();
      ctx.strokeStyle = this.pal(t).sat; ctx.lineWidth = 1.6;
      for (let i = 0; i < 70; i++) {
        const y0 = -460 + hash(i, 1) * 920, ph = (t * 0.25 + hash(i, 2)) % 1, x0 = -520 + ph * 1040;
        ctx.globalAlpha = wk * 0.5 * Math.sin(ph * Math.PI);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 40, y0 - 14 * Math.sin(i), x0 + 90, y0 + 6); ctx.stroke();
      }
      ctx.restore(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  override hudInfo(_t: number) { return { trk: 'LAYERS HAZARDS + WEATHER', alt: 'ALT 20,200 KM', loc: '5.0°N  150.0°E' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    const rows: [string, string, string][] = [['earthquakes', 'QUAKES', 'USGS · LAST 24 H'], ['fires', 'ACTIVE FIRES', 'NASA FIRMS'], ['rain', 'RAIN RADAR', 'NOAA NOWCOAST'], ['lightning', 'LIGHTNING', 'NOAA NOWCOAST'], ['cyclones', 'CYCLONES', 'NOAA NHC'], ['wind', 'WIND', 'NOAA GFS · ECMWF']];
    rows.forEach(([k, a, b], i) => {
      const kk = clamp((t - this.s(k) + 0.05) / 0.25);
      if (kk <= 0) return;
      mono(ctx, c, '■ ' + a, -820, -300 + i * 92, { a: kk, size: 30, bold: true, col: i === 0 ? P.quake : i === 1 ? P.fire : P.sat });
      mono(ctx, c, b, -790, -268 + i * 92, { a: kk, size: 18, col: P.dim });
    });
  }
}
