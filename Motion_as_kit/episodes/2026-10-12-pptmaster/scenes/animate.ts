// ANIMATE: "It even adds native transitions, animations, and a voice-over narration."
// A slide pushes into the next with a morph (TRANSITIONS); its pieces fly in on an animation timeline whose
// bars fill (ANIMATIONS); a microphone and a live waveform under the deck (NARRATION).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, slide, glass, pill, headline, BODY, WHITE, SOFT, ORANGE, VIOLET, TEAL, clamp, ease, TAU } from '@ep/keynote';

export default class Animate extends Keynote {
  build() {
    this.take('It even adds', ['adds', 'native', 'transitions,', 'animations,', 'voice-over', 'narration.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -20, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 0.96, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // morphing slides
    const ph = (t - this.ctx.start) * 0.9;
    const i = Math.floor(ph), f = ease.inOutCubic(ph - i);
    const kinds = ['title', 'chart', 'image', 'table'] as const;
    slide(ctx, c, -200 - 760 * f, -40, 640, { kind: kinds[i % 4], title: ['Welcome', 'Growth', 'Product', 'Numbers'][i % 4], accent: [ORANGE, VIOLET, TEAL][i % 3], a: 1 - f * 0.6, rot: -0.04 * f, seed: i });
    slide(ctx, c, 560 - 760 * f, -40, 640, { kind: kinds[(i + 1) % 4], title: ['Welcome', 'Growth', 'Product', 'Numbers'][(i + 1) % 4], accent: [ORANGE, VIOLET, TEAL][(i + 1) % 3], a: 0.4 + 0.6 * f, build: f, rot: 0.04 * (1 - f), seed: i + 1, glow: 0.4 * f });
    pill(ctx, c, 'TRANSITIONS', -560, 230, 30, { a: clamp((t - w.transitions!.start) / 0.2), bg: 'rgba(255,91,58,0.9)' });
    // the animation timeline
    const ka = clamp((t - w.animations!.start + 0.05) / 0.25);
    if (ka > 0) {
      glass(ctx, c, -100, 170, 560, 170, { a: ka, r: 18 });
      setWorld(ctx, c, -100, 170, 1, 0); ctx.globalAlpha = ka;
      ctx.font = font(BODY, 24); ctx.fillStyle = SOFT; ctx.fillText('ANIMATIONS', 24, 38);
      for (let r = 0; r < 3; r++) {
        const fill = clamp((t - w.animations!.start - r * 0.25) / 0.6);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(24 + r * 60, 60 + r * 34, 380, 22);
        ctx.fillStyle = [ORANGE, VIOLET, TEAL][r]!; ctx.fillRect(24 + r * 60, 60 + r * 34, 380 * fill, 22);
      }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // narration
    const kn = clamp((t - w.voiceover!.start + 0.05) / 0.25);
    if (kn > 0) {
      glass(ctx, c, 500, 170, 380, 170, { a: kn, r: 18 });
      setWorld(ctx, c, 500, 170, 1, 0); ctx.globalAlpha = kn;
      ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.roundRect(30, 50, 40, 70, 20); ctx.fill();
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(50, 95, 34, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = WHITE; ctx.lineWidth = 5;
      ctx.beginPath();
      for (let x = 0; x <= 240; x += 6) { const a = Math.sin(x * 0.09 + t * 14) * Math.sin(x * 0.021 + t * 3) * 40; x ? ctx.lineTo(110 + x, 85 + a) : ctx.moveTo(110 + x, 85 + a); }
      ctx.stroke();
      ctx.font = font(BODY, 24); ctx.fillStyle = SOFT; ctx.fillText('NARRATION', 110, 150);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void TAU;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'IT EVEN MOVES', 0, -360, 86, t, this.w.adds!.start - 0.05, { from: '#FFFFFF', to: '#C9C2FF' });
  }
}
