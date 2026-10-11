// 14 IDEA: "Still, the idea is big. An AI that doesn't talk. It just decides."
// The callback. THE IDEA IS BIG. Then the noise of the opening returns, bubbles and walls of text, on "An AI
// that doesn't talk"; on "It just decides." all of it collapses into the single red dot in the middle, and
// IT JUST DECIDES. rises under it.
import type { Cam } from '@kit/_vo';
import { Swiss, ob, kinetic, dot, bubble, textWall, label, RED, clamp, ease, hash, lerp } from '@ep/swiss';

export default class Idea extends Swiss {
  override wipeIn = RED;
  override section = 14;
  build() {
    this.take('Still, the idea', ['Still,', 'idea', 'big.', 'An', "doesn't", 'talk.', 'It', 'decides.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.w.it!.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.08, 0, ease.inOutCubic);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const col = ease.inCubic(clamp((t - w.it!.start + 0.05) / 0.45)); // collapse
    const t0 = w.an!.start;
    if (t > t0 && col < 1) {
      for (let i = 0; i < 16; i++) {
        const x0 = -880 + 1760 * hash(i, 21), y0 = -360 + 640 * hash(i, 22);
        const x = lerp(x0, 0, col), y = lerp(y0, 0, col), s = 1 - col;
        bubble(ctx, c, x, y, 240 + 120 * hash(i, 23), 90 + 50 * hash(i, 24), t, t0 + i * 0.07, { seed: i + 30, s, a: 1 - col * 0.6 });
      }
      textWall(ctx, c, lerp(-900, -60, col), lerp(80, 0, col), lerp(600, 40, col), lerp(260, 20, col), t, t0 + 0.2, { rate: 14, seed: 12, col: '#C9C2B5', a: 1 - col });
    }
    const dk = ob(clamp((t - w.it!.start - 0.25) / 0.35));
    dot(ctx, c, 0, -40, 90 * dk, { pulse: clamp((t - w.decides!.start) / 0.7) });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'THE IDEA IS BIG.', -840, -260, 110, t, w.still!.start, { out: w.an!.start - 0.1 });
    label(ctx, c, 'AN AI THAT DOESN’T TALK', -840, -300, { a: clamp((t - w.an!.start) / 0.2) * (1 - clamp((t - w.it!.start) / 0.2)), rule: true, size: 28 });
    kinetic(ctx, c, 'IT JUST DECIDES.', 0, 250, 140, t, w.it!.start + 0.1, { align: 'center', hi: ['DECIDES.'], col: '#121212', hiCol: RED });
    void RED;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.decides!.start, 0.02) }; }
}
