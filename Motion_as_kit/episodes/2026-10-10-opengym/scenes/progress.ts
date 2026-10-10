// PROGRESS: "Progress is built in. Hit your reps, and the weight goes up. Miss them, and it doesn't.
// Stall, and it plans a deload."
// A sheet of graph paper. The red marker draws the training weight as the rules are read: a step up on
// "goes up" (+2.5 KG), a flat run with an X on "Miss them", a flat stall, then a drop on "deload" and a
// climb back. A kettlebell print sits on the corner of the sheet, and an index card lists the rules.
import { drawCut, tag, indexCard, ease, prog, setWorld, font, F, rgba, wobble } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, PAPER } from '@ep/kit';

const G = { x0: -700, y0: -330, w: 1080, h: 640 };
const P = (x: number, y: number) => ({ x, y });

export default class Progress extends Desk {
  override uses = ['kettle'];

  build() {
    this.take('Progress is built in', ['Progress', 'built', 'Hit', 'reps,', 'weight', 'up.', 'Miss', "doesn't.", 'Stall,', 'plans', 'deload.']);
    const w = this.w;
    const seg = (pts: { x: number; y: number }[], t0: number, t1: number, s: number) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = t0 + ((t1 - t0) * i) / (pts.length - 1), b = t0 + ((t1 - t0) * (i + 1)) / (pts.length - 1);
        this.plot.add(wobble(pts[i]!, pts[i + 1]!, s + i, 1.5, 16), a, b, 'signal', { pen: true, width: 8 });
      }
    };
    seg([P(-600, 160), P(-470, 160)], w.hit!.start, w.reps!.end, 1);
    seg([P(-470, 160), P(-470, 60), P(-300, 60)], w.weight!.start, w.up!.end + 0.1, 3);
    seg([P(-300, 60), P(-120, 60)], w.miss!.start, w.doesnt!.end, 6);
    seg([P(-120, 60), P(40, 60)], w.stall!.start, w.stall!.end + 0.2, 8);
    seg([P(40, 60), P(40, 140), P(170, 140)], w.plans!.start, w.deload!.end, 10);
    seg([P(170, 140), P(170, 40), P(270, 40), P(270, -60), P(340, -60)], w.deload!.end + 0.1, this.ctx.end - 0.1, 13);
    // the X for a missed session
    const xm = P(-210, 60);
    this.plot.add(wobble(P(xm.x - 28, xm.y - 28), P(xm.x + 28, xm.y + 28), 21), w.doesnt!.start, w.doesnt!.start + 0.12, 'ink', { pen: true, width: 6 });
    this.plot.add(wobble(P(xm.x + 28, xm.y - 28), P(xm.x - 28, xm.y + 28), 22), w.doesnt!.start + 0.12, w.doesnt!.start + 0.24, 'ink', { pen: true, width: 6 });
    const K = this.cam;
    K.key(this.ctx.start, -150, -20, 0.98, -0.004);
    K.key(w.hit!.start, -320, 20, 1.08, -0.004, ease.inOutCubic);
    K.key(w.miss!.start, -170, 30, 1.08, 0.0, ease.inOutCubic);
    K.key(w.plans!.start, 0, 30, 1.04, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 60, 10, 0.98, 0.006, ease.inOutCubic);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // graph paper
    const k = prog(t, this.ctx.start, this.ctx.start + 0.25, ease.outCubic);
    setWorld(ctx, c, G.x0 + G.w / 2, G.y0 + G.h / 2, 0.9 + 0.1 * k, -0.01);
    ctx.translate(-G.w / 2, -G.h / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(8, 11, G.w, G.h);
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, G.w, G.h);
    ctx.strokeStyle = 'rgba(46,94,166,0.18)'; ctx.lineWidth = 1.2;
    for (let x = 40; x < G.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, G.h); ctx.stroke(); }
    for (let y = 40; y < G.h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(G.w, y); ctx.stroke(); }
    ctx.strokeStyle = rgba('ink', 0.85); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(70, 50); ctx.lineTo(70, G.h - 70); ctx.lineTo(G.w - 40, G.h - 70); ctx.stroke();
    ctx.font = font(F.mono(700), 26); ctx.fillStyle = rgba('ink', 0.8);
    ctx.fillText('WEEKS →', G.w - 200, G.h - 30);
    ctx.save(); ctx.translate(46, 260); ctx.rotate(-Math.PI / 2); ctx.fillText('WEIGHT →', 0, 0); ctx.restore();
    ctx.font = font(F.archivo(87.5, 800), 40); ctx.fillStyle = rgba('ink', 1); ctx.fillText('Bench press', 100, 70);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    tag(ctx, c, '+2.5 KG', -470, -40, 30, { a: prog(t, w.up!.start, w.up!.start + 0.15), rot: -0.05, seed: 81, bg: '#E8F7B8' });
    tag(ctx, c, 'MISSED: SAME WEIGHT', -210, 190, 26, { a: prog(t, w.doesnt!.start, w.doesnt!.start + 0.15), rot: 0.03, seed: 82 });
    tag(ctx, c, 'STALL', -40, -40, 30, { a: prog(t, w.stall!.start, w.stall!.start + 0.15), rot: 0.04, seed: 83 });
    tag(ctx, c, 'DELOAD', 105, 250, 30, { a: prog(t, w.deload!.start, w.deload!.start + 0.15), rot: -0.04, seed: 84, bg: '#FDE2CC' });
    drawCut(ctx, c, this.cuts.kettle!, 640, -170, t, { t0: this.ctx.start + 0.15, scale: 0.62, rot: 0.06, seed: 85 });
    indexCard(ctx, c, 480, 120, 380, 220, 'RULES', 'linear · Greyskull LP', { rot: 0.04, a: prog(t, w.built!.start, w.built!.start + 0.15), state: 'plain' });
    if (t > w.built!.start) {
      setWorld(ctx, c, 480 + 190, 120 + 110, 1, 0.04);
      ctx.font = font(F.mono(500), 22); ctx.fillStyle = rgba('acid', 0.95);
      ctx.fillText('double · triple', -190 + 380 * 0.07, 110 * 0.0 + 60);
      ctx.fillText('progression', -190 + 380 * 0.07, 110 * 0.0 + 90);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.up!.start, 0.01) * this.punch(t, w.deload!.start, 0.012) };
  }
}
