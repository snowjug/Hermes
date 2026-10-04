// TWIST: "Oh, and this voice? Also AI. Made for free, on a laptop."
// The Short's own narration, start to now, prints as one big pink waveform, still growing; THIS VOICE
// points at it; = AI slams on "Also AI."; MADE ON A LAPTOP and $0 land. The last frame loops into the
// first (the price tag).
import { Plate, ease, prog, pulse, noise1, rgba, setWorld, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, mono, voiceEnv, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));

export default class Twist extends Plate {
  paper = true;

  build() {
    this.take('Oh, and this voice', ['Oh,', 'this', 'voice?', 'Also', 'AI.', 'Made', 'free,', 'laptop.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -80, 1.08, 0.0);
    K.key(w.ai!.start + 0.08, 0, -40, 1.0, 0.015, ease.outExpo);
    K.key(this.ctx.end, 0, -20, 1.03, 0.0, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rslam(ctx, c, 'THIS VOICE?', -490, -640, fit('THIS VOICE?', 920, 190), t, w.this!.start, { top: 'ink' });
    // the narration, 0:00 to now, as vertical bars down the middle
    const a = prog(t, w.this!.start, w.voice!.end);
    if (a > 0) {
      const n = 46, top = -480, bot = 280, now = t;
      setWorld(ctx, c, 0, 0);
      overprint(ctx, (col) => {
        ctx.fillStyle = col;
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          if (u > a) break;
          const y = top + (bot - top) * u;
          const amp = Math.max(0.04, voiceEnv(this.ctx.audio, u * now));
          ctx.fillRect(-470 * amp, y - 6, 940 * amp, 11);
        }
      }, { top: 'signal', dx: 8, dy: 5 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, '0:00', -500, top + 6, 26, 'ink', { a });
      mono(ctx, c, 'NOW', -500, bot + 6, 26, 'blood', { a });
    }
    rslam(ctx, c, '= AI', -490, 520, fit('= AI', 920, 330), t, w.ai!.start, { top: 'signal' });
    mono(ctx, c, 'MADE FOR $0, ON A LAPTOP', -486, 640, 46, 'ink', { a: prog(t, w.made!.start, w.made!.start + 0.15) });
    mono(ctx, c, 'NO GRAPHICS CARD · CHATTERBOX (MIT)', -486, 710, 32, 'blood', { a: prog(t, w.laptop!.start, w.laptop!.start + 0.15) });
    void rgba;
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.ai!.start, 0.07);
    return { zoom: 1 + 0.035 * hit, shake: [10 * hit * noise1(t * 60, 1), 10 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
