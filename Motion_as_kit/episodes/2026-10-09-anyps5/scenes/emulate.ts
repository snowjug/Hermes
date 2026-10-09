// EMULATE: "Normally, that takes emulation: software pretending to be the whole console, translating every
// instruction while you play."
// The sheet slides off a laptop. EMULATION in big type, a red highlighter swiped under it. On
// "pretending to be the whole console" the PS5 photo is taped over the laptop like a mask. On
// "translating every instruction" an old reader (the interpreter) lands beside it and slips of machine
// code crawl past him one at a time, a meter beside them reading "slow".
import { drawCut, tape, highlight, tag, prog, ease, clamp, springStep, rgba, setWorld, font, F, hash } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const LP = { x: 330, y: 120, s: 0.78 };
const RD = { x: -560, y: 150, s: 0.62 };
const CODE = ['mov rax, [rbp-8]', 'add rax, rcx', 'call [rip+0x2f30]', 'vmovaps ymm0, [rsi]', 'cmp eax, 1', 'jne 0x4f12a0'];

export default class Emulate extends Desk {
  override uses = ['laptop', 'ps5', 'reader'];
  override wipeIn = true;
  override wipeFrom: 'left' | 'right' = 'left';

  build() {
    const w = this.w;
    this.take('Normally, that takes emulation', ['Normally,', 'emulation:', 'software', 'pretending', 'whole', 'console,', 'translating', 'every', 'instruction', 'play.']);
    void w;
    const K = this.cam;
    K.key(this.ctx.start, 60, -40, 1.0, 0);
    K.key(w.pretending!.start, 140, 20, 1.04, 0.006, ease.inOutCubic);
    K.key(w.translating!.start, -80, 60, 0.95, -0.004, ease.inOutCubic);
    K.key(this.ctx.end, -60, 60, 0.97, -0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the headline, with a highlighter swipe on "emulation"
    const ha = prog(t, this.ctx.start + 0.1, this.ctx.start + 0.3);
    highlight(ctx, c, -650, -400, 790, 120, prog(t, w.emulation!.start, w.emulation!.end, ease.inOutCubic), { a: 0.55, seed: 4 });
    setWorld(ctx, c, -640, -300);
    ctx.globalAlpha = ha;
    ctx.font = font(F.archivo(75, 900), 138); ctx.fillStyle = rgba('ink', 1); ctx.fillText('EMULATION', 0, 0);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the laptop, and the PS5 mask taped over it
    drawCut(ctx, c, this.cuts.laptop!, LP.x, LP.y, t, { t0: this.ctx.start - 0.5, scale: LP.s, rot: 0.03, seed: 3 });
    const tm = w.pretending!.start;
    drawCut(ctx, c, this.cuts.ps5!, LP.x + 20, LP.y - 120, t, { t0: tm, scale: 0.42, rot: -0.12, seed: 9 });
    if (t > tm + 0.3) {
      tape(ctx, c, LP.x - 120, LP.y - 300, 140, -0.7, { seed: 21, a: prog(t, tm + 0.3, tm + 0.38) });
      tape(ctx, c, LP.x + 170, LP.y - 290, 140, 0.6, { seed: 22, a: prog(t, tm + 0.38, tm + 0.46) });
    }
    tag(ctx, c, 'A PC IN A PS5 COSTUME', LP.x + 40, LP.y + 330, 28, { a: prog(t, w.whole!.start, w.whole!.start + 0.2), rot: 0.02, seed: 23 });
    // the interpreter, and the code slips crawling past him
    const tr = w.translating!.start;
    drawCut(ctx, c, this.cuts.reader!, RD.x, RD.y, t, { t0: tr - 0.1, scale: RD.s, rot: -0.05, seed: 12 });
    tag(ctx, c, 'THE INTERPRETER', RD.x, RD.y + 230, 26, { a: prog(t, tr + 0.2, tr + 0.4), rot: -0.03, seed: 24 });
    for (let i = 0; i < CODE.length; i++) {
      const ti = tr + 0.25 + i * 0.75;
      if (t < ti) break;
      const k = clamp((t - ti) / 2.2);
      const x = RD.x + 230 + k * 560, y = RD.y - 240 + i * 46 - k * 30;
      const a = clamp((t - ti) / 0.15) * (1 - prog(k, 0.85, 1));
      setWorld(ctx, c, x, y, 0.8 + 0.2 * springStep(t - ti, 3, 0.5), (hash(i, 7) - 0.5) * 0.12);
      ctx.globalAlpha = a;
      const s = CODE[i]!;
      ctx.font = font(F.mono(500), 24);
      const tw = ctx.measureText(s).width;
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(4, -26, tw + 28, 40);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, -30, tw + 28, 40);
      ctx.fillStyle = rgba('acid', 1); ctx.fillText(s, 14, -2);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the meter
    const ma = prog(t, w.instruction!.start, w.instruction!.start + 0.2);
    if (ma > 0) {
      setWorld(ctx, c, -40, 330, 1, -0.03);
      ctx.globalAlpha = ma;
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, 0, 360, 64);
      ctx.strokeStyle = rgba('ink', 0.8); ctx.lineWidth = 2; ctx.strokeRect(0, 0, 360, 64);
      ctx.font = font(F.mono(700), 26); ctx.fillStyle = rgba('ink', 1); ctx.fillText('EVERY INSTRUCTION:', 16, 42);
      ctx.fillStyle = rgba('signal', 1); ctx.fillText('SLOW', 280, 42);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
}
