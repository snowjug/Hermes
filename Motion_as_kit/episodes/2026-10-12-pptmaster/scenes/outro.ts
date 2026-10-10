// OUTRO: "That's today's tool. There's a new one every day."
// The finale: a ring of slides orbiting slowly around PPT Master in big gradient type, the GitHub address and
// the channel tag underneath.
import type { Cam } from '@kit/_vo';
import { Keynote, slide, headline, pill, sparkles, ORANGE, VIOLET, TEAL, PEACH, type SlideKind } from '@ep/keynote';

const KINDS: SlideKind[] = ['chart', 'bullets', 'image', 'table', 'quote', 'agenda', 'title', 'chart'];

export default class Outro extends Keynote {
  build() {
    this.take("That's today's tool", ["today's", 'tool.', 'new', 'every', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.06, 0);
    K.key(this.ctx.end, 0, 0, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const n = KINDS.length;
    const items = KINDS.map((k, i) => {
      const a = (i / n) * Math.PI * 2 + t * 0.35;
      return { k, i, x: Math.cos(a) * 760, y: Math.sin(a) * 300 - 20, z: Math.sin(a) };
    }).sort((p, q) => p.z - q.z);
    items.forEach(({ k, i, x, y, z }) => slide(ctx, c, x, y, 300 + 80 * (z + 1) / 2, { kind: k, title: ['Q3', 'Plan', 'Market', 'Budget', 'Voices', 'Agenda', 'Hello', 'Growth'][i], accent: [ORANGE, VIOLET, TEAL][i % 3], a: 0.45 + 0.4 * (z + 1) / 2, seed: i, rot: 0.04 * Math.cos(i) }));
    sparkles(ctx, c, 0, -60, t, this.ctx.start + 0.1, 30, 13, PEACH);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'PPT Master', 0, -40, 170, t, this.ctx.start + 0.05, { from: '#FFFFFF', to: PEACH, glow: 1.5 });
    pill(ctx, c, 'github.com/hugohe3/ppt-master', 0, 80, 36, { a: Math.min(1, Math.max(0, (t - this.w.tool!.start) / 0.2)) });
    pill(ctx, c, 'TOOL MAN · A NEW TOOL EVERY DAY', 0, 180, 30, { a: Math.min(1, Math.max(0, (t - this.w.new!.start) / 0.2)), bg: 'rgba(255,91,58,0.9)' });
  }
}
