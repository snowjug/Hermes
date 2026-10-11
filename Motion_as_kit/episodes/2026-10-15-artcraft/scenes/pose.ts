// 05 POSE: "Drop in a room, place your actors, and pose them like mannequins."
// The clapper claps scene 2 open. The room drops in on "room"; the two wooden mannequins pop onto their marks on
// "actors" (with floor marks); on "pose" they move into their poses, one pointing, one thinking, and the rotation
// gizmo rings appear around the pointing arm's elbow.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { drawParts, project, xpt, type Obj } from '@kit/_cad3d';
import { Cinema, room, figures, tape, AMBER, clamp, ease, ob } from '@ep/cinema';
import { STAGE, cast } from '@ep/set';

export default class Pose extends Cinema {
  override slateIn = true;
  override scene = 2;
  build() {
    this.take('Drop in a room', ['Drop', 'room,', 'place', 'actors,', 'pose', 'mannequins.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.w.pose!.start, 40, 0, 1.08, 0, ease.inOutCubic);
    K.key(this.ctx.end, 60, 0, 1.12, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = STAGE(t, this.ctx.start, 0.5, 0.05, 1.45);
    const objs: Obj[] = [];
    const rk = clamp((t - w.room!.start + 0.25) / 0.2);
    if (rk > 0) objs.push({ mesh: room(), a: rk, xf: { at: [0, 0, 200 * (1 - ease.outBack(clamp((t - w.room!.start + 0.25) / 0.45)))] } });
    const ak = ob(clamp((t - w.actors!.start + 0.1) / 0.35));
    const pk = ease.inOutCubic(clamp((t - w.pose!.start) / 0.8));
    const fs = cast(pk);
    if (ak > 0) objs.push({ mesh: figures(fs), xf: { s: ak } });
    const P = drawParts(ctx, c, 0, 100, v, objs, { shadow: 1 });
    // floor marks (gaffer tape crosses) under each actor
    if (ak > 0) {
      setWorld(ctx, c, 0, 100, 1, 0);
      ctx.strokeStyle = AMBER; ctx.lineWidth = 4; ctx.globalAlpha = clamp((t - w.place!.start) / 0.2);
      for (const f of fs) {
        const [x, y] = [f.xf.at![0], f.xf.at![1]];
        const a = project(P, [x - 22, y, 1]), b = project(P, [x + 22, y, 1]), cc = project(P, [x, y - 22, 1]), d = project(P, [x, y + 22, 1]);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(cc[0], cc[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the rotation gizmo around A's right elbow
    const gk = clamp((t - w.mannequins!.start + 0.3) / 0.3);
    if (gk > 0) {
      const el = project(P, xpt(fs[0]!.pose.elR, fs[0]!.xf));
      setWorld(ctx, c, el[0], 100 + el[1], 1, 0);
      ctx.lineWidth = 4; ctx.globalAlpha = gk;
      ([['#FF4D4D', 0, 0.35], ['#4DFF88', Math.PI / 2, 0.35], ['#4DA6FF', 0, 1]] as [string, number, number][]).forEach(([col, rot, sq]) => {
        ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 46 * gk, 46 * gk * sq, rot + t * 0.3, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tape(ctx, c, 'ROOM', -640, -330, 34, { a: clamp((t - w.room!.start) / 0.2) });
    tape(ctx, c, 'ACTORS', -470, -330, 34, { a: clamp((t - w.actors!.start) / 0.2), rot: 0.02 });
    tape(ctx, c, 'POSE', -300, -330, 34, { a: clamp((t - w.pose!.start) / 0.2), rot: -0.05, col: AMBER });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.pose!.start, 0.012) }; }
}
