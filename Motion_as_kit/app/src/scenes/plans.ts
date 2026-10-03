// PLANS: "Even the plans you already pay for become providers. Your Claude Code sign-in can power
// other agents, with no key to paste."
// The provider column holds DEEPSEEK, KIMI, GLM. Three plan cards (Claude, ChatGPT, Copilot) appear
// and, on "become providers", slide into the column. Then the Claude plan lights as "Claude Code
// sign-in" and wires itself to OPENCODE, PI and GOOSE; on "no key to paste" the pen draws a key and
// strikes it out.
import { type LineBatch } from '../engine/lines';
import { placeRow, arc } from './_vo';
import { Plate, ARCH, drawNode, packets, chip, pt, ease, lerp, prog, pulse, rgba, type Cam, type P } from './_mp';

const PROV = ['DEEPSEEK', 'KIMI', 'GLM'];
const PLANS: [string, string][] = [['CLAUDE PLAN', 'your subscription'], ['CHATGPT PLAN', 'your subscription'], ['COPILOT SEAT', 'your subscription']];
const AGENTS = ['OPENCODE', 'PI', 'GOOSE'];
const PXc = 600;
const prY = (i: number) => -330 + i * 125;
const agY = (i: number) => -20 + i * 160;

export default class Plans extends Plate {
  tMove = 0;
  links: P[][] = [];

  build() {
    const w = this.w;
    const L = this.take('Even the plans', ['Even', 'the', 'plans', 'you', 'already', 'pay', 'for', 'become', 'providers.', 'Your', 'Claude', 'Code', 'sign-in', 'can', 'power', 'other', 'agents,', 'with', 'no', 'key', 'to', 'paste.']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L, 'Even', 'providers.'), -780, -450, 60, fam, 'K1', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'Your', 'paste.'), -780, 510, 54, fam, 'K2', { ant: 0.2 }).words);
    this.tMove = w.become!.start;
    this.links = AGENTS.map((_, i) => [pt(PXc - 190, prY(3)), pt(0, prY(3)), pt(-200, agY(i)), pt(-410, agY(i))]);
    // the key, drawn and struck out
    const tk = w.key!.start - 0.25, kx = -80, ky = 360;
    this.plot.add(arc(kx, ky, 34, 0, Math.PI * 2, 40), tk, tk + 0.2, 'plot', { pen: true, width: 3, group: 'key' });
    this.plot.add([pt(kx + 34, ky), pt(kx + 190, ky), pt(kx + 190, ky + 28)], tk + 0.2, tk + 0.36, 'plot', { pen: true, width: 3, group: 'key' });
    this.plot.add([pt(kx + 150, ky), pt(kx + 150, ky + 20)], tk + 0.36, tk + 0.42, 'plot', { pen: true, width: 3, group: 'key' });
    this.plot.add([pt(kx - 60, ky - 60), pt(kx + 240, ky + 60)], w.paste!.start, w.paste!.start + 0.18, 'signal', { pen: true, ez: ease.inOutQuad, width: 7, group: 'key' });
    this.plot.note('nothing copied · no key to paste', kx + 270, ky + 10, w.paste!.end, { size: 23, col: 'ash', group: 'key' });
    const K = this.cam;
    K.key(this.ctx.start, 120, -100, 1.0, 0.004);
    K.key(this.tMove, 120, -60, 0.98, 0.0, ease.inOutCubic);
    K.key(this.tMove + 0.7, 110, -40, 0.92, 0.004, ease.inOutCubic);
    K.key(w.your!.start - 0.1, 100, -30, 0.92, 0.004, ease.linear);
    K.key(w.your!.start + 0.2, 40, 110, 0.94, 0.0, ease.inOutCubic);
    K.key(w.key!.start, 30, 150, 0.96, -0.004, ease.inOutCubic);
    K.key(this.ctx.end, 30, 160, 0.97, -0.006, ease.linear);
  }

  alpha(g: string, t: number) { return g === 'K1' ? 1 - 0.7 * prog(t, this.w.your!.start - 0.2, this.w.your!.start + 0.1) : 1; }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = this.ctx.start;
    PROV.forEach((n, i) => drawNode(ctx, c, PXc, prY(i), n, 'API key', { a: prog(t, t0 + i * 0.06, t0 + 0.25 + i * 0.06), w: 380, h: 108, size: 24, dim: 0.75 }));
    chip(ctx, c, 'PROVIDERS', PXc, prY(0) - 96, { a: prog(t, t0, t0 + 0.3), size: 21, border: rgba('ash', 0.5), col: rgba('ash', 0.9) });
    PLANS.forEach(([n, sub], i) => {
      const ta = w.plans!.start + i * 0.12;
      const mv = ease.inOutCubic(prog(t, this.tMove + i * 0.1, this.tMove + 0.55 + i * 0.1));
      const x = lerp(-360, PXc, mv), y = lerp(-200 + i * 150, prY(3 + i), mv);
      const signed = i === 0 && t > w.claude!.start;
      const hot = Math.max(pulse(t, this.tMove + 0.55 + i * 0.1, 0.3), signed ? 0.6 + 0.4 * pulse(t, w.claude!.start, 0.4) : 0);
      drawNode(ctx, c, x, y, n, mv > 0.98 ? (signed ? 'Claude Code sign-in' : 'now a provider') : sub, { a: prog(t, ta, ta + 0.2), w: 380, h: 108, size: 24, hot });
    });
    AGENTS.forEach((n, i) => {
      const ta = w.other!.start + i * 0.08;
      drawNode(ctx, c, -600, agY(i), n, 'agent', { a: prog(t, ta, ta + 0.2), w: 380, h: 108, size: 24, hot: pulse(t, w.agents!.start + i * 0.1, 0.4) });
    });
    // links from the Claude plan to the agents
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.links.forEach((p, i) => {
      const k = prog(t, w.power!.start + i * 0.07, w.agents!.end + i * 0.07, ease.inOutCubic);
      if (k <= 0) return;
      const n = p.length - 1, u = k * n;
      ctx.strokeStyle = rgba('signal', 0.75); ctx.lineWidth = 1.6;
      ctx.beginPath();
      const s0 = toS(c, p[0]!); ctx.moveTo(s0[0], s0[1]);
      for (let j = 1; j <= n; j++) {
        const f = Math.min(1, u - (j - 1));
        if (f <= 0) break;
        const s = toS(c, pt(lerp(p[j - 1]!.x, p[j]!.x, f), lerp(p[j - 1]!.y, p[j]!.y, f)));
        ctx.lineTo(s[0], s[1]);
      }
      ctx.stroke();
    });
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    this.links.forEach((p, i) => packets(X, c, p, t, { t0: this.w.agents!.end + i * 0.1, speed: 600, gap: 0.3, fadeIn: 0.2 }));
  }

  postFX(t: number) {
    return { zoom: 1 + 0.008 * pulse(t, this.tMove + 0.6, 0.1) + 0.01 * pulse(t, this.w.paste!.start, 0.1) };
  }
}

function toS(c: Cam, p: P): [number, number] {
  const dx = (p.x - c.cx) * c.z, dy = (p.y - c.cy) * c.z;
  const co = Math.cos(c.roll), si = Math.sin(c.roll);
  return [960 + co * dx - si * dy, 540 + si * dx + co * dy];
}
