// PLAN: "First, it agrees on a plan with you: the template, sixteen by nine, eight to ten pages."
// The chat window answers: Sure. Let's confirm the design spec. Three spec rows tick on their words:
// [Template] Free design, [Format] PPT 16:9 (a 16:9 frame draws itself beside it), [Pages] 8-10 (a stack of
// page thumbnails counts up).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, slide, headline, BODY, HEAD, SOFT, WHITE, TEAL, ORANGE, VIOLET, clamp, ease } from '@ep/keynote';

export default class Plan extends Keynote {
  build() {
    this.take('First, it agrees', ['agrees', 'plan', 'template,', 'sixteen', 'nine,', 'eight', 'ten', 'pages.']);
    const K = this.cam;
    K.key(this.ctx.start, -160, -20, 1.04, 0);
    K.key(this.ctx.end, 40, -10, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    glass(ctx, c, -860, -300, 860, 560, { a: clamp((t - this.ctx.start) / 0.2) });
    setWorld(ctx, c, -860, -300, 1, 0);
    ctx.font = font(BODY, 34); ctx.fillStyle = WHITE; ctx.fillText("Sure. Let's confirm the design spec:", 50, 90);
    const rows: [string, string, number][] = [['[Template]', 'Free design', w.template!.start], ['[Format]', 'PPT 16:9', w.sixteen!.start], ['[Pages]', '8 – 10 pages', w.eight!.start]];
    rows.forEach(([k, v, t0], i) => {
      const a = clamp((t - t0 + 0.1) / 0.2);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(40, 150 + i * 110, 780, 86, 18); ctx.fill();
      ctx.font = font(F2, 34); ctx.fillStyle = SOFT; ctx.fillText(k, 70, 205 + i * 110);
      ctx.font = font(HEAD, 40); ctx.fillStyle = WHITE; ctx.fillText(v, 330, 207 + i * 110);
      const tk = clamp((t - t0 - 0.15) / 0.25);
      ctx.strokeStyle = TEAL; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(740, 192 + i * 110);
      ctx.lineTo(740 + 18 * Math.min(1, tk * 2), 192 + i * 110 + 18 * Math.min(1, tk * 2));
      if (tk > 0.5) ctx.lineTo(758 + 34 * (tk - 0.5) * 2, 210 + i * 110 - 40 * (tk - 0.5) * 2);
      ctx.stroke(); ctx.lineCap = 'butt';
      ctx.globalAlpha = 1;
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the 16:9 frame
    const kf = clamp((t - w.sixteen!.start) / 0.5);
    if (kf > 0) {
      setWorld(ctx, c, 450, -150, 1, 0);
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 6; ctx.setLineDash([]);
      const fw = 400 * ease.outCubic(kf), fh = 225 * ease.outCubic(kf);
      ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
      ctx.font = font(HEAD, 60); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.globalAlpha = kf; ctx.fillText('16 : 9', 0, 20); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the page stack
    if (t > w.eight!.start - 0.05) {
      const n = Math.min(10, Math.floor(1 + (t - w.eight!.start) * 9));
      for (let i = 0; i < n; i++) slide(ctx, c, 330 + i * 26, 160 + i * 14, 260, { kind: (['title', 'bullets', 'chart', 'image', 'table'] as const)[i % 5], title: 'Slide ' + (i + 1), accent: [ORANGE, VIOLET, TEAL][i % 3], a: 1, seed: i, rot: -0.04 });
      setWorld(ctx, c, 500, 380, 1, 0); ctx.font = font(HEAD, 44); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText(`${n} SLIDES`, 0, 0); ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'FIRST, A PLAN', -430, -360, 80, t, this.w.agrees!.start - 0.05, { from: '#FFFFFF', to: '#C9C2FF' });
  }
}

const F2 = BODY;
