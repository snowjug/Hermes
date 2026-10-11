// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// The video's contrast in one frame: on the left, a crowd of grey chat bubbles struck through in red; on the
// right, one huge red dot with 0.97 beside it. NO CHAT. JUST DECISIONS. across the top in the editorial type.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, bubble, dot, HEAD, MONOB, INK, RED, hash } from '@ep/swiss';

export default class Thumb extends Swiss {
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }
  override init() { super.init(); this.chunks = []; }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    for (let i = 0; i < 9; i++) {
      bubble(ctx, c, -620 + 380 * (hash(i, 1) - 0.5) * 1.6, 130 + 300 * (hash(i, 2) - 0.5), 260, 90 + 40 * hash(i, 3), t, -10, { seed: i });
    }
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.strokeStyle = RED; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-900, 360); ctx.lineTo(-300, -80); ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    dot(ctx, c, 330, 150, 190);
    setWorld(ctx, c, 560, 190, 1, 0);
    ctx.fillStyle = INK; ctx.font = font(MONOB, 120); ctx.fillText('0.97', 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    setWorld(ctx, c, -860, -250, 1, 0);
    ctx.font = font(HEAD, 210); ctx.fillStyle = INK; ctx.fillText('NO CHAT.', 0, 0);
    ctx.fillStyle = RED; ctx.font = font(HEAD, 128); ctx.fillText('JUST DECISIONS.', 6, 140);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
