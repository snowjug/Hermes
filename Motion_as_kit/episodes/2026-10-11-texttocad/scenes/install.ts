// INSTALL: "You don't even install it yourself. You tell your agent: install text-to-cad, and paste the link."
// A terminal greys out and is struck through: no setup commands. A chat with the agent: the install message
// types itself (the link included) and the agent answers that text-to-cad is ready.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts } from '@kit/_cad3d';
import { Viewport, panel, chat, tag, MONO, SOFT, GREEN, RED, clamp, ease, lerp } from '@ep/viewport';

export default class Install extends Viewport {
  build() {
    this.take("You don't even install", ['install', 'yourself.', 'tell', ['install2', 'install', 1], 'texttocad,', 'paste', 'link.']);
    const K = this.cam;
    K.key(this.ctx.start, -240, 0, 1.08, 0);
    K.key(this.w.tell!.start - 0.05, -200, 0, 1.08, 0);
    K.key(this.w.tell!.start + 0.5, 120, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 130, 0, 1.02, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawParts(ctx, c, 0, 200, { yaw: -0.2 + 0.08 * t, pitch: 0.5, dist: 1100, s: 3.6 }, [], { grid: 380, gridStep: 10, a: 0.45 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the terminal you can skip
    const ta = clamp((t - this.ctx.start) / 0.2);
    panel(ctx, c, -800, -260, 620, 360, 'terminal', { a: ta * 0.9 });
    setWorld(ctx, c, -800, -260, 1, 0);
    ctx.globalAlpha = ta * 0.75;
    ctx.font = font(MONO, 24); ctx.fillStyle = SOFT;
    ['$ setup steps…', '$ config…', '$ restart…'].forEach((s, i) => ctx.fillText(s, 34, 110 + i * 46));
    const sk = ease.outCubic(clamp((t - w.install!.start) / 0.3));
    ctx.strokeStyle = RED; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(40, 320); ctx.lineTo(lerp(40, 580, sk), lerp(320, 70, sk)); ctx.stroke();
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    tag(ctx, c, 'NO SETUP COMMANDS', -490, 160, 32, { a: clamp((t - w.yourself!.start) / 0.15), bg: 'rgba(255,90,95,0.95)' });
    // the chat
    const ca = clamp((t - w.tell!.start + 0.2) / 0.25);
    panel(ctx, c, -120, -330, 900, 560, 'chat · your agent', { a: ca });
    const tm = w.install2!.start - 0.05, tr = Math.max(w.link!.end + 0.15, tm + 1.6);
    chat(ctx, c, -80, -250, 820, [
      ['Install text-to-cad from https://github.com/earthtojake/text-to-cad', 'me', tm],
      ['Installing text-to-cad…  done. Ask me for a part.', 'ai', tr],
    ], t, { size: 30, a: ca, cps: 68 / Math.max(0.6, w.link!.end - tm) });
    if (t > tr + 0.1) tag(ctx, c, 'READY ✓', 590, 140, 34, { a: clamp((t - tr - 0.1) / 0.15), bg: 'rgba(54,211,153,0.95)', fg: '#0D1117' });
    void GREEN;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.link!.start, 0.012) }; }
}
