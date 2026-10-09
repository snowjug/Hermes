// CHIP: "Inside a PS5 is an AMD processor that speaks your PC's language, so the game's code can run as
// it is."
// A PS5 motherboard sticker (a real board photo, CC0), the camera in close. On "AMD processor" the
// marker rings the big chip and a tag names it. On "speaks your PC's language" the laptop lands and two
// speech bubbles, one from each, say the same thing: x86-64. On "as it is" a strip of machine code
// slides from the board to the laptop and gets a tick.
import { drawCut, tag, ring, prog, ease, clamp, springStep, rgba, setWorld, font, F, pt, arrow } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const BD = { x: -360, y: 40, s: 0.86 };
const APU = { x: BD.x - 26, y: BD.y + 16 };
const LP = { x: 600, y: 150, s: 0.56 };

export default class Chip extends Desk {
  override uses = ['board', 'laptop'];

  build() {
    const w = this.w;
    this.take('Inside a PS5', ['Inside', 'PS5', 'AMD', 'processor', 'speaks', "PC's", 'language,', "game's", 'code', 'run', 'as', 'is.']);
    const P = this.plot;
    P.add(ring(APU.x, APU.y, 120, 112, 6), w.amd!.start, w.processor!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 7 });
    const ar = arrow(pt(APU.x + 160, APU.y - 60), pt(LP.x - 230, LP.y - 80), 8, -0.25);
    P.add(ar.shaft, w.code!.start, w.run!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 6 });
    P.add(ar.head, w.run!.end, w.run!.end + 0.12, 'signal', { pen: true, width: 6 });
    const K = this.cam;
    K.key(this.ctx.start, APU.x + 40, APU.y, 1.45, -0.01);
    K.key(w.processor!.end, APU.x + 120, APU.y - 20, 1.25, -0.006, ease.inOutCubic);
    K.key(w.speaks!.start + 0.2, 90, 30, 0.95, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 100, 40, 0.97, 0.004, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.board!, BD.x, BD.y, t, { t0: this.ctx.start - 0.05, scale: BD.s, rot: -0.04, seed: 31 });
    tag(ctx, c, 'AMD ZEN 2', APU.x + 290, APU.y - 170, 32, { sub: 'the PS5’s CPU · x86-64', a: prog(t, w.processor!.start, w.processor!.start + 0.2), rot: 0.05, seed: 32 });
    drawCut(ctx, c, this.cuts.laptop!, LP.x, LP.y, t, { t0: w.speaks!.start - 0.1, scale: LP.s, rot: 0.06, seed: 33 });
    const b1 = w.speaks!.start + 0.15, b2 = w.pcs!.start;
    bubble(ctx, c, APU.x - 150, APU.y - 330, 'x86-64', t, b1, -0.06, 'left');
    bubble(ctx, c, LP.x + 40, LP.y - 330, 'x86-64', t, b2, 0.05, 'right');
    const ea = prog(t, w.language!.start, w.language!.start + 0.15);
    if (ea > 0) {
      setWorld(ctx, c, (APU.x + LP.x) / 2 + 70, -330);
      ctx.globalAlpha = ea; ctx.font = font(F.archivo(87.5, 900), 120); ctx.fillStyle = rgba('signal', 1); ctx.textAlign = 'center';
      ctx.fillText('=', 0, 0); ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the machine code strip, board → laptop, then a tick
    const tc = w.code!.start;
    if (t > tc) {
      const k = ease.inOutCubic(clamp((t - tc) / 0.9));
      const x = APU.x + 120 + k * 700, y = APU.y + 230 - k * 120;
      setWorld(ctx, c, x, y, 1, -0.05 + 0.08 * k);
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(5, -24, 420, 44);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, -28, 420, 44);
      ctx.font = font(F.mono(500), 24); ctx.fillStyle = rgba('acid', 1); ctx.fillText('48 89 e5  48 83 ec 20  e8 ...', 14, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    tag(ctx, c, 'RUNS AS IS', LP.x + 10, LP.y + 260, 32, { a: prog(t, w.is!.start, w.is!.start + 0.15), rot: -0.04, seed: 34, col: '#2F8F4E' });
  }
}

/** A paper speech bubble with big mono text, its tail toward `side`. */
function bubble(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, text: string, t: number, t0: number, rot: number, side: 'left' | 'right') {
  if (t < t0) return;
  const sp = springStep(t - t0, 3.2, 0.45);
  setWorld(ctx, c, x, y, 0.4 + 0.6 * sp, rot + (1 - sp) * 0.4);
  const w = 330, h = 130, tx = side === 'left' ? -70 : 70;
  const shape = (dx: number, dy: number) => {
    ctx.beginPath(); ctx.roundRect(-w / 2 + dx, -h / 2 + dy, w, h, 50);
    ctx.moveTo(tx - 30 + dx, h / 2 - 4 + dy); ctx.lineTo(tx + (side === 'left' ? -30 : 30) + dx, h / 2 + 60 + dy); ctx.lineTo(tx + 30 + dx, h / 2 - 4 + dy);
  };
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; shape(6, 9); ctx.fill();
  ctx.fillStyle = '#FBF8F0'; shape(0, 0); ctx.fill();
  ctx.strokeStyle = rgba('ink', 0.85); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 50); ctx.stroke();
  ctx.font = font(F.mono(700), 64); ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center';
  ctx.fillText(text, 0, 22); ctx.textAlign = 'left';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
