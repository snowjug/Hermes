// TWIST: "One more thing. This narration is AI too, made free on a laptop with no graphics card."
// "One more thing": the screen empties to the pen. "This narration": the whole voiceover so far rewinds
// onto the screen as one waveform, 0:00 to now, the pen at its playhead, still growing while it speaks.
// "on a laptop": the pen draws the laptop from the opening around it, and the facts land as chips:
// Chatterbox (MIT), generated on the CPU, no graphics card, no cost.
import { type LineBatch } from '@engine/lines';
import { placeRow, rowWidth, rectPts } from '@kit/_vo';
import { Plate, ARCH, lineRows, chip, pt, clamp, ease, prog, pulse, noise1, rgba, setWorld, label, burst, type Cam } from '@kit/_mp';
import { waveBars, voiceEnv } from '@ep/vs';

const S = { x0: -700, x1: 700, y: -40, h: 120 };
const LAP = { x: -800, y: -330, w: 1600, h: 560 };

export default class Twist extends Plate {
  tN = 0;

  build() {
    const w = this.w;
    const L = this.take('One more thing', ['One', 'more', 'thing.', 'This', 'narration', 'AI', 'too,', 'made', 'free', 'laptop', 'no', 'graphics', 'card.']);
    const fam = ARCH(100, 900);
    const r1 = this.span(L, 'One', 'thing.');
    this.kw.push(...placeRow(r1, -rowWidth(r1.map((x) => x.w), 96, fam) / 2, -420, 96, fam, 'A', { ant: 0.25 }).words);
    this.screenKw.push(...lineRows(this.span(L, 'This', 'card.'), -860, 400, 52, ARCH(100, 800), 'B', 1720).words);
    this.tN = w.narration!.start - 0.1;
    const P = this.plot;
    // the pen sits at the playhead (drawn per frame in drawFX); before that, centre stage
    P.wp(pt(0, S.y), this.ctx.start, Math.max(0.05, this.tN - this.ctx.start));
    // the laptop around the waveform on "laptop"
    const tl = w.laptop!.start - 0.1;
    P.wp(pt(S.x1 + 6, S.y), this.tN + 0.9, Math.max(0.05, tl - this.tN - 1.2));
    P.add(rectPts(LAP.x, LAP.y, LAP.w, LAP.h), tl, tl + 0.6, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.6 });
    P.add([pt(LAP.x - 100, LAP.y + LAP.h + 14), pt(LAP.x + LAP.w + 100, LAP.y + LAP.h + 14), pt(LAP.x + LAP.w + 50, LAP.y + LAP.h + 60), pt(LAP.x - 50, LAP.y + LAP.h + 60), pt(LAP.x - 100, LAP.y + LAP.h + 14)], tl + 0.6, tl + 0.85, 'plot', { pen: true, width: 2.4 });
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.3, 0);
    K.key(this.tN, 0, -150, 1.2, 0, ease.inOutCubic);
    K.key(this.tN + 0.6, 0, -20, 0.96, 0, ease.inOutCubic);
    K.key(w.laptop!.start, 0, 10, 0.9, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 20, 0.92, 0, ease.linear);
  }

  override camAt(t: number) { return this.cam.at(t); }

  alpha(g: string, t: number) {
    if (g === 'A') return 1 - 0.75 * prog(t, this.tN, this.tN + 0.3);
    return 1;
  }

  /** how much of the strip has rewound onto the screen (1 = all of it) */
  rew(t: number) { return prog(t, this.tN, this.tN + 0.9, ease.inOutCubic); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a = this.rew(t);
    if (a > 0) {
      // time ticks under the strip: 0:00 … now
      for (let s = 0; s <= t; s += 10) {
        const x = S.x0 + ((S.x1 - S.x0) * s) / t;
        if (x < S.x1 - (S.x1 - S.x0) * a) continue;
        setWorld(ctx, c, x, S.y + S.h + 44);
        label(ctx, `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`, 0, 0, { size: 17, col: rgba('ash', 0.9), spacing: 2, align: 'center' });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      setWorld(ctx, c, S.x0, S.y - S.h - 40);
      label(ctx, 'THIS NARRATION, START TO NOW', 0, 0, { size: 22, col: rgba('signal', a), spacing: 5, weight: 600 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const facts: [string, number, number, number][] = [
      ['AI VOICE: CHATTERBOX  ·  MIT LICENCE', w.ai!.start, -420, 150],
      ['MADE OFFLINE  ·  $0', w.free!.start, 420, 150],
      ['NO GRAPHICS CARD  ·  CPU ONLY', w.graphics!.start, 0, 210],
    ];
    for (const [s, t0, x, y] of facts) {
      const fa = prog(t, t0 - 0.05, t0 + 0.15);
      if (fa > 0) chip(ctx, c, s, x, y, { a: fa, size: 22 * (1 + 0.12 * pulse(t, t0, 0.1)), border: rgba('signal', 0.8), col: rgba('bone', 1) });
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const a = this.rew(t);
    if (a <= 0) return;
    const au = this.ctx.audio;
    const now = t;
    waveBars(X, c, S.x0, S.x1, S.y, S.h, 360, (u) => voiceEnv(au, u * now), { from: 1 - a, I: 1.25 });
    // the playhead
    const p0 = this.s(c, S.x1 + 6, S.y - S.h - 10), p1 = this.s(c, S.x1 + 6, S.y + S.h + 10);
    X.seg2(p0[0], p0[1], p1[0], p1[1], 2.5, [3, 3, 3], 0.9);
    burst(X, c, pt(S.x1, S.y), t, this.tN + 0.9, 36, 19, 0.6);
    void clamp; void noise1;
  }

  s(c: Cam, x: number, y: number): [number, number] {
    const dx = (x - c.cx) * c.z, dy = (y - c.cy) * c.z;
    return [this.ctx.W / 2 + dx, this.ctx.H / 2 + dy];
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.ai!.start, 0.08);
    return { zoom: 1 + 0.02 * hit, vignette: 0.55 };
  }
}
