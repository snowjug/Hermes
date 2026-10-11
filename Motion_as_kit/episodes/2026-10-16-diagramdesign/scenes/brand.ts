// 16 YOUR BRAND: "Want your company's look? Give it your website, and it pulls your colours and fonts, and checks the
// text stays readable."
// A browser window with a made-up company site (yoursite.com, teal brand); on "pulls" an eyedropper samples it and
// the swatches fly out into the skill's token table: paper, ink, muted, accent, link; on "fonts" a type specimen;
// on "checks" a contrast badge, 4.5 : 1 · AA, ticks green. Then the app diagram restyles with the teal accent.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { Dgm, card, mono, sans, mark, chip, appDiagram, subCam, node, TEXT, MUTED, HAIR, GREEN, SANSB, SERIF, MONO, clamp, ease, ob, lerp } from '@ep/dgm';

const TEAL = '#14B8A6';
const TOKENS: [string, string][] = [['paper', '#F7F5F0'], ['ink', '#10201E'], ['muted', '#6B7C79'], ['accent', TEAL], ['link', '#2563EB']];

export default class Brand extends Dgm {
  build() {
    this.take('Want your company', ["company's", 'look?', 'website,', 'pulls', 'colours', 'fonts,', 'checks', 'readable.']);
    this.frame(0, 0, 1, { from: [0, -700, 1], to: [-900, 0, 1], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the site
    const bk = clamp((t - this.ctx.start - 0.1) / 0.5);
    const bx = -460, by = -20;
    card(ctx, c, bx, by, 760, 520, { k: bk, title: 'yoursite.com' });
    if (bk > 0.4) {
      const a = clamp((bk - 0.4) / 0.6);
      setWorld(ctx, c, bx, by, 1, 0); ctx.globalAlpha = a;
      ctx.fillStyle = '#F7F5F0'; ctx.fillRect(-370, -218, 740, 468);
      ctx.fillStyle = TEAL; ctx.fillRect(-370, -218, 740, 70);
      ctx.fillStyle = '#FFFFFF'; ctx.font = font(SANSB, 26); ctx.fillText('northwind', -340, -174);
      ctx.fillStyle = '#10201E'; ctx.font = font(SERIF, 54); ctx.fillText('Ship faster,', -330, -60); ctx.fillText('worry less.', -330, 0);
      ctx.fillStyle = '#6B7C79'; ctx.font = font(MONO, 18); ctx.fillText('The platform for small teams.', -330, 50);
      ctx.fillStyle = TEAL; ctx.beginPath(); ctx.roundRect(-330, 90, 180, 56, 28); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = font(SANSB, 20); ctx.fillText('Get started', -306, 125);
      ctx.fillStyle = '#2563EB'; ctx.font = font(MONO, 18); ctx.fillText('Read the docs →', -120, 124);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the eyedropper and the swatches flying out to the token table
    const pk = clamp((t - this.s('pulls') + 0.1) / 0.6);
    TOKENS.forEach(([name, hex], i) => {
      const k = ease.inOutCubic(clamp((t - this.s('pulls') - 0.1 - i * 0.12) / 0.5));
      if (k <= 0) return;
      const sx = lerp(bx - 300 + i * 120, 230, k), sy = lerp(by - 120 + (i % 2) * 160, -250 + i * 64, k);
      setWorld(ctx, c, sx, sy, 0.8 + 0.2 * ob(k), 0);
      ctx.fillStyle = hex; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(-22, -22, 44, 44, 6); ctx.fill(); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (k > 0.8) {
        mono(ctx, c, name.toUpperCase(), 280, -244 + i * 64, { a: (k - 0.8) / 0.2, size: 18, col: name === 'accent' ? TEAL : TEXT });
        mono(ctx, c, hex, 420, -244 + i * 64, { a: (k - 0.8) / 0.2, size: 18 });
      }
    });
    if (pk > 0) mono(ctx, c, 'BRAND TOKENS', 200, -310, { a: pk, size: 16, track: 3 });
    // fonts
    const fk = clamp((t - this.s('fonts') + 0.05) / 0.4);
    if (fk > 0) {
      node(ctx, c, 330, 120, 300, 120, { k: fk, tag: 'FONT' });
      sans(ctx, c, 'Aa', 260, 150, 60, { a: fk, bold: true });
      mono(ctx, c, 'Brand Sans', 330, 116, { a: fk, size: 18, col: TEXT });
      mono(ctx, c, '600 · 400', 330, 146, { a: fk, size: 16 });
    }
    // the contrast check
    const ck = clamp((t - this.s('checks') + 0.05) / 0.4);
    if (ck > 0) {
      chip(ctx, c, '4.5 : 1 · WCAG AA', 330, 270, { a: ck, col: GREEN, size: 20, scale: 0.9 + 0.1 * ob(ck) });
      mark(ctx, c, 500, 270, true, clamp((t - this.s('readable')) / 0.3), 1.2);
    }
    // the diagram, in the brand
    const dk = clamp((t - this.s('readable') + 0.1) / 0.5);
    if (dk > 0) {
      setWorld(ctx, c, 0, 0, 1, 0); ctx.globalAlpha = dk; ctx.fillStyle = 'rgba(11,14,19,0.9)'; ctx.fillRect(560, -200, 400, 340); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      appDiagram(ctx, subCam(c, 760, -30, 0.25), 0, 0, 1, { a: dk, acc: TEAL });
    }
    void measure; void MUTED;
  }
}
