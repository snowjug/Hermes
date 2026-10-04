// NAME: "It's called VoiceStudio. 52,000 GitHub stars, nearly a third from this week."
// VOICE / STUDIO slam in letter by letter, black then pink. The star count rolls to 52,915 and a bar
// prints under it: the last 32% in pink, THIS WEEK.
import { Plate, ease, prog, pulse, noise1, clamp, rgba, setWorld, font, type Cam } from '@kit/_mp';
import { layout } from '@engine/type';
import { overprint, mono, ARCHB } from '@ep/riso';

export default class Name extends Plate {
  paper = true;

  build() {
    this.take("It's called VoiceStudio", ['called', 'VoiceStudio.', '52,000', 'GitHub', 'stars,', 'nearly', 'third', 'this', 'week.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.08, 0.0);
    K.key(w['52000']!.start, 0, -60, 1.0, 0, ease.inOutCubic);
    K.key(w.third!.start, 0, 40, 1.04, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 60, 1.06, 0.0, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  word(ctx: CanvasRenderingContext2D, c: Cam, s: string, y: number, t: number, t0: number, dur: number, top: string) {
    const fam = ARCHB(125);
    const lay = layout(s, fam, 100);
    const size = Math.min(260, (980 / lay.width) * 100);
    lay.glyphs.forEach((g, i) => {
      const ti = t0 + (i / lay.glyphs.length) * dur;
      if (t < ti) return;
      const age = t - ti, k = ease.outExpo(clamp(age / 0.2));
      setWorld(ctx, c, -490 + (g.x / 100) * size, y + (1 - k) * -60, 1);
      ctx.font = font(fam, size);
      overprint(ctx, (col) => { ctx.fillStyle = col; ctx.fillText(g.ch, 0, 0); }, { top, dx: 8 * (2 - k), dy: 6 * (2 - k), a: clamp(age / 0.04) });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    mono(ctx, c, "IT'S CALLED", -486, -720, 48, 'ink', { a: prog(t, w.called!.start - 0.15, w.called!.start) });
    const vs = w.voicestudio!;
    const d = Math.max(0.4, vs.end - vs.start);
    this.word(ctx, c, 'VOICE', -500, t, vs.start, d * 0.45, 'ink');
    this.word(ctx, c, 'STUDIO', -280, t, vs.start + d * 0.45, d * 0.5, 'signal');
    // the stars
    const sa = prog(t, w['52000']!.start - 0.1, w['52000']!.start + 0.1);
    if (sa > 0) {
      const v = Math.round(52915 * ease.outCubic(prog(t, w['52000']!.start, w.stars!.end)));
      setWorld(ctx, c, -490, 60);
      ctx.font = font(ARCHB(112.5), 210);
      overprint(ctx, (col) => { ctx.fillStyle = col; ctx.fillText(v.toLocaleString('en-US'), 0, 0); }, { top: 'ink', a: sa });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, '★ GITHUB STARS', -486, 140, 48, 'blood', { a: sa });
    }
    // the bar: the last 32% is this week
    const ba = prog(t, w.nearly!.start - 0.1, w.nearly!.start + 0.1);
    if (ba > 0) {
      const B = { x: -480, y: 260, w: 960, h: 130 };
      const k = ease.outCubic(prog(t, w.third!.start, w.third!.start + 0.4));
      setWorld(ctx, c, 0, 0);
      ctx.globalAlpha = ba;
      ctx.fillStyle = rgba('ink', 1); ctx.fillRect(B.x, B.y, B.w * 0.683, B.h);
      overprint(ctx, (col) => { ctx.fillStyle = col; ctx.fillRect(B.x + B.w * 0.683, B.y, B.w * 0.317 * k, B.h); }, { top: 'signal', a: ba });
      ctx.globalAlpha = ba;
      ctx.strokeStyle = rgba('ink', 1); ctx.lineWidth = 8; ctx.strokeRect(B.x, B.y, B.w, B.h);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'APRIL → LAST WEEK', B.x, B.y + B.h + 60, 34, 'ink', { a: ba });
      mono(ctx, c, 'THIS WEEK', B.x + B.w, B.y + B.h + 60, 40, 'signal', { a: prog(t, w.this!.start, w.this!.start + 0.15), align: 'right' });
      mono(ctx, c, '+16,775', B.x + B.w, B.y - 30, 56, 'signal', { a: prog(t, w.third!.start + 0.2, w.third!.start + 0.4), align: 'right' });
    }
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.voicestudio!.start + 0.1, 0.07) + 0.6 * pulse(t, w.third!.start, 0.07);
    return { zoom: 1 + 0.025 * hit, shake: [8 * hit * noise1(t * 60, 1), 8 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
