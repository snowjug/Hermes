// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// The keynote stage: a PDF on the left, a glowing arrow, and a big fan of glossy slides bursting out on the
// right with a pointer and selection handles on the front one. PDF → PPT in huge gradient type and an EDITABLE
// pill. The title says "makes your PowerPoint"; the thumbnail shows the transformation and the proof.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, slide, pdf, pill, pointer, loadImg, HEAD, ORANGE, VIOLET, TEAL, PEACH, type SlideKind } from '@ep/keynote';

export default class Thumb extends Keynote {
  ex: HTMLImageElement | null = null;
  override async init() { try { this.ex = await loadImg('data/ex/attention.webp'); } catch { /* drawn instead */ } super.init(); }
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }
  override captionLines() { return []; }

  override stage(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    pdf(ctx, c, -640, 140, 0.95, { rot: -0.08, spread: 0.15 });
    // arrow
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.strokeStyle = PEACH; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(255,91,58,0.9)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(-380, 120); ctx.lineTo(-170, 120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-210, 70); ctx.lineTo(-160, 120); ctx.lineTo(-210, 170); ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineCap = 'butt'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const kinds: SlideKind[] = ['chart', 'bullets', 'image', 'table', 'title'];
    kinds.forEach((k, i) => {
      const f = (i - 2) / 2;
      slide(ctx, c, 330 + f * 300, 150 + Math.abs(f) * 60, i === 4 ? 520 : 400, { kind: k, title: ['Q3 Revenue', 'Findings', 'Market', 'Budget', 'Annual Review'][i], accent: [ORANGE, VIOLET, TEAL][i % 3], rot: f * 0.22, seed: i, glow: i === 2 ? 0.6 : 0, img: i === 2 ? this.ex : null });
    });
    // selection handles on the front slide, turned with it
    setWorld(ctx, c, 630, 210, 1, 0.22);
    const hw = 520 / 2 + 10, hh = 520 * 9 / 32 + 10;
    ctx.strokeStyle = TEAL; ctx.lineWidth = 4; ctx.setLineDash([12, 7]); ctx.strokeRect(-hw, -hh, hw * 2, hh * 2); ctx.setLineDash([]);
    ctx.fillStyle = '#FFFFFF';
    for (const [hx, hy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) { ctx.beginPath(); ctx.rect(hx! * hw - 9, hy! * hh - 9, 18, 18); ctx.fill(); ctx.stroke(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    pointer(ctx, c, 730, 290, 0.4);
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    setWorld(ctx, c, 0, -250, 1, -0.02);
    ctx.font = font(HEAD, 230); ctx.textAlign = 'center';
    const g = ctx.createLinearGradient(-700, -200, 700, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, PEACH);
    ctx.shadowColor = 'rgba(255,91,58,0.8)'; ctx.shadowBlur = 50;
    ctx.fillStyle = g; ctx.fillText('PDF → PPT', 0, 0);
    ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    pill(ctx, c, 'EDITABLE ✓', 640, -40, 54, { bg: 'rgba(46,211,192,0.97)', fg: '#06232A', rot: 0.08 });
  }
}
