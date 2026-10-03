// MARRIED: "The biggest coding agents come married to one AI company. Codex talks to OpenAI. Claude
// Code talks to Anthropic."
// A. The spark at rest (the video's first and last frame). The headline arrives word by word; the pen
//    writes "married" in wedding-card script, and rules a line under "one AI company".
// B. A whip down to the diagram: CODEX and CLAUDE CODE on the left, each tied by one drawn line to its
//    vendor on the right. The pen loops two interlocked rings onto each line as the vendor is named.
import { type LineBatch } from '../engine/lines';
import { strokeText } from '../engine/stroke';
import { placeRow, fitRow, arc } from './_vo';
import { Plate, ARCH, drawNode, drawLink, packets, pt, clamp, ease, prog, pulse, noise1, LIN, type Cam, type P } from './_mp';

export default class Married extends Plate {
  x0 = -720;
  mx = 0; mw = 0;
  rest = pt(0, 0);
  ys = [640, 900];
  nodes: { title: string; sub: string; x: number; y: number; t: number }[] = [];
  links: { a: P; b: P; t0: number; t1: number }[] = [];

  build() {
    const w = this.w;
    const L1 = this.take('The biggest coding agents', ['The', 'biggest', 'coding', 'agents', 'come', 'married', 'to', 'one', 'AI', 'company.']);
    this.take('Codex talks to OpenAI', [['codex', 'Codex'], ['talks', 'talks'], ['to1', 'to'], ['openai', 'OpenAI.'], ['claude', 'Claude'], ['code', 'Code'], ['talks2', 'talks', 1], ['to2', 'to', 1], ['anthropic', 'Anthropic.']]);
    void L1;
    // ---- A: headline
    const fam = ARCH(100, 800);
    const s1 = fitRow(['The', 'biggest', 'coding', 'agents'], 1440, fam, 120);
    const y1 = -330, y2 = -150;
    this.kw.push(...placeRow([w.the!, w.biggest!, w.coding!, w.agents!], this.x0, y1, s1, fam, 'A', { ant: 0.2 }).words);
    const rc = placeRow([w.come!], this.x0, y2, s1 * 0.8, fam, 'A', { ant: 0.15 });
    this.kw.push(...rc.words);
    // "married" in script, written with the pen while it is said
    this.mw = 400;
    const ms = (100 * this.mw) / strokeText('married', 'script', 100).width;
    this.mx = this.x0 + rc.width + 34;
    this.plot.writeWords('married', [w.married!], 'script', ms, this.mx, y2 + 6, 'A', { width: 3.2, endEarly: 0.0, minDur: 0.3 });
    const r3 = placeRow([w.to!, w.one!, w.ai!, w.company!], this.mx + this.mw + 34, y2, s1 * 0.8, fam, 'A', { ant: 0.15 });
    this.kw.push(...r3.words);
    // a rule under "one AI company", then the pen goes home to the first node
    const u0 = r3.words[1]!.x - 6, u1 = this.mx + this.mw + 34 + r3.width + 8;
    this.plot.add([pt(u0, y2 + 26), pt(u1, y2 + 22)], w.company!.start, w.company!.end + 0.05, 'signal', { pen: true, ez: ease.inOutQuad, width: 4, group: 'A' });
    this.rest = pt(this.x0 - 40, y1 - 0.36 * s1);
    this.plot.wp(this.rest, 0, Math.max(0.01, w.the!.start - 0.02));
    this.plot.note('fig. 1  /  the default', this.x0, y1 - s1 - 30, w.biggest!.start, { size: 20, col: 'ash', group: 'A' });

    // ---- B: the diagram
    const [ya, yb] = this.ys;
    this.nodes = [
      { title: 'CODEX', sub: 'coding agent', x: -560, y: ya, t: w.codex!.start - 0.12 },
      { title: 'OPENAI', sub: 'its model vendor', x: 560, y: ya, t: w.openai!.start - 0.12 },
      { title: 'CLAUDE CODE', sub: 'coding agent', x: -560, y: yb, t: w.claude!.start - 0.12 },
      { title: 'ANTHROPIC', sub: 'its model vendor', x: 560, y: yb, t: w.anthropic!.start - 0.12 },
    ];
    this.links = [
      { a: pt(-345, ya), b: pt(345, ya), t0: w.talks!.start, t1: w.openai!.start + 0.12 },
      { a: pt(-345, yb), b: pt(345, yb), t0: w.talks2!.start, t1: w.anthropic!.start + 0.12 },
    ];
    // interlocked rings on each line, looped by the pen as the vendor is named
    const ring = (y: number, t0: number) => {
      this.plot.add(arc(-17, y, 26, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI, 48), t0, t0 + 0.22, 'signal', { pen: true, width: 2.6, group: 'B' });
      this.plot.add(arc(17, y, 26, Math.PI / 2, Math.PI / 2 + 2 * Math.PI, 48), t0 + 0.24, t0 + 0.46, 'signal', { pen: true, width: 2.6, group: 'B' });
    };
    ring(ya, w.openai!.start + 0.05);
    ring(yb, w.anthropic!.start + 0.05);
    this.plot.wp(pt(0, yb + 60), this.ctx.end - 0.05, 0.05);
    this.plot.note('one agent, one vendor', -130, yb + 120, w.anthropic!.end + 0.1, { size: 20, col: 'ash', group: 'B' });
    // L2 as small karaoke above and below the diagram
    const fam7 = ARCH(100, 700);
    this.kw.push(...placeRow([w.codex!, w.talks!, w.to1!, w.openai!], -770, ya - 120, 60, fam7, 'B', { ant: 0.2 }).words);
    this.kw.push(...placeRow([w.claude!, w.code!, w.talks2!, w.to2!, w.anthropic!], -770, yb + 190, 60, fam7, 'B', { ant: 0.2 }).words);

    // ---- camera
    const K = this.cam;
    const r = this.rest;
    K.key(0, r.x + 120, r.y + 40, 2.1, 0.03);
    K.key(w.the!.start, r.x + 120, r.y + 40, 2.1, 0.03);
    K.key(w.coding!.start, -40, y1 + 30, 1.2, 0.01, ease.outCubic);
    K.key(w.married!.start, this.mx + 180, (y1 + y2) / 2 + 10, 1.28, -0.005, ease.inOutCubic);
    K.key(w.married!.end, this.mx + 240, (y1 + y2) / 2 + 20, 1.3, -0.01, ease.linear);
    K.key(w.company!.end + 0.05, 0, (y1 + y2) / 2 + 20, 1.1, 0, ease.inOutCubic);
    K.key(w.codex!.start - 0.1, 0, (y1 + y2) / 2 + 40, 1.1, 0, ease.linear);
    K.key(w.codex!.start + 0.22, -120, ya + 60, 1.22, -0.01, ease.outExpo);
    K.key(w.openai!.end, 0, ya + 80, 1.2, 0, ease.inOutCubic);
    K.key(w.claude!.start + 0.2, 0, (ya + yb) / 2 + 40, 1.12, 0.008, ease.inOutCubic);
    K.key(this.ctx.end, 0, (ya + yb) / 2 + 50, 1.15, 0.01, ease.linear);
  }

  alpha(g: string, t: number) {
    if (g === 'A') return 1 - 0.7 * prog(t, this.w.codex!.start - 0.1, this.w.codex!.start + 0.3);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    for (const n of this.nodes) {
      const a = prog(t, n.t, n.t + 0.25);
      const hot = pulse(t, n.t + 0.1, 0.35);
      drawNode(ctx, c, n.x, n.y, n.title, n.sub, { a, hot, w: 420, h: 140, size: 30 });
    }
    for (const l of this.links) drawLink(ctx, c, l.a, l.b, prog(t, l.t0, l.t1, ease.inOutCubic), { a: 0.9 });
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    for (const l of this.links) packets(X, c, [l.a, l.b], t, { t0: l.t1, speed: 420, gap: 0.3, fadeIn: 0.2 });
    void LIN; void clamp;
  }

  penScale(t: number) { return 0.8 + 0.6 * pulse(t, this.w.married!.start, 0.2); }

  postFX(t: number) {
    const w = this.w;
    const punch = 0.012 * pulse(t, w.married!.start, 0.1) + 0.01 * pulse(t, w.openai!.start, 0.08) + 0.01 * pulse(t, w.anthropic!.start, 0.08);
    const sh = 5 * pulse(t, w.codex!.start + 0.2, 0.06);
    return { zoom: 1 + punch, shake: [sh * noise1(t * 45, 3), sh * noise1(t * 51, 4)] as [number, number],
      frame: 1 - prog(t, w.the!.start - 0.05, w.the!.start + 0.4, ease.inOutCubic) };
  }
}
