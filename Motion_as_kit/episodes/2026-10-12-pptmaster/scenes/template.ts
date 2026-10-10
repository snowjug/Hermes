// TEMPLATE: "It can learn your company's template from an old deck, or pour new content into one without
// touching the design."
// Left: an old deck in a teal-and-gold house style. On "learn" its colours, fonts and layouts lift out onto a
// template card (swatches, Aa, layout boxes); new slides on the right come out wearing the same style. On
// "pour new content" the right deck's contents slide out and new ones in while the frame holds still
// (DESIGN UNTOUCHED).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, slide, pill, headline, HEAD, BODY, WHITE, SOFT, clamp, ease, type SlideKind } from '@ep/keynote';

const HOUSE = '#0E6E6A', GOLD = '#E9B949';

export default class Template extends Keynote {
  build() {
    this.take("It can learn", ['learn', "company's", 'template', 'old', 'deck,', 'pour', 'content', 'touching', 'design.']);
    const K = this.cam;
    K.key(this.ctx.start, -380, 0, 1.0, 0);
    K.key(this.w.template!.start, 0, 0, 0.92, 0);
    K.key(this.w.pour!.start - 0.1, 300, 0, 1.0, 0);
    K.key(this.ctx.end, 320, 0, 1.02, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the old deck
    for (let i = 0; i < 3; i++) slide(ctx, c, -620 + i * 30, -60 + i * 40, 420, { kind: (['title', 'bullets', 'chart'] as SlideKind[])[i], title: ['Acme Corp', 'Our year', 'Results'][i], accent: GOLD, bg: i === 0 ? HOUSE : '#FFFFFF', dark: i === 0, a: clamp((t - this.ctx.start) / 0.2), seed: i, rot: -0.03 });
    pill(ctx, c, 'OLD DECK', -590, 240, 28, { a: clamp((t - w.old!.start) / 0.2) });
    // the template card
    const kt = clamp((t - w.template!.start + 0.05) / 0.3);
    if (kt > 0) {
      glass(ctx, c, -170, -230, 340, 420, { a: kt });
      setWorld(ctx, c, -170, -230, 1, 0); ctx.globalAlpha = kt;
      ctx.font = font(BODY, 26); ctx.fillStyle = SOFT; ctx.fillText('TEMPLATE', 30, 50);
      [HOUSE, GOLD, '#FFFFFF', '#1C2330'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(60 + i * 72, 110, 26, 0, Math.PI * 2); ctx.fill(); });
      ctx.font = font(HEAD, 90); ctx.fillStyle = WHITE; ctx.fillText('Aa', 30, 250);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.strokeRect(30 + i * 96, 300, 84, 60); ctx.fillStyle = GOLD; ctx.fillRect(38 + i * 96, 310, 40, 6); }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the new deck, wearing the style; contents swap on "pour"
    const kn = clamp((t - w.deck!.start) / 0.3);
    const swap = clamp((t - w.pour!.start) / 0.5);
    for (let i = 0; i < 3; i++) {
      const k = ease.outBack(clamp(kn * 3 - i));
      if (k <= 0) continue;
      const kinds: SlideKind[] = swap > 0.5 ? ['title', 'table', 'image'] : ['title', 'bullets', 'chart'];
      const titles = swap > 0.5 ? ['Q4 Plan', 'Budget', 'Launch'] : ['Acme 2027', 'Strategy', 'Forecast'];
      slide(ctx, c, 540 + i * 30, -60 + i * 40, 420, { kind: kinds[i], title: titles[i], accent: GOLD, bg: i === 0 ? HOUSE : '#FFFFFF', dark: i === 0, a: clamp(k * 2), build: Math.abs(swap - 0.5) * 2, seed: i + 5, rot: 0.03 });
    }
    pill(ctx, c, 'DESIGN UNTOUCHED ✓', 590, 250, 28, { a: clamp((t - w.touching!.start) / 0.2), bg: 'rgba(46,211,192,0.95)', fg: '#06232A' });
    // flow arrows
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.strokeStyle = 'rgba(255,179,122,0.9)'; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(255,91,58,0.8)'; ctx.shadowBlur = 14;
    const a1 = clamp((t - w.template!.start) / 0.3), a2 = clamp((t - w.deck!.start) / 0.3);
    if (a1 > 0) { ctx.beginPath(); ctx.moveTo(-380, -40); ctx.lineTo(-380 + 190 * a1, -40); ctx.stroke(); }
    if (a2 > 0) { ctx.beginPath(); ctx.moveTo(190, -40); ctx.lineTo(190 + 110 * a2, -40); ctx.stroke(); }
    ctx.shadowBlur = 0; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'YOUR TEMPLATE, LEARNED', 0, -360, 70, t, this.w.learn!.start - 0.05, { from: '#FFFFFF', to: '#E9B949' });
  }
}
