// THUMB: the video's thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// AI VOICE: $99/mo struck through in amber, $0 in phosphor, a glowing waveform, the name.
import { type LineBatch } from '@engine/lines';
import { Plate, ARCH, chip, slam, rgba, setWorld, label, font, F, type Cam } from '@kit/_mp';
import { waveBars, speechEnv, lin } from '@ep/vs';

export default class Thumb extends Plate {
  build() {
    this.cam.key(this.ctx.start, 0, 0, 1, 0);
    this.showPen = false;
  }

  gridOpts() { return { ink: 1.4 }; }

  drawUI(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    slam(ctx, c, 'AI VOICE', -880, -250, 190, t, 0, { wt: 900, col: 'bone' });
    slam(ctx, c, '$99/mo', -880, 40, 230, t, 0, { wt: 900, col: 'acid' });
    // the strike
    setWorld(ctx, c, 0, 0);
    ctx.strokeStyle = rgba('acid', 1); ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-900, -20); ctx.lineTo(-40, -110); ctx.stroke();
    ctx.lineCap = 'butt'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    slam(ctx, c, '$0', 120, 120, 420, t, 0, { wt: 900, col: 'signal' });
    chip(ctx, c, 'FREE  ·  OPEN SOURCE  ·  RUNS OFFLINE', 470, -420, { size: 30, border: rgba('signal', 0.9), col: rgba('bone', 1) });
    setWorld(ctx, c, -876, 230);
    ctx.font = font(ARCH(100, 800), 64); ctx.fillStyle = rgba('bone', 1); ctx.fillText('VoiceStudio', 0, 0);
    label(ctx, '52,915 ★ ON GITHUB', 430, -8, { size: 30, col: rgba('signal', 1), spacing: 4, weight: 700 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    void F;
  }

  drawFX(X: LineBatch, _t: number, c: Cam) {
    waveBars(X, c, -900, 900, 400, 90, 150, (u) => speechEnv(u * 9, 7), { I: 1.6, col: lin('signal', 1) });
  }

  postFX() { return { bloom: 0.85, vignette: 0.5, grain: 0.04 }; }
}
