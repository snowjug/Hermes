// STOP: "Stop paying for AI voices."
// Cream stock. Before a word is said, a price tag sits on the sheet: $99/mo, the AI-voice plan. STOP lands
// in pink and a fat pink X prints across the tag; PAYING / FOR AI / VOICES. slam in under it, overprinted.
import { Plate, pt, clamp, ease, prog, pulse, noise1, rgba, setWorld, font, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, card, mono, halftone, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));

export default class Stop extends Plate {
  paper = true;

  build() {
    this.take('Stop paying', ['Stop', 'paying', 'for', 'AI', 'voices.']);
    const K = this.cam;
    // the first frame is the price tag, big; on "Stop" the camera snaps out to the whole sheet
    K.key(this.ctx.start, 0, 380, 1.55, -0.02);
    K.key(this.w.stop!.start - 0.04, 0, 370, 1.5, -0.02, ease.linear);
    K.key(this.w.stop!.start + 0.1, 0, 20, 1.0, -0.015, ease.outExpo);
    K.key(this.ctx.end, 0, 0, 1.03, -0.01, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the bottom: pink halftone rising
    halftone(ctx, c, -560, 520, 1120, 460, 26, (_u, v) => 0.15 + 0.85 * v, 'signal', 0.55);
    // the price tag
    const tag = { x: -330, y: 300, w: 660, h: 330 };
    mono(ctx, c, 'WHAT AN AI VOICE COSTS:', 0, tag.y - 50, 40, 'ink', { align: 'center', a: 1 - prog(t, w.stop!.start - 0.05, w.stop!.start + 0.1) });
    card(ctx, c, tag.x, tag.y, tag.w, tag.h, { r: 28 });
    setWorld(ctx, c, tag.x + tag.w / 2, tag.y + 200);
    ctx.font = font(ARCHB(112.5), 170); ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center';
    ctx.fillText('$99/mo', 0, 0); ctx.textAlign = 'left';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    mono(ctx, c, 'ELEVENLABS PRO · ~10 HOURS', tag.x + tag.w / 2, tag.y + 278, 30, 'ink', { align: 'center' });
    // the X on "Stop"
    const k = prog(t, w.stop!.start, w.stop!.start + 0.18, ease.outCubic);
    if (k > 0) {
      setWorld(ctx, c, 0, tag.y + tag.h / 2);
      overprint(ctx, (col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 44; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-380, -200); ctx.lineTo(-380 + 760 * k, -200 + 400 * k); ctx.stroke();
        const k2 = prog(t, w.stop!.start + 0.08, w.stop!.start + 0.26, ease.outCubic);
        if (k2 > 0) { ctx.beginPath(); ctx.moveTo(380, -200); ctx.lineTo(380 - 760 * k2, -200 + 400 * k2); ctx.stroke(); }
        ctx.lineCap = 'butt';
      }, { top: 'signal', under: 'acid', dx: 10, dy: 8 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the words
    const X = -480;
    rslam(ctx, c, 'STOP', X, -560, fit('STOP', 960, 330), t, w.stop!.start, { top: 'signal' });
    rslam(ctx, c, 'PAYING', X, -330, fit('PAYING', 960, 230), t, w.paying!.start, { top: 'ink' });
    rslam(ctx, c, 'FOR AI', X, -130, fit('FOR AI', 960, 230), t, w.for!.start, { top: 'ink' });
    rslam(ctx, c, 'VOICES.', X, 70, fit('VOICES.', 960, 230), t, w.voices!.start, { top: 'signal' });
    void pt; void clamp; void pulse; void noise1;
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.stop!.start, 0.07) + 0.6 * pulse(t, w.voices!.start, 0.07);
    return { zoom: 1 + 0.03 * hit, shake: [10 * hit * noise1(t * 60, 1), 10 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06,
      frame: 0 };
  }
}
