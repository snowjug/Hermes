// HARDWARE: "Nvidia, Apple Silicon, or a plain laptop: it runs on all three, just slower without a
// graphics card."
// The pen draws each machine as it is named: a graphics card with two fans, a system-on-chip, a plain
// laptop. On "runs on all three" each one renders the same sentence: the card's bar shoots across, the
// chip's follows, the laptop's crawls ("just slower"), and gets there anyway.
import { type LineBatch } from '@engine/lines';
import { rectPts, arc } from '@kit/_vo';
import { Plate, ARCH, lineRows, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, label, burst, TAU, type Cam } from '@kit/_mp';
import { waveBars, speechEnv, lin } from '@ep/vs';

const COLS = [-620, 0, 620];
const MY = -110;

export default class Hardware extends Plate {
  tRun = 0;

  build() {
    const w = this.w;
    const L = this.take('Nvidia, Apple Silicon', ['Nvidia,', 'Apple', 'Silicon,', 'plain', 'laptop:', 'runs', 'all', 'three,', 'just', 'slower', 'without', 'graphics', 'card.']);
    this.screenKw.push(...lineRows(L.words, -860, -430, 54, ARCH(100, 800), 'K', 1760).words);
    this.tRun = w.runs!.start;
    const P = this.plot;
    // GPU: board, two fans, the bracket and the slot fingers
    const tg = w.nvidia!.start - 0.05;
    const gx = COLS[0]! - 230, gy = MY - 100;
    P.add(rectPts(gx, gy, 460, 200), tg, tg + 0.35, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4 });
    for (const fx of [gx + 120, gx + 340]) P.add(arc(fx, gy + 100, 70, 0, TAU, 40), tg + 0.35, tg + 0.5, 'plot', { pen: true, width: 2 });
    P.add([pt(gx + 80, gy + 200), pt(gx + 80, gy + 222), pt(gx + 380, gy + 222), pt(gx + 380, gy + 200)], tg + 0.5, tg + 0.6, 'plot', { pen: true, width: 2 });
    // chip: package, die, pins
    const tc = w.apple!.start - 0.05;
    const cx = COLS[1]!, cs = 200;
    P.add(rectPts(cx - cs / 2, MY - cs / 2, cs, cs), tc, tc + 0.3, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4 });
    P.add(rectPts(cx - 60, MY - 60, 120, 120), tc + 0.3, tc + 0.45, 'plot', { pen: true, width: 1.8 });
    for (let i = 0; i < 6; i++) {
      const o = -75 + i * 30;
      P.add([pt(cx + o, MY - cs / 2), pt(cx + o, MY - cs / 2 - 22)], tc + 0.45 + i * 0.01, tc + 0.46 + i * 0.01, 'cons', { width: 1.6 });
      P.add([pt(cx + o, MY + cs / 2), pt(cx + o, MY + cs / 2 + 22)], tc + 0.45 + i * 0.01, tc + 0.46 + i * 0.01, 'cons', { width: 1.6 });
      P.add([pt(cx - cs / 2, MY + o), pt(cx - cs / 2 - 22, MY + o)], tc + 0.5 + i * 0.01, tc + 0.51 + i * 0.01, 'cons', { width: 1.6 });
      P.add([pt(cx + cs / 2, MY + o), pt(cx + cs / 2 + 22, MY + o)], tc + 0.5 + i * 0.01, tc + 0.51 + i * 0.01, 'cons', { width: 1.6 });
    }
    // laptop
    const tl = w.plain!.start - 0.05;
    const lx = COLS[2]! - 200, ly = MY - 120;
    P.add(rectPts(lx, ly, 400, 240), tl, tl + 0.35, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4 });
    P.add([pt(lx - 40, ly + 250), pt(lx + 440, ly + 250), pt(lx + 410, ly + 280), pt(lx - 10, ly + 280), pt(lx - 40, ly + 250)], tl + 0.35, tl + 0.55, 'plot', { pen: true, width: 2.2 });
    P.wp(pt(COLS[2]! + 300, 330), this.ctx.end - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, COLS[0]! + 100, MY + 40, 1.25, -0.01);
    K.key(w.apple!.start, -200, MY + 60, 1.08, -0.004, ease.inOutCubic);
    K.key(w.plain!.start, 120, MY + 80, 1.04, 0.004, ease.inOutCubic);
    K.key(this.tRun, 0, 20, 0.98, 0, ease.inOutCubic);
    K.key(w.slower!.start, 380, 60, 1.18, 0.008, ease.inOutCubic);
    K.key(this.ctx.end, 420, 70, 1.22, 0.01, ease.linear);
  }

  /** render progress of machine i (0 GPU, 1 chip, 2 laptop) */
  done(i: number, t: number) {
    const dur = [0.55, 1.1, Math.max(2.4, this.ctx.end - this.tRun - 0.5)][i]!;
    return prog(t, this.tRun, this.tRun + dur, i === 2 ? ease.linear : ease.outCubic);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const names: [string, string, number][] = [['NVIDIA GPU', 'CUDA', w.nvidia!.start], ['APPLE SILICON', 'METAL', w.apple!.start], ['PLAIN LAPTOP', 'CPU ONLY', w.plain!.start]];
    names.forEach(([n, sub, t0], i) => {
      const a = prog(t, t0 + 0.1, t0 + 0.3);
      if (a <= 0) return;
      const x = COLS[i]!;
      setWorld(ctx, c, x, 250);
      label(ctx, n, 0, 0, { size: 28, col: rgba('bone', a), spacing: 5, align: 'center', weight: 700 });
      label(ctx, sub, 0, 34, { size: 18, col: rgba('ash', a), spacing: 4, align: 'center' });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // the progress bar
      const ra = prog(t, this.tRun - 0.1, this.tRun + 0.1);
      if (ra > 0) {
        const d = this.done(i, t);
        setWorld(ctx, c, x - 210, 330);
        ctx.globalAlpha = ra;
        ctx.strokeStyle = rgba('bone', 0.5); ctx.lineWidth = 1.4; ctx.strokeRect(0, 0, 420, 26);
        ctx.fillStyle = d >= 1 ? rgba('signal', 1) : mixCss('graphite', 'signal', 0.6, 1); ctx.fillRect(3, 3, 414 * d, 20);
        label(ctx, d >= 1 ? 'DONE' : `${Math.floor(d * 100)}%`, 210, 64, { size: 18, col: rgba(d >= 1 ? 'signal' : 'ash', 1), spacing: 3, align: 'center' });
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    });
    const sa = prog(t, w.slower!.start, w.slower!.start + 0.2);
    if (sa > 0) {
      setWorld(ctx, c, COLS[2]!, 470);
      label(ctx, 'SLOWER, BUT IT WORKS', 0, 0, { size: 24, col: rgba('acid', sa), spacing: 5, align: 'center', weight: 600 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    // fans spin on the GPU once it runs
    if (t > w.nvidia!.start + 0.5) {
      const gx = COLS[0]! - 230, gy = MY - 100;
      const sp = t > this.tRun ? 14 : 2;
      for (const fx of [gx + 120, gx + 340]) for (let k = 0; k < 5; k++) {
        const an = (k / 5) * TAU + t * sp;
        const p0 = this.s(c, fx + Math.cos(an) * 12, gy + 100 + Math.sin(an) * 12), p1 = this.s(c, fx + Math.cos(an + 0.5) * 62, gy + 100 + Math.sin(an + 0.5) * 62);
        X.seg2(p0[0], p0[1], p1[0], p1[1], 2 * c.z, lin('ash', 0.9), 0.9);
      }
    }
    // each machine's output sentence
    for (let i = 0; i < 3; i++) {
      const d = this.done(i, t);
      if (d <= 0) continue;
      waveBars(X, c, COLS[i]! - 200, COLS[i]! + 200, 160, 26, 40, (u) => speechEnv(u * 3, 71), { to: d, I: d >= 1 ? 1.3 : 0.9 });
    }
    burst(X, c, pt(COLS[0]! + 210, 343), t, this.tRun + 0.55, 24, 15, 0.4);
    burst(X, c, pt(COLS[1]! + 210, 343), t, this.tRun + 1.1, 24, 16, 0.4);
    void clamp; void noise1;
  }

  s(c: Cam, x: number, y: number): [number, number] {
    const dx = (x - c.cx) * c.z, dy = (y - c.cy) * c.z;
    const co = Math.cos(c.roll), si = Math.sin(c.roll);
    return [this.ctx.W / 2 + co * dx - si * dy, this.ctx.H / 2 + si * dx + co * dy];
  }

  postFX(t: number) {
    const hit = pulse(t, this.tRun + 0.55, 0.08);
    return { zoom: 1 + 0.01 * hit };
  }
}
