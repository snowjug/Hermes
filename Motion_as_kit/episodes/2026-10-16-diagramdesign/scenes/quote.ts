// 13 THE RULEBOOK: "As its own rulebook says: the highest-quality move is usually deletion."
// The quote, in serif italic over two lines, each word rising as it's said; "deletion." in coral, underlined as it
// lands; the attribution in mono. A giant faint minus sits behind it. The channel's subscribe card plays small above.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { font, measure } from '@engine/type';
import { subscribe } from '@kit/_subscribe';
import { Dgm, mono, SERIFI, TEXT, CORAL, clamp, ease } from '@ep/dgm';

const L1 = ['“The', 'highest-quality', 'move'], L2 = ['is', 'usually', 'deletion.”'];

export default class Quote extends Dgm {
  build() {
    this.take('As its own rulebook', ['rulebook', 'highest-quality', 'move', 'usually', 'deletion.']);
    this.frame(0, 0, 1, { from: [0, 0, 0.7], to: [0, 700, 1], drift: 0.05 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const size = 104, sp = measure(' ', SERIFI, size);
    const times = [this.s('highestquality') - 0.1, this.s('highestquality'), this.s('move'), this.s('move') + 0.15, this.s('usually'), this.s('deletion')];
    [L1, L2].forEach((ln, li) => {
      const widths = ln.map((w) => measure(w, SERIFI, size));
      const total = widths.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
      let x = -total / 2;
      const y = li ? 80 : -60;
      ln.forEach((word, wi) => {
        const t0 = times[li * 3 + wi]!, k = ease.outExpo(clamp((t - t0 + 0.05) / 0.55));
        if (k > 0) {
          setWorld(ctx, c, x, y, 1, 0);
          ctx.save(); ctx.beginPath(); ctx.rect(-10, -size, widths[wi]! + 40, size * 1.35); ctx.clip();
          const last = li === 1 && wi === 2;
          ctx.font = font(SERIFI, size); ctx.fillStyle = last ? CORAL : TEXT; ctx.fillText(word, 0, (1 - k) * size);
          ctx.restore();
          if (last) {
            const u = ease.outCubic(clamp((t - t0 - 0.25) / 0.4));
            ctx.fillStyle = CORAL; ctx.fillRect(0, 22, (widths[wi]! - 30) * u, 4);
          }
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        x += widths[wi]! + sp;
      });
    });
    mono(ctx, c, '— THE DIAGRAM DESIGN README', 0, 210, { a: clamp((t - this.s('rulebook')) / 0.4), align: 'center', size: 18, track: 3 });
    subscribe(ctx, t, this.s('rulebook') - 0.2, this.ctx.end - 0.35, { x: W / 2, y: 150, s: 0.72, dark: true });
    void H;
  }
}
