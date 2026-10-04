// CATCH: "Now the catch. The app is free, but the default voice model's licence is non-commercial.
// Making money? Swap in an Apache-licensed tape, like CosyVoice. And only clone voices you have
// permission to use."
// Two labels side by side: the deck (the app, AGPL-3.0, free) gets a tick; the OmniVoice tape's weights
// say CC BY-NC, and a NON-COMMERCIAL stamp slams on it in amber. "Making money?": the OmniVoice tape
// ejects and CosyVoice 3 (Apache-2.0) slides in. Last, a consent card: clone only with permission.
import { type LineBatch } from '@engine/lines';
import { Plate, ARCH, lineRows, makeStamp, drawStamp, chip, pt, clamp, ease, prog, pulse, noise1, lerp, rgba, mixCss, setWorld, label, font, F, burst, type Cam } from '@kit/_mp';
import { HEX } from '@engine/palette';
import { cassette, deckFace, bayOf, DECK_H } from '@ep/vs';

const D = { x: -880, y: -250, w: 900 };
const TAPE = { x: 200, y: -250, w: 640 };

export default class Catch extends Plate {
  stamp: HTMLCanvasElement | null = null;
  tB = 0; tC = 0;

  build() {
    const w = this.w;
    const L16 = this.take('Now the catch', ['Now', 'catch.', ['app', 'app'], ['free', 'free,'], 'default', 'licence', 'non-commercial.']);
    const L17 = this.take('Making money?', ['Making', 'money?', 'Swap', 'Apache-licensed', ['tape', 'tape,'], 'CosyVoice.', 'only', 'clone', 'voices', 'permission', 'use.']);
    this.tB = L17.start;
    this.tC = w.only!.start - 0.05;
    this.screenKw.push(...lineRows(L16.words, -860, -420, 54, ARCH(100, 800), 'A', 1760).words);
    this.screenKw.push(...lineRows(this.span(L17, 'Making', 'CosyVoice.'), -860, -420, 54, ARCH(100, 800), 'B', 1760).words);
    this.screenKw.push(...lineRows(this.span(L17, 'And', 'use.'), -860, -420, 58, ARCH(100, 800), 'C', 1760).words);
    this.stamp = makeStamp('NON-COMMERCIAL', 'OMNIVOICE WEIGHTS', 'CC BY-NC · CHECK BEFORE YOU MONETIZE', HEX.acid, 11);
    const P = this.plot;
    // a tick on the app's label on "free"
    const tf = w.free!.start;
    P.add([pt(D.x + 40, D.y + D.w * DECK_H + 70), pt(D.x + 70, D.y + D.w * DECK_H + 100), pt(D.x + 130, D.y + D.w * DECK_H + 30)], tf, tf + 0.25, 'signal', { pen: true, ez: ease.inOutQuad, width: 5 });
    P.wp(pt(TAPE.x + TAPE.w + 40, TAPE.y + 100), this.tB - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, -300, -40, 1.08, -0.008);
    K.key(w.default!.start, -20, -10, 1.0, 0.004, ease.inOutCubic);
    K.key(w.noncommercial!.start + 0.1, 60, -10, 1.05, 0.008, ease.outCubic);
    K.key(this.tB + 0.1, 100, 0, 0.98, 0, ease.inOutCubic);
    K.key(this.tC, 100, 0, 0.98, 0, ease.linear);
    K.key(this.tC + 0.35, 0, 1300, 1.0, 0, ease.inOutExpo);
    K.key(this.ctx.end, 0, 1310, 1.04, 0.004, ease.linear);
  }

  alpha(g: string, t: number) {
    if (g === 'A') return 1 - prog(t, this.tB - 0.1, this.tB + 0.05);
    if (g === 'B') return prog(t, this.tB - 0.1, this.tB + 0.05) * (1 - prog(t, this.tC - 0.1, this.tC + 0.05));
    if (g === 'C') return prog(t, this.tC - 0.05, this.tC + 0.1);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const aTop = 1 - prog(t, this.tC + 0.1, this.tC + 0.3);
    if (aTop > 0) {
      // the app
      deckFace(ctx, c, D.x, D.y, D.w, { a: aTop, name: 'VoiceStudio  ·  the app' });
      const fa = prog(t, w.free!.start, w.free!.start + 0.2) * aTop;
      if (fa > 0) {
        setWorld(ctx, c, D.x + 160, D.y + D.w * DECK_H + 86);
        label(ctx, 'APP: AGPL-3.0  ·  FREE TO USE', 0, 0, { size: 26, col: rgba('signal', fa), spacing: 4, weight: 600 });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // the tapes: OmniVoice ejects, CosyVoice 3 goes in
      const swap = ease.inOutCubic(prog(t, w.swap!.start, w.cosyvoice!.end));
      const b = bayOf(D.x, D.y, D.w);
      const big = prog(t, w.default!.start - 0.1, w.default!.start + 0.25, ease.outCubic);
      // OmniVoice: from the bay to the right (big), then away on the swap
      const ox = lerp(b.x, TAPE.x, big) + swap * 1400, oy = lerp(b.y, TAPE.y, big) - swap * 200, ow = lerp(b.w, TAPE.w, big);
      cassette(ctx, c, ox, oy, ow, { a: aTop, label: 'OmniVoice', sub: 'weights: CC BY-NC', tag: 'DEFAULT', accent: 'acid', hot: pulse(t, w.licence!.start, 0.4), rot: swap * 0.3 });
      if (this.stamp) drawStamp(ctx, c, this.stamp, ox + ow / 2, oy + ow * 0.32, t, w.noncommercial!.start, 0.44 * (ow / TAPE.w), -0.09 + swap * 0.3, 0.95);
      // CosyVoice 3 comes in from the right into the same place
      const ci = ease.outCubic(prog(t, w.apachelicensed!.start, w.cosyvoice!.end));
      if (ci > 0) {
        cassette(ctx, c, TAPE.x + (1 - ci) * 1200, TAPE.y, TAPE.w, { a: aTop, label: 'CosyVoice 3', sub: 'weights: Apache-2.0', tag: 'COMMERCIAL OK', accent: 'signal', hot: pulse(t, w.cosyvoice!.end, 0.4) });
        chip(ctx, c, 'ALSO APACHE-2.0: VOXCPM2 · KITTENTTS', TAPE.x + TAPE.w / 2, TAPE.y + TAPE.w * 0.64 + 70, { a: prog(t, w.cosyvoice!.end, w.cosyvoice!.end + 0.3) * aTop, size: 20 });
      }
      const ma = prog(t, w.money!.start, w.money!.start + 0.15) * aTop;
      if (ma > 0) {
        setWorld(ctx, c, 620, 260);
        ctx.globalAlpha = ma;
        ctx.font = font(ARCH(100, 900), 120); ctx.fillStyle = mixCss('ember', 'acid', prog(t, w.money!.start, w.money!.start + 0.4), 1); ctx.fillText('$', 0, 0);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // the consent card (below)
    const ca = prog(t, this.tC + 0.2, this.tC + 0.45);
    if (ca > 0) {
      setWorld(ctx, c, -520, 1130);
      ctx.globalAlpha = ca;
      ctx.fillStyle = rgba('ink2', 0.96); ctx.fillRect(0, 0, 1040, 330);
      ctx.strokeStyle = rgba('signal', 0.7); ctx.lineWidth = 1.6; ctx.strokeRect(0, 0, 1040, 330);
      label(ctx, 'BEFORE YOU CLONE A VOICE', 40, 60, { size: 22, col: rgba('ash', 1), spacing: 5 });
      const box = (y: number, text: string, t0: number) => {
        const k = prog(t, t0, t0 + 0.2);
        ctx.strokeStyle = rgba('bone', 0.8); ctx.lineWidth = 3; ctx.strokeRect(40, y - 34, 44, 44);
        if (k > 0) {
          ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 6; ctx.beginPath();
          ctx.moveTo(48, y - 12); ctx.lineTo(48 + 14 * Math.min(1, k * 2), y - 12 + 14 * Math.min(1, k * 2));
          if (k > 0.5) ctx.lineTo(48 + 14 + 22 * (k - 0.5) * 2, y + 2 - 34 * (k - 0.5) * 2);
          ctx.stroke();
        }
        ctx.font = font(F.mono(600), 34); ctx.fillStyle = rgba('bone', 1); ctx.fillText(text, 110, y);
      };
      box(150, "it's my voice, or", w.clone!.start);
      box(230, 'I have the speaker’s permission', w.permission!.start);
      label(ctx, 'THE PROJECT ASKS THE SAME: "CLONE VOICES ONLY WITH PERMISSION"', 40, 300, { size: 15, col: rgba('ash', 1), spacing: 2 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    burst(X, c, pt(TAPE.x + TAPE.w / 2, TAPE.y + 200), t, w.noncommercial!.start, 50, 17, 0.9);
    burst(X, c, pt(TAPE.x + TAPE.w / 2, TAPE.y + 200), t, w.cosyvoice!.end, 30, 18, 0.6);
    void clamp;
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.noncommercial!.start, 0.09);
    return { zoom: 1 + 0.03 * hit, shake: [10 * hit * noise1(t * 60, 1), 10 * hit * noise1(t * 60, 2)] as [number, number] };
  }
}
