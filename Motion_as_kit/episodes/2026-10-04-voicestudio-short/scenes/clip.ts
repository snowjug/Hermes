// CLIP: "This free app copies a voice from a ten-second clip."
// A recording prints across the sheet in black. On "copies" a pink copy peels off it and drops below,
// bar for bar; on "ten-second" a pink bracket grabs ten seconds of the original and 10 SEC slams in.
import { Plate, ease, prog, pulse, noise1, lerp, rgba, setWorld, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, bars, speechEnv, mono, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));
const OY = -230, CY = 170, X0 = -490, X1 = 490;

export default class Clip extends Plate {
  paper = true;

  build() {
    this.take('This free app copies', ['This', 'free', 'app', 'copies', 'voice', 'ten-second', 'clip.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -60, 1.04, 0.01);
    K.key(w.copies!.start + 0.1, 0, -20, 1.0, 0, ease.outExpo);
    K.key(w.tensecond!.start, 0, -40, 1.0, 0, ease.linear);
    K.key(w.tensecond!.start + 0.12, -40, -60, 1.06, -0.012, ease.outExpo);
    K.key(this.ctx.end, -40, -60, 1.08, -0.012, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rslam(ctx, c, 'FREE APP', -490, -620, fit('FREE APP', 920, 170), t, w.free!.start, { top: 'ink' });
    // the original recording
    const rec = prog(t, this.ctx.start, this.ctx.start + 0.5);
    bars(ctx, c, X0, X1, OY, 120, 64, (u) => speechEnv(u * 22, 3), 'ink', { to: rec });
    mono(ctx, c, 'A RECORDING OF A VOICE', X0, OY - 160, 30, 'ink', { a: rec });
    // the copy, peeled off on "copies"
    const k = ease.outBack(prog(t, w.copies!.start, w.copies!.start + 0.45));
    if (k > 0) {
      const y = lerp(OY, CY, k);
      setWorld(ctx, c, 0, 0);
      overprint(ctx, (col) => {
        ctx.fillStyle = col;
        for (let i = 0; i < 64; i++) {
          const u = (i + 0.5) / 64, a = Math.max(0.03, speechEnv(u * 22, 3));
          const x = X0 + (X1 - X0) * u;
          ctx.fillRect(x - 4.5, y - 120 * a, 9, 240 * a);
        }
      }, { top: 'signal', under: 'acid', dx: 8, dy: 6 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'THE SAME VOICE, ANY WORDS', X0, CY + 200, 30, 'blood', { a: prog(t, w.copies!.start + 0.3, w.copies!.start + 0.5) });
    }
    // the bracket on "ten-second"
    const b = prog(t, w.tensecond!.start, w.tensecond!.start + 0.2, ease.outCubic);
    if (b > 0) {
      const bx0 = X0 - 14, bx1 = lerp(bx0, X0 + (X1 - X0) * 0.45, b);
      setWorld(ctx, c, 0, 0);
      ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 12;
      ctx.strokeRect(bx0, OY - 150, bx1 - bx0, 300);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      rslam(ctx, c, '10 SEC.', -490, 640, fit('10 SEC.', 920, 300), t, w.tensecond!.start + 0.05, { top: 'signal' });
      mono(ctx, c, 'IS ALL IT NEEDS', -486, 720, 40, 'ink', { a: prog(t, w.clip!.start, w.clip!.start + 0.2) });
    }
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.copies!.start + 0.1, 0.07) + pulse(t, w.tensecond!.start + 0.05, 0.07);
    return { zoom: 1 + 0.025 * hit, shake: [8 * hit * noise1(t * 60, 1), 8 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
