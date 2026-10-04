// DUB: "Dubbing chains it all: transcribe the video, translate it, re-voice each speaker in time."
// A production line the camera rides along. A video with two speakers and their original speech; on
// "transcribe" their words appear as text; on "translate" the text turns into Spanish letter by letter;
// on "re-voice" new speech grows in each speaker's colour; on "in time" it is squeezed into the slots
// the original lines took, and the camera pulls back to show the whole chain.
import { type LineBatch } from '@engine/lines';
import { rectPts } from '@kit/_vo';
import { Plate, ARCH, lineRows, packets, pt, clamp, ease, prog, pulse, noise1, lerp, rgba, mixCss, setWorld, font, F, label, burst, hash, type Cam } from '@kit/_mp';
import { waveBars, speechEnv, lin } from '@ep/vs';

const SX = [0, 1100, 2200, 3300];
const Y = -40;
const SEG: { who: 'A' | 'B'; a: number; b: number; en: string; es: string }[] = [
  { who: 'A', a: 0.0, b: 0.46, en: 'Welcome back to the show.', es: 'Bienvenidos de nuevo al programa.' },
  { who: 'B', a: 0.54, b: 1.0, en: 'Thanks for having me.', es: 'Gracias por invitarme.' },
];
const STRIP = { w: 640 };
const colOf = (who: 'A' | 'B') => (who === 'A' ? 'signal' : 'acid');

export default class Dub extends Plate {
  build() {
    const w = this.w;
    const L = this.take('Dubbing chains it all', ['Dubbing', 'chains', 'all:', 'transcribe', 'video,', 'translate', 're-voice', 'each', 'speaker', 'in', 'time.']);
    this.screenKw.push(...lineRows(L.words, -860, 400, 52, ARCH(100, 800), 'K', 1720).words);
    const P = this.plot;
    // the pipes between the stations, drawn as each station is named
    const pipe = (i: number, t0: number) => P.add([pt(SX[i]! + 360, Y), pt(SX[i + 1]! - 360, Y)], t0, t0 + 0.3, 'cons', { pen: true, ez: ease.inOutQuad, width: 1.6, dash: 16 });
    pipe(0, w.transcribe!.start - 0.2);
    pipe(1, w.translate!.start - 0.2);
    pipe(2, w.revoice!.start - 0.2);
    // the slots of the original lines (dashed), at the last station
    SEG.forEach((s, i) => P.add(rectPts(SX[3]! - STRIP.w / 2 + s.a * STRIP.w, Y + 150, (s.b - s.a) * STRIP.w, 120), w.revoice!.start + i * 0.1, w.revoice!.start + 0.3 + i * 0.1, 'cons', { width: 1.4, dash: 10 }));
    P.wp(pt(SX[3]! + 380, Y), this.ctx.end - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, SX[0]! + 60, Y + 40, 1.15, -0.01);
    K.key(w.transcribe!.start, SX[0]! + 300, Y + 30, 1.05, -0.004, ease.inOutCubic);
    K.key(w.video!.start, SX[1]!, Y + 30, 1.1, 0.004, ease.inOutCubic);
    K.key(w.translate!.start + 0.1, SX[2]!, Y + 30, 1.1, -0.004, ease.inOutCubic);
    K.key(w.revoice!.start + 0.15, SX[3]!, Y + 60, 1.05, 0.004, ease.inOutCubic);
    K.key(w.in!.start, SX[3]! - 200, Y + 40, 0.9, 0, ease.inOutCubic);
    K.key(w.time!.end + 0.1, (SX[0]! + SX[3]!) / 2, Y + 40, 0.42, 0, ease.inOutCubic);
    K.key(this.ctx.end, (SX[0]! + SX[3]!) / 2, Y + 40, 0.43, 0, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const heads = ['VIDEO', '01  TRANSCRIBE', '02  TRANSLATE', '03  RE-VOICE  ·  04  IN TIME'];
    const tOn = [this.ctx.start, w.transcribe!.start, w.translate!.start, w.revoice!.start];
    heads.forEach((h, i) => {
      const a = prog(t, tOn[i]! - 0.1, tOn[i]! + 0.1);
      if (a <= 0) return;
      setWorld(ctx, c, SX[i]!, Y - 300);
      label(ctx, h, 0, 0, { size: 30, col: mixCss('bone', 'signal', pulse(t, tOn[i]!, 0.3), a), spacing: 6, align: 'center', weight: 700 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // station 0: the video frame with two speakers
    setWorld(ctx, c, SX[0]! - 320, Y - 250);
    ctx.fillStyle = rgba('ink2', 0.95); ctx.fillRect(0, 0, 640, 360);
    ctx.strokeStyle = rgba('bone', 0.5); ctx.lineWidth = 1.4; ctx.strokeRect(0, 0, 640, 360);
    for (const [x, who] of [[200, 'A'], [440, 'B']] as const) {
      const talking = this.talking(who, t);
      ctx.fillStyle = mixCss('graphite', colOf(who), 0.4 + 0.6 * talking, 1);
      ctx.beginPath(); ctx.arc(x, 150, 52, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, 300, 100, 80, 0, Math.PI, 0); ctx.fill();
      label(ctx, who, x, 60, { size: 26, col: rgba(colOf(who), 1), spacing: 2, align: 'center', weight: 700 });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // stations 1 and 2: the words
    const cards: [number, number, boolean][] = [[1, w.transcribe!.start, false], [2, w.translate!.start, true]];
    for (const [i, t0, es] of cards) {
      const a = prog(t, t0 - 0.05, t0 + 0.15);
      if (a <= 0) continue;
      setWorld(ctx, c, SX[i]! - 340, Y - 200);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba('ink2', 0.95); ctx.fillRect(0, 0, 680, 300);
      ctx.strokeStyle = rgba('bone', 0.4); ctx.lineWidth = 1.4; ctx.strokeRect(0, 0, 680, 300);
      SEG.forEach((s, k) => {
        const y = 110 + k * 110;
        label(ctx, s.who, 30, y, { size: 30, col: rgba(colOf(s.who), 1), spacing: 2, weight: 700 });
        ctx.font = font(F.mono(500), s.es.length > 26 ? 27 : 30); ctx.fillStyle = rgba('bone', 0.95);
        const shown = es ? this.scramble(s.en, s.es, t, t0 + 0.1 + k * 0.15) : s.en.slice(0, Math.ceil(s.en.length * prog(t, t0 + k * 0.2, t0 + 0.5 + k * 0.2)));
        ctx.fillText(shown, 80, y);
      });
      label(ctx, es ? 'ENGLISH → SPANISH' : 'SPEECH → TEXT', 30, 46, { size: 17, col: rgba('ash', 1), spacing: 4 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const fa = prog(t, w.time!.start, w.time!.start + 0.2);
    if (fa > 0) {
      setWorld(ctx, c, SX[3]!, Y + 330);
      label(ctx, 'EACH NEW LINE FITS THE OLD ONE’S SLOT', 0, 0, { size: 22, col: rgba('signal', fa), spacing: 4, align: 'center' });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  talking(who: 'A' | 'B', t: number) {
    const u = ((t - this.ctx.start) % 2.2) / 2.2;
    const s = SEG.find((x) => x.who === who)!;
    return u >= s.a && u <= s.b ? 1 : 0;
  }

  /** English turning into Spanish letter by letter from t0 */
  scramble(en: string, es: string, t: number, t0: number) {
    const n = es.length, k = prog(t, t0, t0 + 0.6);
    const done = Math.floor(n * k);
    let s = '';
    for (let i = 0; i < n; i++) {
      if (i < done) s += es[i];
      else if (i < done + 4 && k > 0) s += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(hash(i, Math.floor(t * 30)) * 26)];
      else s += en[i] ?? ' ';
    }
    return s.trimEnd();
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    // the original speech under the video, coloured by speaker
    const x0 = SX[0]! - STRIP.w / 2;
    for (const s of SEG) waveBars(X, c, x0 + s.a * STRIP.w, x0 + s.b * STRIP.w, Y + 210, 50, 40, (u) => speechEnv(u * 4 + (s.who === 'A' ? 0 : 7), 51), { col: lin(colOf(s.who), 1.0), I: 1 });
    // the new speech, grown on "re-voice", squeezed into its slot on "in time"
    const grow = prog(t, w.revoice!.start, w.speaker!.end);
    const fit = ease.inOutCubic(prog(t, w.in!.start, w.time!.end));
    const x3 = SX[3]! - STRIP.w / 2;
    SEG.forEach((s, k) => {
      const len0 = (s.b - s.a) * STRIP.w * (k === 0 ? 1.45 : 1.25); // Spanish runs longer
      const a = x3 + s.a * STRIP.w, b = lerp(a + len0, x3 + s.b * STRIP.w, fit);
      if (grow > 0) waveBars(X, c, a, b, Y + 210, 50, 40, (u) => speechEnv(u * 4 + (s.who === 'A' ? 13 : 21), 52), { col: lin(colOf(s.who), 1.2), I: 1.1, to: clamp(grow * 1.4 - k * 0.4) });
    });
    // packets along the pipes once both ends exist
    const tp = [w.transcribe!.start, w.translate!.start, w.revoice!.start];
    tp.forEach((t0, i) => packets(X, c, [pt(SX[i]! + 360, Y), pt(SX[i + 1]! - 360, Y)], t, { t0: t0 + 0.1, speed: 700, gap: 0.18, fadeIn: 0.2 }));
    burst(X, c, pt(SX[3]!, Y + 210), t, w.time!.end - 0.05, 40, 13, 0.8);
    void noise1;
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.time!.end - 0.05, 0.08);
    return { zoom: 1 + 0.015 * hit };
  }
}
