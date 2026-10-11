// 14 DIRECTING: "Stop prompting and praying. Start directing."
// The clapper claps scene 5 open: ACTION. The stage, lit, the cast in their poses and the camera on its marks.
// "Stop prompting and praying." is struck through in amber; START DIRECTING. lands huge in serif.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { measure } from '@engine/type';
import { drawParts } from '@kit/_cad3d';
import { Cinema, room, figures, rig, title, SERIF, SERIFI, AMBER, IVORY, clamp, ease } from '@ep/cinema';
import { STAGE, cast, RIG_XF } from '@ep/set';

export default class Directing extends Cinema {
  override slateIn = true;
  override scene = 5;
  build() {
    this.take('Stop prompting', ['Stop', 'prompting', 'praying.', 'Start', 'directing.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.08, 0, ease.inOutCubic);
  }
  override letterbox() { return 1; }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawParts(ctx, c, 0, 160, STAGE(t, this.ctx.start, -0.1, 0.08, 1.2), [{ mesh: room() }, { mesh: figures(cast(1)) }, { mesh: rig(RIG_XF) }], { a: 0.55 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'Stop prompting and praying.', 0, -150, 84, t, w.stop!.start - 0.05, { f: SERIFI, col: IVORY });
    const sk = ease.outCubic(clamp((t - w.praying!.end) / 0.3));
    if (sk > 0) {
      const tw = measure('Stop prompting and praying.', SERIFI, 84);
      setWorld(ctx, c, 0, -175, 1, 0);
      ctx.strokeStyle = AMBER; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-tw / 2, 0); ctx.lineTo(-tw / 2 + tw * sk, 0); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    title(ctx, c, 'Start directing.', 0, 90, 190, t, w.start!.start - 0.05, { f: SERIF, col: AMBER, glow: 'rgba(245,179,66,0.55)' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.directing!.start, 0.025) }; }
}
