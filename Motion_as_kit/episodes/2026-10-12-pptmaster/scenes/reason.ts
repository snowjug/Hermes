// REASON: "Then it reasons the argument into shape, and only then designs the slides."
// An argument outline builds as a chain of glass nodes joined by glowing lines (THE PROBLEM → WHY NOW →
// THE PLAN → THE PROOF → THE ASK). On "designs the slides" each node flips into a finished slide in place.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, slide, headline, BODY, WHITE, ORANGE, VIOLET, TEAL, clamp, ease, type SlideKind } from '@ep/keynote';

const NODES: { label: string; kind: SlideKind; x: number; y: number }[] = [
  { label: 'THE PROBLEM', kind: 'title', x: -720, y: -60 },
  { label: 'WHY NOW', kind: 'chart', x: -360, y: 110 },
  { label: 'THE PLAN', kind: 'agenda', x: 0, y: -60 },
  { label: 'THE PROOF', kind: 'table', x: 360, y: 110 },
  { label: 'THE ASK', kind: 'quote', x: 720, y: -60 },
];

export default class Reason extends Keynote {
  build() {
    this.take('Then it reasons', ['reasons', 'argument', 'shape,', 'only', 'designs', 'slides.']);
    const K = this.cam;
    K.key(this.ctx.start, -300, 0, 1.0, 0);
    K.key(this.w.designs!.start - 0.1, 0, 0, 0.9, 0);
    K.key(this.ctx.end, 0, 0, 0.92, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.reasons!.start, td = w.designs!.start;
    NODES.forEach((n, i) => {
      const tn = t0 + i * Math.max(0.15, (w.shape!.end - t0) / NODES.length);
      if (t < tn) return;
      // the link to the previous node
      if (i > 0) {
        const p = NODES[i - 1]!, k = clamp((t - tn) / 0.25);
        setWorld(ctx, c, 0, 0, 1, 0);
        ctx.strokeStyle = 'rgba(123,92,255,0.9)'; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(123,92,255,0.9)'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (n.x - p.x) * k, p.y + (n.y - p.y) * k); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      const flip = clamp((t - td - i * 0.12) / 0.35);
      const sx = Math.abs(Math.cos(flip * Math.PI));
      if (flip < 0.5) {
        const k = ease.outBack(clamp((t - tn) / 0.3));
        glass(ctx, c, n.x - 175 * sx * k, n.y - 66 * k, 350 * sx * k, 132 * k, { a: clamp((t - tn) / 0.1) });
        setWorld(ctx, c, n.x, n.y, 1, 0);
        ctx.font = font(BODY, 40); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.globalAlpha = sx;
        ctx.save(); ctx.scale(sx, 1); ctx.fillText(n.label, 0, 14); ctx.restore();
        ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        setWorld(ctx, c, 0, 0, 1, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
        slide(ctx, c, n.x, n.y, 330 * Math.max(0.05, sx), { kind: n.kind, title: n.label.replace('THE ', ''), accent: [ORANGE, VIOLET, TEAL][i % 3], seed: i, glow: 0.3 });
      }
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'ARGUMENT FIRST. DESIGN SECOND.', 0, -330, 70, t, this.w.reasons!.start, { from: '#FFFFFF', to: '#FFB37A' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.designs!.start, 0.015) }; }
}
