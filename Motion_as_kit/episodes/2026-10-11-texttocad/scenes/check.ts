// CHECK: "Before you print, it checks the design: walls too thin to print, and overhangs that need support."
// The bracket stands as it would print. A scan plane sweeps up it on "checks"; on "walls too thin" the thin
// gusset turns red; on "overhangs" the shelf arm, hanging out in the air, turns orange, and support columns
// grow under it on "support". A check list fills in on the right.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { drawParts, project, wallBracket, type V3 } from '@kit/_cad3d';
import { Viewport, panel, check, tag, at3, PART, ORANGE, RED, BLUE, clamp, ease } from '@ep/viewport';

export default class Check extends Viewport {
  build() {
    this.take('Before you print', ['print,', 'checks', 'design:', 'walls', 'thin', ['print2', 'print', 1], 'overhangs', 'support.']);
    const K = this.cam;
    K.key(this.ctx.start, -120, 0, 1.04, 0);
    K.key(this.ctx.end, -80, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = { yaw: 2.2 + 0.1 * t, pitch: 0.3, dist: 900, s: 6.2, target: [0, 20, 30] as V3 };
    this.gizmoView = v;
    const thin = t > w.walls!.start;
    const over = t > w.overhangs!.start;
    const paint = (cen: V3) => {
      if (thin && Math.abs(cen[0]) < 3.2 && cen[1] > 4 && cen[1] < 43 && cen[2] < 55) return RED;
      if (over && cen[2] > 54 && cen[1] > 6) return ORANGE;
      return null;
    };
    const P = drawParts(ctx, c, -250, 40, v, [{ mesh: wallBracket(40, PART), paint }], { grid: 220, gridStep: 10 });
    // the scan plane
    const sk = clamp((t - w.checks!.start) / Math.max(0.6, w.design!.end - w.checks!.start));
    if (sk > 0 && sk < 1) {
      const z = 62 * sk;
      const q = ([[-40, -15], [40, -15], [40, 65], [-40, 65]] as [number, number][]).map(([x, y]) => project(P, [x, y, z]));
      setWorld(ctx, c, -250, 40, 1, 0);
      ctx.fillStyle = 'rgba(61,139,255,0.18)'; ctx.strokeStyle = BLUE; ctx.lineWidth = 2;
      ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // support columns under the arm
    const sp = ease.outCubic(clamp((t - w.support!.start + 0.1) / 0.5));
    if (sp > 0) {
      setWorld(ctx, c, -250, 40, 1, 0);
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      for (const x of [-16, -8, 8, 16]) for (const y of [12, 24, 36, 47]) {
        const a = project(P, [x, y, 0]), b = project(P, [x, y, 55 * sp]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (thin) tag(ctx, c, 'THIN WALL', ...at3(P, -250, 40, [0, 20, 30]), 30, { a: clamp((t - w.walls!.start) / 0.15), bg: 'rgba(255,90,95,0.95)' });
    if (over) tag(ctx, c, 'OVERHANG', ...at3(P, -250, 40, [0, 40, 75]), 30, { a: clamp((t - w.overhangs!.start) / 0.15), bg: 'rgba(255,122,26,0.95)', fg: '#0D1117' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const pa = clamp((t - w.checks!.start + 0.1) / 0.25);
    panel(ctx, c, 300, -300, 500, 400, 'printability check', { a: pa, accent: BLUE });
    check(ctx, c, 340, -170, 'Wall thickness', false, { a: clamp((t - w.thin!.start) / 0.15) });
    check(ctx, c, 340, -80, 'Overhangs', false, { a: clamp((t - w.overhangs!.start) / 0.15) });
    check(ctx, c, 340, 10, 'Supports added', true, { a: clamp((t - w.support!.start) / 0.15) });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.walls!.start, 0.012) }; }
}
