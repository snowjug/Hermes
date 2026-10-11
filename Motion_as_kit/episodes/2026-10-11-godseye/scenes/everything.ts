// 02 EVERYTHING: "Every satellite overhead. Every ship at sea. And it all runs in your browser, for free."
// Orbits sweep on around the globe on "satellite", ships light the sea lanes on "ship"; on "browser" the camera pulls
// back and the feed turns out to be a browser tab (localhost:4173); FREE · MIT stamps on "free".
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Feed, globe, MONO, MONOB, clamp, ease, ob } from '@ep/sat';

export default class Everything extends Feed {
  build() {
    this.take('Every satellite overhead', ['satellite', 'overhead.', 'ship', 'sea.', 'runs', 'browser,', 'free.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.25); K.key(s + 0.4, 0, 0, 1.08, 0, ease.outExpo);
    K.key(this.s('browser') - 0.3, 0, 0, 1.1, 0, ease.inOutQuad);
    K.key(this.s('browser') + 0.5, 0, 30, 0.82, 0, ease.inOutCubic);
    K.key(e, 0, 30, 0.8, 0, ease.inOutQuad);
  }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const sa = clamp((t - this.s('satellite') + 0.1) / 0.9), sh = clamp((t - this.s('ship') + 0.1) / 0.9);
    globe(ctx, c, 0, -20, 470, { lon: -10 + t * 2.5, lat: 25 }, t, { flights: 1, lights: 1, grat: 0.8, sats: sa, orbits: sa, ships: sh }, this.pal(t));
    const bk = ease.outCubic(clamp((t - this.s('browser') + 0.2) / 0.5));
    if (bk > 0) {
      const w = 1880, h = 1130;
      setWorld(ctx, c, 0, 20, 1, 0);
      ctx.globalAlpha = bk; ctx.strokeStyle = 'rgba(230,246,255,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 16); ctx.stroke();
      ctx.fillStyle = 'rgba(20,26,34,0.95)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 86, [16, 16, 0, 0]); ctx.fill();
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-w / 2 + 34 + i * 30, -h / 2 + 30, 9, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = 'rgba(40,48,60,1)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 150, -h / 2 + 12, 340, 40, [10, 10, 0, 0]); ctx.fill();
      ctx.font = font(MONOB, 18); ctx.fillStyle = '#E6F6FF'; ctx.fillText("God's Eye View", -w / 2 + 172, -h / 2 + 38);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 150, -h / 2 + 52, 700, 28, 14); ctx.fill();
      ctx.font = font(MONO, 17); ctx.fillStyle = 'rgba(230,246,255,0.85)'; ctx.fillText('localhost:4173', -w / 2 + 170, -h / 2 + 72);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  override hudInfo(t: number) { return { trk: `TRK 11,284 AIRCRAFT${t > this.s('satellite') ? ' · 838 SAT' : ''}${t > this.s('ship') ? ' · AIS' : ''}`, alt: 'ALT 20,200 KM', loc: '25.0°N  10.0°W' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const fk = clamp((t - this.s('free') + 0.05) / 0.25);
    if (fk > 0) {
      setWorld(ctx, c, 600, 330, 0.7 + 0.3 * ob(fk), -0.12);
      ctx.globalAlpha = fk; ctx.strokeStyle = '#3BE8FF'; ctx.lineWidth = 6; ctx.strokeRect(-170, -56, 340, 112);
      ctx.font = font(MONOB, 54); ctx.fillStyle = '#3BE8FF'; ctx.textAlign = 'center'; ctx.fillText('FREE · MIT', 0, 18); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('free'), 0.02) }; }
}
