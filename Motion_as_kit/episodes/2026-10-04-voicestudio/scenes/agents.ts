// AGENTS: "It even runs a local server, so your AI agents can speak too."
// On "local server" the pen draws the backend box (127.0.0.1:3900, MCP mounted at /mcp). On "agents" a
// coding agent's terminal types a request and calls the server's generate_speech tool; packets run to the
// server and on to a speaker, and on "speak" the speaker talks: rings and a waveform. (The session is an
// illustration; the tool names and port are from the project's MCP docs.)
import { type LineBatch } from '@engine/lines';
import { placeRow, rectPts, arc, rowWidth } from '@kit/_vo';
import { Plate, ARCH, drawWindow, typed, packets, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, label, burst, w2s, font, F, type Cam } from '@kit/_mp';
import { waveBars, voiceEnv, speechEnv, lin } from '@ep/vs';

const TERM = { x: -900, y: -250, w: 760, h: 480 };
const SRV = { x: 40, y: -120, w: 380, h: 240 };
const SPK = { x: 700, y: 0 };

export default class Agents extends Plate {
  build() {
    const w = this.w;
    const L = this.take('It even runs a local server', ['It', 'even', 'runs', 'local', 'server,', 'so', 'your', 'AI', 'agents', 'can', 'speak', 'too.']);
    const fam = ARCH(100, 800);
    const ws = L.words;
    this.screenKw.push(...placeRow(ws, -rowWidth(ws.map((x) => x.w), 52, fam) / 2, -420, 52, fam, 'K', { ant: 0.2 }).words);
    const P = this.plot;
    const ts = w.local!.start - 0.05;
    P.add(rectPts(SRV.x, SRV.y, SRV.w, SRV.h), ts, ts + 0.5, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4 });
    P.add([pt(SRV.x, SRV.y + 60), pt(SRV.x + SRV.w, SRV.y + 60)], ts + 0.5, ts + 0.6, 'cons', { pen: true, width: 1.4 });
    // the speaker: magnet box and cone
    const tk = w.agents!.start;
    P.add(rectPts(SPK.x - 60, SPK.y - 50, 40, 100), tk, tk + 0.2, 'plot', { pen: true, width: 2.4 });
    P.add([pt(SPK.x - 20, SPK.y - 50), pt(SPK.x + 60, SPK.y - 120), pt(SPK.x + 60, SPK.y + 120), pt(SPK.x - 20, SPK.y + 50)], tk + 0.2, tk + 0.45, 'plot', { pen: true, width: 2.4 });
    // sound rings on "speak"
    for (let i = 0; i < 3; i++) P.add(arc(SPK.x + 70, SPK.y, 70 + i * 55, -0.7, 0.7, 24), w.speak!.start + i * 0.08, w.speak!.start + 0.18 + i * 0.08, 'signal', { width: 3 });
    P.wp(pt(SPK.x + 260, SPK.y + 160), this.ctx.end - 0.1, 0.1);
    const K = this.cam;
    K.key(this.ctx.start, 230, -20, 1.2, 0.008);
    K.key(w.server!.end, 120, -10, 1.06, 0.004, ease.inOutCubic);
    K.key(w.agents!.start, -120, 0, 0.98, 0, ease.inOutCubic);
    K.key(this.ctx.end, -60, 0, 1.0, -0.004, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the server's face
    const sa = prog(t, w.server!.start, w.server!.start + 0.3);
    if (sa > 0) {
      setWorld(ctx, c, SRV.x + 24, SRV.y + 40);
      ctx.globalAlpha = sa;
      label(ctx, 'VOICESTUDIO BACKEND', 0, 0, { size: 19, col: rgba('ash', 1), spacing: 4 });
      ctx.font = font(F.mono(600), 34); ctx.fillStyle = rgba('bone', 1); ctx.fillText('127.0.0.1:3900', 0, 76);
      label(ctx, 'MCP AT /mcp  ·  LOCAL API', 0, 120, { size: 18, col: rgba('signal', 1), spacing: 3 });
      label(ctx, 'generate_speech · clone_voice', 0, 160, { size: 17, col: rgba('ash', 1), spacing: 1 });
      label(ctx, 'design_voice · transcribe', 0, 186, { size: 17, col: rgba('ash', 1), spacing: 1 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the agent's terminal
    const ta = prog(t, w.so!.start - 0.1, w.so!.start + 0.2, ease.outCubic);
    if (ta > 0) {
      drawWindow(ctx, c, TERM.x, TERM.y + (1 - ta) * 60, TERM.w, TERM.h, 'coding agent', { a: ta });
      const y0 = TERM.y + (1 - ta) * 60;
      const t0 = w.so!.start + 0.1;
      typed(ctx, c, '> read the test results out loud', TERM.x + 30, y0 + 110, t, t0, 0.55, { size: 26, col: 'bone' });
      typed(ctx, c, '● voicestudio · generate_speech', TERM.x + 30, y0 + 190, t, t0 + 0.65, 0.35, { size: 26, col: 'signal' });
      typed(ctx, c, '  text: "All 214 tests passed."', TERM.x + 30, y0 + 240, t, t0 + 1.0, 0.3, { size: 24, col: 'ash' });
      typed(ctx, c, '  → audio, played locally', TERM.x + 30, y0 + 290, t, w.speak!.start, 0.25, { size: 24, col: 'ash' });
      setWorld(ctx, c, TERM.x + 30, y0 + TERM.h - 26);
      label(ctx, 'ILLUSTRATION', 0, 0, { size: 14, col: rgba('graphite', ta), spacing: 4 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void mixCss; void clamp;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.so!.start + 0.75;
    packets(X, c, [pt(TERM.x + TERM.w, 0), pt(SRV.x, 0)], t, { t0, t1: t0 + 1.2, speed: 900, gap: 0.12, fadeIn: 0.1 });
    packets(X, c, [pt(SRV.x + SRV.w, 0), pt(SPK.x - 60, 0)], t, { t0: t0 + 0.4, t1: t0 + 1.6, speed: 900, gap: 0.12, fadeIn: 0.1 });
    // the link lines themselves
    const la = prog(t, t0 - 0.2, t0);
    if (la > 0) {
      for (const [a, b] of [[TERM.x + TERM.w, SRV.x], [SRV.x + SRV.w, SPK.x - 60]] as const) {
        const p0 = w2s(c, a, 0), p1 = w2s(c, b, 0);
        X.seg2(p0[0], p0[1], p1[0], p1[1], 1.2, lin('ash', 0.5 * la), 0.8);
      }
    }
    // the speaker talks with the narrator's own voice
    const sp = prog(t, w.speak!.start, w.speak!.start + 0.2);
    if (sp > 0) waveBars(X, c, SPK.x + 100, SPK.x + 260, SPK.y + 200, 40, 20, (u) => Math.max(voiceEnv(this.ctx.audio, t - (1 - u) * 0.5), 0.3 * speechEnv(u * 3 + t, 61)), { alpha: sp, I: 1.2 });
    burst(X, c, pt(SPK.x + 70, SPK.y), t, w.speak!.start, 30, 14, 0.5);
    void noise1;
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.speak!.start, 0.08);
    return { zoom: 1 + 0.015 * hit };
  }
}
