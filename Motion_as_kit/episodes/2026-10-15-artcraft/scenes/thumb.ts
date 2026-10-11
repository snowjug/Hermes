// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// The idea in one frame: on the left the painted shot, on the right the grey-box blocking it came from, the posed
// mannequins and the camera on its tripod, an amber arrow between. DIRECT, DON'T PROMPT. in serif above.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { drawParts } from '@kit/_cad3d';
import { Cinema, room, figures, rig, paintShot, SERIF, SERIFI, AMBER, IVORY } from '@ep/cinema';
import { STAGE, POV, cast, RIG_XF } from '@ep/set';

export default class Thumb extends Cinema {
  override hud = false;
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }
  override init() { super.init(); this.chunks = []; }

  override stage(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const fs = cast(1);
    drawParts(ctx, c, 470, 180, STAGE(0, 0, 0.55, 0, 1.25), [{ mesh: room() }, { mesh: figures(fs) }, { mesh: rig(RIG_XF) }], { shadow: 1 });
    const P = drawParts(ctx, c, -470, 160, { ...POV, s: 1.15 }, [], {});
    paintShot(ctx, c, -470, 160, 820, 461, P, fs, { t: 3 });
    setWorld(ctx, c, -470, 160, 1, 0);
    ctx.strokeStyle = 'rgba(241,236,226,0.7)'; ctx.lineWidth = 3; ctx.strokeRect(-410, -230, 820, 461);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    setWorld(ctx, c, 0, 160, 1, 0);
    ctx.strokeStyle = AMBER; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(245,179,66,0.9)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(-40, 0); ctx.moveTo(0, -42); ctx.lineTo(-44, 0); ctx.lineTo(0, 42); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    setWorld(ctx, c, 0, -300, 1, 0);
    // the two halves set side by side, centred as one line
    const a = 'Direct,', b = "don't prompt.", gap = 48;
    const wa = measure(a, SERIF, 190), wb = measure(b, SERIFI, 190), x0 = -(wa + gap + wb) / 2;
    ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30;
    ctx.font = font(SERIF, 190); ctx.fillStyle = IVORY; ctx.fillText(a, x0, 0);
    ctx.font = font(SERIFI, 190); ctx.fillStyle = AMBER; ctx.fillText(b, x0 + wa + gap, 0);
    ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
