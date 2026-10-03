// SWITCHBOARD: "But if you juggle more than one agent, this might be the switchboard you've been missing.
// That's today's tool. There's a new one every day."
// A. Four agent chips juggle in arcs. On "switchboard" they drop into the jacks of an operator's
//    switchboard; the pen patches cords from agents to models, one per word.
// B. A whip down to the sign-off: today's tool, the channel's promise, and the spark at rest inside
//    the crop marks (the video's first frame).
import { type LineBatch } from '../engine/lines';
import { placeRow, bezier } from './_vo';
import { Plate, ARCH, chip, pt, clamp, ease, lerp, prog, pulse, rgba, mixCss, setWorld, label, typed, w2s, LIN, TAU, type Cam } from './_mp';

const AG = ['CLAUDE CODE', 'CODEX', 'GEMINI CLI', 'OPENCODE'];
const MD = ['DEEPSEEK', 'KIMI', 'GLM', 'CLAUDE PLAN', 'CHATGPT PLAN'];
const PAIRS: [number, number][] = [[0, 1], [1, 0], [2, 2], [3, 3]];
const JL = -300, JR = 300;
const ly = (i: number) => -190 + i * 130;
const ry = (i: number) => -230 + i * 118;
const OUT = 1000; // y of the sign-off

export default class Switchboard extends Plate {
  tSB = 0; tWhip = 0;
  cords: { pts: { x: number; y: number }[]; t: number }[] = [];

  build() {
    const w = this.w;
    const L16 = this.take('But if you juggle', ['But', 'if', ['you1', 'you', 0], 'juggle', 'more', 'than', ['one1', 'one', 0], 'agent,', 'this', 'might', 'be', 'the', 'switchboard', "you've", 'been', 'missing.']);
    const L17 = this.take("That's today's tool", ["That's", "today's", 'tool.', "There's", 'a', 'new', 'one', 'every', 'day.']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L16, 'But', 'agent,'), -800, -440, 62, fam, 'K1', { ant: 0.2 }).words);
    this.kw.push(...placeRow([w.this!, w.might!, w.be!, w.the!, w.switchboard!, w.youve!, w.been!, w.missing!], -800, 490, 60, fam, 'K1', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L17, "That's", 'tool.'), -560, OUT - 30, 120, ARCH(100, 800), 'K2', { ant: 0.25 }).words);
    this.kw.push(...placeRow(this.span(L17, "There's", 'day.'), -560, OUT + 80, 74, ARCH(100, 700), 'K2', { ant: 0.25 }).words);
    this.tSB = w.switchboard!.start;
    this.tWhip = w.thats!.start;
    const ts = [w.switchboard!.start + 0.1, w.youve!.start, w.been!.start, w.missing!.start];
    this.cords = PAIRS.map(([a, b], i) => {
      const p0 = pt(JL, ly(a)), p3 = pt(JR, ry(b));
      return { pts: bezier(p0, pt(JL + 220, ly(a) + 240), pt(JR - 220, ry(b) + 240), p3, 48), t: ts[i]! };
    });
    this.cords.forEach((cd) => this.plot.add(cd.pts, cd.t, cd.t + 0.32, 'signal', { pen: true, ez: ease.inOutQuad, width: 3.2, group: 'cords' }));
    // the pen comes to rest at the sign-off
    this.plot.wp(pt(-560, OUT + 200), this.ctx.end - 1.2, 1.3);
    const K = this.cam;
    K.key(this.ctx.start, 0, -160, 1.1, 0.0);
    K.key(w.agent!.end, 0, -120, 1.06, 0.0, ease.linear);
    K.key(this.tSB + 0.3, 0, 40, 0.9, 0.0, ease.inOutCubic);
    K.key(this.tWhip - 0.08, 0, 60, 0.92, 0.004, ease.linear);
    K.key(this.tWhip + 0.25, -60, OUT + 40, 1.0, -0.006, ease.outExpo);
    K.key(this.ctx.end - 1.0, -40, OUT + 60, 1.05, -0.004, ease.inOutCubic);
    K.key(this.ctx.end, -560, OUT + 200, 2.1, 0.03, ease.inOutCubic);
  }

  alpha(g: string, t: number) {
    if (g === 'K1') return 1 - prog(t, this.tWhip - 0.1, this.tWhip + 0.2);
    if (g === 'K2') return 1 - prog(t, this.ctx.end - 1.0, this.ctx.end - 0.5);
    if (g === 'cords') return 1 - 0.7 * prog(t, this.tWhip, this.tWhip + 0.3);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const sb = prog(t, this.tSB - 0.3, this.tSB + 0.1);
    // the switchboard panel
    if (sb > 0) {
      setWorld(ctx, c, -700, -330);
      ctx.fillStyle = rgba('ink2', 0.95 * sb); ctx.fillRect(0, 0, 1400, 700);
      ctx.lineWidth = 1.2 / c.z; ctx.strokeStyle = rgba('bone', 0.35 * sb); ctx.strokeRect(0, 0, 1400, 700);
      label(ctx, 'AGENTS', 60, 56, { size: 20, col: rgba('ash', 0.9 * sb), spacing: 4 });
      label(ctx, 'MODELS', 1340, 56, { size: 20, col: rgba('ash', 0.9 * sb), spacing: 4, align: 'right' });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const jack = (x: number, y: number, on: number) => {
        const [sx, sy] = w2s(c, x, y);
        ctx.fillStyle = rgba('ink', 1); ctx.strokeStyle = mixCss('ash', 'signal', on, sb); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, 16 * c.z, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = mixCss('graphite', 'signal', on, sb); ctx.beginPath(); ctx.arc(sx, sy, 6 * c.z, 0, TAU); ctx.fill();
      };
      AG.forEach((_, i) => jack(JL, ly(i), this.on(i, -1, t)));
      MD.forEach((m, i) => {
        jack(JR, ry(i), this.on(-1, i, t));
        setWorld(ctx, c, JR + 40, ry(i) + 9);
        label(ctx, m, 0, 0, { size: 25, col: rgba('bone', 0.9 * sb), spacing: 3, weight: 500 });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
    }
    // the agent chips: juggled, then dropped into their jacks
    const tj = w.juggle!.start - 0.2;
    if (t > tj && t < this.tWhip + 0.3) {
      const settle = ease.inOutCubic(prog(t, this.tSB - 0.25, this.tSB + 0.25));
      AG.forEach((n, i) => {
        const ph = ((t - tj) * 0.85 + i / AG.length) % 1;
        const dir = i % 2 ? -1 : 1;
        const jx = dir * (-300 + 600 * ph), jy = -40 - 420 * 4 * ph * (1 - ph);
        const x = lerp(jx, JL - 190, settle), y = lerp(jy, ly(i), settle);
        chip(ctx, c, n, x, y, { a: prog(t, tj + i * 0.06, tj + 0.2 + i * 0.06), size: 26, border: rgba('signal', 0.7) });
      });
    }
    // the sign-off
    if (t > this.tWhip) {
      const a = prog(t, this.tWhip + 0.2, this.tWhip + 0.5) * (1 - prog(t, this.ctx.end - 1.0, this.ctx.end - 0.5));
      typed(ctx, c, 'magpie  ·  github.com/yetone/magpie', -556, OUT - 200, t, this.tWhip + 0.2, 0.5, { size: 32, col: 'ash', a });
      setWorld(ctx, c, -556, OUT + 190);
      label(ctx, 'TOOL MAN  ·  ONE NEW TOOL, EVERY DAY', 0, 0, { size: 24, col: rgba('signal', a * prog(t, w.every!.start, w.every!.start + 0.3)), spacing: 5, weight: 600 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  /** Is agent i (or model j) patched by t? */
  on(i: number, j: number, t: number) {
    let v = 0;
    PAIRS.forEach(([a, b], k) => { if (a === i || b === j) v = Math.max(v, prog(t, this.cords[k]!.t + 0.25, this.cords[k]!.t + 0.4)); });
    return v;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    if (t > this.tWhip + 0.3) return;
    this.cords.forEach((cd) => {
      if (t < cd.t + 0.35) return;
      const n = cd.pts.length;
      for (let k = 0; k < 3; k++) {
        const u = ((t - cd.t) * 0.6 + k / 3) % 1;
        const q = cd.pts[Math.min(n - 1, Math.floor(u * (n - 1)))]!;
        const [sx, sy] = w2s(c, q.x, q.y);
        X.seg2(sx, sy, sx + 0.01, sy, 7 * c.z, [LIN.ember[0] * 2, LIN.ember[1] * 2, LIN.ember[2] * 2], 0.9);
      }
    });
  }

  penScale(t: number) { return 0.8 + 0.5 * prog(t, this.ctx.end - 1.2, this.ctx.end - 0.4); }

  postFX(t: number) {
    const sh = 6 * pulse(t, this.tWhip + 0.2, 0.06);
    return {
      zoom: 1 + 0.01 * pulse(t, this.tSB, 0.1), shake: [sh * Math.sin(t * 90), sh * Math.cos(t * 77)] as [number, number],
      frame: prog(t, this.ctx.end - 0.9, this.ctx.end - 0.2, ease.inOutCubic),
    };
  }
}

void clamp;
