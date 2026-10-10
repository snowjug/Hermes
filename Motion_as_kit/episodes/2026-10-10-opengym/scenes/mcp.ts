// MCP: "And a read-only MCP server lets an assistant like Claude answer questions about your training."
// The app's stats screen lands on the left. A paper slip reads MCP SERVER with a READ-ONLY tag; on
// "assistant" a speech bubble asks about the bench press, and on "answer" a reply bubble types itself
// out from the logged sets (an example, marked as one).
import { drawCut, tag, ease, prog, setWorld, font, F, rgba, clamp, measure } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, slip, PAPER } from '@ep/kit';

function bubble(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, who: string, lines: string[], t: number, t0: number, dur: number, o: { right?: boolean; col?: string; rot?: number } = {}) {
  if (t < t0) return;
  const size = 32, lh = size * 1.4, h = lines.length * lh + size * 2.4;
  const k = clamp((t - t0) / 0.15);
  setWorld(ctx, c, x, y, 0.7 + 0.3 * ease.outCubic(k), o.rot ?? 0);
  const x0 = -w / 2, y0 = -h / 2;
  const shape = (dx: number, dy: number) => {
    ctx.beginPath(); ctx.roundRect(x0 + dx, y0 + dy, w, h, 28);
    const tx = o.right ? w / 2 - 70 : -w / 2 + 70;
    ctx.moveTo(tx - 20 + dx, h / 2 - 2 + dy); ctx.lineTo(tx + (o.right ? 30 : -30) + dx, h / 2 + 40 + dy); ctx.lineTo(tx + 20 + dx, h / 2 - 2 + dy);
  };
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; shape(6, 9); ctx.fill();
  ctx.fillStyle = o.col ?? PAPER; shape(0, 0); ctx.fill();
  ctx.font = font(F.mono(700), size * 0.7); ctx.fillStyle = rgba('graphite', 1); ctx.fillText(who, x0 + size, y0 + size * 1.2);
  ctx.font = font(F.archivo(87.5, 700), size);
  const total = lines.reduce((a, l) => a + l.length, 0);
  let shown = Math.floor(total * clamp((t - t0) / Math.max(0.1, dur)));
  lines.forEach((l, i) => {
    const n = Math.min(l.length, shown); shown -= l.length;
    if (n <= 0) return;
    ctx.fillStyle = rgba('ink', 1); ctx.fillText(l.slice(0, n), x0 + size, y0 + size * 2.4 + i * lh);
  });
  void measure;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Mcp extends Desk {
  override uses = ['s_stats'];

  build() {
    this.take('And a read-only MCP server', ['read-only', 'MCP', 'server', 'assistant', 'Claude', 'answer', 'questions', 'training.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -380, -40, 1.04, -0.004);
    K.key(w.assistant!.start - 0.1, 60, -30, 0.98, 0.002, ease.inOutCubic);
    K.key(this.ctx.end, 90, -20, 1.0, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.s_stats!, -620, 20, t, { t0: this.ctx.start + 0.05, scale: 0.85, rot: -0.04, seed: 141 });
    slip(ctx, c, 'MCP SERVER', -180, -330, 60, t, w.mcp!.start - 0.1, { rot: -0.03 });
    tag(ctx, c, 'READ-ONLY · RUNS LOCALLY', -180, -210, 28, { a: prog(t, w.readonly!.start, w.readonly!.start + 0.15) * prog(t, w.server!.start - 0.1, w.server!.start + 0.05), rot: 0.03, seed: 142, bg: '#E8F7B8' });
    bubble(ctx, c, 330, -230, 760, 'YOU', ['How is my bench press going?'], t, w.assistant!.start - 0.05, 0.6, { right: true, rot: 0.02 });
    bubble(ctx, c, 180, 110, 820, 'CLAUDE (EXAMPLE)', ['Up from 75 kg × 8 on 7 Sept', 'to 77.5 kg × 8: linear progression.'], t, w.answer!.start - 0.05, Math.max(0.8, w.training!.end - w.answer!.start), { rot: -0.02, col: '#F3E9D8' });
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.answer!.start, 0.012) };
  }
}
