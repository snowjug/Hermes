// GATEWAY: "So magpie runs a gateway on your own computer that speaks all of them, and translates in
// both directions, streaming and tool calls included."
// The gateway (127.0.0.1:3425) appears; the pen draws a laptop around it on "your own computer". Agents
// on the left (each with the API it speaks), providers on the right. Its three ports light on "speaks
// all of them"; on "translates" packets run in, change shape inside the gateway and run out — and back.
// "streaming" and "tool calls" are ticked by the pen.
import { type LineBatch } from '../engine/lines';
import { placeRow, rectPts } from './_vo';
import { Plate, ARCH, drawNode, drawLink, packets, chip, pt, ease, lerp, prog, pulse, rgba, mixCss, setWorld, font, F, label, LIN, type Cam, type P } from './_mp';

const AG: [string, string][] = [['CODEX', 'Responses'], ['CLAUDE CODE', 'Messages'], ['GEMINI CLI', 'Gemini'], ['OPENCODE', 'Chat']];
const PR: [string, string][] = [['DEEPSEEK', 'API key'], ['KIMI', 'API key'], ['GLM', 'API key'], ['YOUR CLAUDE PLAN', 'sign-in']];
const PORTS = ['OpenAI Chat · Responses', 'Anthropic Messages', 'Google Gemini'];
const GX = 0, GY = -40;
const ay = (i: number) => -300 + i * 175;
const py = (i: number) => -300 + i * 175;

export default class Gateway extends Plate {
  tPorts: number[] = [];
  left: P[][] = []; right: P[][] = [];

  build() {
    const w = this.w;
    const L = this.take('So magpie runs a gateway', ['So', 'magpie', 'runs', 'a', 'gateway', 'on', 'your', 'own', 'computer', 'that', 'speaks', 'all', 'of', 'them,', ['and1', 'and', 0], 'translates', 'in', 'both', 'directions,', 'streaming', ['and2', 'and', 1], 'tool', 'calls', 'included.']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L, 'So', 'computer'), -700, 520, 62, fam, 'K1', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'that', 'directions,'), -820, 490, 52, fam, 'K2', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'streaming', 'included.'), -820, 560, 52, fam, 'K2', { ant: 0.2 }).words);
    // the laptop, drawn on "your own computer"
    const t0 = w.your!.start;
    this.plot.add(rectPts(-350, -290, 700, 460), t0, t0 + 0.45, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.2, group: 'lap' });
    this.plot.add([pt(-350, 170), pt(-420, 240), pt(420, 240), pt(350, 170)], t0 + 0.45, t0 + 0.7, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.2, group: 'lap' });
    this.plot.add([pt(-60, 206), pt(60, 206)], t0 + 0.72, t0 + 0.8, 'plot', { pen: true, width: 2.2, group: 'lap' });
    this.plot.note('your computer', -340, 284, w.computer!.end, { size: 22, col: 'ash', group: 'lap' });
    this.tPorts = [w.speaks!.start, w.all!.start, w.them!.start];
    this.left = AG.map((_, i) => [pt(-590, ay(i)), pt(-430, ay(i)), pt(-235, GY - 40 + (i - 1.5) * 30)]);
    this.right = PR.map((_, i) => [pt(235, GY - 40 + (i - 1.5) * 30), pt(430, py(i)), pt(590, py(i))]);
    // ticks on "streaming" and "tool calls"
    const tick = (x: number, y: number, tt: number) => this.plot.add([pt(x, y), pt(x + 9, y + 10), pt(x + 26, y - 12)], tt, tt + 0.14, 'signal', { pen: true, width: 4, group: 'tick' });
    tick(-46, 352, w.streaming!.start + 0.15);
    tick(318, 352, w.calls!.start + 0.1);
    const K = this.cam;
    K.key(this.ctx.start, GX, GY - 10, 1.35, 0.006);
    K.key(w.gateway!.end, GX, GY, 1.32, 0.004, ease.linear);
    K.key(w.computer!.end, 0, 40, 1.05, 0.0, ease.inOutCubic);
    K.key(w.speaks!.start + 0.2, -60, 60, 0.9, 0.0, ease.inOutCubic);
    K.key(w.translates!.start + 0.3, 0, 90, 0.86, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 100, 0.88, 0.004, ease.linear);
  }

  alpha(g: string, t: number) {
    const s = this.w.that!.start;
    if (g === 'K1') return 1 - prog(t, s - 0.15, s);
    if (g === 'K2') return prog(t, s - 0.15, s);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the gateway with its ports
    const tg = w.gateway!.start - 0.1;
    drawNode(ctx, c, GX, GY - 40, 'MAGPIE GATEWAY', '127.0.0.1:3425', { a: prog(t, tg, tg + 0.25), hot: pulse(t, tg + 0.1, 0.4), w: 470, h: 150, size: 30 });
    PORTS.forEach((p, i) => {
      const tp = this.tPorts[i]!;
      const a = prog(t, tp, tp + 0.15);
      if (a <= 0) return;
      const hot = pulse(t, tp, 0.4);
      setWorld(ctx, c, GX - 230, GY + 80 + i * 40);
      ctx.fillStyle = mixCss('ash', 'signal', hot, a);
      ctx.beginPath(); ctx.arc(8, -8, 7, 0, Math.PI * 2); ctx.fill();
      ctx.font = font(F.mono(500), 25);
      ctx.fillStyle = mixCss('bone', 'signal', hot * 0.7, 0.9 * a);
      ctx.fillText(p, 26, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // agents and providers
    const tA = w.so!.start;
    AG.forEach(([n, api], i) => drawNode(ctx, c, -780, ay(i), n, `speaks ${api}`, { a: prog(t, tA + i * 0.08, tA + 0.3 + i * 0.08), w: 380, h: 124, size: 26, hot: pulse(t, this.tPorts[Math.min(i, 2)]!, 0.3) * 0.6 }));
    const tP = w.translates!.start - 0.2;
    PR.forEach(([n, sub], i) => drawNode(ctx, c, 780, py(i), n, sub, { a: prog(t, tP + i * 0.07, tP + 0.3 + i * 0.07), w: 380, h: 124, size: 25 }));
    // links
    this.left.forEach((p, i) => drawPoly(ctx, c, p, prog(t, w.speaks!.start + i * 0.08, w.them!.end + i * 0.08, ease.inOutCubic)));
    this.right.forEach((p, i) => drawPoly(ctx, c, p, prog(t, w.translates!.start + i * 0.06, w.directions!.start + i * 0.06, ease.inOutCubic)));
    // the two features
    const f = (txt: string, x: number, tt: number) => chip(ctx, c, txt, x, 350, { a: prog(t, tt - 0.1, tt + 0.1), size: 30, border: rgba('signal', 0.7) });
    f('streaming', -170, w.streaming!.start);
    f('tool calls', 190, w.tool!.start);
    void label; void drawLink;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.translates!.start + 0.1;
    this.left.forEach((p, i) => {
      packets(X, c, p, t, { t0: t0 + i * 0.07, speed: 640, gap: 0.42, fadeIn: 0.2 });
      packets(X, c, p, t, { t0: w.both!.start + i * 0.07, speed: 640, gap: 0.42, reverse: true, col: LIN.bone, I: 1.0, size: 0.8, fadeIn: 0.2 });
    });
    this.right.forEach((p, i) => {
      packets(X, c, p, t, { t0: t0 + 0.3 + i * 0.05, speed: 640, gap: 0.5, fadeIn: 0.2 });
      packets(X, c, p, t, { t0: w.both!.start + 0.2 + i * 0.05, speed: 640, gap: 0.5, reverse: true, col: LIN.bone, I: 1.0, size: 0.8, fadeIn: 0.2 });
    });
  }

  postFX(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.01 * pulse(t, w.gateway!.start, 0.1) + 0.008 * pulse(t, w.translates!.start, 0.1) };
  }
}

function drawPoly(ctx: CanvasRenderingContext2D, c: Cam, pts: P[], k: number) {
  if (k <= 0) return;
  const n = pts.length - 1, u = k * n;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = rgba('bone', 0.55);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const p0 = toS(c, pts[0]!);
  ctx.moveTo(p0[0], p0[1]);
  for (let i = 1; i <= n; i++) {
    const f = Math.min(1, u - (i - 1));
    if (f <= 0) break;
    const a = pts[i - 1]!, b = pts[i]!;
    const p = toS(c, pt(lerp(a.x, b.x, f), lerp(a.y, b.y, f)));
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
}
function toS(c: Cam, p: P): [number, number] {
  const dx = (p.x - c.cx) * c.z, dy = (p.y - c.cy) * c.z;
  const co = Math.cos(c.roll), si = Math.sin(c.roll);
  return [960 + co * dx - si * dy, 540 + si * dx + co * dy];
}
