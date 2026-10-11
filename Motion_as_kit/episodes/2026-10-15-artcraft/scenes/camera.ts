// 06 CAMERA: "Then put the camera exactly where you want it, and frame the shot."
// The camera on its tripod glides in on "camera"; its field of view opens on "exactly" as an amber frustum. On
// "frame the shot" we cut into the lens: the room through the virtual camera, with rule-of-thirds lines and
// FRAMED on tape.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { drawParts, xform, xpt, type Obj } from '@kit/_cad3d';
import { Cinema, room, figures, rig, frustum, tape, AMBER, IVORY, clamp, ease } from '@ep/cinema';
import { STAGE, POV, cast, RIG_XF } from '@ep/set';

export default class CameraScene extends Cinema {
  override scene = 2;
  build() {
    this.take('Then put the camera', ['camera', 'exactly', 'want', 'frame', 'shot.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.05, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }
  override letterbox(t: number) { return clamp((t - this.w.frame!.start) / 0.3); }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const pov = ease.inOutCubic(clamp((t - w.frame!.start + 0.1) / 0.35));
    const fs = cast(1);
    if (pov < 1) {
      const v = STAGE(t, this.ctx.start, 0.75, 0.04, 1.3);
      const gk = ease.outCubic(clamp((t - w.camera!.start + 0.2) / 0.7));
      const objs: Obj[] = [{ mesh: room() }, { mesh: figures(fs) }, { mesh: xform(rig(RIG_XF), { at: [-260 * (1 - gk), -120 * (1 - gk), 0] }) }];
      const P = drawParts(ctx, c, 0, 100, v, objs, { shadow: 1, a: 1 - pov });
      const lens = xpt([0, -34, 150], RIG_XF);
      frustum(ctx, c, 0, 100, P, lens, [0, 1, 0], ease.outCubic(clamp((t - w.exactly!.start) / 0.5)) * (1 - pov));
    }
    if (pov > 0) {
      drawParts(ctx, c, 0, 0, POV, [{ mesh: room() }, { mesh: figures(fs) }], { shadow: 1, a: pov });
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.strokeStyle = 'rgba(241,236,226,0.35)'; ctx.lineWidth = 2; ctx.globalAlpha = pov;
      for (const u of [-1, 1]) { ctx.beginPath(); ctx.moveTo(u * 310, -400); ctx.lineTo(u * 310, 400); ctx.moveTo(-930, u * 135); ctx.lineTo(930, u * 135); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tape(ctx, c, 'CAMERA', -620, -320, 34, { a: clamp((t - w.camera!.start) / 0.2) * (1 - clamp((t - w.frame!.start) / 0.2)) });
    tape(ctx, c, 'FRAMED', 640, -250, 34, { a: clamp((t - w.shot!.start) / 0.2), col: AMBER });
    void IVORY;
  }
}
