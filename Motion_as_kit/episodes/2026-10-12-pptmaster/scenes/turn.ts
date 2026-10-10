// TURN: "This free tool turns that PDF into a real PowerPoint. Not pictures of slides: a deck you can actually
// edit."
// The money shot. The PDF flies to the centre and, on "turns", bursts into a fan of nine slides (two of them
// real decks from the project's examples) with sparks; REAL POWERPOINT lands above. On "Not pictures" a
// flat screenshot-slide is crossed out; on "actually edit" a pointer clicks the front slide's title, selection
// handles snap on, and the title is retyped live with a caret (EDITABLE).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, slide, pdf, headline, pill, pointer, handles, sparkles, loadImg, flyIn, HEAD, ORANGE, VIOLET, TEAL, PEACH, clamp, ease, lerp, type SlideKind } from '@ep/keynote';

const FAN: { kind: SlideKind; title: string; accent: string; ex?: 'pixel' | 'attention'; dark?: boolean }[] = [
  { kind: 'chart', title: 'Q3 Revenue', accent: ORANGE },
  { kind: 'bullets', title: 'Key findings', accent: VIOLET },
  { kind: 'image', title: 'The market', accent: TEAL },
  { kind: 'title', title: 'Annual Review', accent: ORANGE, ex: 'pixel' },
  { kind: 'title', title: 'Report 2026', accent: ORANGE },
  { kind: 'table', title: 'Budget', accent: TEAL, ex: 'attention' },
  { kind: 'quote', title: 'Customers', accent: VIOLET },
  { kind: 'agenda', title: 'Next steps', accent: ORANGE },
  { kind: 'chart', title: 'Growth', accent: TEAL, dark: true },
];

export default class Turn extends Keynote {
  imgs: Record<string, HTMLImageElement | null> = { pixel: null, attention: null };
  override async init() {
    try { this.imgs.pixel = await loadImg('data/ex/pixel.webp'); this.imgs.attention = await loadImg('data/ex/attention.webp'); } catch { /* shown as drawn slides */ }
    super.init();
  }

  build() {
    this.take('This free tool turns', ['free', 'tool', 'turns', 'PDF', 'real', 'PowerPoint.', 'pictures', 'slides:', 'deck', 'actually', 'edit.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -200, 0, 1.0, 0);
    K.key(w.turns!.start, 0, 0, 0.92, 0);
    K.key(w.actually!.start - 0.2, 60, 60, 1.1, 0);
    K.key(this.ctx.end, 70, 60, 1.14, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tb = w.turns!.start + 0.1;
    const burst = ease.outCubic(clamp((t - tb) / 0.7));
    // the PDF travels to the centre, then fades as the slides leave it
    if (burst < 1) {
      const kx = ease.inOutCubic(clamp((t - this.ctx.start) / Math.max(0.3, tb - this.ctx.start)));
      pdf(ctx, c, lerp(-470, 0, kx), lerp(60, 40, kx), lerp(0.95, 0.7, kx), { a: 1 - burst, rot: lerp(-0.06, 0, kx) });
    }
    // the fan
    if (t > tb) {
      FAN.forEach((s, i) => {
        const n = FAN.length, mid = (n - 1) / 2, f = (i - mid) / mid;
        const k = ease.outBack(clamp((t - tb - Math.abs(i - mid) * 0.04) / 0.55));
        const x = lerp(0, f * 760, k), y = lerp(40, 60 + Math.abs(f) * 120 - 40, k), rot = lerp(0, f * 0.32, k);
        const front = i === 4;
        slide(ctx, c, x, y, front ? 560 : 420, { kind: s.kind, title: s.title, accent: s.accent, rot, img: s.ex ? this.imgs[s.ex] : null, dark: s.dark, build: k, a: clamp(k * 3), glow: front ? 0.6 * k : 0, seed: i + 3 });
      });
      sparkles(ctx, c, 0, 40, t, tb, 26, 4);
    }
    // the flat screenshot, crossed out
    const tp = w.pictures!.start - 0.1;
    if (t > tp && t < w.actually!.start + 0.4) {
      const a = clamp((t - tp) / 0.15) * (1 - clamp((t - w.deck!.start) / 0.4));
      setWorld(ctx, c, 690, -250, 0.8, 0.08);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#2A2F55'; ctx.fillRect(-170, -96, 340, 192);
      ctx.font = font(HEAD, 30); ctx.fillStyle = 'rgba(244,245,255,0.6)'; ctx.textAlign = 'center'; ctx.fillText('screenshot.png', 0, 10); ctx.textAlign = 'left';
      const kx = clamp((t - w.pictures!.start - 0.1) / 0.25);
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-190, -110); ctx.lineTo(-190 + 380 * kx, -110 + 220 * kx); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    headline(ctx, c, 'REAL POWERPOINT', 0, -330, 104, t, w.real!.start - 0.05, { from: '#FFFFFF', to: PEACH });
    // edit: click the front slide's title
    const te = w.actually!.start - 0.15;
    if (t > te) {
      const pk = ease.inOutCubic(clamp((t - te) / 0.35));
      const click = clamp((t - te - 0.35) / 0.4);
      pointer(ctx, c, lerp(380, -40, pk), lerp(260, -10, pk), click);
      if (click > 0) {
        handles(ctx, c, -244, -40, 340, 54, clamp(click * 3));
        pill(ctx, c, 'EDITABLE ✓', 130, -150, 34, { a: clamp(click * 3), bg: 'rgba(46,211,192,0.95)', fg: '#06232A', stroke: 'rgba(255,255,255,0.5)' });
      }
    }
    void HEAD;
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.turns!.start + 0.1, 0.03) * this.punch(t, w.real!.start, 0.012) };
  }
}
