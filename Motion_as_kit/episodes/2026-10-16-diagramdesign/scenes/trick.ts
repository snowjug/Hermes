// 07 THE TRICK: "And its trick is one every good designer knows, and almost no AI does."
// A sealed node in the middle, THE TRICK, with a padlock. On "designer" a DESIGNERS node on the left links to it with
// a solid line and a check; on "almost no AI" an AI node on the right tries with a dashed line that stops short, and
// a cross. The lock stays shut: the answer comes later.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Dgm, node, edge, mark, mono, CORAL, HAIR, MUTED, clamp, ob } from '@ep/dgm';

export function lock(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, open: number, a = 1, s = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, s, 0);
  ctx.globalAlpha = a; ctx.strokeStyle = CORAL; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.roundRect(-22, -6, 44, 36, 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -6 - 16 * open, 14, Math.PI, 0); ctx.lineTo(14, -6 - 16 * open + (open > 0.2 ? -6 : 6)); ctx.moveTo(-14, -6 - 16 * open); ctx.lineTo(-14, -6 - 16 * open + 6); ctx.stroke();
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(0, 10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Trick extends Dgm {
  build() {
    this.take('And its trick', ['trick', 'every', 'designer', 'knows,', 'almost', 'AI', 'does.']);
    this.frame(0, 0, 1.05, { from: [0, 700, 1], to: [-900, 0, 1], drift: 0.05 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const tk = clamp((t - this.s('trick') + 0.2) / 0.5);
    node(ctx, c, 0, -20, 320, 150, { k: tk, title: 'THE TRICK', tag: 'SEALED', accent: true, titleSize: 34, glow: 0.5 });
    lock(ctx, c, 0, 30, 0, clamp((t - this.s('trick')) / 0.3), 1);
    // designers know it
    const dk = clamp((t - this.s('designer') + 0.1) / 0.5);
    node(ctx, c, -560, -20, 260, 110, { k: dk, title: 'Designers', sub: 'every good one', tag: 'HUMAN' });
    edge(ctx, c, [[-430, -20], [-160, -20]], clamp((t - this.s('knows') + 0.1) / 0.4), { label: 'KNOWS IT' });
    mark(ctx, c, -300, 30, true, clamp((t - this.s('knows') - 0.2) / 0.3), 1.4);
    // AI mostly doesn't
    const ak = clamp((t - this.s('almost') + 0.1) / 0.5);
    node(ctx, c, 560, -20, 260, 110, { k: ak, title: 'AI', sub: 'almost every model', tag: 'MODEL' });
    const reach = clamp((t - this.s('ai') + 0.05) / 0.5);
    edge(ctx, c, [[430, -20], [430 - 150 * reach, -20]], reach > 0 ? 1 : 0, { dash: true, head: false, col: HAIR });
    mark(ctx, c, 300, 30, false, clamp((t - this.s('does')) / 0.3), 1.4);
    mono(ctx, c, '?', 230, -8, { a: clamp((t - this.s('does')) / 0.3), size: 34, col: MUTED, bold: true });
    void ob;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('does'), 0.012) }; }
}
