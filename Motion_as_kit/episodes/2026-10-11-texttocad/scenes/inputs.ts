// INPUTS: "It also works from a photo or a sketch, and pulls real screws, bearings and motors from a parts
// library."
// A photo of a knob and a pencil sketch of it (Ø32) pin up on the left; an arrow, and the knob comes out in 3D.
// On the right, a parts library: a screw, a bearing and a stepper motor pop into their cards on their words.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { bearing, drawParts, knob, screw, stepper } from '@kit/_cad3d';
import { Viewport, panel, tag, BODY, MONO, HEAD, PART, ORANGE, WHITE, clamp, ease, TAU } from '@ep/viewport';

export default class Inputs extends Viewport {
  build() {
    this.take('It also works from a photo', ['photo', 'sketch,', 'pulls', 'screws,', 'bearings', 'motors', 'parts', 'library.']);
    const K = this.cam;
    K.key(this.ctx.start, -380, 0, 1.15, 0);
    K.key(this.w.sketch!.end + 0.1, -330, 0, 1.12, 0);
    K.key(this.w.pulls!.start + 0.4, 0, 0, 0.97, 0, ease.inOutCubic);
    K.key(this.ctx.end, 20, 0, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the photo
    const ph = ease.outBack(clamp((t - w.photo!.start + 0.1) / 0.35));
    if (ph > 0) {
      setWorld(ctx, c, -760, -150, 0.7 + 0.3 * ph, -0.07);
      ctx.globalAlpha = clamp(ph);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.fillStyle = '#F4F1EA'; ctx.fillRect(-150, -170, 300, 340); ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(0, -150, 0, 110); g.addColorStop(0, '#6B5A48'); g.addColorStop(1, '#2C241D');
      ctx.fillStyle = g; ctx.fillRect(-130, -150, 260, 260);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawParts(ctx, c, -760, -150, { yaw: 0.3, pitch: 0.7, dist: 700, s: 4.2, target: [0, 0, 8] }, [{ mesh: knob('#2A2F36'), a: clamp(ph) }], { shadow: 0.6 });
      setWorld(ctx, c, -760, -150, 0.7 + 0.3 * ph, -0.07);
      ctx.globalAlpha = clamp(ph); ctx.fillStyle = '#3A3A3A'; ctx.font = font(BODY, 24); ctx.fillText('PHOTO', -50, 150);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the sketch
    const sk = ease.outBack(clamp((t - w.sketch!.start + 0.1) / 0.35));
    if (sk > 0) {
      setWorld(ctx, c, -560, 130, 0.7 + 0.3 * sk, 0.06);
      ctx.globalAlpha = clamp(sk);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.fillStyle = '#FBFAF4'; ctx.fillRect(-170, -130, 340, 260); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#4A4A55'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const draw = clamp((t - w.sketch!.start) / 0.6);
      ctx.beginPath(); ctx.arc(-30, 0, 70, 0, TAU * draw); ctx.stroke();
      ctx.beginPath(); ctx.arc(-30, 0, 55, 0, TAU * draw); ctx.stroke();
      for (let i = 0; i < 16 * draw; i++) { const a = (i / 16) * TAU; ctx.beginPath(); ctx.moveTo(-30 + 70 * Math.cos(a), 70 * Math.sin(a)); ctx.lineTo(-30 + 78 * Math.cos(a), 78 * Math.sin(a)); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-100, 100); ctx.lineTo(40, 100); ctx.stroke();
      ctx.fillStyle = '#4A4A55'; ctx.font = font(MONO, 26); ctx.fillText('Ø32', 70, 108);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the knob comes out
    const kk = ease.outCubic(clamp((t - w.sketch!.end - 0.05) / 0.5));
    if (kk > 0) {
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.globalAlpha = kk; ctx.strokeStyle = ORANGE; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-380, -20); ctx.lineTo(-380 + 120 * kk, -20); ctx.lineTo(-400 + 120 * kk, -42); ctx.moveTo(-380 + 120 * kk, -20); ctx.lineTo(-400 + 120 * kk, 2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawParts(ctx, c, -110, 20, { yaw: 0.4 + t * 0.8, pitch: 0.55, dist: 800, s: 6.5 * kk, target: [0, 0, 9] }, [{ mesh: knob(PART), a: kk }], { grid: 60, gridStep: 10 });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const la = clamp((t - w.pulls!.start + 0.1) / 0.25);
    if (la <= 0) return;
    panel(ctx, c, 200, -360, 720, 640, 'step.parts · parts library', { a: la, accent: ORANGE });
    const cards: [string, string, number, ReturnType<typeof screw>, number, number][] = [
      ['SCREW', 'screws', 0, screw(PART), 8, 9],
      ['BEARING', 'bearings', 1, bearing(PART), 6.5, 3.5],
      ['MOTOR', 'motors', 2, stepper('#2C323B', '#C9CED6'), 3.3, 30],
    ];
    for (const [label, key, i, mesh, s, tz] of cards) {
      const k = ease.outBack(clamp((t - w[key]!.start + 0.05) / 0.3));
      const x = 330 + i * 230, y = -40;
      setWorld(ctx, c, x, y, 1, 0);
      ctx.globalAlpha = la;
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.roundRect(-100, -170, 200, 400, 18); ctx.fill();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (k > 0) {
        drawParts(ctx, c, x, y + 40, { yaw: 0.6 + t * 0.9 + i, pitch: 0.45, dist: 700, s: s * k, target: [0, 0, tz] }, [{ mesh, a: clamp(k * 2) }], { shadow: 0.7 });
        setWorld(ctx, c, x, y, 1, 0);
        ctx.globalAlpha = clamp(k * 2); ctx.fillStyle = WHITE; ctx.font = font(HEAD, 34); ctx.textAlign = 'center'; ctx.fillText(label, 0, 200);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    tag(ctx, c, 'REAL, OFF-THE-SHELF PARTS', 560, 300, 30, { a: clamp((t - w.library!.start) / 0.15), bg: 'rgba(255,122,26,0.95)', fg: '#0D1117' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.pulls!.start, 0.012) }; }
}
