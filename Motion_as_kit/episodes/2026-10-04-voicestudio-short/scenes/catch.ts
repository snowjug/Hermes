// CATCH: "One catch: the default model is non-commercial. Monetizing? Switch engines."
// A tape label for the default model; NON-COMMERCIAL stamps across it in pink. "Monetizing?" a fat $
// lands; on "Switch engines" a big toggle throws from OMNIVOICE to COSYVOICE 3 (Apache-2.0).
import { Plate, ease, prog, pulse, noise1, lerp, rgba, setWorld, font, F, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, card, mono, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));

export default class Catch extends Plate {
  paper = true;

  build() {
    this.take('One catch', ['One', 'catch:', 'default', 'model', 'non-commercial.', 'Monetizing?', 'Switch', 'engines.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -200, 1.06, 0.0);
    K.key(w.noncommercial!.start + 0.08, 0, -260, 1.08, -0.02, ease.outExpo);
    K.key(w.monetizing!.start, 0, 40, 1.0, 0, ease.inOutCubic);
    K.key(w.switch!.start + 0.1, 0, 120, 1.04, 0.01, ease.outExpo);
    K.key(this.ctx.end, 0, 130, 1.06, 0.01, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rslam(ctx, c, 'ONE CATCH', -490, -700, fit('ONE CATCH', 920, 200), t, w.one!.start, { top: 'ink' });
    // the tape label of the default model
    const la = prog(t, w.default!.start - 0.1, w.default!.start + 0.1);
    card(ctx, c, -460, -640, 920, 300, { a: la });
    if (la > 0) {
      mono(ctx, c, 'DEFAULT MODEL', -420, -570, 34, 'blood', { a: la });
      setWorld(ctx, c, -420, -460);
      ctx.globalAlpha = la; ctx.font = font(ARCHB(100), 100); ctx.fillStyle = rgba('ink', 1); ctx.fillText('OmniVoice', 0, 0);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'WEIGHTS: CC BY-NC', -420, -385, 34, 'ink', { a: la });
    }
    // the stamp
    const s0 = w.noncommercial!.start;
    if (t > s0 - 0.03) {
      const age = t - (s0 - 0.03);
      const sc = 1 + 0.6 * (1 - ease.outExpo(Math.min(1, age / 0.12)));
      setWorld(ctx, c, 40, -300, sc, -0.1);
      overprint(ctx, (col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.strokeRect(-470, -100, 940, 180);
        ctx.fillStyle = col; ctx.font = font(ARCHB(112.5), 112); ctx.textAlign = 'center'; ctx.fillText('NON-COMMERCIAL', 0, 30, 880); ctx.textAlign = 'left';
      }, { top: 'signal', a: Math.min(1, age / 0.04) * 0.95 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // Monetizing?
    rslam(ctx, c, 'MONETIZING?', -490, -50, fit('MONETIZING?', 920, 170), t, w.monetizing!.start, { top: 'ink' });
    // the switch
    const sa = prog(t, w.monetizing!.start + 0.2, w.switch!.start);
    if (sa > 0) {
      const k = ease.outBack(prog(t, w.switch!.start, w.switch!.start + 0.25));
      const S = { x: -450, y: 120, w: 900, h: 240 };
      setWorld(ctx, c, 0, 0);
      ctx.globalAlpha = sa;
      ctx.fillStyle = rgba('acid', 1); ctx.beginPath(); ctx.roundRect(S.x + 14, S.y + 14, S.w, S.h, S.h / 2); ctx.fill();
      ctx.fillStyle = rgba('bone', 1); ctx.beginPath(); ctx.roundRect(S.x, S.y, S.w, S.h, S.h / 2); ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = rgba('ink', 1); ctx.stroke();
      const kx = lerp(S.x + S.h / 2, S.x + S.w - S.h / 2, k);
      ctx.fillStyle = rgba(k > 0.5 ? 'signal' : 'ink', 1);
      ctx.beginPath(); ctx.arc(kx, S.y + S.h / 2, S.h / 2 - 22, 0, Math.PI * 2); ctx.fill();
      ctx.font = font(F.mono(700), 46); ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center';
      ctx.fillText(k > 0.5 ? 'COSYVOICE 3' : 'OMNIVOICE', k > 0.5 ? S.x + S.w / 2 - 110 : S.x + S.w / 2 + 110, S.y + S.h / 2 + 16);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'APACHE-2.0 · COMMERCIAL USE OK', 0, S.y + S.h + 90, 38, 'signal', { a: prog(t, w.switch!.start + 0.2, w.switch!.start + 0.4), align: 'center' });
    }
    rslam(ctx, c, 'SWITCH ENGINES', -490, 700, fit('SWITCH ENGINES', 920, 150), t, w.switch!.start, { top: 'signal' });
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.noncommercial!.start, 0.07) + pulse(t, w.switch!.start + 0.1, 0.07);
    return { zoom: 1 + 0.03 * hit, shake: [10 * hit * noise1(t * 60, 1), 10 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
