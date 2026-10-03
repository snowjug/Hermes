// ADAPTER: "Think of it as a travel adapter. The plug stays the same. The socket can be anywhere."
// The pen draws a plug (your agent), an adapter (magpie) and a wall socket. On "the same" the plug is
// underlined and holds. On "socket … anywhere" the wall socket changes country three times (round
// pins, three square pins, angled pins), each labelled with a different provider, and the adapter's
// pins change to fit.
import { type LineBatch } from '../engine/lines';
import { placeRow, rectPts, bezier } from './_vo';
import { Plate, ARCH, pt, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, burst, type Cam } from './_mp';

type Kind = 'A' | 'C' | 'G' | 'I';
const SOCK = { x: 280, y: -190, w: 330, h: 380, cx: 445, cy: 0 };
const ADP = { x: -330, y: -120, w: 380, h: 240 };

export default class Adapter extends Plate {
  swaps: { t: number; kind: Kind; name: string }[] = [];

  build() {
    const w = this.w;
    const L = this.take('Think of it as a travel adapter', ['Think', 'of', 'it', 'as', 'a', 'travel', 'adapter.', ['the1', 'The', 0], 'plug', 'stays', ['the2', 'the', 1], 'same.', ['the3', 'The', 2], 'socket', 'can', 'be', 'anywhere.']);
    const fam = ARCH(100, 800);
    this.kw.push(...placeRow(this.span(L, 'Think', 'adapter.'), -760, -330, 78, fam, 'K1', { ant: 0.2 }).words);
    this.kw.push(...placeRow([w.the1!, w.plug!, w.stays!, w.the2!, w.same!], -780, 340, 60, ARCH(100, 700), 'K2', { ant: 0.2 }).words);
    this.kw.push(...placeRow([w.the3!, w.socket!, w.can!, w.be!, w.anywhere!], 100, 340, 60, ARCH(100, 700), 'K2', { ant: 0.2 }).words);
    const P = this.plot;
    // the plug: cord, body, pins (US flat pins)
    const tp = w.think!.start;
    P.add(bezier(pt(-1000, 140), pt(-860, 140), pt(-820, 0), pt(-680, 0), 30), tp, tp + 0.3, 'plot', { pen: true, width: 2.4, group: 'plug' });
    P.add(rectPts(-680, -70, 200, 140), tp + 0.3, tp + 0.7, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4, group: 'plug' });
    P.add(rectPts(-480, -44, 64, 14), tp + 0.72, tp + 0.82, 'plot', { pen: true, width: 2, group: 'plug' });
    P.add(rectPts(-480, 30, 64, 14), tp + 0.84, tp + 0.94, 'plot', { pen: true, width: 2, group: 'plug' });
    P.note('your agent', -680, 124, tp + 0.6, { size: 24, col: 'ash', group: 'plug' });
    // the adapter, on "adapter"
    const ta = w.travel!.start;
    P.add(rectPts(ADP.x, ADP.y, ADP.w, ADP.h), ta, ta + 0.5, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4, group: 'adp' });
    P.add(rectPts(ADP.x - 4, -46, 10, 18), ta + 0.5, ta + 0.56, 'plot', { pen: true, width: 2, group: 'adp' });
    P.add(rectPts(ADP.x - 4, 28, 10, 18), ta + 0.57, ta + 0.63, 'plot', { pen: true, width: 2, group: 'adp' });
    // the wall plate
    P.add(rectPts(SOCK.x, SOCK.y, SOCK.w, SOCK.h), w.adapter!.start + 0.1, w.adapter!.start + 0.6, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4, group: 'sock' });
    P.note('the wall', SOCK.x, SOCK.y + SOCK.h + 40, w.adapter!.end, { size: 24, col: 'ash', group: 'sock' });
    // "stays the same": a signal underline under the plug
    P.add([pt(-690, 92), pt(-470, 88)], w.same!.start, w.same!.start + 0.25, 'signal', { pen: true, ez: ease.inOutQuad, width: 5, group: 'plug' });
    this.swaps = [
      { t: -1, kind: 'A', name: 'OPENAI' },
      { t: w.socket!.start + 0.05, kind: 'C', name: 'DEEPSEEK' },
      { t: w.be!.start, kind: 'G', name: 'KIMI' },
      { t: w.anywhere!.start + 0.15, kind: 'I', name: 'GLM' },
    ];
    P.wp(pt(SOCK.x + SOCK.w + 40, 0), w.anywhere!.end, 0.2);
    const K = this.cam;
    K.key(this.ctx.start, -560, -60, 1.35, -0.01);
    K.key(w.travel!.start, -380, -40, 1.15, -0.006, ease.inOutCubic);
    K.key(w.adapter!.end, -100, -10, 0.95, 0.0, ease.inOutCubic);
    K.key(w.plug!.start + 0.1, -330, 30, 1.12, -0.006, ease.inOutCubic);
    K.key(w.socket!.start + 0.15, 120, 20, 1.02, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, 100, 20, 1.0, 0.008, ease.linear);
  }

  alpha(g: string, t: number) {
    const s = this.w.the1!.start;
    if (g === 'K1') return 1 - 0.75 * prog(t, s - 0.2, s + 0.1);
    return 1;
  }

  cur(t: number) { let s = this.swaps[0]!; for (const x of this.swaps) if (t >= x.t) s = x; return s; }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const s = this.cur(t);
    const age = t - Math.max(s.t, 0);
    const flash = s.t > 0 ? pulse(t, s.t, 0.12) : 0;
    const shown = prog(t, w.adapter!.start + 0.5, w.adapter!.start + 0.8);
    if (shown > 0) {
      // socket holes
      setWorld(ctx, c, SOCK.cx, SOCK.cy);
      const pop = 1 + 0.15 * (s.t > 0 ? 1 - ease.outExpo(Math.min(1, age / 0.2)) : 0);
      ctx.scale(pop, pop);
      ctx.fillStyle = rgba('ink', 1);
      ctx.strokeStyle = mixCss('bone', 'signal', flash, 0.9 * shown);
      ctx.lineWidth = 2.4;
      holes(ctx, s.kind);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, SOCK.x + SOCK.w / 2, SOCK.y - 26);
      label(ctx, s.name, 0, 0, { size: 31, col: mixCss('bone', 'signal', Math.max(flash, s.t > 0 ? 0.6 : 0), shown), spacing: 5, align: 'center', weight: 600 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // adapter: label and its output pins (match the socket)
    const ta = prog(t, w.travel!.start + 0.4, w.adapter!.start + 0.2);
    if (ta > 0) {
      setWorld(ctx, c, ADP.x + ADP.w / 2, 12);
      ctx.font = font(F.mono(600), 42);
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba('bone', 0.95 * ta);
      ctx.fillText('magpie', 0, 0);
      ctx.font = font(F.mono(400), 22);
      ctx.fillStyle = rgba('ash', 0.85 * ta);
      ctx.fillText('the adapter', 0, 42);
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, ADP.x + ADP.w, 0);
      ctx.strokeStyle = mixCss('bone', 'signal', flash, 0.9 * ta);
      ctx.fillStyle = mixCss('bone', 'signal', flash, 0.9 * ta);
      ctx.lineWidth = 2.4;
      pins(ctx, s.kind);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void noise1;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    for (const s of this.swaps) if (s.t > 0) burst(X, c, pt(ADP.x + ADP.w + 60, 0), t, s.t, 26, s.t, 0.6);
  }

  postFX(t: number) {
    const z = this.swaps.reduce((m, s) => m + (s.t > 0 ? 0.008 * pulse(t, s.t, 0.08) : 0), 0);
    return { zoom: 1 + z };
  }
}

/** Socket holes centred at 0,0 for a plug type. */
function holes(ctx: CanvasRenderingContext2D, k: Kind) {
  const slot = (x: number, y: number, w: number, h: number, r = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 3); ctx.fill(); ctx.stroke(); ctx.restore(); };
  ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.stroke();
  if (k === 'A') { slot(-36, -10, 14, 64); slot(36, -10, 14, 64); ctx.beginPath(); ctx.arc(0, 56, 14, Math.PI, 0); ctx.lineTo(14, 70); ctx.lineTo(-14, 70); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (k === 'C') { for (const x of [-40, 40]) { ctx.beginPath(); ctx.arc(x, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } }
  if (k === 'G') { slot(0, -50, 16, 50); slot(-44, 34, 50, 16); slot(44, 34, 50, 16); }
  if (k === 'I') { slot(-38, -14, 14, 56, -0.55); slot(38, -14, 14, 56, 0.55); slot(0, 54, 14, 46); }
}
/** The adapter's output pins, from its right face (x = 0) outward. */
function pins(ctx: CanvasRenderingContext2D, k: Kind) {
  const bar = (y: number, len: number, th: number) => { ctx.fillRect(0, y - th / 2, len, th); };
  if (k === 'A') { bar(-36, 60, 12); bar(36, 60, 12); }
  if (k === 'C') { for (const y of [-40, 40]) { ctx.fillRect(0, y - 9, 66, 18); ctx.beginPath(); ctx.arc(66, y, 9, -Math.PI / 2, Math.PI / 2); ctx.fill(); } }
  if (k === 'G') { bar(-50, 56, 16); bar(-10, 56, 16); bar(30, 56, 16); }
  if (k === 'I') { bar(-38, 56, 12); bar(38, 56, 12); bar(0, 48, 12); }
}
