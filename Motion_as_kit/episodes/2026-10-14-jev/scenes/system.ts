// 08 SYSTEM: "TypeSafe calls it a System One model, named after fast, gut-feeling thinking."
// The page turns to ink. Split screen: SYSTEM 1 on the left, where the red dot zips between three points
// almost instantly; SYSTEM 2 on the right, greyed, a slow paragraph creeping along. A footnote names the idea's
// source: Kahneman's Thinking, Fast and Slow. FAST and GUT FEELING rise on their words.
import type { Cam } from '@kit/_vo';
import { Swiss, kinetic, dot, label, rule, textWall, CREAM, RED, clamp, ease, lerp } from '@ep/swiss';

export default class System extends Swiss {
  override dark = true;
  override wipeIn = '#121212';
  override section = 8;
  override label = 'SYSTEM ONE';
  build() {
    this.take('TypeSafe calls it', ['TypeSafe', 'System', 'One', 'named', 'fast,', 'gutfeeling', 'thinking.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rule(ctx, c, 0, -340, 0, 340, ease.outCubic(clamp((t - this.ctx.start) / 0.5)), { col: '#3A3733', w: 2 });
    // system 1: the dot zips between three points
    const s1 = clamp((t - w.system!.start + 0.1) / 0.2);
    if (s1 > 0) {
      const pts: [number, number][] = [[-700, 120], [-420, -20], [-200, 180]];
      const ph = (t * 3.2) % 3, i = Math.floor(ph), f = ease.inOutCubic(ph - i);
      const a = pts[i]!, b = pts[(i + 1) % 3]!;
      pts.forEach(([x, y]) => dot(ctx, c, x, y, 8, { a: s1 * 0.5, col: CREAM }));
      dot(ctx, c, lerp(a[0], b[0], f), lerp(a[1], b[1], f), 22, { a: s1 });
    }
    // system 2: a slow paragraph
    textWall(ctx, c, 140, -60, 720, 300, t, this.ctx.start + 0.4, { rate: 1.6, seed: 9, col: '#4A4640', lh: 36 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    kinetic(ctx, c, 'SYSTEM 1', -840, -200, 140, t, w.system!.start - 0.08, { col: CREAM });
    kinetic(ctx, c, 'SYSTEM 2', 140, -200, 140, t, w.system!.start + 0.15, { col: '#4A4640' });
    kinetic(ctx, c, 'FAST.', -840, 330, 110, t, w.fast!.start - 0.06, { col: RED });
    kinetic(ctx, c, 'GUT FEELING.', -440, 330, 70, t, w.gutfeeling!.start - 0.06, { col: CREAM });
    label(ctx, c, 'SLOW · DELIBERATE', 140, -110, { a: clamp((t - w.system!.start - 0.2) / 0.3), col: '#6E6A62' });
    label(ctx, c, "AFTER DANIEL KAHNEMAN · 'THINKING, FAST AND SLOW'", 140, 330, { a: clamp((t - w.named!.start) / 0.25), col: '#8C877E', size: 22 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.fast!.start, 0.015) }; }
}
