// FORMATS: "The clever part is underneath. Codex only speaks OpenAI's Responses format. Claude Code
// only speaks Anthropic's Messages format."
// A. The menu-bar panel sits on a dashed surface; on "underneath" the camera tilts down below it.
// B. Two request cards, typed as each sentence is said: Codex's POST /v1/responses and Claude Code's
//    POST /v1/messages. Under each, its packets: squares for Responses, discs for Messages.
import { type LineBatch } from '../engine/lines';
import { placeRow } from './_vo';
import { Plate, ARCH, drawWindow, typed, pt, ease, prog, pulse, rgba, setWorld, font, F, label, w2s, LIN, TAU, type Cam } from './_mp';

const LEFT = ['POST /v1/responses', '{', '  "model": "gpt-6-astra",', '  "input": "fix the failing test",', '  "stream": true', '}'];
const RIGHT = ['POST /v1/messages', '{', '  "model": "claude-fable-5-1",', '  "max_tokens": 4096,', '  "messages": [ … ]', '}'];
const CY = 40, CWID = 880, CHGT = 400;
const LX = -920, RX = 40;

export default class Formats extends Plate {
  hasUnder = true;
  tUnder = 0;

  build() {
    const w = this.w;
    this.take('The clever part', [['the', 'The'], 'clever', 'part', 'is', 'underneath.']);
    const L9 = this.take('Codex only speaks', ['Codex', ['only1', 'only', 0], ['speaks1', 'speaks', 0], "OpenAI's", 'Responses', ['format1', 'format.', 0], 'Claude', 'Code', ['only2', 'only', 1], ['speaks2', 'speaks', 1], "Anthropic's", 'Messages', ['format2', 'format.', 1]]);
    this.tUnder = w.underneath!.start;
    const r = placeRow([w.the!, w.clever!, w.part!, w.is!, w.underneath!], -700, -170, 104, ARCH(100, 800), 'A', { ant: 0.2 });
    r.words[4]!.done = 'signal';
    this.kw.push(...r.words);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L9, 'Codex', 'speaks'), LX, CY - 128, 48, fam, 'B', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L9, "OpenAI's", 'format.'), LX, CY - 68, 48, fam, 'B', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L9, 'Claude', 'speaks'), RX, CY - 128, 48, fam, 'B', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L9, "Anthropic's", 'format.'), RX, CY - 68, 48, fam, 'B', { ant: 0.2 }).words);
    // the surface line, ruled by the pen
    this.plot.add([pt(-1100, -360), pt(1100, -360)], this.ctx.start + 0.1, this.ctx.start + 0.6, 'cons', { ez: ease.outCubic, dash: 16, alpha: 0.8, group: 'A' });
    this.plot.note('what you see', -940, -380, this.ctx.start + 0.4, { size: 22, col: 'ash', group: 'A' });
    this.plot.note('underneath', -940, -325, this.tUnder, { size: 22, col: 'signal', group: 'A' });
    const K = this.cam;
    K.key(this.ctx.start, 0, -440, 1.0, -0.006);
    K.key(this.tUnder, 0, -430, 1.02, -0.004, ease.linear);
    K.key(this.tUnder + 0.5, 0, -250, 1.02, 0.0, ease.inOutCubic);
    K.key(w.codex!.start + 0.25, -20, 220, 0.98, 0.0, ease.outExpo);
    K.key(w.claude!.start + 0.2, 20, 225, 0.98, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 30, 230, 1.0, 0.006, ease.linear);
  }

  alpha(g: string, t: number) { return g === 'A' ? 1 - prog(t, this.w.codex!.start - 0.1, this.w.codex!.start + 0.3) : 1; }

  drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // a compact copy of the panel above the surface, sliding up and away on "underneath"
    const lift = ease.inOutCubic(prog(t, this.tUnder, this.tUnder + 0.6));
    const y = -700 - 160 * lift;
    drawWindow(ctx, c, -330, y, 660, 300, 'magpie', { a: 1 - 0.5 * lift });
    setWorld(ctx, c, -330, y);
    ctx.font = font(F.mono(500), 24);
    const rows: [string, string][] = [['Claude Code', 'claude-fable-5-1'], ['Codex', 'deepseek/deepseek-v4-pro'], ['Gemini CLI', 'gemini-3.1-pro'], ['OpenCode', 'anthropic/claude-sonnet-5']];
    rows.forEach(([a, m], i) => {
      ctx.fillStyle = rgba('bone', 0.85 * (1 - 0.5 * lift)); ctx.fillText(a, 24, 96 + i * 52);
      ctx.fillStyle = rgba(i === 1 ? 'signal' : 'ash', 0.85 * (1 - 0.5 * lift)); ctx.fillText(m, 250, 96 + i * 52);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const card = (x: number, title: string, lines: string[], t0: number, t1: number, tag: string) => {
      const a = prog(t, t0 - 0.2, t0 + 0.1);
      if (a <= 0) return;
      const slide = (1 - ease.outExpo(prog(t, t0 - 0.2, t0 + 0.3))) * 60;
      drawWindow(ctx, c, x, CY + slide, CWID, CHGT, title, { a });
      const per = (t1 - t0) / lines.length;
      lines.forEach((ln, i) => typed(ctx, c, ln, x + 30, CY + slide + 50 + 58 + i * 50, t, t0 + i * per, Math.max(0.08, per * 0.9), { size: 30, col: i === 0 ? 'signal' : 'bone', a, caret: i === lines.length - 1 }));
      setWorld(ctx, c, x, CY + slide + CHGT + 46);
      label(ctx, tag, 0, 0, { size: 21, col: rgba('ash', 0.9 * a), spacing: 4 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    card(LX, 'codex → request', LEFT, w.speaks1!.start, w.format1!.end, 'SPEAKS: OPENAI RESPONSES');
    card(RX, 'claude code → request', RIGHT, w.speaks2!.start, w.format2!.end, 'SPEAKS: ANTHROPIC MESSAGES');
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    // packets under each card: squares (Responses) and discs (Messages), flowing right
    const row = (x: number, y: number, t0: number, square: boolean) => {
      if (t < t0) return;
      for (let k = 0; k < 9; k++) {
        const u = ((t - t0) * 0.35 + k / 9) % 1;
        const px = x + 40 + u * (CWID - 80), py = y;
        const f = Math.min(1, (t - t0) * 3) * Math.min(1, Math.min(u, 1 - u) * 8);
        const [sx, sy] = w2s(c, px, py);
        const s = 7 * c.z;
        const col: [number, number, number] = [LIN.signal[0] * 1.6 * f, LIN.signal[1] * 1.6 * f, LIN.signal[2] * 1.6 * f];
        if (square) {
          X.seg2(sx - s, sy - s, sx + s, sy - s, 2, col); X.seg2(sx + s, sy - s, sx + s, sy + s, 2, col);
          X.seg2(sx + s, sy + s, sx - s, sy + s, 2, col); X.seg2(sx - s, sy + s, sx - s, sy - s, 2, col);
        } else {
          for (let i = 0; i < 12; i++) {
            const a0 = (i / 12) * TAU, a1 = ((i + 1) / 12) * TAU;
            X.seg2(sx + Math.cos(a0) * s, sy + Math.sin(a0) * s, sx + Math.cos(a1) * s, sy + Math.sin(a1) * s, 2, col);
          }
        }
      }
    };
    row(LX, CY + CHGT + 96, this.w.responses!.start, true);
    row(RX, CY + CHGT + 96, this.w.messages!.start, false);
  }

  postFX(t: number) {
    return { zoom: 1 + 0.01 * pulse(t, this.w.codex!.start + 0.2, 0.1) + 0.008 * pulse(t, this.w.claude!.start + 0.15, 0.1) };
  }
}
