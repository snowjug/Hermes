// WINDOWS: "And on Windows 11, Smart App Control can block its CAD engine. Turning that off is one-way, so WSL is
// the safer route."
// A shield (Smart App Control) drops a red barrier in front of the CAD engine block: BLOCKED. A switch flips to
// OFF with a one-way arrow (it only comes back with a Windows reinstall). On "WSL" a Linux terminal slides in,
// `cadgen doctor` says the CAD kernel loads, and the part turns happily inside it: SAFER ROUTE.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, knob } from '@kit/_cad3d';
import { Viewport, panel, tag, headline, BODY, MONO, HEAD, SOFT, WHITE, GREEN, RED, ORANGE, PART, clamp, ease, lerp } from '@ep/viewport';

export default class Windows extends Viewport {
  build() {
    this.take('And on Windows', ['Windows', '11,', 'Smart', 'block', 'engine.', 'Turning', 'oneway,', 'WSL', 'safer', 'route.']);
    const K = this.cam;
    K.key(this.ctx.start, -200, 0, 1.06, 0);
    K.key(this.w.wsl!.start - 0.1, -160, 0, 1.06, 0);
    K.key(this.w.wsl!.start + 0.45, 120, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 130, 0, 1.0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    headline(ctx, c, 'WINDOWS 11', -560, -380, 90, t, w.windows!.start - 0.05, { col: WHITE });
    // the shield
    const sk = ease.outBack(clamp((t - w.smart!.start + 0.05) / 0.3));
    if (sk > 0) {
      setWorld(ctx, c, -760, -60, 0.6 + 0.4 * sk, 0);
      ctx.globalAlpha = clamp(sk);
      ctx.fillStyle = 'rgba(61,139,255,0.18)'; ctx.strokeStyle = '#6FB1FF'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, -110); ctx.lineTo(90, -76); ctx.lineTo(90, 6); ctx.quadraticCurveTo(80, 80, 0, 116); ctx.quadraticCurveTo(-80, 80, -90, 6); ctx.lineTo(-90, -76); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = WHITE; ctx.font = font(BODY, 26); ctx.textAlign = 'center'; ctx.fillText('Smart App', 0, 164); ctx.fillText('Control', 0, 196);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the CAD engine block and the barrier
    const ea = clamp((t - w.smart!.start) / 0.25);
    setWorld(ctx, c, -330, -60, 1, 0);
    ctx.globalAlpha = ea;
    ctx.fillStyle = 'rgba(18,23,31,0.96)'; ctx.beginPath(); ctx.roundRect(-170, -90, 340, 180, 20); ctx.fill();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = WHITE; ctx.font = font(HEAD, 46); ctx.textAlign = 'center'; ctx.fillText('CAD ENGINE', 0, 4);
    ctx.fillStyle = SOFT; ctx.font = font(MONO, 22); ctx.fillText('OCP · OpenCascade', 0, 46);
    const bk = ease.outBack(clamp((t - w.block!.start) / 0.3));
    if (bk > 0) {
      ctx.save(); ctx.translate(0, -200 * (1 - bk)); ctx.rotate(-0.08);
      ctx.fillStyle = RED; ctx.fillRect(-210, -24, 420, 48);
      ctx.fillStyle = '#FFFFFF'; for (let i = -6; i < 7; i++) { ctx.beginPath(); ctx.moveTo(i * 36, -24); ctx.lineTo(i * 36 + 18, -24); ctx.lineTo(i * 36 - 6, 24); ctx.lineTo(i * 36 - 24, 24); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = RED; ctx.font = font(HEAD, 40); ctx.fillText('BLOCKED', 0, 150);
    }
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the one-way switch
    const swa = clamp((t - w.turning!.start + 0.1) / 0.2);
    if (swa > 0) {
      const flip = ease.inOutCubic(clamp((t - w.turning!.start - 0.15) / 0.3));
      setWorld(ctx, c, -560, 170, 1, 0);
      ctx.globalAlpha = swa;
      ctx.fillStyle = flip > 0.5 ? '#3B4452' : GREEN; ctx.beginPath(); ctx.roundRect(-70, -34, 140, 68, 34); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(lerp(36, -36, flip), 0, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = WHITE; ctx.font = font(BODY, 30); ctx.fillText(flip > 0.5 ? 'OFF' : 'ON', 96, 11);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tag(ctx, c, 'ONE-WAY: BACK ON ONLY BY REINSTALLING WINDOWS', -420, 265, 26, { a: clamp((t - w.oneway!.start) / 0.15), bg: 'rgba(255,90,95,0.95)' });
    }
    // WSL
    const wa = clamp((t - w.wsl!.start + 0.05) / 0.3);
    if (wa > 0) {
      panel(ctx, c, 250, -300, 640, 520, 'WSL · Linux', { a: wa, accent: GREEN });
      setWorld(ctx, c, 280, -210, 1, 0);
      ctx.globalAlpha = wa; ctx.font = font(MONO, 26);
      ctx.fillStyle = GREEN; ctx.fillText('$', 0, 0); ctx.fillStyle = WHITE; ctx.fillText('uvx cadgen doctor', 30, 0);
      if (t > w.wsl!.end + 0.2) { ctx.fillStyle = GREEN; ctx.fillText('✓ CAD kernel loads', 0, 46); }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawParts(ctx, c, 570, 60, { yaw: t * 0.9, pitch: 0.55, dist: 800, s: 6, target: [0, 0, 9] }, [{ mesh: knob(PART), a: clamp((t - w.wsl!.end - 0.2) / 0.3) }], { shadow: 0.6 });
      tag(ctx, c, 'SAFER ROUTE ✓', 570, 300, 34, { a: clamp((t - w.safer!.start) / 0.15), bg: 'rgba(54,211,153,0.95)', fg: '#0D1117' });
    }
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.block!.start + 0.15, 0.02) }; }
}
