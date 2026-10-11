// 18 THE CATCH: "The catch: it's only as good as the model running it, the same prompt can lay out differently, and
// you get a picture, not an editable canvas."
// THE CATCH as the header, then three honest limits as three columns, each on its words: MODEL (two models feeding
// the same skill, one output crisp and one rough), LAYOUT (the same prompt, run twice: two different layouts that
// flicker), PICTURE (a pointer tries to drag a box; it won't move: NOT EDITABLE).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Dgm, header, node, edge, chip, pointer, mono, appDiagram, subCam, APP, CORAL, HAIR, MUTED, clamp, ease, lerp } from '@ep/dgm';

export default class Catch extends Dgm {
  build() {
    this.take('The catch', ['catch:', 'only', 'good', 'model', 'running', 'same', 'prompt', 'lay', 'differently,', 'picture,', 'editable', 'canvas.']);
    this.frame(0, 0, 1, { from: [0, 700, 1], to: [-900, 0, 1], drift: 0.03 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const cols = [-560, 0, 560];
    // 1 MODEL
    const m1 = clamp((t - this.s('only') + 0.1) / 0.4);
    if (m1 > 0) {
      chip(ctx, c, '01 · THE MODEL', cols[0]!, -230, { a: m1, col: CORAL, size: 16 });
      node(ctx, c, cols[0]! - 120, -110, 180, 70, { k: m1, title: 'strong model', titleSize: 20 });
      node(ctx, c, cols[0]! - 120, 20, 180, 70, { k: clamp((t - this.s('model')) / 0.4), title: 'weak model', titleSize: 20, dim: 0.3 });
      edge(ctx, c, [[cols[0]! - 30, -110], [cols[0]! + 60, -110]], clamp((t - this.s('model')) / 0.4));
      edge(ctx, c, [[cols[0]! - 30, 20], [cols[0]! + 60, 20]], clamp((t - this.s('running')) / 0.4), { dash: true });
      const q = clamp((t - this.s('running')) / 0.4);
      // crisp vs rough output
      appDiagram(ctx, subCam(c, cols[0]! + 160, -110, 0.15), 0, 0, 1, { a: m1 });
      appDiagram(ctx, subCam(c, cols[0]! + 160, 20, 0.15), 0, 0, 0.35, { a: q });
    }
    // 2 LAYOUT
    const m2 = clamp((t - this.s('same') + 0.1) / 0.4);
    if (m2 > 0) {
      chip(ctx, c, '02 · SAME PROMPT', cols[1]!, -230, { a: m2, col: CORAL, size: 16 });
      const flip = t > this.s('lay') ? Math.floor((t - this.s('lay')) / 0.45) % 2 : 0;
      setWorld(ctx, c, cols[1]!, -40, 1, 0); ctx.globalAlpha = m2; ctx.strokeStyle = HAIR; ctx.lineWidth = 1.4; ctx.strokeRect(-240, -145, 480, 290); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (flip === 0) appDiagram(ctx, subCam(c, cols[1]!, -40, 0.3), 0, 0, 1, { a: m2 });
      else {
        // the same boxes, laid out as a column instead
        const sc = subCam(c, cols[1]!, -40, 0.3);
        APP.forEach((n, i) => node(ctx, sc, (i % 2 ? 260 : -260), -420 + Math.floor(i / 2) * 260, 220, 96, { title: n.title, tag: n.tag, accent: n.accent, a: m2 }));
      }
      mono(ctx, c, flip ? 'RUN 2' : 'RUN 1', cols[1]! + 200, 120, { a: clamp((t - this.s('lay')) / 0.2), align: 'right', size: 16, col: MUTED });
    }
    // 3 PICTURE
    const m3 = clamp((t - this.s('picture') + 0.1) / 0.4);
    if (m3 > 0) {
      chip(ctx, c, '03 · A PICTURE', cols[2]!, -230, { a: m3, col: CORAL, size: 16 });
      const sc = subCam(c, cols[2]!, -40, 0.3);
      appDiagram(ctx, sc, 0, 0, 1, { a: m3 });
      // the pointer tries to drag the API box; it springs back
      const d = clamp((t - this.s('editable') + 0.2) / 0.8);
      const tug = Math.sin(d * Math.PI) * 40;
      const api = APP.find((n) => n.accent)!;
      const px = cols[2]! + api.clean[0] * 0.3 + 10 + tug, py = -40 + api.clean[1] * 0.3 + 10 + tug * 0.4;
      pointer(ctx, c, px, py, { a: m3, press: d > 0 && d < 1 ? 1 : 0, label: d > 0.4 ? 'NOT EDITABLE' : undefined });
    }
    void ease; void lerp;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    header(ctx, c, -820, -330, 'THE CATCH', 'Three honest limits', t, this.s('catch') - 0.15, { size: 56 });
  }
}
