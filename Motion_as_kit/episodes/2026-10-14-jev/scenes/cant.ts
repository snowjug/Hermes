// 02 CAN'T: "This one can't chat. It won't even write code."
// Silence after the noise: an empty page and one red dot dropping into the middle. CAN'T CHAT. rises beside
// it; a chat bubble and a { } code mark appear and are struck through, one on each word.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, kinetic, dot, label, bubble, MONOB, INK, RED, clamp, ease, lerp } from '@ep/swiss';

export default class Cant extends Swiss {
  override wipeIn = RED;
  override section = 2;
  build() {
    this.take('This one', ['This', "can't", 'chat.', 'write', 'code.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.04, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const dk = ob(clamp((t - this.ctx.start - 0.15) / 0.4));
    dot(ctx, c, -620, lerp(-500, -40, dk), 70, { a: clamp(dk * 3), pulse: clamp((t - w.chat!.end) / 0.6) });
    // the struck-through chat bubble
    bubble(ctx, c, 420, -170, 360, 150, t, w.chat!.start - 0.15, { seed: 11 });
    const s1 = ease.outCubic(clamp((t - w.chat!.start - 0.05) / 0.25));
    if (s1 > 0) { setWorld(ctx, c, 0, 0, 1, 0); ctx.strokeStyle = RED; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(220, -60); ctx.lineTo(lerp(220, 620, s1), lerp(-60, -280, s1)); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
    // the struck-through code mark
    const ca = clamp((t - w.write!.start + 0.1) / 0.2);
    if (ca > 0) {
      setWorld(ctx, c, 420, 150, 1, 0);
      ctx.globalAlpha = ca; ctx.fillStyle = INK; ctx.font = font(MONOB, 170); ctx.textAlign = 'center'; ctx.fillText('{ }', 0, 60);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      const s2 = ease.outCubic(clamp((t - w.code!.start - 0.05) / 0.25));
      if (s2 > 0) { setWorld(ctx, c, 0, 0, 1, 0); ctx.strokeStyle = RED; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(240, 240); ctx.lineTo(lerp(240, 600, s2), lerp(240, 60, s2)); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    label(ctx, c, 'THIS ONE', -500, -250, { a: clamp((t - w.this!.start) / 0.2), rule: true });
    kinetic(ctx, c, "CAN'T", -500, -10, 200, t, w.cant!.start - 0.06);
    kinetic(ctx, c, 'CHAT.', -500, 180, 200, t, w.chat!.start - 0.08, { col: RED });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.chat!.start, 0.025) }; }
}
