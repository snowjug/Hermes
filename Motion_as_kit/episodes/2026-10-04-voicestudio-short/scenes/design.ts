// DESIGN: "Describe a voice that doesn't exist, and it builds one."
// A card types a description; DOESN'T EXIST stamps across it in pink; on "builds" the bars of a new
// waveform stack up from the floor, block by block, into a voice, and NEW VOICE slams in.
import { Plate, ease, prog, pulse, noise1, rgba, setWorld, font, F, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, card, speechEnv, mono, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));
const DESC = 'deep, old, British, whispering';

export default class Design extends Plate {
  paper = true;

  build() {
    this.take('Describe a voice', ['Describe', 'voice', "doesn't", 'exist,', 'builds', 'one.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.06, 0.0);
    K.key(w.exist!.start + 0.1, 0, -150, 1.02, 0.012, ease.outExpo);
    K.key(w.builds!.start, 0, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 20, 1.03, 0, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rslam(ctx, c, 'DESCRIBE', -490, -640, fit('DESCRIBE', 920, 200), t, w.describe!.start, { top: 'ink' });
    // the description card, typed
    const ca = prog(t, w.describe!.start, w.describe!.start + 0.15);
    card(ctx, c, -480, -540, 960, 260, { a: ca });
    if (ca > 0) {
      mono(ctx, c, 'A VOICE THAT IS…', -440, -470, 30, 'blood');
      const n = Math.ceil(DESC.length * prog(t, w.describe!.start + 0.1, w.exist!.end));
      setWorld(ctx, c, -440, -370);
      ctx.font = font(F.mono(700), 48); ctx.fillStyle = rgba('ink', 1);
      ctx.fillText(DESC.slice(0, n), 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // DOESN'T EXIST (yet)
    const ea = prog(t, w.doesnt!.start, w.doesnt!.start + 0.1);
    if (ea > 0) {
      setWorld(ctx, c, 0, -150, 1, -0.07);
      ctx.font = font(ARCHB(125), 88);
      overprint(ctx, (col) => { ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText("DOESN'T EXIST", 0, 0); ctx.textAlign = 'left'; }, { top: 'signal', a: ea });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the bars build up on "builds"
    const b = prog(t, w.builds!.start - 0.1, w.one!.end + 0.2);
    if (b > 0) {
      const n = 24, x0 = -470, x1 = 470, floor = 560;
      setWorld(ctx, c, 0, 0);
      overprint(ctx, (col) => {
        ctx.fillStyle = col;
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          const h = 40 + 520 * speechEnv(u * 5 + 1.3, 17);
          const blocks = Math.floor(h / 40);
          const shown = Math.floor(blocks * ease.outCubic(prog(b, u * 0.5, u * 0.5 + 0.5)));
          for (let k = 0; k < shown; k++) ctx.fillRect(x0 + (x1 - x0) * u - 15, floor - (k + 1) * 40 + 4, 30, 34);
        }
      }, { top: 'signal', under: 'acid' });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      rslam(ctx, c, 'NEW VOICE', -490, 760, fit('NEW VOICE', 920, 200), t, w.one!.start, { top: 'ink' });
    }
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.doesnt!.start, 0.07) + pulse(t, w.one!.start, 0.07);
    return { zoom: 1 + 0.025 * hit, shake: [8 * hit * noise1(t * 60, 1), 8 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
