// OUTRO: "That's today's tool. There's a new one every day."
// The last page: a splash panel with speed lines, REA in giant block letters, the detective tipping his hat,
// the GitHub address and the channel tag; TO BE CONTINUED in the corner.
import type { Cam } from '@kit/_vo';
import { Comic, panel, agent, speedLines, title, label, sfx, INK, RED, YEL, BLUE, clamp } from '@ep/comic';

export default class Outro extends Comic {
  build() {
    this.take("That's today's tool", ["today's", 'tool.', 'new', 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -110, 1.06, -0.004);
    K.key(this.ctx.end, 0, -110, 0.98, 0.004);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -940, -500, 1880, 760, t, this.ctx.start, {
      fill: BLUE, dots: 'rgba(255,255,255,0.18)', from: 'pop',
      draw: (g) => {
        speedLines(g, 260, -40, 260, 1200, 60, 21, '#FFFFFF', 0.4);
        agent(g, -560, 120, 1.25, t, { mouth: 'smile', glass: 0.2 });
        label(g, 'github.com/morluto/rea', 260, 170, 44, { fill: '#FFFFFF' });
        if (t > w.new!.start) label(g, 'TOOL MAN · A NEW TOOL EVERY DAY', 260, 275, 36, { fill: YEL, rot: -0.02 });
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    title(ctx, c, 'REA', 260, -110, 300, t, this.ctx.start + 0.15, { fill: YEL, stroke: RED, rot: -0.04 });
    sfx(ctx, c, 'TO BE CONTINUED...', 520, -400, 54, t, this.w.every!.start, { fill: '#FFFFFF', rot: 0.04 });
    void INK; void clamp;
  }
}
