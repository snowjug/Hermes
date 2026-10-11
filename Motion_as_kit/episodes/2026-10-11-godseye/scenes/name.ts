// 03–04 NAME: "It's called God's Eye View, and its tagline says it all: a spy satellite simulator, except the data is real."
// "It hit number one on GitHub Trending, and it's past 50,000 stars."
// GOD'S EYE VIEW decodes from random glyphs over the dimmed globe; the tagline types out in mono, THE DATA IS REAL in
// the accent; then a #1 GITHUB TRENDING badge stamps and the star count races to 50,869.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { Feed, globe, decode, mono, WIDE, MONOB, fmt, count, clamp, ease, ob } from '@ep/sat';

export default class Name extends Feed {
  build() {
    this.take("It's called God", ['called', "God's", 'Eye', 'View,', 'tagline', 'spy', 'satellite', 'simulator,', 'except', 'data', 'real.']);
    this.take('It hit number one', ['number', 'one', 'GitHub', 'Trending,', '50,000', 'stars.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.12); K.key(s + 0.4, 0, 0, 1.0, 0, ease.outExpo); K.key(e, 0, 0, 1.05, 0, ease.inOutQuad);
  }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    globe(ctx, c, 0, 120, 560, { lon: 20 + t * 2, lat: 20 }, t, { flights: 1, lights: 1, grat: 0.5, sats: 1, orbits: 0.6, fade: 0.35 }, this.pal(t));
  }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    const up = ease.inOutCubic(clamp((t - this.s('number') + 0.3) / 0.5));
    decode(ctx, c, "GOD'S EYE VIEW", 0, -150 - 90 * up, 150 - 30 * up, t, this.s('gods') - 0.15, { dur: 0.7, glow: 'rgba(59,232,255,0.6)', col: '#FFFFFF' });
    const line1 = 'A SPY SATELLITE SIMULATOR IN YOUR BROWSER,', line2a = 'EXCEPT ', line2b = 'THE DATA IS REAL.';
    const ty = (s: string, t0: number, t1: number) => s.slice(0, Math.floor(clamp((t - t0) / Math.max(0.3, t1 - t0)) * s.length));
    const ta = 1 - 0.6 * up;
    mono(ctx, c, ty(line1, this.s('spy') - 0.1, this.e('simulator') + 0.4), 0, -40 - 70 * up, { align: 'center', size: 34, bold: true, col: P.text, a: ta });
    const full = line2a + line2b, typed = ty(full, this.s('except') - 0.05, this.e('real') - 0.05);
    const w2 = measure(full, MONOB, 40), x0 = -w2 / 2;
    mono(ctx, c, typed.slice(0, line2a.length), x0, 14 - 70 * up, { size: 40, bold: true, col: P.text, a: ta });
    mono(ctx, c, typed.slice(line2a.length), x0 + measure(line2a, MONOB, 40), 14 - 70 * up, { size: 40, bold: true, col: P.accent, a: ta });
    // #1 trending, the stars
    const bk = clamp((t - this.s('number') + 0.05) / 0.25);
    if (bk > 0) {
      setWorld(ctx, c, -300, 170, 0.7 + 0.3 * ob(bk), -0.06);
      ctx.globalAlpha = bk; ctx.strokeStyle = P.accent; ctx.lineWidth = 6; ctx.strokeRect(-230, -60, 460, 120);
      ctx.font = font(WIDE, 52); ctx.fillStyle = P.accent; ctx.textAlign = 'center'; ctx.fillText('#1', -150, 20);
      ctx.font = font(MONOB, 24); ctx.fillText('GITHUB TRENDING', 50, 0); ctx.font = font(MONOB, 18); ctx.fillStyle = P.text; ctx.fillText('DAILY + WEEKLY · AUG 2026', 50, 32);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const sk = clamp((t - this.s('50000') + 0.1) / 0.2);
    if (sk > 0) {
      mono(ctx, c, `★ ${fmt(count(50869, t, this.s('50000') - 0.1, 1.0))}`, 330, 195, { align: 'center', size: 84, bold: true, col: '#FFFFFF', a: sk });
      mono(ctx, c, 'GITHUB STARS · 10.3K FORKS', 330, 240, { align: 'center', size: 20, col: P.dim, a: sk });
    }
  }
  override hudInfo(_t: number) { return { trk: 'SRC github.com/bilawalsidhu/gods-eye-view', alt: 'MIT LICENCE' }; }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('gods'), 0.02) * this.punch(t, this.s('number'), 0.015) }; }
}
