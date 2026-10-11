// 02–05 THE SAME DIAGRAM, TWICE: "But ask it for one diagram, and you get this." "Boxes everywhere. Arrows crossing
// arrows. Five colours shouting at once." "Now watch the exact same diagram again." "Same boxes, same facts. Except now
// it looks like a design studio made it."
// One continuous shot. The prompt types; on "this." the default diagram slams in: pastel boxes with drop shadows,
// thick borders, curved arrows. The problems get called out: 8 BOXES · 6 SIZES, a coral ring on every real crossing
// of its arrows (counted), the five colours as swatches that shake on "shouting". On "again" it rewinds (TAKE 2).
// On "Same boxes" the very same eight boxes glide onto the grid: shadows drain, borders thin to hairlines, colours
// fall to ink and the one box that matters turns coral; the edges re-route at right angles and the header writes in.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Dgm, appDiagram, messCrossings, ring, chip, card, typed, header, mono, APP, CORAL, TEXT, MUTED, MONOB, clamp, ease, ob, lerp } from '@ep/dgm';

const CROSS = messCrossings();

export default class Mess extends Dgm {
  build() {
    this.take('But ask it', ['ask', 'one', 'diagram,', 'get', 'this.']);
    this.take('Boxes everywhere', [['boxes3', 'Boxes'], 'everywhere.', 'Arrows', 'crossing', 'Five', 'colours', 'shouting', 'once.']);
    this.take('Now watch the exact', ['watch', 'exact', ['same4', 'same'], 'again.']);
    this.take('Same boxes', ['Same', 'boxes,', ['samefacts', 'same', 1], 'facts.', 'Except', 'design', 'studio', 'made']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, -900, -330, 1.25);
    K.key(s + 0.5, 0, -330, 1.25, 0, ease.outExpo);
    K.key(this.s('this') - 0.15, 0, -300, 1.22, 0, ease.inOutQuad);
    K.key(this.s('this') + 0.35, 0, 20, 0.98, 0, ease.outExpo);
    K.key(this.s('crossing'), 30, 10, 1.06, 0, ease.inOutQuad);
    K.key(this.s('once'), 0, 10, 1.02, 0, ease.inOutQuad);
    K.key(this.s('again') + 0.2, 0, 10, 0.92, 0, ease.inOutCubic);
    K.key(this.s('same') + 0.2, 0, 0, 0.92, 0, ease.inOutQuad);
    K.key(this.s('studio'), 0, -10, 1.0, 0, ease.inOutCubic);
    K.key(e - 0.26, 0, -10, 1.03, 0, ease.inOutQuad);
    K.key(e, 900, -10, 1.03, 0, ease.inExpo);
  }

  /** the morph: 0 until "Same", then the boxes glide over ~2.4 s */
  m(t: number) { return clamp((t - this.s('same') + 0.05) / 2.4); }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const show = clamp((t - this.s('this') + 0.05) / 0.5);
    // the rewind on "again": the messy boxes shudder back and forth once
    const rw = clamp((t - this.s('again')) / 0.5);
    const wob = rw > 0 && rw < 1 ? Math.sin(rw * Math.PI * 3) * 14 * (1 - rw) : 0;
    const m = this.m(t);
    const tint = clamp((t - this.s('again')) / 0.3) * (1 - clamp(m * 4));
    appDiagram(ctx, c, wob, 10, m, { show, stagger: 0.45, a: 1 - 0.35 * tint, t: m >= 1 ? t : undefined, hot: clamp((t - this.s('made')) / 0.3) * 0.8 });
    // the prompt bar
    const pa = clamp((t - this.ctx.start - 0.1) / 0.3) * (1 - clamp((t - this.s('this') - 0.3) / 0.4));
    if (pa > 0) {
      card(ctx, c, 0, -330, 980, 110, { a: pa, title: 'chat with your agent' });
      typed(ctx, c, '› draw a diagram of my app', -440, -292, t, this.s('ask') - 0.1, 26, { size: 26, a: pa });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const m = this.m(t);
    const off = 1 - clamp((t - this.s('again')) / 0.3);
    // 8 BOXES · 6 SIZES
    chip(ctx, c, '8 BOXES · 6 SIZES', -560, -380, { a: clamp((t - this.s('boxes3')) / 0.25) * off, col: CORAL, size: 17 });
    // the crossings, ringed one by one and counted
    const ck = (t - this.s('crossing') + 0.1) / 0.09;
    CROSS.forEach(([x, y], i) => ring(ctx, c, x, y + 10, 26, 22, clamp((ck - i) / 2) * off));
    const nC = Math.min(CROSS.length, Math.max(0, Math.floor(ck)));
    if (nC > 0) chip(ctx, c, `${nC} CROSSINGS`, 560, -380, { a: off, col: CORAL, size: 17 });
    // the five colours, shaking on "shouting"
    const sw = clamp((t - this.s('five')) / 0.25) * off;
    if (sw > 0) {
      const cols = ['#FFD6E0', '#FFF1A8', '#BFD7FF', '#D9C2FF', '#C4F0C9'];
      const shake = t > this.s('shouting') && t < this.e('once') ? 1 : 0;
      cols.forEach((col, i) => {
        const k = ob(clamp((t - this.s('five') - i * 0.06) / 0.3));
        setWorld(ctx, c, -150 + i * 75 + shake * 4 * Math.sin(t * 60 + i), 390 + shake * 3 * Math.cos(t * 53 + i * 2), k, 0);
        ctx.globalAlpha = sw; ctx.fillStyle = col; ctx.strokeStyle = '#2B2B33'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-28, -28, 56, 56, 10); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
      mono(ctx, c, '5 COLOURS', 250, 398, { a: sw, size: 18, col: CORAL, bold: true });
    }
    // TAKE 2
    const tk = clamp((t - this.s('again')) / 0.25) * (1 - clamp((t - this.s('same') - 0.2) / 0.3));
    if (tk > 0) {
      setWorld(ctx, c, 0, -360, 0.9 + 0.1 * ob(tk), 0);
      ctx.globalAlpha = tk; ctx.font = font(MONOB, 26); ctx.fillStyle = TEXT; ctx.textAlign = 'center';
      ctx.fillText('↺  TAKE 2 · SAME BOXES, SAME FACTS', 0, 0);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the header writes in as the morph lands
    header(ctx, c, -750, -330, 'ARCHITECTURE · DIAGRAM DESIGN', 'My app in production', t, this.s('design') - 0.2, { size: 58 });
    // the legend
    const lg = clamp((m - 0.85) / 0.15);
    if (lg > 0) {
      mono(ctx, c, 'LEGEND', -750, 330, { a: lg, size: 14, track: 3 });
      [['focal', CORAL], ['request', '#5B8CFF'], ['internal', 'rgba(214,222,235,0.55)']].forEach(([lab, col], i) => {
        setWorld(ctx, c, -750 + 130 + i * 190, 325, 1, 0);
        ctx.globalAlpha = lg; ctx.strokeStyle = col!; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(36, 0); ctx.stroke();
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        mono(ctx, c, lab!.toUpperCase(), -750 + 180 + i * 190, 331, { a: lg, size: 14 });
      });
    }
    void APP; void lerp; void MUTED;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('this'), 0.03) * this.punch(t, this.s('same'), 0.012) }; }
}
