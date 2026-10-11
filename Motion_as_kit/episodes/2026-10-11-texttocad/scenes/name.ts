// NAME: "It's called text-to-cad: free, open source, and 19,000 stars on GitHub."
// Behind, a gear, the bracket and the stand turn on the grid. text-to-cad lands huge with its dimension line;
// on "19,000" the dimension's value counts up in stars. FREE · OPEN SOURCE · MIT, and GITHUB.
import type { Cam } from '@kit/_vo';
import { drawParts, gear, phoneStand, wallBracket } from '@kit/_cad3d';
import { Viewport, headline, tag, PART, ORANGE, BLUE, GREEN, clamp, ease } from '@ep/viewport';

export default class Name extends Viewport {
  build() {
    this.take("It's called", ['called', 'texttocad', 'free,', 'open', 'source,', '19000', 'stars', 'GitHub.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.06, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const v = { yaw: 0.4 + 0.25 * t, pitch: 0.5, dist: 1100, s: 3.6, target: [0, 0, 20] as [number, number, number] };
    this.gizmoView = v;
    drawParts(ctx, c, 0, 120, v, [
      { mesh: gear(18, 30, 10, '#C9A86A'), xf: { at: [-95, 10, 0], rz: t * 0.6 } },
      { mesh: wallBracket(40, PART), xf: { at: [0, -20, 0] } },
      { mesh: phoneStand(PART), xf: { at: [110, 20, 0], rz: -0.5 } },
    ], { grid: 320, gridStep: 10, a: 0.55 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const ts = w['19000']!.start - 0.05;
    const k = ease.outCubic(clamp((t - ts) / Math.max(0.5, w.stars!.end - ts)));
    headline(ctx, c, 'text-to-cad', 0, -150, 190, t, w.texttocad!.start - 0.05, { dim: t > ts ? `★ ${Math.round(19000 * k).toLocaleString('en-US')}` : undefined });
    tag(ctx, c, 'FREE', -300, 110, 38, { a: clamp((t - w.free!.start) / 0.12), bg: 'rgba(54,211,153,0.95)', fg: '#0D1117' });
    tag(ctx, c, 'OPEN SOURCE', 0, 110, 38, { a: clamp((t - w.open!.start) / 0.12), bg: 'rgba(61,139,255,0.95)', fg: '#FFFFFF' });
    tag(ctx, c, 'MIT', 270, 110, 38, { a: clamp((t - w.source!.start) / 0.12), stroke: BLUE });
    tag(ctx, c, 'STARS ON GITHUB', 0, 210, 32, { a: clamp((t - w.github!.start + 0.1) / 0.12), stroke: ORANGE });
    void GREEN;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.texttocad!.start, 0.02) }; }
}
