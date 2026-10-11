// 10 PRICE: "Input costs 42 dollars per billion tokens. The answers are free."
// A red slab clears to the price set like a magazine pull-quote: $42 huge on the left, PER 1,000,000,000 INPUT
// TOKENS under it; OUTPUT $0 on the right with a FREE stamp. The mid-video subscribe reminder slides in at
// the bottom right while the page is quiet.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { W, H } from '@engine/gl';
import { subscribe } from '@kit/_subscribe';
import { Swiss, ob, kinetic, label, counter, HEAD, RED, INK, clamp, ease } from '@ep/swiss';

export default class Price extends Swiss {
  override wipeIn = RED;
  override section = 10;
  override label = 'PRICE';
  build() {
    this.take('Input costs', ['Input', '42', 'dollars', 'billion', 'tokens.', 'answers', 'free.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the FREE stamp
    const sk = clamp((t - w.free!.start) / 0.18);
    if (sk > 0) {
      setWorld(ctx, c, 560, 170, 1.6 - 0.6 * ob(sk), -0.18);
      ctx.globalAlpha = sk; ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.strokeRect(-170, -62, 340, 124);
      ctx.fillStyle = RED; ctx.font = font(HEAD, 96); ctx.textAlign = 'center'; ctx.fillText('FREE', 0, 34);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    label(ctx, c, 'INPUT', -840, -250, { a: clamp((t - w.input!.start) / 0.2), rule: true, size: 30 });
    counter(ctx, c, 42, (v) => `$${Math.round(v)}`, -850, 110, 330, t, this.ctx.start + 0.25, Math.max(0.6, w['42']!.start - this.ctx.start - 0.1));
    kinetic(ctx, c, 'PER 1,000,000,000 TOKENS', -840, 220, 52, t, w.billion!.start - 0.1, { f: HEAD });
    label(ctx, c, 'OUTPUT · THE ANSWERS', 300, -250, { a: clamp((t - w.answers!.start) / 0.2), rule: true, size: 30 });
    kinetic(ctx, c, '$0', 300, 70, 260, t, w.answers!.start, { col: RED });
    void INK;
    // the mid-video subscribe reminder
    subscribe(ctx, t, w.answers!.start - 0.2, this.ctx.end - 0.35, { x: W - 420, y: H - 225, s: 0.62 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w['42']!.start, 0.02) }; }
}
