// ASK: "Then you just ask: a wall bracket for a shelf, 40 mm wide, with two screw holes."
// The request types itself into the chat as it is spoken. In the viewport the bracket appears as a blue ghost
// on "wall bracket", gets its 40 mm dimension on "40 mm wide", and its two screw holes light up orange on
// "two screw holes" before the part turns solid.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { circle, drawParts, wallBracket, type V3 } from '@kit/_cad3d';
import { Viewport, panel, chat, dim, at3, PART, ORANGE, clamp, ease } from '@ep/viewport';

export const BRACKET_VIEW = (t: number) => ({ yaw: 2.35 + 0.12 * t, pitch: 0.42, dist: 900, s: 5.6, target: [0, 18, 30] as V3 });
export function holePaint(cen: V3) {
  return (Math.hypot(cen[0], cen[2] - 16) < 3.6 || Math.hypot(cen[0], cen[2] - 38) < 3.6) && cen[1] > -0.5 && cen[1] < 5.5 ? ORANGE : null;
}

export default class Ask extends Viewport {
  build() {
    this.take('Then you just ask', ['ask:', 'wall', 'bracket', 'shelf,', '40', 'mm', 'wide,', 'two', 'screw', 'holes.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 60, 0, 1.04, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = BRACKET_VIEW(t);
    this.gizmoView = v;
    const ga = clamp((t - w.wall!.start + 0.05) / 0.25);
    const solid = ease.inOutCubic(clamp((t - w.holes!.end - 0.05) / 0.5));
    const hot = clamp((t - w.two!.start) / 0.15);
    const P = drawParts(ctx, c, 430, 60, v, [
      { mesh: wallBracket(40, PART), a: ga, wire: 1 - solid, paint: hot > 0 ? holePaint : undefined },
    ], { grid: 240, gridStep: 10, shadow: solid });
    // 40 mm across the top of the arm
    const dk = ease.outCubic(clamp((t - w['40']!.start + 0.05) / 0.35));
    if (dk > 0) dim(ctx, c, at3(P, 430, 60, [-20, 50, 60]), at3(P, 430, 60, [20, 50, 60]), '40 mm', { off: -70, k: dk, size: 30 });
    // rings round the holes
    if (hot > 0) {
      for (const z of [16, 38]) {
        const ring = circle(5.2, 28).map(([a, b]) => at3(P, 430, 60, [a, 5.2, z + b]));
        setWorld(ctx, c, 0, 0, 1, 0);
        ctx.globalAlpha = hot * (0.6 + 0.4 * Math.sin(t * 9) ** 2);
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 4;
        ctx.beginPath(); ring.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const ca = clamp((t - this.ctx.start) / 0.25);
    panel(ctx, c, -900, -300, 760, 520, 'chat · your agent', { a: ca });
    const tm = w.ask!.end;
    const msg = 'A wall bracket for a shelf, 40 mm wide, with two screw holes.';
    chat(ctx, c, -860, -220, 680, [[msg, 'me', tm]], t, { size: 34, a: ca, cps: msg.length / Math.max(0.6, w.holes!.end - tm) });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.holes!.end + 0.1, 0.012) }; }
}
