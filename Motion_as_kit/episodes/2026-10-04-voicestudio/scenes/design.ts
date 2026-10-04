// DESIGN: "No clip? Describe one: age, pitch, accent, even a whisper, and it designs the voice."
// "No clip?": the empty clip slot. "Describe one": a description types into a prompt card. Then four
// knobs (AGE, PITCH, ACCENT, WHISPER) turn on their words while a trace below changes character with
// each: rougher, higher, a different rhythm, breathy. On "designs the voice" the trace locks and glows.
import { type LineBatch } from '@engine/lines';
import { rectPts } from '@kit/_vo';
import { Plate, ARCH, lineRows, typed, chip, pt, clamp, ease, prog, pulse, noise1, lerp, rgba, mixCss, setWorld, label, burst, TAU, type Cam } from '@kit/_mp';
import { waveTrace, speechEnv } from '@ep/vs';

const KNOBS = [
  { key: 'age', name: 'AGE', lo: 'young', hi: 'old', v: 0.82 },
  { key: 'pitch', name: 'PITCH', lo: 'low', hi: 'high', v: 0.28 },
  { key: 'accent', name: 'ACCENT', lo: '', hi: 'British', v: 0.66 },
  { key: 'whisper', name: 'WHISPER', lo: 'off', hi: 'on', v: 0.9 },
];
const KY = 30, KR = 92;
const kx = (i: number) => -630 + i * 420;

export default class Design extends Plate {
  build() {
    const w = this.w;
    const L = this.take('No clip?', ['No', 'clip?', 'Describe', 'one:', 'age,', 'pitch,', 'accent,', 'even', 'whisper,', 'designs', 'voice.']);
    this.screenKw.push(...lineRows(L.words, -860, -440, 54, ARCH(100, 800), 'K', 1760).words);
    const P = this.plot;
    // the empty slot on "No clip?", struck through
    P.add(rectPts(-880, -330, 300, 150), this.ctx.start, this.ctx.start + 0.35, 'cons', { pen: true, ez: ease.inOutQuad, width: 1.6, dash: 12 });
    P.add([pt(-880, -180), pt(-580, -330)], w.clip!.start, w.clip!.start + 0.2, 'signal', { pen: true, width: 4 });
    // knob rings, one per word, drawn by the pen as each is named
    KNOBS.forEach((k, i) => {
      const tk = w[k.key]!.start;
      const ring: { x: number; y: number }[] = [];
      for (let j = 0; j <= 48; j++) { const a = Math.PI * 0.75 + (j / 48) * Math.PI * 1.5; ring.push(pt(kx(i) + Math.cos(a) * (KR + 22), KY + Math.sin(a) * (KR + 22))); }
      P.add(ring, tk - 0.12, tk + 0.12, 'plot', { pen: true, width: 2 });
    });
    P.wp(pt(880, 330), this.ctx.end - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, -560, -240, 1.25, -0.01);
    K.key(w.describe!.start, -200, -180, 1.08, -0.004, ease.inOutCubic);
    K.key(w.age!.start, -260, 30, 1.0, 0, ease.inOutCubic);
    K.key(w.whisper!.start, 180, 60, 1.0, 0.004, ease.inOutCubic);
    K.key(w.designs!.start, 0, 80, 0.94, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 90, 0.96, -0.004, ease.linear);
  }

  /** knob i's value at t (turns from 0.1 to its value on its word) */
  val(i: number, t: number) {
    const k = KNOBS[i]!;
    return lerp(0.1, k.v, ease.outBack(prog(t, this.w[k.key]!.start, this.w[k.key]!.start + 0.35)));
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the empty slot's label
    const sa = prog(t, w.no!.start, w.no!.start + 0.2) * (1 - prog(t, w.age!.start, w.age!.start + 0.3));
    if (sa > 0) { setWorld(ctx, c, -730, -245); label(ctx, 'NO CLIP', 0, 0, { size: 26, col: rgba('ash', sa), spacing: 6, align: 'center', weight: 600 }); ctx.setTransform(1, 0, 0, 1, 0, 0); }
    // the prompt card
    const pa = prog(t, w.describe!.start - 0.05, w.describe!.start + 0.15);
    if (pa > 0) {
      setWorld(ctx, c, -500, -300);
      ctx.globalAlpha = pa;
      ctx.fillStyle = rgba('ink2', 0.96); ctx.fillRect(0, 0, 1380, 130);
      ctx.strokeStyle = rgba('signal', 0.6); ctx.lineWidth = 1.4; ctx.strokeRect(0, 0, 1380, 130);
      label(ctx, 'DESCRIBE THE VOICE', 24, 34, { size: 17, col: rgba('ash', 1), spacing: 4 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      typed(ctx, c, 'an older man, low and slow, British, whispering', -476, -220, t, w.describe!.start + 0.1, Math.max(0.6, w.whisper!.end - w.describe!.start), { size: 34 });
    }
    // knobs
    KNOBS.forEach((k, i) => {
      const tk = w[k.key]!.start;
      const a = prog(t, tk - 0.15, tk + 0.05);
      if (a <= 0) return;
      const v = this.val(i, t), hot = pulse(t, tk, 0.3);
      setWorld(ctx, c, kx(i), KY);
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(0, 0, KR, 0, TAU); ctx.fillStyle = rgba('ink2', 1); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = mixCss('bone', 'signal', hot, 0.7); ctx.stroke();
      // value arc
      ctx.lineWidth = 8; ctx.strokeStyle = rgba('signal', 0.95);
      ctx.beginPath(); ctx.arc(0, 0, KR + 22, Math.PI * 0.75, Math.PI * 0.75 + v * Math.PI * 1.5); ctx.stroke();
      // pointer
      const an = Math.PI * 0.75 + v * Math.PI * 1.5;
      ctx.lineWidth = 6; ctx.strokeStyle = rgba('bone', 1); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(Math.cos(an) * 20, Math.sin(an) * 20); ctx.lineTo(Math.cos(an) * (KR - 14), Math.sin(an) * (KR - 14)); ctx.stroke();
      ctx.lineCap = 'butt';
      label(ctx, k.name, 0, KR + 74, { size: 28, col: mixCss('bone', 'signal', hot, 1), spacing: 6, align: 'center', weight: 700 });
      label(ctx, v > 0.5 ? k.hi : k.lo, 0, KR + 108, { size: 18, col: rgba('ash', 1), spacing: 3, align: 'center' });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    const da = prog(t, w.designs!.start, w.designs!.start + 0.2);
    if (da > 0) chip(ctx, c, 'VOICE DESIGNED  ·  NO RECORDING NEEDED', 0, 470, { a: da, size: 24, border: rgba('signal', 0.9), col: rgba('bone', 1) });
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    const a = prog(t, w.age!.start - 0.2, w.age!.start);
    if (a <= 0) return;
    const age = this.val(0, t), pitch = this.val(1, t), acc = this.val(2, t), wh = prog(t, w.whisper!.start, w.whisper!.start + 0.35);
    const lock = prog(t, w.designs!.start, w.designs!.start + 0.3);
    const env = (u: number) => speechEnv(u * lerp(4, 7, acc) + t * 0.8, 41) * lerp(1, 0.45, wh);
    waveTrace(X, c, -860, 860, 330, 110, 700, env, {
      cycles: lerp(30, 120, pitch), phase: t * 30, jag: clamp(0.15 + 0.35 * age + 0.5 * wh), alpha: a,
      I: 1.2 + 1.2 * lock, width: 2 + 1.2 * lock,
    });
    burst(X, c, pt(0, 330), t, w.designs!.start + 0.05, 40, 12, 0.8);
    void noise1;
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.designs!.start + 0.05, 0.08);
    return { zoom: 1 + 0.015 * hit };
  }
}
