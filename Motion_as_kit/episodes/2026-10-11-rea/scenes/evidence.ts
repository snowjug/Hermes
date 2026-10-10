// EVIDENCE: "Every answer comes with its evidence: the code it found, and what it still doesn't know."
// The detective, lens up, beside an evidence board: a manila folder stamped EVIDENCE with a clipped code
// snippet (on "code it found"), and a sticky note headed UNKNOWNS with question marks (on "doesn't know").
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, agent, sfx, codeCard, INK, RED, YEL, BLOCK, clamp, ease } from '@ep/comic';

export default class Evidence extends Comic {
  build() {
    this.take('Every answer comes', ['answer', 'evidence:', 'code', 'found,', 'still', "doesn't", 'know.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -360, -110, 1.08, -0.006);
    K.key(w.code!.start - 0.1, 120, -110, 1.02, 0.002);
    K.key(w.still!.start - 0.1, 300, -110, 1.04, 0.004);
    K.key(this.ctx.end, 320, -110, 1.06, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -980, -470, 640, 720, t, this.ctx.start, {
      fill: '#F2E3C6', dots: 'rgba(107,74,46,0.25)', from: 'left',
      draw: (g) => { agent(g, 0, 90, 1.25, t, { glass: 1, look: 0.8, mouth: 'flat' }); },
    });
    panel(ctx, c, -280, -470, 1260, 720, t, w.evidence!.start - 0.15, {
      fill: '#8B6B4A', dots: 'rgba(18,18,18,0.2)', from: 'right',
      draw: (g) => {
        // the folder
        g.fillStyle = '#E8C57A'; g.strokeStyle = INK; g.lineWidth = 6;
        g.beginPath(); g.moveTo(-560, -250); g.lineTo(-330, -250); g.lineTo(-300, -220); g.lineTo(80, -220); g.lineTo(80, 260); g.lineTo(-560, 260); g.closePath(); g.fill(); g.stroke();
        g.font = font(BLOCK, 44); g.fillStyle = RED; g.save(); g.translate(-240, -150); g.rotate(-0.06);
        g.strokeStyle = RED; g.lineWidth = 6; g.strokeRect(-150, -46, 300, 66); g.fillText('EVIDENCE', -130, 6); g.restore();
        if (t > w.code!.start - 0.05) codeCard(g, -520, -60, 560, [['// found in main.js:1408', '#8C93A3'], ['clipboard.write(rich)', '#FFD21F'], ['ipc.send("copy", fmt)', '#E6E6E6']], t, w.code!.start, 0.8, { size: 26 });
        // the sticky note
        if (t > w.still!.start - 0.1) {
          const k = ease.outBack(clamp((t - w.still!.start + 0.1) / 0.3));
          g.save(); g.translate(330, 20); g.rotate(0.06); g.scale(k, k);
          g.fillStyle = INK; g.fillRect(-190 + 8, -200 + 8, 380, 400);
          g.fillStyle = YEL; g.fillRect(-190, -200, 380, 400); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-190, -200, 380, 400);
          g.font = font(BLOCK, 50); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('UNKNOWNS', 0, -120);
          g.font = font(F.archivoItalic(80, 800), 120); g.fillStyle = RED; g.fillText('? ? ?', 0, 60);
          g.font = font(F.mono(600), 26); g.fillStyle = INK; g.fillText('not proven yet', 0, 140); g.textAlign = 'left';
          g.restore();
        }
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    sfx(ctx, c, 'GOTCHA!', -160, -330, 90, t, this.w.found!.start, { fill: YEL, rot: -0.12 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.found!.start, 0.015) }; }
}
