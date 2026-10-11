// OUTRO: "Your AI just learned CAD. That's today's tool. There's a new one every day."
// A showroom: the stand, the bracket, the gear, the knob and the motor in a ring on the grid while the camera
// orbits. text-to-cad, its GitHub address, and TOOL MAN · A NEW TOOL EVERY DAY.
import type { Cam } from '@kit/_vo';
import { drawParts, gear, knob, phoneStand, stepper, wallBracket, type V3 } from '@kit/_cad3d';
import { Viewport, headline, tag, PART, clamp, ease } from '@ep/viewport';

export default class Outro extends Viewport {
  build() {
    this.take('Your AI just learned CAD', ['learned', 'CAD.', "today's", 'tool.', 'new', 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.06, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const v = { yaw: 0.2 + 0.32 * (t - this.ctx.start), pitch: 0.5, dist: 1300, s: 2.9, target: [0, 0, 25] as V3 };
    this.gizmoView = v;
    const ring = (i: number, n: number): V3 => [110 * Math.cos((i / n) * Math.PI * 2), 110 * Math.sin((i / n) * Math.PI * 2), 0];
    const pop = (i: number) => ease.outBack(clamp((t - this.ctx.start - i * 0.12) / 0.35));
    drawParts(ctx, c, 0, 110, v, [
      { mesh: phoneStand(PART), xf: { at: ring(0, 5), rz: 0.4, s: pop(0) } },
      { mesh: wallBracket(40, PART), xf: { at: ring(1, 5), rz: 1.2, s: pop(1) } },
      { mesh: gear(18, 30, 10, '#C9A86A'), xf: { at: ring(2, 5), rz: t * 0.8, s: pop(2) } },
      { mesh: knob('#2A2F36'), xf: { at: ring(3, 5), s: 1.4 * pop(3) } },
      { mesh: stepper('#2C323B', '#C9CED6'), xf: { at: ring(4, 5), rz: 0.3, s: 0.9 * pop(4) } },
    ], { grid: 300, gridStep: 10 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    headline(ctx, c, 'text-to-cad', 0, -330, 150, t, this.ctx.start + 0.05);
    tag(ctx, c, 'github.com/earthtojake/text-to-cad', 0, -175, 32, { a: clamp((t - w.learned!.start) / 0.2), mono: true });
    tag(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 300, 32, { a: clamp((t - w.new!.start + 0.1) / 0.2), bg: 'rgba(255,122,26,0.95)', fg: '#0D1117' });
  }
}
