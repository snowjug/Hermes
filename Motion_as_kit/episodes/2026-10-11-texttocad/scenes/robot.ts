// ROBOT: "It even writes the files that describe a robot, and reviews parts for CNC machining and sheet metal."
// A robot arm on the grid moves its joints; each joint gets its name tag (URDF). Then the camera slides right: a
// block with a pocket and an end mill tracing it (CNC ✓), and a bent sheet-metal bracket with its bend line
// (SHEET METAL ✓).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { box, circle, cyl, drawParts, extrude, join, project, rect, roundRect, xform, type V3 } from '@kit/_cad3d';
import { Viewport, tag, at3, PART, ORANGE, GREEN, BLUE, clamp, ease } from '@ep/viewport';

function arm(t: number) {
  const a1 = 0.6 * Math.sin(t * 0.9), a2 = -0.5 + 0.35 * Math.sin(t * 1.3 + 1), a3 = 1.1 + 0.4 * Math.sin(t * 1.1 + 2);
  const base = cyl(26, 12, { col: '#2C323B' });
  const turret = cyl(18, 26, { col: ORANGE, at: [0, 0, 12] });
  const upper = xform(box(16, 16, 80, { col: PART, r: 4 }), { ry: a2, at: [0, 0, 38] });
  const j2: V3 = [Math.sin(a2) * 80, 0, 38 + Math.cos(a2) * 80];
  const elbow = xform(extrude(circle(11, 24), [], 22, { plane: 'xz', w0: -11, col: ORANGE }), { at: j2 });
  const fore = xform(box(12, 12, 64, { col: PART, r: 3 }), { ry: a2 + a3, at: j2 });
  const j3: V3 = [j2[0] + Math.sin(a2 + a3) * 64, 0, j2[2] + Math.cos(a2 + a3) * 64];
  const grip = join(xform(box(4, 14, 18, { col: '#2C323B' }), { ry: a2 + a3, at: [j3[0] - 6, 0, j3[2]] }), xform(box(4, 14, 18, { col: '#2C323B' }), { ry: a2 + a3, at: [j3[0] + 6, 0, j3[2]] }));
  const all = xform(join(base, turret, upper, elbow, fore, grip), { rz: a1 });
  const rot = (p: V3): V3 => [p[0] * Math.cos(a1) - p[1] * Math.sin(a1), p[0] * Math.sin(a1) + p[1] * Math.cos(a1), p[2]];
  return { mesh: all, joints: [[0, 0, 24], rot([0, 0, 38]), rot(j2), rot(j3)] as V3[] };
}

export default class Robot extends Viewport {
  build() {
    this.take('It even writes the files', ['files', 'describe', 'robot,', 'reviews', 'CNC', 'machining', 'sheet', 'metal.']);
    const K = this.cam;
    K.key(this.ctx.start, -260, 0, 1.05, 0);
    K.key(this.w.reviews!.start - 0.1, -240, 0, 1.05, 0);
    K.key(this.w.reviews!.start + 0.5, 120, 0, 0.98, 0, ease.inOutCubic);
    K.key(this.ctx.end, 130, 0, 0.97, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = { yaw: 0.5 + 0.1 * t, pitch: 0.38, dist: 1000, s: 3.6, target: [0, 0, 60] as V3 };
    this.gizmoView = v;
    const A = arm(t);
    const P = drawParts(ctx, c, -380, 60, v, [{ mesh: A.mesh }], { grid: 200, gridStep: 10 });
    const names = ['base_link', 'joint_1', 'joint_2', 'gripper'];
    A.joints.forEach((j, i) => {
      const k = clamp((t - w.describe!.start - i * 0.18) / 0.15);
      if (k <= 0) return;
      const [x, y] = at3(P, -380, 60, j);
      setWorld(ctx, c, x, y, 1, 0);
      ctx.globalAlpha = k; ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tag(ctx, c, names[i]!, x + (i % 2 ? 130 : -130), y - 10, 22, { a: k, mono: true, stroke: BLUE });
    });
    // CNC: a block with a pocket and an end mill tracing it
    const ca = clamp((t - w.cnc!.start + 0.3) / 0.3);
    if (ca > 0) {
      const v2 = { yaw: 0.7, pitch: 0.6, dist: 900, s: 4.6, target: [0, 0, 12] as V3 };
      const block = extrude(rect(70, 50), [roundRect(36, 22, 5)], 22, { col: '#B9C2CE' });
      const floor = extrude(roundRect(36, 22, 5), [], 9, { col: '#9AA5B4' });
      const k = (t * 0.6) % 1, pa = k * Math.PI * 2;
      const mill = cyl(3, 34, { col: '#E6E9EE', at: [13 * Math.cos(pa), 6 * Math.sin(pa), 9] });
      const P2 = drawParts(ctx, c, 380, -110, v2, [{ mesh: join(block, floor), a: ca }, { mesh: mill, a: ca }], { shadow: 0.6 });
      const tip = project(P2, [13 * Math.cos(pa), 6 * Math.sin(pa), 9]);
      setWorld(ctx, c, 380, -110, 1, 0);
      ctx.globalAlpha = ca; ctx.fillStyle = 'rgba(255,200,120,0.9)';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(tip[0] + Math.sin(t * 40 + i) * 14, tip[1] - 6 - ((t * 60 + i * 9) % 26), 2.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // sheet metal: a plate bent up 90 degrees with its bend line
    const sa = clamp((t - w.sheet!.start + 0.3) / 0.3);
    if (sa > 0) {
      const bend = ease.inOutCubic(clamp((t - w.sheet!.start) / 0.6)) * (Math.PI / 2);
      const v3 = { yaw: 0.9, pitch: 0.45, dist: 900, s: 4.2, target: [0, 0, 12] as V3 };
      const flat = extrude(rect(60, 40, 0, 0), [rect(8, 4, -15, 0), rect(8, 4, 15, 0)], 2, { col: '#C7CDD6' });
      const flange = xform(extrude(rect(60, 30, 0, 15), [], 2, { col: '#C7CDD6' }), { rx: bend, at: [0, 20, 0] });
      const P3 = drawParts(ctx, c, 700, 150, v3, [{ mesh: join(flat, flange), a: sa }], { shadow: 0.6 });
      const a = project(P3, [-30, 20, 2]), b = project(P3, [30, 20, 2]);
      setWorld(ctx, c, 700, 150, 1, 0);
      ctx.globalAlpha = sa; ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tag(ctx, c, 'ROBOT DESCRIPTION · URDF', -380, -330, 30, { a: clamp((t - w.robot!.start) / 0.15), bg: 'rgba(61,139,255,0.95)' });
    tag(ctx, c, 'CNC ✓', 380, -320, 34, { a: clamp((t - w.machining!.start) / 0.15), bg: 'rgba(54,211,153,0.95)', fg: '#0D1117' });
    tag(ctx, c, 'SHEET METAL ✓', 700, 330, 34, { a: clamp((t - w.metal!.start) / 0.15), bg: 'rgba(54,211,153,0.95)', fg: '#0D1117' });
    void GREEN;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.reviews!.start, 0.01) }; }
}
