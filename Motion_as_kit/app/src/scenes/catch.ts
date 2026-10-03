// CATCH: "The catch? magpie can swap the model. It can't make a cheaper model as good as the one your
// agent was built around."
// "The catch?" in serif. A MODEL slot shuffles through names on "swap". Then a balance: a cheaper model
// on one pan, the model the agent was built around on the other; on "good" the beam tips (a damped
// spring) toward the original.
import { type LineBatch } from '../engine/lines';
import { placeRow } from './_vo';
import { springStep } from '../engine/util';
import { Plate, ARCH, chip, pt, clamp, ease, prog, pulse, rgba, mixCss, setWorld, font, F, label, w2s, LIN, type Cam } from './_mp';

const NAMES = ['deepseek-v4-pro', 'kimi-k3', 'glm-5.3', 'claude-sonnet-5', 'qwen', 'gpt-6-astra', 'deepseek-v4-pro'];
const PIV = pt(0, 470), ARM = 420;

export default class Catch extends Plate {
  tTilt = 0;

  build() {
    const w = this.w;
    const L = this.take('The catch?', [['the1', 'The', 0], 'catch?', 'magpie', ['can1', 'can', 0], 'swap', ['the2', 'the', 1], ['model1', 'model.', 0], 'It', "can't", 'make', 'a', 'cheaper', ['model2', 'model', 1], ['as1', 'as', 0], 'good', ['as2', 'as', 1], ['the3', 'the', 2], 'one', 'your', 'agent', 'was', 'built', 'around.']);
    const r = placeRow([w.the1!, w.catch!], -360, -170, 190, F.serif(600, true), 'A', { ant: 0.25 });
    r.words[1]!.done = 'signal';
    this.kw.push(...r.words);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L, 'magpie', 'model.'), -400, 150, 58, fam, 'B', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'It', 'around.'), -900, 940, 46, fam, 'C', { ant: 0.2 }).words);
    this.tTilt = w.good!.start;
    const K = this.cam;
    K.key(this.ctx.start, -30, -220, 1.3, -0.01);
    K.key(w.catch!.end, -20, -210, 1.34, -0.006, ease.linear);
    K.key(w.magpie!.start + 0.2, 0, -10, 1.1, 0.0, ease.inOutCubic);
    K.key(w.it!.start + 0.3, 0, 560, 0.92, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 580, 0.95, 0.004, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the model slot
    const ts = w.swap!.start;
    const sa = prog(t, w.magpie!.start, w.magpie!.start + 0.2);
    if (sa > 0) {
      const steps = Math.floor(clamp((t - ts) / 0.11, 0, NAMES.length - 1));
      const name = t < ts ? 'gpt-6-astra' : NAMES[steps]!;
      const hot = t < ts ? 0 : pulse(t, ts + steps * 0.11, 0.08);
      setWorld(ctx, c, -400, 52);
      label(ctx, 'MODEL', 0, 0, { size: 22, col: rgba('ash', 0.9 * sa), spacing: 4 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      chip(ctx, c, name, 90, 44, { a: sa, size: 40 * (1 + 0.06 * hot), border: mixCss('bone', 'signal', Math.max(hot, t > ts ? 0.5 : 0), 0.9), col: mixCss('bone', 'signal', hot, 1) });
    }
    // the balance
    const tb = w.it!.start - 0.1;
    const ba = prog(t, tb, tb + 0.35);
    if (ba <= 0) return;
    const th = -0.13 * springStep(t - this.tTilt, 1.6, 0.4);
    const ex = Math.cos(th) * ARM, ey = Math.sin(th) * ARM;
    const L = pt(PIV.x - ex, PIV.y - ey), R = pt(PIV.x + ex, PIV.y + ey);
    const S = (x: number, y: number) => w2s(c, x, y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = ba;
    ctx.strokeStyle = rgba('bone', 0.85); ctx.lineWidth = 2.2 * Math.min(1.4, c.z);
    const line = (a: { x: number; y: number }, b: { x: number; y: number }) => { const p = S(a.x, a.y), q = S(b.x, b.y); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
    line(PIV, pt(PIV.x, PIV.y + 330));
    line(pt(PIV.x - 150, PIV.y + 330), pt(PIV.x + 150, PIV.y + 330));
    line(L, R);
    const pc = S(PIV.x, PIV.y);
    ctx.fillStyle = rgba('signal', 1); ctx.beginPath(); ctx.arc(pc[0], pc[1], 7 * c.z, 0, Math.PI * 2); ctx.fill();
    // pans hang straight down from the beam ends
    const pan = (e: { x: number; y: number }, txt: string[], heavy: boolean, tIn: number) => {
      const hang = 170, py = e.y + hang;
      line(e, pt(e.x - 130, py)); line(e, pt(e.x + 130, py));
      line(pt(e.x - 150, py), pt(e.x + 150, py));
      const k = ease.outCubic(prog(t, tIn, tIn + 0.25));
      if (k <= 0) return;
      const bw = heavy ? 250 : 170, bh = heavy ? 130 : 76;
      const drop = (1 - k) * -120;
      setWorld(ctx, c, e.x - bw / 2, py - bh + drop);
      ctx.fillStyle = heavy ? rgba('ink2', 0.95 * k) : rgba('ink2', 0.95 * k);
      ctx.fillRect(0, 0, bw, bh);
      ctx.lineWidth = (heavy ? 3 : 1.5) / c.z; ctx.strokeStyle = heavy ? rgba('bone', k) : rgba('signal', 0.9 * k); ctx.strokeRect(0, 0, bw, bh);
      if (heavy) { ctx.fillStyle = rgba('bone', 0.12 * k); for (let i = 1; i < 6; i++) ctx.fillRect(0, (bh * i) / 6, bw, 2 / c.z); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      txt.forEach((s, i) => {
        setWorld(ctx, c, e.x, py + 52 + i * 32);
        ctx.font = font(F.mono(500), 26); ctx.textAlign = 'center';
        ctx.fillStyle = rgba(heavy ? 'bone' : 'signal', 0.95 * k);
        ctx.fillText(s, 0, 0);
        ctx.textAlign = 'left';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
    };
    pan(L, ['the model it was', 'built around'], true, w.one!.start);
    pan(R, ['a cheaper model'], false, w.cheaper!.start);
    ctx.globalAlpha = 1;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const p = w2s(c, PIV.x, PIV.y);
    const k = pulse(t, this.tTilt, 0.3);
    if (k > 0.01) X.seg2(p[0], p[1], p[0] + 0.01, p[1], 30 * k * c.z, [LIN.signal[0] * 2 * k, LIN.signal[1] * 2 * k, LIN.signal[2] * 2 * k], 0.6);
  }

  postFX(t: number) {
    return { zoom: 1 + 0.012 * pulse(t, this.w.catch!.start, 0.12) + 0.01 * pulse(t, this.tTilt, 0.1) };
  }
}
