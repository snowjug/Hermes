// 02 SET: "This one lets you build the scene first, like a film set, and only then generate."
// The clapper claps the scene open on the bare stage. The room drops in piece by piece on "build the scene";
// the two mannequins arrive on "first"; on "film set" the letterbox closes and the camera on its tripod rolls
// in. On "only then generate" a GENERATE button appears, waiting: LATER.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, xform, type Obj } from '@kit/_cad3d';
import { Cinema, room, figures, rig, tape, MONOB, AMBER, IVORY, clamp, ease, ob } from '@ep/cinema';
import { STAGE, cast, RIG_XF } from '@ep/set';

export default class SetScene extends Cinema {
  override slateIn = true;
  override scene = 1;
  build() {
    this.take('This one lets you build', ['build', 'scene', 'first,', 'film', 'set,', 'only', 'generate.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 20, 1.06, 0);
  }
  override letterbox(t: number) { return clamp((t - this.w.film!.start) / 0.4); }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = STAGE(t, this.ctx.start);
    const drop = (t0: number) => 180 * (1 - ease.outBack(clamp((t - t0) / 0.45)));
    const rk = clamp((t - w.build!.start + 0.15) / 0.2);
    const objs: Obj[] = [];
    if (rk > 0) objs.push({ mesh: room(), xf: { at: [0, 0, drop(w.build!.start)] as [number, number, number] }, a: rk });
    const fk = ob(clamp((t - w.first!.start) / 0.4));
    if (fk > 0) objs.push({ mesh: figures(cast(0)), xf: { s: fk } });
    const rr = ease.outCubic(clamp((t - w.set!.start) / 0.6));
    if (rr > 0) objs.push({ mesh: xform(rig(RIG_XF), { at: [-300 * (1 - rr), 0, 0] }) });
    drawParts(ctx, c, 0, 90, v, objs, { grid: 0, shadow: 1 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tape(ctx, c, 'BUILD THE SCENE FIRST', -560, -300, 36, { a: clamp((t - w.build!.start) / 0.2) });
    const ga = clamp((t - w.only!.start) / 0.25);
    if (ga > 0) {
      setWorld(ctx, c, 600, -300, 0.9 + 0.1 * ob(ga), 0);
      ctx.globalAlpha = ga * 0.9; ctx.fillStyle = 'rgba(245,179,66,0.18)'; ctx.strokeStyle = AMBER; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-150, -40, 300, 80, 40); ctx.fill(); ctx.stroke();
      ctx.fillStyle = AMBER; ctx.font = font(MONOB, 30); ctx.textAlign = 'center'; ctx.fillText('GENERATE', 0, 11);
      ctx.fillStyle = IVORY; ctx.font = font(MONOB, 20); ctx.fillText('LATER', 0, 72);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
}
