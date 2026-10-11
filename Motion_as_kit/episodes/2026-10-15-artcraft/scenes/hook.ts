// 01 HOOK: "Every AI image tool works the same way: you type a prompt, and you pray."
// THE USUAL WAY on tape. A prompt types itself; a 2 x 2 grid of results keeps rerolling, a different mess every
// beat, while the ATTEMPT counter climbs. On "pray." the line lands in amber serif. The clapperboard rises.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { Cinema, tape, title, mono, messThumb, BODY, MONOB, IVORY, AMBER, SERIFI, clamp, ease } from '@ep/cinema';

const PROMPT = 'a lonely astronaut in a neon diner, cinematic';

export default class Hook extends Cinema {
  override slateOut = true;
  override scene = 0;
  build() {
    this.take('Every AI image tool', ['Every', 'works', 'same', 'type', 'prompt,', 'pray.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.works!.start;
    if (t > t0 - 0.1) {
      const roll = Math.floor((t - t0) / 0.16);
      [[-240, -20], [240, -20], [-240, 250], [240, 250]].forEach(([x, y], i) => {
        const a = clamp((t - t0 - i * 0.08) / 0.2);
        messThumb(ctx, c, x!, y!, 440, 248, roll * 4 + i, a);
      });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tape(ctx, c, 'THE USUAL WAY', -620, -400, 34, { a: clamp((t - w.every!.start) / 0.2) });
    // the prompt bar
    const pa = clamp((t - w.every!.start - 0.1) / 0.25);
    setWorld(ctx, c, -560, -330, 1, 0);
    ctx.globalAlpha = pa; ctx.fillStyle = 'rgba(22,22,26,0.95)'; ctx.beginPath(); ctx.roundRect(0, 0, 1120, 80, 40); ctx.fill();
    ctx.strokeStyle = 'rgba(241,236,226,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    const n = Math.ceil(PROMPT.length * clamp((t - w.type!.start) / Math.max(0.5, w.prompt!.end - w.type!.start)));
    ctx.font = font(BODY, 32); ctx.fillStyle = IVORY; ctx.fillText(PROMPT.slice(0, n), 36, 52);
    if (n < PROMPT.length && Math.floor(t * 4) % 2 === 0 && t > w.type!.start) { ctx.fillStyle = AMBER; ctx.fillRect(40 + measure(PROMPT.slice(0, n), BODY, 32), 22, 3, 38); }
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // attempts
    const at = Math.max(1, Math.floor((t - w.works!.start) / 0.16) + 1);
    if (t > w.works!.start) mono(ctx, c, `ATTEMPT ${at}`, 470, -380, { size: 30, col: at > 12 ? AMBER : IVORY });
    title(ctx, c, '…and pray.', 0, 130, 150, t, w.pray!.start - 0.05, { f: SERIFI, col: AMBER, glow: 'rgba(245,179,66,0.6)' });
    void MONOB; void ease;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.pray!.start, 0.02) }; }
}
