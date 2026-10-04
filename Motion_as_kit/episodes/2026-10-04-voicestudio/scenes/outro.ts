// OUTRO: "That's today's tool. There's a new one every day."
// The deck again with its tape turning, the name and where to get it; the live trace along the bottom
// runs out to a flat line as the voice stops, and the pen comes to rest at its end: the first frame
// of the video, mirrored.
import { type LineBatch } from '@engine/lines';
import { placeRow, rowWidth } from '@kit/_vo';
import { Plate, ARCH, chip, pt, clamp, ease, prog, pulse, noise1, rgba, setWorld, label, font, F, type Cam } from '@kit/_mp';
import { cassette, deckFace, bayOf, waveTrace, voiceEnv, DECK_H } from '@ep/vs';

const D = { x: 120, y: -330, w: 760 };
const TR = { x0: -880, x1: 860, y: 330, h: 90 };

export default class Outro extends Plate {
  build() {
    const w = this.w;
    const L = this.take("That's today's tool", [['thats', "That's"], 'today’s', 'tool.', ['theres', "There's"], 'new', 'one', 'every', 'day.']);
    const fam = ARCH(100, 800);
    const ws = L.words;
    this.screenKw.push(...placeRow(ws, -rowWidth(ws.map((x) => x.w), 56, fam) / 2, 450, 56, fam, 'K', { ant: 0.2 }).words);
    this.plot.wp(pt(TR.x1, TR.y), this.ctx.start, Math.max(0.05, this.ctx.end - this.ctx.start));
    const K = this.cam;
    K.key(this.ctx.start, -120, 0, 1.06, -0.006);
    K.key(this.ctx.end, 0, 40, 0.98, 0.0, ease.inOutCubic);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a = prog(t, this.ctx.start, this.ctx.start + 0.3);
    deckFace(ctx, c, D.x, D.y, D.w, { a, name: 'VoiceStudio', press: 1, play: 1 });
    const b = bayOf(D.x, D.y, D.w);
    cassette(ctx, c, b.x, b.y, b.w, { a, label: 'Your voice', sub: 'any engine you like', spin: (t - this.ctx.start) * 3 });
    ctx.globalAlpha = a;
    setWorld(ctx, c, -880, -150);
    ctx.font = font(ARCH(100, 900), 120); ctx.fillStyle = rgba('bone', 1); ctx.fillText('Voice', 0, 0);
    ctx.fillStyle = rgba('signal', 1); ctx.fillText('Studio', 0, 116);
    ctx.font = font(F.mono(400), 26); ctx.fillStyle = rgba('ash', 1); ctx.fillText('github.com/debpalash/VoiceStudio', 4, 180);
    ctx.fillText('voicestudio.sh  ·  macOS · Windows · Linux · Docker', 4, 222);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sa = prog(t, w.theres!.start, w.theres!.start + 0.2);
    if (sa > 0) chip(ctx, c, 'TOOL MAN  ·  A NEW TOOL EVERY DAY', -480, 120, { a: sa, size: 26, border: rgba('signal', 0.9), col: rgba('bone', 1) });
    void DECK_H; void label; void clamp;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const au = this.ctx.audio;
    const env = (u: number) => voiceEnv(au, t - (1 - u) * 1.3);
    waveTrace(X, c, TR.x0, TR.x1, TR.y, TR.h, 520, env, { cycles: 70, phase: t * 40, I: 1.4, width: 2.2 });
    void pulse; void noise1;
  }

  postFX(t: number) {
    // the last half second fades down to the spark, like the first
    return { frame: prog(t, this.ctx.end - 0.6, this.ctx.end, ease.inOutCubic) };
  }
}
