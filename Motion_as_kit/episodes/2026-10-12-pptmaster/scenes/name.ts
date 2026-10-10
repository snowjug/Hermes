// NAME: "It's called PPT Master, and it has 59,000 GitHub stars."
// The deck fans out behind, dimmed; PPT Master lands huge in gradient type. On "59,000" a counter races up
// with stars bursting around it, and pills underneath: FREE · OPEN SOURCE · MIT.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, slide, headline, pill, sparkles, HEAD, ORANGE, VIOLET, TEAL, PEACH, WHITE, clamp, ease, type SlideKind } from '@ep/keynote';

const KINDS: SlideKind[] = ['chart', 'bullets', 'image', 'table', 'quote', 'agenda', 'chart'];

export default class Name extends Keynote {
  build() {
    this.take("It's called", ['called', 'PPT', 'Master,', '59,000', 'GitHub', 'stars.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -30, 1.06, 0);
    K.key(this.ctx.end, 0, -20, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    KINDS.forEach((k, i) => {
      const f = (i - 3) / 3;
      slide(ctx, c, f * 720, 120 + Math.abs(f) * 60, 400, { kind: k, title: ['Q3', 'Plan', 'Market', 'Budget', 'Voices', 'Agenda', 'Growth'][i], accent: [ORANGE, VIOLET, TEAL][i % 3], rot: f * 0.26 + 0.02 * Math.sin(t + i), a: 0.32, seed: i });
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    headline(ctx, c, 'PPT Master', 0, -170, 190, t, w.ppt!.start - 0.08, { from: '#FFFFFF', to: PEACH, glow: 1.4 });
    const ts = w['59000']!.start - 0.05;
    if (t > ts) {
      const k = ease.outCubic(clamp((t - ts) / Math.max(0.5, w.stars!.end - ts)));
      setWorld(ctx, c, 0, 70, 1, 0);
      ctx.globalAlpha = clamp((t - ts) / 0.1);
      ctx.font = font(HEAD, 130); ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,179,122,0.6)'; ctx.shadowBlur = 30;
      ctx.fillStyle = WHITE; ctx.fillText(`★ ${Math.round(59115 * k).toLocaleString('en-US')}`, 0, 0);
      ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      sparkles(ctx, c, 0, 20, t, ts + 0.2, 22, 7, '#FFD27A');
      pill(ctx, c, 'GITHUB STARS', 0, 140, 32, { a: clamp((t - w.github!.start) / 0.15) });
      pill(ctx, c, 'FREE · OPEN SOURCE · MIT', 0, 230, 32, { a: clamp((t - w.stars!.start) / 0.15), bg: 'rgba(255,91,58,0.9)' });
    }
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.ppt!.start, 0.02) }; }
}
