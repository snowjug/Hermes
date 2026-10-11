// 19 STICK WITH MERMAID: "If your diagrams live in Git and change every week, stick with Mermaid."
// A git history: the main line draws itself with a commit a week (WK 1 … WK 6), each with a small +/- diff on a
// diagram.mmd; a branch splits off and merges back. On "stick with Mermaid" a MERMAID node lights blue with a tick:
// DOCS THAT CHANGE → MERMAID. DIAGRAMS THAT PERSUADE → DIAGRAM DESIGN, in mono under it.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Dgm, edge, node, mark, mono, chip, BLUE, HAIR, TEXT, CORAL, clamp, ob, TAU } from '@ep/dgm';

export default class Mermaid extends Dgm {
  build() {
    this.take('If your diagrams live', ['diagrams', 'live', 'Git', 'change', 'every', 'week,', 'stick', 'Mermaid.']);
    this.frame(0, 0, 1, { from: [900, 0, 1], to: [0, 0, 0.6], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const y = -80, x0 = -760, step = 230;
    const lk = clamp((t - this.ctx.start - 0.1) / 1.6);
    edge(ctx, c, [[x0, y], [x0 + step * 5 + 60, y]], lk, { head: false, col: HAIR });
    // a branch off and back
    edge(ctx, c, [[x0 + step, y], [x0 + step + 40, y - 110], [x0 + step * 3 - 40, y - 110], [x0 + step * 3, y]], clamp((t - this.s('change')) / 0.8), { head: false, col: BLUE, dash: true });
    for (let i = 0; i < 6; i++) {
      const k = clamp((t - this.ctx.start - 0.2 - i * 0.22) / 0.3);
      if (k <= 0) continue;
      const x = x0 + i * step;
      setWorld(ctx, c, x, y, ob(k), 0);
      ctx.fillStyle = '#0B0E13'; ctx.strokeStyle = TEXT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, `WK ${i + 1}`, x, y + 44, { a: k, align: 'center', size: 16 });
      const dk = clamp((t - this.s('every') - i * 0.15) / 0.3);
      if (dk > 0) { mono(ctx, c, `+${3 + ((i * 5) % 7)}`, x - 8, y + 80, { a: dk, align: 'right', size: 16, col: '#3DDC97' }); mono(ctx, c, `−${1 + ((i * 3) % 4)}`, x + 8, y + 80, { a: dk, size: 16, col: CORAL }); }
    }
    mono(ctx, c, 'diagram.mmd', x0, y - 170, { a: clamp((t - this.ctx.start - 0.1) / 0.3), size: 20, col: TEXT });
    // stick with Mermaid
    const mk = clamp((t - this.s('stick') + 0.1) / 0.45);
    node(ctx, c, 0, 210, 320, 110, { k: mk, title: 'Mermaid', sub: 'text you can diff', tag: 'USE THIS', blue: true, glow: 0.4 });
    mark(ctx, c, 190, 210, true, clamp((t - this.s('mermaid')) / 0.3), 1.4);
    chip(ctx, c, 'DIAGRAMS IN GIT THAT CHANGE WEEKLY', 0, 330, { a: clamp((t - this.s('mermaid') - 0.1) / 0.3), size: 16 });
  }
}
