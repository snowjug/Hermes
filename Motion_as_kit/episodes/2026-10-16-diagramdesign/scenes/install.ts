// 08 INSTALL: "Install it once, then just ask: draw an architecture diagram of my app."
// A terminal types the real install command and answers with a green tick; on "ask" a chat card slides up under it
// and the request types in step with the voice, the word ARCHITECTURE lit coral.
import type { Cam } from '@kit/_vo';
import { Dgm, card, typed, mono, mark, chip, GREEN, MUTED, CORAL, clamp } from '@ep/dgm';

const CMD = '$ npx skills add cathrynlavery/diagram-design';

export default class Install extends Dgm {
  build() {
    this.take('Install it once', ['Install', 'once,', 'ask:', 'draw', 'architecture', 'diagram', 'app.']);
    this.frame(0, 0, 1, { from: [-900, 0, 1], to: [900, 0, 1], hold: [0, 60], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const t0 = this.ctx.start;
    card(ctx, c, 0, -150, 1180, 230, { k: clamp((t - t0) / 0.4), title: 'terminal' });
    typed(ctx, c, CMD, -540, -150, t, this.s('install') - 0.05, 42, { size: 28, caret: t < this.s('once') + 0.4 });
    const done = clamp((t - this.s('once') - 0.15) / 0.3);
    if (done > 0) {
      mark(ctx, c, -525, -88, true, done, 1);
      mono(ctx, c, 'added diagram-design · 44 diagram types · ready', -495, -82, { a: done, size: 22, col: GREEN });
    }
    // the ask
    const ak = clamp((t - this.s('ask') + 0.2) / 0.4);
    card(ctx, c, 0, 170, 1180, 190, { k: ak, title: 'chat with your agent' });
    if (ak > 0.3) {
      const say = '› draw an architecture diagram of my app';
      typed(ctx, c, say, -540, 190, t, this.s('draw') - 0.05, say.length / Math.max(0.6, this.e('app') - this.s('draw') + 0.05), { size: 30 });
    }
    chip(ctx, c, 'TYPE: ARCHITECTURE', 420, 300, { a: clamp((t - this.s('architecture') - 0.2) / 0.3), col: CORAL, size: 17 });
    void MUTED;
  }
}
