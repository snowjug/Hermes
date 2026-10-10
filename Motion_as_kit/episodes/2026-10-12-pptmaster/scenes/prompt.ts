// PROMPT: "You drop the PDF in a folder and type: turn this into a PPT. Or paste your notes straight into the
// chat."
// Left: a folder window (projects/) and the PDF dropping into it. Right: the agent's chat window; on "type"
// the message "turn this into a PPT" types itself with the PDF attached as a chip; on "paste your notes" a
// second message lands: a pasted block of notes.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, chat, pdf, pill, BODY, HEAD, SOFT, WHITE, ORANGE, clamp, ease, lerp } from '@ep/keynote';

export default class Prompt extends Keynote {
  build() {
    this.take('You drop the PDF', ['drop', 'PDF', 'folder', 'type:', 'turn', 'PPT.', 'paste', 'notes', 'chat.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -380, 0, 1.04, 0);
    K.key(w.type!.start - 0.1, 200, -20, 1.0, 0);
    K.key(this.ctx.end, 230, -10, 1.03, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the folder window
    glass(ctx, c, -900, -260, 620, 480, { a: clamp((t - this.ctx.start) / 0.2) });
    setWorld(ctx, c, -900, -260, 1, 0);
    ctx.font = font(BODY, 28); ctx.fillStyle = SOFT; ctx.fillText('projects /', 40, 50);
    ctx.fillStyle = '#F2B84B'; ctx.beginPath(); ctx.roundRect(200, 130, 220, 160, 14); ctx.fill();
    ctx.fillStyle = '#E0A23A'; ctx.beginPath(); ctx.roundRect(200, 110, 100, 40, 10); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the PDF drops in
    const kd = ease.inOutCubic(clamp((t - w.drop!.start + 0.1) / 0.6));
    pdf(ctx, c, lerp(-590, -590, kd), lerp(-520, -40, kd), lerp(0.55, 0.32, kd), { a: 1 - clamp((t - w.folder!.end) / 0.3) * 0.6, rot: lerp(-0.3, 0, kd) });
    pill(ctx, c, 'report.pdf', -590, 160, 30, { a: clamp((t - w.folder!.start) / 0.2) });
    // the chat
    const tm = w.type!.start;
    chat(ctx, c, -160, -330, 780, 600, 'Claude Code', [
      ['turn projects/report.pdf into a PPT', 'me', tm + 0.1],
      ['Meeting notes, Q3: revenue up 18%, two new regions, hiring plan...', 'me', w.paste!.start + 0.05],
    ], t, { a: clamp((t - tm + 0.3) / 0.25) });
    if (t > tm + 0.6) pill(ctx, c, '+ report.pdf', 400, -100, 28, { a: clamp((t - tm - 0.6) / 0.2), bg: 'rgba(226,52,45,0.85)' });
    void HEAD; void WHITE; void ORANGE;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.turn!.start, 0.012) }; }
}
