// 16 NO KEYS: "17 of its 20 layers need no API key at all. Clone it, run it, and the planet opens in your browser."
// Twenty layer chips fill a grid; seventeen light up NO KEY, three show a key (vessels, fires and street level take a
// free key); then a terminal types the real commands and a browser tab springs open on the globe (localhost:4173).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Feed, globe, mono, MONO, MONOB, clamp, ease, ob } from '@ep/sat';

const L20 = ['BASEMAP', 'FLIGHTS', 'MILITARY', 'SATELLITES', 'QUAKES', 'TRAFFIC', 'CCTV', 'ALPR MAP', 'RADIO', 'TRANSIT', 'BIKESHARE', 'DIRECTIONS', 'LAUNCHES', 'INSTALLATIONS', 'WIND', 'WEATHER', 'CYCLONES', 'VESSELS', 'FIRES', 'STREET LEVEL'];

export default class Keys extends Feed {
  build() {
    this.take('17 of its 20', ['17', '20', 'layers', 'need', 'API', 'key', 'all.', 'Clone', 'run', 'planet', 'opens', 'browser.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.15); K.key(s + 0.45, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.s('clone') - 0.2, 0, 0, 1.0, 0, ease.inOutQuad); K.key(this.s('clone') + 0.4, 0, 0, 1.0, 0, ease.inOutCubic);
    K.key(e, 0, 0, 1.05, 0, ease.inOutQuad);
  }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    const out = ease.inOutCubic(clamp((t - this.s('clone') + 0.2) / 0.4));
    L20.forEach((name, i) => {
      const k = clamp((t - this.ctx.start - 0.1 - i * 0.04) / 0.25) * (1 - out);
      if (k <= 0) return;
      const x = -720 + (i % 5) * 360, y = -280 + Math.floor(i / 5) * 140, keyed = i >= 17;
      const lit = clamp((t - this.s('need') - (keyed ? 0.3 : i * 0.02)) / 0.2);
      setWorld(ctx, c, x, y, 0.9 + 0.1 * ob(k), 0);
      ctx.globalAlpha = k; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.strokeStyle = keyed ? '#FFC21A' : lit > 0 ? '#5CFFC0' : P.dim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-160, -48, 320, 96, 10); ctx.fill(); ctx.stroke();
      ctx.font = font(MONOB, 22); ctx.fillStyle = P.text; ctx.fillText(name, -140, -6);
      ctx.font = font(MONO, 17); ctx.fillStyle = keyed ? '#FFC21A' : '#5CFFC0'; ctx.globalAlpha = k * Math.max(lit, keyed ? 0 : 0);
      if (lit > 0) ctx.fillText(keyed ? 'FREE KEY' : 'NO KEY', -140, 24);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // the terminal, then the tab
    const tk = clamp((t - this.s('clone') + 0.1) / 0.3);
    if (tk > 0) {
      setWorld(ctx, c, -420, -40, 1, 0);
      ctx.globalAlpha = tk; ctx.fillStyle = 'rgba(8,12,18,0.95)'; ctx.strokeStyle = P.dim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-430, -170, 860, 340, 12); ctx.fill(); ctx.stroke();
      ctx.font = font(MONO, 24);
      const cmds = ['$ git clone https://github.com/bilawalsidhu/gods-eye-view', '$ cd gods-eye-view && npm ci', '$ npm run dev', '  ➜  Local:  http://localhost:4173'];
      cmds.forEach((s, i) => {
        const t0 = this.s('clone') + i * 0.45, n = Math.floor(clamp((t - t0) * 70, 0, s.length));
        ctx.fillStyle = i === 3 ? '#5CFFC0' : '#E6F6FF'; ctx.fillText(s.slice(0, n), -400, -100 + i * 60);
      });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const ok = ease.outCubic(clamp((t - this.s('planet') + 0.1) / 0.5));
    if (ok > 0) {
      setWorld(ctx, c, 520, 20, 0.85 + 0.15 * ok, 0);
      ctx.globalAlpha = ok; ctx.fillStyle = '#05080D'; ctx.strokeStyle = 'rgba(230,246,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-330, -240, 660, 480, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(30,38,48,1)'; ctx.fillRect(-330, -240, 660, 44);
      ctx.font = font(MONO, 16); ctx.fillStyle = '#E6F6FF'; ctx.fillText('localhost:4173', -300, -212);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      globe(ctx, c, 520, 40, 190 * ok, { lon: t * 6, lat: 20 }, t, { flights: 1, lights: 1, grat: 0.6, sats: 1, orbits: 0.5, fade: ok }, P);
    }
    void mono;
  }
  override hudInfo(t: number) { return { trk: t > this.s('need') ? '17 / 20 LAYERS · NO KEY NEEDED' : 'LAYERS 20', alt: 'RUNS LOCALLY', loc: 'NODE 24 · LOCALHOST' }; }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('planet'), 0.015) }; }
}
