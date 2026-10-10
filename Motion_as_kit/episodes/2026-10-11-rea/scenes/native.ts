// NATIVE: "Point it at a native program, and it pulls out the assembly, pseudocode, strings and symbols,
// with Ghidra, Hopper or IDA doing the heavy lifting."
// A strip of three panels the camera tracks across: PROGRAM.EXE as a wall of hex bytes; on "assembly" a
// code card of x86 instructions; on "pseudocode" a C-like card, with STRINGS and SYMBOLS tags landing on
// their words. On "Ghidra, Hopper or IDA" three engine badges stamp in along the bottom.
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, codeCard, label, sfx, halftone, INK, RED, YEL, SKY, BLUE, ORANGE, GREEN, BLOCK, clamp, ease, hash } from '@ep/comic';

export default class Native extends Comic {
  build() {
    this.take('Point it at a native', ['Point', 'native', 'program,', 'pulls', 'assembly,', 'pseudocode,', 'strings', 'symbols,', 'Ghidra,', 'Hopper', 'IDA', 'heavy', 'lifting.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -700, -110, 1.1, -0.006);
    K.key(w.assembly!.start - 0.15, -60, -110, 1.04, 0);
    K.key(w.pseudocode!.start - 0.15, 560, -110, 1.04, 0.004);
    K.key(w.ghidra!.start - 0.15, 0, -40, 0.78, 0);
    K.key(this.ctx.end, 0, -40, 0.8, 0.004);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -1180, -500, 620, 640, t, this.ctx.start, {
      fill: '#FFFFFF', dots: 'rgba(31,95,209,0.2)', from: 'left',
      draw: (g) => {
        g.font = font(BLOCK, 44); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('PROGRAM.EXE', 0, -240); g.textAlign = 'left';
        g.font = font(F.mono(700), 30);
        for (let r = 0; r < 9; r++) for (let q = 0; q < 6; q++) {
          const v = Math.floor(hash(r * 7 + q, 3) * 256).toString(16).toUpperCase().padStart(2, '0');
          const lit = (r * 6 + q) < 2 ? true : hash(r, q) > 0.8;
          g.fillStyle = lit ? RED : '#3B4252';
          g.fillText(r === 0 && q === 0 ? '4D' : r === 0 && q === 1 ? '5A' : v, -250 + q * 88, -160 + r * 46);
        }
      },
    });
    panel(ctx, c, -520, -500, 640, 640, t, w.assembly!.start - 0.12, {
      fill: SKY, dots: 'rgba(18,18,18,0.15)', from: 'up',
      draw: (g) => {
        codeCard(g, -280, -250, 560, [['push   ebp', '#7EC8F2'], ['mov    ebp, esp', '#7EC8F2'], ['mov    eax, [ebp+8]', '#E6E6E6'], ['sub    eax, 320', '#E6E6E6'], ['imul   eax, 100', '#E6E6E6'], ['call   SetPan', '#FFD21F'], ['pop    ebp', '#7EC8F2'], ['ret', '#7EC8F2']], t, w.assembly!.start, 1.2, { size: 30, title: 'ASSEMBLY' });
      },
    });
    panel(ctx, c, 160, -500, 760, 640, t, w.pseudocode!.start - 0.12, {
      fill: YEL, dots: 'rgba(242,134,46,0.4)', from: 'right',
      draw: (g) => {
        codeCard(g, -340, -250, 680, [['int pan(int x) {', '#FFD21F'], ['  int d = x - 320;', '#E6E6E6'], ['  return d * 100 / 320;', '#E6E6E6'], ['}', '#FFD21F']], t, w.pseudocode!.start, 1.0, { size: 32, title: 'PSEUDOCODE' });
        if (t > w.strings!.start) label(g, 'STRINGS: "sound.wav"', -120, 150, 34, { fill: '#FFFFFF', rot: -0.03 });
        if (t > w.symbols!.start) label(g, 'SYMBOLS: SetPan', 140, 240, 34, { fill: '#FFFFFF', rot: 0.03 });
      },
    });
    // the engines
    const eng: [string, string, string][] = [['ghidra', 'GHIDRA', RED], ['hopper', 'HOPPER', ORANGE], ['ida', 'IDA', BLUE]];
    eng.forEach(([k, name, col], i) => {
      panel(ctx, c, -760 + i * 520, 165, 460, 150, t, w[k]!.start - 0.05, {
        fill: col, from: 'down',
        draw: (g, ww, hh) => {
          halftone(g, -ww / 2, -hh / 2, ww, hh, 'rgba(255,255,255,0.25)', 3, 11);
          g.font = font(BLOCK, 70); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = INK; g.strokeText(name, 0, 25); g.fillStyle = '#FFFFFF'; g.fillText(name, 0, 25); g.textAlign = 'left';
        },
      });
    });
    void GREEN; void clamp; void ease;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    sfx(ctx, c, 'HEAVE!', 760, 140, 80, t, this.w.heavy!.start, { fill: YEL, rot: 0.1 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.ghidra!.start, 0.012) }; }
}
