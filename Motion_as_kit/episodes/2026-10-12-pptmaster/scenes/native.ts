// NATIVE: "What comes out is native PowerPoint: slide masters, real shapes, text boxes, charts and tables, all
// editable."
// A presentation editor (generic: thumbnail rail, toolbar, canvas). Each word selects its part of the slide
// with handles and a teal label: the slide master behind it, a shape, a text box, a chart, a table; on "all
// editable" every handle lights up at once.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, slide, pill, handles, headline, BODY, HEAD, WHITE, SOFT, ORANGE, VIOLET, TEAL, clamp } from '@ep/keynote';

const PARTS = [
  { key: 'masters', label: 'SLIDE MASTER', box: [-470, -230, 940, 530] },
  { key: 'shapes', label: 'NATIVE SHAPE', box: [-420, -90, 200, 200] },
  { key: 'text', label: 'TEXT BOX', box: [-420, -200, 520, 70] },
  { key: 'charts', label: 'CHART', box: [-160, -90, 300, 220] },
  { key: 'tables', label: 'TABLE', box: [170, -90, 260, 220] },
] as const;

export default class Native extends Keynote {
  build() {
    this.take('What comes out', ['native', 'PowerPoint:', 'slide', 'masters,', 'shapes,', 'text', 'boxes,', 'charts', 'tables,', 'editable.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 0.94, 0);
    K.key(this.ctx.end, 40, 10, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a0 = clamp((t - this.ctx.start) / 0.25);
    // the editor window
    glass(ctx, c, -880, -380, 1760, 720, { a: a0, tint: 'rgba(22,26,52,0.92)' });
    setWorld(ctx, c, -880, -380, 1, 0);
    ctx.globalAlpha = a0;
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 50, 1760, 70);
    ['Home', 'Insert', 'Design', 'Transitions', 'Animations'].forEach((s, i) => { ctx.font = font(BODY, 26); ctx.fillStyle = i === 0 ? WHITE : SOFT; ctx.fillText(s, 40 + i * 190, 95); });
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 4; i++) slide(ctx, c, -760, -150 + i * 140, 190, { kind: (['title', 'chart', 'table', 'bullets'] as const)[i], title: '', accent: [ORANGE, VIOLET, TEAL][i % 3], a: a0, seed: i, glow: i === 1 ? 0.5 : 0 });
    // the slide on the canvas
    setWorld(ctx, c, 30, 60, 1, 0);
    ctx.globalAlpha = a0;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-470, -230, 940, 530, 10); ctx.fill();
    ctx.fillStyle = ORANGE; ctx.fillRect(-470, -230, 940, 14);
    ctx.font = font(HEAD, 54); ctx.fillStyle = '#141833'; ctx.fillText('Q3 at a glance', -410, -150);
    ctx.fillStyle = VIOLET; ctx.beginPath(); ctx.roundRect(-410, -80, 180, 180, 24); ctx.fill();
    ctx.font = font(HEAD, 64); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText('+18%', -320, 30); ctx.textAlign = 'left';
    [0.5, 0.8, 0.6, 1].forEach((v, i) => { ctx.fillStyle = i === 3 ? ORANGE : '#C9CDE0'; ctx.fillRect(-140 + i * 70, 120 - 190 * v, 48, 190 * v); });
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) { ctx.fillStyle = r === 0 ? TEAL : (q % 2 ? '#EEF0F8' : '#E2E5F2'); ctx.fillRect(180 + q * 84, -80 + r * 52, 80, 48); }
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // parts lit on their words
    const all = t > w.editable!.start - 0.05;
    PARTS.forEach((p) => {
      const t0 = w[p.key]!.start - 0.05;
      if (t < t0) return;
      const live = all || t < t0 + 1.4;
      const [x, y, bw, bh] = p.box;
      handles(ctx, c, 30 + x, 60 + y, bw, bh, live ? 1 : 0.25, p.key === 'masters' ? VIOLET : TEAL);
      if (live) pill(ctx, c, p.label, 30 + x + bw / 2, 60 + y - 34, 26, { bg: p.key === 'masters' ? 'rgba(123,92,255,0.95)' : 'rgba(46,211,192,0.95)', fg: '#06142A' });
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'NATIVE POWERPOINT', 0, -410, 64, t, this.w.native!.start - 0.05, { from: '#FFFFFF', to: '#FFB37A' });
  }
}
