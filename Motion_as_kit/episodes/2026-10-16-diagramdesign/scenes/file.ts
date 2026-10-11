// 10 ONE FILE: "No build step, no JavaScript. One file that opens anywhere."
// Two dependency nodes, BUILD STEP and JAVASCRIPT, get struck through and crossed on their words; ONE FILE gets the
// tick, and diagram.html opens into a browser window with the clean app diagram inside, then the same file in two
// more windows (OFFLINE, ANY BROWSER).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Dgm, node, mark, card, mono, appDiagram, subCam, CORAL, MUTED, clamp, ease } from '@ep/dgm';

export default class File extends Dgm {
  build() {
    this.take('No build step', ['build', 'step,', 'JavaScript.', 'One', 'file', 'opens', 'anywhere.']);
    this.frame(0, 0, 1, { from: [0, 700, 1], to: [0, 0, 1.7], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const rows: [string, string, string, boolean][] = [['build step', 'NONE', 'build', false], ['JavaScript', 'NONE', 'javascript', false], ['one .html file', 'THAT\'S IT', 'one', true]];
    rows.forEach(([title, sub, key, ok], i) => {
      const y = -170 + i * 150, k = clamp((t - this.ctx.start - 0.15 - i * 0.1) / 0.45);
      node(ctx, c, -560, y, 380, 110, { k, title, sub, tag: ok ? 'OUTPUT' : 'DEPENDENCY', accent: ok });
      const sk = clamp((t - this.s(key) - 0.15) / 0.3);
      if (!ok && sk > 0) {
        setWorld(ctx, c, -560, y, 1, 0);
        ctx.strokeStyle = CORAL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(-150 + 300 * ease.outCubic(sk), 0); ctx.stroke();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      mark(ctx, c, -320, y, ok, sk, 1.5);
    });
    // the file opens: one window, then two more
    const ok = clamp((t - this.s('opens') + 0.15) / 0.45);
    const wins: [number, number, number, string, number][] = [[320, -40, 1, 'diagram.html', 0], [640, 200, 0.62, 'offline', 0.25], [80, 240, 0.55, 'any browser', 0.4]];
    wins.forEach(([x, y, s, title, d], i) => {
      const k = clamp((t - this.s('opens') + 0.15 - d - (i ? this.e('opens') - this.s('opens') : 0)) / 0.45);
      if (k <= 0) return;
      card(ctx, c, x, y, 900 * s, 520 * s, { k, title });
      appDiagram(ctx, subCam(c, x, y + 20 * s, 0.55 * s), 0, 0, 1, { a: clamp(k * 1.5 - 0.5), t });
    });
    mono(ctx, c, 'OPENS ANYWHERE', 320, -330, { a: clamp((t - this.s('anywhere')) / 0.3), align: 'center', size: 20, col: CORAL, track: 3 });
    void ok; void MUTED;
  }
}
