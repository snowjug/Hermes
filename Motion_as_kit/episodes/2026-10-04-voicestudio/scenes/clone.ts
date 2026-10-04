// CLONE: "To copy a voice, it needs a clip of just three to ten seconds."
// A recording runs across the frame on a seconds ruler. On "clip" the pen brackets three seconds of it,
// on "ten" the bracket stretches to ten (OmniVoice asks for a 3-10 s reference). On "seconds" the clip
// lifts out and curls into a voiceprint, and new speech in that voice pours out of it.
import { type LineBatch } from '@engine/lines';
import { rectPts } from '@kit/_vo';
import { Plate, ARCH, lineRows, pt, clamp, ease, prog, pulse, noise1, lerp, rgba, setWorld, label, burst, w2s, TAU, type Cam } from '@kit/_mp';
import { waveBars, speechEnv, lin } from '@ep/vs';

const RX0 = -880, RX1 = 880, RY = -130, SEC = 30;
const xs = (s: number) => RX0 + ((RX1 - RX0) * s) / SEC;
const VP = { x: -520, y: 250, r: 120 };
const A0 = 6; // the clip starts at 6 s

export default class Clone extends Plate {
  build() {
    const w = this.w;
    const L = this.take('To copy a voice', ['To', 'copy', 'voice,', 'needs', 'clip', 'just', 'three', 'ten', 'seconds.']);
    this.kw.push(...lineRows(L.words, -880, -400, 66, ARCH(100, 800), 'K', 1760).words);
    const P = this.plot;
    // the ruler
    const tr = L.start;
    P.add([pt(RX0, RY + 90), pt(RX1, RY + 90)], tr, tr + 0.4, 'axis', { pen: true, ez: ease.inOutQuad, width: 1.4 });
    for (let s = 0; s <= SEC; s++) {
      const big = s % 5 === 0;
      P.add([pt(xs(s), RY + 90), pt(xs(s), RY + 90 + (big ? 16 : 8))], tr + 0.4 + s * 0.008, tr + 0.41 + s * 0.008, 'axis', { width: 1.2 });
      if (big) P.note(`${s}s`, xs(s), RY + 136, tr + 0.4 + s * 0.008, { size: 18, col: 'ash', align: 'center', dur: 0.05 });
    }
    // the bracket: 3 s on "three", stretched to 10 s on "ten" (drawn in drawUI as it changes); the pen rides its right edge
    P.wp(pt(xs(A0 + 3), RY - 110), w.three!.start, Math.max(0.05, w.ten!.start - w.three!.start));
    P.wp(pt(xs(A0 + 10), RY - 110), w.ten!.end, 0.1);
    // the voiceprint ring, drawn by the pen as the clip arrives
    const tv = w.seconds!.start + 0.15;
    const ring: { x: number; y: number }[] = [];
    for (let i = 0; i <= 64; i++) { const a = -Math.PI / 2 + (i / 64) * TAU; ring.push(pt(VP.x + Math.cos(a) * VP.r, VP.y + Math.sin(a) * VP.r)); }
    P.add(ring, tv, tv + 0.45, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.2 });
    P.note('voiceprint', VP.x, VP.y + VP.r + 60, tv + 0.3, { size: 22, col: 'ash', align: 'center' });
    P.wp(pt(VP.x + VP.r + 40, VP.y), this.ctx.end - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, -200, -120, 1.08, -0.006);
    K.key(w.clip!.start, 0, -110, 1.0, 0, ease.inOutCubic);
    K.key(w.ten!.start, xs(A0 + 5) * 0.3, -100, 1.04, 0.004, ease.inOutCubic);
    K.key(w.seconds!.start + 0.2, 0, 20, 0.96, 0, ease.inOutCubic);
    K.key(this.ctx.end, 40, 40, 0.98, -0.004, ease.linear);
  }

  /** the bracket's length in seconds (0 before "clip") */
  len(t: number) {
    const w = this.w;
    const a = ease.outBack(prog(t, w.three!.start, w.three!.start + 0.3));
    const b = ease.inOutCubic(prog(t, w.ten!.start, w.ten!.start + 0.35));
    return lerp(0, 3, a) + 7 * b;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const lift = ease.inOutCubic(prog(t, w.seconds!.start, w.seconds!.start + 0.45));
    const ba = prog(t, w.clip!.start, w.clip!.start + 0.15) * (1 - lift);
    if (ba > 0) {
      const L = Math.max(0.2, this.len(t));
      const x0 = xs(A0), x1 = xs(A0 + L);
      setWorld(ctx, c, x0, RY - 100);
      ctx.globalAlpha = ba;
      ctx.fillStyle = rgba('signal', 0.12); ctx.fillRect(0, 0, x1 - x0, 200);
      ctx.strokeStyle = rgba('signal', 0.95); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(0, 0); ctx.lineTo(0, 200); ctx.lineTo(18, 200); ctx.moveTo(x1 - x0 - 18, 0); ctx.lineTo(x1 - x0, 0); ctx.lineTo(x1 - x0, 200); ctx.lineTo(x1 - x0 - 18, 200); ctx.stroke();
      const lab = L < 3.05 ? `${L.toFixed(1)} s` : L > 9.95 ? '3–10 s' : `${L.toFixed(1)} s`;
      label(ctx, lab, (x1 - x0) / 2, -18, { size: 30, col: rgba('signal', 1), spacing: 3, align: 'center', weight: 700 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const na = prog(t, w.ten!.end, w.ten!.end + 0.2) * (1 - lift);
    if (na > 0) {
      setWorld(ctx, c, xs(A0 + 10) + 30, RY - 60);
      label(ctx, 'THE REFERENCE CLIP', 0, 0, { size: 20, col: rgba('bone', na), spacing: 4 });
      label(ctx, 'OMNIVOICE: 3 TO 10 SECONDS', 0, 30, { size: 17, col: rgba('ash', na), spacing: 3 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const oa = prog(t, w.seconds!.start + 0.7, w.seconds!.start + 1.0);
    if (oa > 0) {
      setWorld(ctx, c, VP.x + VP.r + 70, VP.y + 120);
      label(ctx, 'NEW SPEECH, ANY TEXT, IN THAT VOICE', 0, 0, { size: 21, col: rgba('signal', oa), spacing: 4 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    const lift = ease.inOutCubic(prog(t, w.seconds!.start, w.seconds!.start + 0.45));
    const rec = prog(t, this.ctx.start, this.ctx.start + 0.6);
    const L = this.len(t);
    // the recording (the clip's bars light up)
    if (rec > 0) waveBars(X, c, RX0, RX1, RY, 80, 240, (u) => speechEnv(u * SEC, 31), {
      to: rec, I: 0.9, col: lin('ash', 0.9),
      gain: (u) => { const s = u * SEC; return s >= A0 && s <= A0 + L ? 0 : 1; },
    });
    // the clip itself: in place, then flying into the ring
    const n = Math.max(2, Math.round((240 * Math.max(0.2, L)) / SEC));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, s = A0 + u * Math.max(0.2, L);
      const amp = Math.max(0.05, speechEnv(s, 31));
      const xa = xs(s), ya = RY;
      const an = -Math.PI / 2 + u * TAU + (t - w.seconds!.start) * 1.2;
      const rr = VP.r * 0.62;
      const x = lerp(xa, VP.x + Math.cos(an) * rr, lift), y = lerp(ya, VP.y + Math.sin(an) * rr, lift);
      const h = 80 * amp * lerp(1, 0.55, lift);
      const dx = lerp(0, Math.cos(an), lift), dy = lerp(1, Math.sin(an), lift);
      const p0 = w2s(c, x - dx * h * 0.15, y - dy * h), p1 = w2s(c, x + dx * h, y + dy * h);
      if (prog(t, w.clip!.start, w.clip!.start + 0.15) > 0) X.seg2(p0[0], p0[1], p1[0], p1[1], 3.2 * c.z, lin('signal', 1.4), 1);
    }
    // new speech pours out to the right
    const k = prog(t, w.seconds!.start + 0.55, this.ctx.end, ease.outCubic);
    if (k > 0) waveBars(X, c, VP.x + VP.r + 40, 900, VP.y, 70, 150, (u) => speechEnv(u * 14 - t * 0.6, 31), { to: k, I: 1.2 });
    burst(X, c, pt(VP.x, VP.y - VP.r), t, w.seconds!.start + 0.45, 30, 9, 0.5);
    void clamp; void noise1; void rectPts;
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.seconds!.start + 0.45, 0.08);
    return { zoom: 1 + 0.015 * hit };
  }
}
