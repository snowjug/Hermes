// 15 REDRAW: "Got an old diagram? Hand it a draw.io, Mermaid or Excalidraw file, and it redraws it, with a receipt of
// what it merged or dropped."
// Three old files arrive on their words (.drawio, .mmd, .excalidraw), each with a scrawl of its old diagram, and
// slide along edges into the skill's node; the clean diagram builds on the right on "redraws"; on "receipt" a paper
// ledger prints out under it: MERGED, COLLAPSED, DROPPED (an example receipt).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Dgm, node, edge, fileIcon, appDiagram, subCam, mono, CORAL, HAIR, TEXT, MONO, MONOB, clamp, ease, ob } from '@ep/dgm';

export default class Redraw extends Dgm {
  build() {
    this.take('Got an old diagram', ['old', 'diagram?', 'Hand', 'draw.io,', 'Mermaid', 'Excalidraw', 'file,', 'redraws', 'receipt', 'merged', 'dropped.']);
    this.frame(60, 0, 1, { from: [-900, 0, 1], to: [900, 0, 1], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const files: [string, string, number][] = [['.drawio', 'drawio', -230], ['.mmd', 'mermaid', 0], ['.excalidraw', 'excalidraw', 230]];
    files.forEach(([lab, key, y], i) => {
      const k0 = clamp((t - this.ctx.start - 0.1 - i * 0.08) / 0.3), k = clamp((t - this.s(key) + 0.15) / 0.4);
      if (k0 <= 0) return;
      fileIcon(ctx, c, -700, y, lab, { s: 0.9 + 0.08 * ob(k) - 0.08 * k, a: k0 * (0.35 + 0.65 * k), accent: k > 0.5 && t < this.s('redraws') });
      // a scrawl of the old diagram beside it
      setWorld(ctx, c, -560, y, 1, 0);
      ctx.globalAlpha = k0 * (0.35 + 0.65 * k); ctx.strokeStyle = ['#E8577A', '#4D7CFE', '#F2B33D'][i]!; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, -20, 26, 18, 0.3, 0, Math.PI * 2); ctx.moveTo(20, -10); ctx.bezierCurveTo(60, 30, 20, 50, 70, 30); ctx.rect(60, 10, 40, 30); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      edge(ctx, c, [[-440, y], [-360, y], [-360, 0], [-250, 0]], clamp((t - this.s(key) - 0.1) / 0.5), { col: HAIR, dot: (t * 0.8 + i * 0.33) % 1 });
    });
    node(ctx, c, -130, 0, 230, 110, { k: clamp((t - this.s('hand') + 0.1) / 0.5), title: 'diagram-design', sub: 'redraw', tag: 'SKILL', accent: true, glow: clamp((t - this.s('redraws')) / 0.3) * 0.7 });
    const rk = clamp((t - this.s('redraws') + 0.05) / 0.4);
    edge(ctx, c, [[-15, 0], [120, 0]], rk, { col: CORAL });
    if (rk > 0) appDiagram(ctx, subCam(c, 480, -60, 0.4), 0, 0, 1, { show: clamp((t - this.s('redraws')) / 0.6), t });
    // the receipt
    const pk = clamp((t - this.s('receipt') + 0.1) / 0.8);
    if (pk > 0) {
      const h = 260 * ease.outCubic(pk);
      setWorld(ctx, c, 480, 110, 1, -0.02);
      ctx.fillStyle = '#ECEFF3'; ctx.beginPath(); ctx.moveTo(-170, 0); ctx.lineTo(170, 0); ctx.lineTo(170, h);
      for (let i = 0; i <= 17; i++) ctx.lineTo(170 - i * 20, h + (i % 2 ? 8 : 0)); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(-170, 0, 340, h); ctx.clip();
      ctx.font = font(MONOB, 18); ctx.fillStyle = '#111317'; ctx.textAlign = 'center'; ctx.fillText('REDRAW RECEIPT', 0, 36);
      ctx.font = font(MONO, 16); ctx.fillStyle = '#5A6070'; ctx.fillText('- - - - - - - - - - - - - - -', 0, 60);
      const rows: [string, string, string][] = [['MERGED', '2 nodes', 'merged'], ['COLLAPSED', '1 group', 'merged'], ['DROPPED', '3 styles', 'dropped'], ['KEPT', 'every fact', 'dropped']];
      rows.forEach(([a, b, key], i) => {
        if (t < this.s(key) - 0.1 + i * 0.12) return;
        ctx.textAlign = 'left'; ctx.fillStyle = i === 2 ? '#D9472B' : '#111317'; ctx.fillText(a, -140, 100 + i * 34);
        ctx.textAlign = 'right'; ctx.fillText(b, 140, 100 + i * 34);
      });
      ctx.restore(); ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'EXAMPLE RECEIPT', 480, 420, { a: pk, align: 'center', size: 14, track: 2 });
    }
    mono(ctx, c, 'OLD FILES', -700, -330, { a: clamp((t - this.s('old')) / 0.3), align: 'center', size: 16, track: 3 });
    void TEXT;
  }
}
