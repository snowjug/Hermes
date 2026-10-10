// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// A comic cover: the robot detective with his lens raised over an app window that has been cracked open to
// show its code, speed lines behind, and NO SOURCE CODE lettered across the top. The title carries "AI tool
// reverse-engineers any app"; the cover adds the twist in three words.
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, agent, speedLines, appWindow, codeCard, sfx, INK, RED, YEL, BLUE, SKY, BLOCK } from '@ep/comic';

export default class Thumb extends Comic {
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }
  override captionLines() { return []; }

  override page(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    panel(ctx, c, -940, -520, 1880, 1040, t, 0, {
      fill: YEL, dots: 'rgba(229,50,43,0.35)',
      draw: (g) => {
        speedLines(g, 300, 120, 300, 1300, 64, 7, '#FFFFFF', 0.7);
        // the app, cracked open
        g.save(); g.translate(330, 140); g.rotate(0.05);
        appWindow(g, -380, -260, 760, 520, 'ANY APP', { bar: SKY });
        g.restore();
        g.save(); g.translate(360, 210); g.rotate(-0.04);
        codeCard(g, -330, -150, 660, [['mov  eax, [ebp+8]', '#7EC8F2'], ['call ShowFeature', '#FFD21F'], ['int feature(...) {', '#E6E6E6'], ['  return magic;', '#E6E6E6']], t, 0, 0.1, { size: 36 });
        g.restore();
        agent(g, -560, 170, 1.75, 2.0, { glass: 1, look: 1, mouth: 'o' });
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    sfx(ctx, c, 'NO SOURCE CODE!', 40, -330, 158, t, 0, { fill: '#FFFFFF', rot: -0.05 });
    void RED; void BLUE; void INK; void BLOCK; void font; void F;
  }
}
