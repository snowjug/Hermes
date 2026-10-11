// 17 WHERE IT RUNS: "It works in Claude Code, Codex, Copilot, Cursor and more, and exports SVG or PNG for slides and
// docs."
// Hub and spokes: the skill's node in the middle; the hosts arrive on the left one per name and wire into it (with a
// "+ more" node); on "exports" two edges run out to SVG and PNG chips, and on to a slide and a document.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Dgm, node, edge, orth, chip, CORAL, BLUE, HAIR, TEXT, clamp, ob } from '@ep/dgm';

export default class Hosts extends Dgm {
  build() {
    this.take('It works in Claude Code', ['works', 'Claude', 'Codex,', 'Copilot,', 'Cursor', 'more,', 'exports', 'SVG', 'PNG', 'slides', 'docs.']);
    this.frame(0, 0, 1, { from: [900, 0, 1], to: [0, 700, 1], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    node(ctx, c, -40, 0, 280, 120, { k: clamp((t - this.ctx.start - 0.05) / 0.5), title: 'diagram-design', sub: 'one skill', tag: 'SKILL', accent: true, glow: 0.4 });
    const hosts: [string, string, number][] = [['Claude Code', 'claude', -280], ['Codex', 'codex', -140], ['Copilot', 'copilot', 0], ['Cursor', 'cursor', 140], ['+ more', 'more', 280]];
    hosts.forEach(([name, key, y], i) => {
      const k = clamp((t - this.ctx.start - 0.15 - i * 0.07) / 0.4), lit = clamp((t - this.s(key) + 0.1) / 0.3);
      node(ctx, c, -640, y, 240, 84, { k, title: name, tag: i === 4 ? 'GEMINI CLI · PI · …' : 'HOST', titleSize: 24, dim: 1 - lit, blue: lit > 0.5 && i === 0 });
      edge(ctx, c, orth([-520, y], [-180, 0], -330), clamp((t - this.s(key)) / 0.4), { col: i === 0 ? BLUE : HAIR, dot: (t * 0.7 + i * 0.21) % 1 });
    });
    // exports
    const ek = (d: number) => clamp((t - this.s('exports') - d) / 0.4);
    edge(ctx, c, orth([100, 0], [330, -140], 210), ek(0), { col: CORAL });
    edge(ctx, c, orth([100, 0], [330, 140], 210), ek(0.1), { col: CORAL });
    chip(ctx, c, '.svg', 400, -140, { a: clamp((t - this.s('svg') + 0.1) / 0.3), col: CORAL, size: 22, scale: 0.8 + 0.2 * ob(clamp((t - this.s('svg') + 0.1) / 0.3)) });
    chip(ctx, c, '.png · 2×', 420, 140, { a: clamp((t - this.s('png') + 0.1) / 0.3), col: CORAL, size: 22, scale: 0.8 + 0.2 * ob(clamp((t - this.s('png') + 0.1) / 0.3)) });
    edge(ctx, c, [[480, -140], [600, -140]], clamp((t - this.s('slides') + 0.1) / 0.3));
    edge(ctx, c, [[520, 140], [600, 140]], clamp((t - this.s('docs') + 0.1) / 0.3));
    // a slide and a document
    const sk = clamp((t - this.s('slides') + 0.05) / 0.4);
    if (sk > 0) {
      setWorld(ctx, c, 730, -140, 0.85 + 0.15 * ob(sk), 0);
      ctx.globalAlpha = sk; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.6; ctx.fillStyle = '#121720';
      ctx.beginPath(); ctx.roundRect(-110, -64, 220, 128, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = CORAL; ctx.strokeRect(-70, -24, 40, 30); ctx.strokeStyle = HAIR; ctx.strokeRect(20, -24, 40, 30); ctx.beginPath(); ctx.moveTo(-30, -9); ctx.lineTo(20, -9); ctx.stroke();
      ctx.fillStyle = TEXT; ctx.fillRect(-80, -48, 90, 6);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const dk = clamp((t - this.s('docs') + 0.05) / 0.4);
    if (dk > 0) {
      setWorld(ctx, c, 700, 140, 0.85 + 0.15 * ob(dk), 0);
      ctx.globalAlpha = dk; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.6; ctx.fillStyle = '#121720';
      ctx.beginPath(); ctx.roundRect(-70, -90, 140, 180, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(214,222,235,0.4)'; for (let i = 0; i < 3; i++) ctx.fillRect(-50, -66 + i * 14, 100 - i * 20, 5);
      ctx.strokeStyle = CORAL; ctx.strokeRect(-50, -10, 36, 26); ctx.strokeStyle = HAIR; ctx.strokeRect(14, -10, 36, 26);
      ctx.fillStyle = 'rgba(214,222,235,0.4)'; for (let i = 0; i < 3; i++) ctx.fillRect(-50, 34 + i * 14, 100 - i * 14, 5);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
}
