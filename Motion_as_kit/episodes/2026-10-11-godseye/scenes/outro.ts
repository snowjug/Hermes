// 21–22 OUTRO: "That's God's Eye View. Free, open source, and a little bit terrifying." "Subscribe, there's a new tool
// every day."
// The globe turns behind; GOD'S EYE VIEW decodes, FREE · OPEN SOURCE · A LITTLE BIT TERRIFYING ticks in word by word,
// the repo address in mono; on "Subscribe" the channel's subscribe graphic plays (dark card).
import type { Cam } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { subscribe } from '@kit/_subscribe';
import { Feed, globe, decode, mono, clamp, type Mode } from '@ep/sat';

export default class Outro extends Feed {
  build() {
    this.take("That's God's Eye View", ["God's", 'Free,', 'open', 'little', 'terrifying.']);
    this.take('Subscribe, there', ['Subscribe,', 'new', 'every', 'day.']);
    const K = this.cam; K.key(this.ctx.start, 0, 0, 1.1); K.key(this.ctx.start + 0.5, 0, 0, 1.0); K.key(this.ctx.end, 0, 0, 1.03);
  }
  override mode(t: number): Mode { return t > this.s('terrifying') - 0.05 && t < this.s('subscribe') - 0.1 ? 'nvg' : 'eo'; }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    globe(ctx, c, 0, 420, 700, { lon: 100 + t * 3, lat: -10 }, t, { flights: 1, lights: 1, grat: 0.6, sats: 1, orbits: 0.6, fade: 0.55 }, this.pal(t));
  }
  override hudInfo(_t: number) { return { trk: 'END OF FEED', alt: 'TOOL MAN', loc: '@tooladay' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    decode(ctx, c, "GOD'S EYE VIEW", 0, -250, 130, t, this.s('gods') - 0.2, { dur: 0.6, col: '#FFFFFF', glow: 'rgba(59,232,255,0.5)' });
    const parts: [string, string, number][] = [['FREE', 'free', -380], ['OPEN SOURCE', 'open', -60], ['A LITTLE BIT TERRIFYING', 'little', 420]];
    parts.forEach(([s, k, x], i) => mono(ctx, c, s, x, -150, { size: 34, bold: true, align: 'center', col: i === 2 ? P.accent : P.text, a: clamp((t - this.s(k) + 0.05) / 0.2) }));
    mono(ctx, c, 'github.com/bilawalsidhu/gods-eye-view', 0, -90, { size: 24, align: 'center', col: P.dim, a: clamp((t - this.s('gods')) / 0.4) });
    subscribe(ctx, t, this.s('subscribe') - 0.15, this.ctx.end + 1, { x: W / 2, y: H / 2 + 120, s: 1, dark: true });
  }
}
