// QUESTION: "So how does an app under fifteen megabytes put Codex on DeepSeek, and Claude Code on Kimi?"
// A small square (the app, not named yet) is ruled by the pen and dimensioned "< 15 MB". Then the
// agents re-wire through it: CODEX → DEEPSEEK, CLAUDE CODE → KIMI, packets running. On "Kimi?" the
// pen writes a question mark inside the app.
import { type LineBatch } from '../engine/lines';
import { placeRow, rectPts } from './_vo';
import { Plate, ARCH, drawNode, packets, pt, ease, prog, pulse, noise1, rgba, w2s, type Cam, type P } from './_mp';

export default class Question extends Plate {
  nodes: { title: string; sub: string; x: number; y: number; t: number }[] = [];
  routes: { pts: P[]; t0: number; t1: number }[] = [];

  build() {
    const w = this.w;
    this.take('So how does an app', ['So', 'how', 'does', 'an', 'app', 'under', 'fifteen', 'megabytes', 'put', 'Codex', ['on1', 'on', 0], 'DeepSeek,', 'and', 'Claude', 'Code', ['on2', 'on', 1], 'Kimi?']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow([w.so!, w.how!, w.does!, w.an!, w.app!, w.under!, w.fifteen!, w.megabytes!], -760, -400, 66, fam, 'K', { ant: 0.2 }).words);
    this.kw.push(...placeRow([w.put!, w.codex!, w.on1!, w.deepseek!, w.and!, w.claude!, w.code!, w.on2!, w.kimi!], -760, 450, 66, fam, 'K', { ant: 0.2 }).words);
    // the app: a square ruled by the pen on "app"
    const s = 210;
    this.plot.add(rectPts(-s / 2, -s / 2, s, s), w.app!.start - 0.05, w.app!.start + 0.35, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.2, group: 'app' });
    // dimension on "fifteen megabytes"
    this.plot.dimension(pt(-s / 2, -s / 2 - 46), pt(s / 2, -s / 2 - 46), '< 15 MB', w.fifteen!.start, 'dim', 28);
    this.plot.note('the whole app', -s / 2, s / 2 + 40, w.megabytes!.end, { size: 20, col: 'ash', group: 'dim' });
    // the question mark, written on "Kimi?"
    const tq = w.kimi!.end - 0.05;
    const q = [pt(-26, -38), pt(-20, -58), pt(0, -66), pt(22, -58), pt(28, -36), pt(14, -18), pt(0, -6), pt(0, 16)];
    this.plot.add(q, tq, tq + 0.3, 'signal', { pen: true, ez: ease.inOutQuad, width: 5, group: 'app' });
    this.plot.add([pt(0, 40), pt(0.5, 41)], tq + 0.34, tq + 0.38, 'signal', { pen: true, width: 7, group: 'app' });
    this.nodes = [
      { title: 'CODEX', sub: 'coding agent', x: -600, y: -150, t: w.codex!.start - 0.1 },
      { title: 'DEEPSEEK', sub: 'model vendor', x: 600, y: -150, t: w.deepseek!.start - 0.12 },
      { title: 'CLAUDE CODE', sub: 'coding agent', x: -600, y: 170, t: w.claude!.start - 0.1 },
      { title: 'KIMI', sub: 'model vendor', x: 600, y: 170, t: w.kimi!.start - 0.12 },
    ];
    this.routes = [
      { pts: [pt(-400, -150), pt(-170, -150), pt(-105, -40), pt(105, -40), pt(170, -150), pt(400, -150)], t0: w.codex!.start, t1: w.deepseek!.end },
      { pts: [pt(-400, 170), pt(-170, 170), pt(-105, 40), pt(105, 40), pt(170, 170), pt(400, 170)], t0: w.claude!.start, t1: w.kimi!.end },
    ];
    const K = this.cam;
    K.key(this.ctx.start, -170, -190, 1.12, -0.01);
    K.key(w.app!.start, -110, -150, 1.2, -0.008, ease.linear);
    K.key(w.megabytes!.end, -40, -90, 1.24, 0.0, ease.inOutCubic);
    K.key(w.codex!.start + 0.25, -40, 20, 1.04, 0.006, ease.outExpo);
    K.key(w.kimi!.start, 0, 30, 1.02, 0.01, ease.inOutCubic);
    K.key(this.ctx.end, 0, 10, 1.1, 0.0, ease.inOutCubic);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    for (const n of this.nodes) drawNode(ctx, c, n.x, n.y, n.title, n.sub, { a: prog(t, n.t, n.t + 0.25), hot: pulse(t, n.t + 0.12, 0.35), w: 400, h: 136, size: 28 });
    // routes, drawn progressively along their polylines
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const r of this.routes) {
      const k = prog(t, r.t0, r.t1, ease.inOutCubic);
      if (k <= 0) continue;
      const n = r.pts.length - 1, u = k * n;
      ctx.strokeStyle = rgba('bone', 0.75);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const p0 = w2s(c, r.pts[0]!.x, r.pts[0]!.y);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i <= n; i++) {
        const f = Math.min(1, u - (i - 1));
        if (f <= 0) break;
        const a = r.pts[i - 1]!, b = r.pts[i]!;
        const p = w2s(c, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    for (const r of this.routes) packets(X, c, r.pts, t, { t0: r.t1 - 0.1, speed: 560, gap: 0.24, fadeIn: 0.2 });
  }

  postFX(t: number) {
    const w = this.w;
    const sh = 5 * pulse(t, w.codex!.start + 0.22, 0.06);
    return { zoom: 1 + 0.012 * pulse(t, w.fifteen!.start, 0.1) + 0.012 * pulse(t, w.kimi!.end, 0.1), shake: [sh * noise1(t * 45, 3), sh * noise1(t * 51, 4)] as [number, number] };
  }
}
