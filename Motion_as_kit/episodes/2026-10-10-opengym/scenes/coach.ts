// COACH: "There's even an optional AI coach. It drafts your week, but nothing changes until you approve it."
// The app's Plan screen (with its Coach card) lands on the left, tagged OPTIONAL. On "drafts your week" a
// typed sheet, THIS WEEK (DRAFT), fills with a plan. On "nothing changes" an APPROVE box appears unticked,
// and on "approve" the tick is drawn and a stamp lands: YOU DECIDE.
import { drawCut, tag, ease, prog } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk, doc, checkbox } from '@ep/kit';

export default class Coach extends Desk {
  override uses = ['s_plan'];
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take("There's even an optional", ['optional', 'AI', 'coach.', 'drafts', 'week,', 'nothing', 'changes', 'approve']);
    this.stamp = makeStamp('YOU DECIDE', 'AI COACH · OPTIONAL', 'NOTHING CHANGES UNTIL YOU SAY SO', HEX.signal, 51);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -420, -40, 1.06, -0.004);
    K.key(w.drafts!.start - 0.1, -60, -60, 0.98, 0.0, ease.inOutCubic);
    K.key(w.nothing!.start, 120, -20, 0.98, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 150, -10, 1.0, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.s_plan!, -580, 30, t, { t0: this.ctx.start + 0.05, scale: 0.72, rot: -0.04, seed: 111 });
    tag(ctx, c, 'OPTIONAL · YOUR OWN AI KEY', -580, -330, 28, { a: prog(t, w.optional!.start, w.optional!.start + 0.15), rot: 0.03, seed: 112 });
    doc(ctx, c, -170, -380, 620, 560, 'This week (draft)', ['MON  Push day · 6 exercises', 'TUE  Rest', 'WED  Pull day · 5 exercises', 'THU  Rest', 'FRI  Leg day · 6 exercises', 'SAT  Cardio · 30 min'], t, w.drafts!.start - 0.1, Math.max(0.6, w.nothing!.start - w.drafts!.start), { rot: 0.02, size: 27, hot: [4] });
    const tb = w.nothing!.start - 0.05;
    checkbox(ctx, c, 600, -150, 'APPROVE?', prog(t, w.approve!.start, w.approve!.end + 0.15), { size: 58, a: prog(t, tb, tb + 0.15), rot: -0.03 });
    tag(ctx, c, 'NOT YET APPLIED', 640, -10, 28, { a: prog(t, w.changes!.start, w.changes!.start + 0.15) * (1 - prog(t, w.approve!.start, w.approve!.start + 0.2)), rot: 0.04, seed: 113, bg: '#FDE2CC' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    if (this.stamp) drawStamp(ctx, c, this.stamp, 620, 150, t, this.w.approve!.end + 0.1, 0.55, -0.1, 0.95);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.approve!.end + 0.1, 0.018) };
  }
}
