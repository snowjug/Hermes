// CATCH: "The catch: deep native analysis needs Ghidra, Hopper or IDA installed. And your AI provider still
// sees the results." / "So only take apart software you're allowed to."
// THE CATCH as a block title. Panel one: the three engines as badges, REQUIRED FOR NATIVE. Panel two: a cloud
// (YOUR AI PROVIDER) with an eye peering at a results page. Then a full-width warning panel: a yellow
// hazard sign and ONLY TAKE APART SOFTWARE YOU'RE ALLOWED TO, the detective with a serious face.
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { Comic, panel, title, label, agent, halftone, INK, RED, YEL, SKY, BLUE, ORANGE, BLOCK, clamp, ease, TAU } from '@ep/comic';

export default class Catch extends Comic {
  build() {
    this.take('The catch', ['catch:', 'deep', 'native', 'Ghidra,', 'Hopper', 'IDA', 'installed.', 'provider', 'sees', 'results.']);
    this.take('So only take apart', ['only', 'take', 'apart', 'software', 'allowed']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -400, -120, 1.02, -0.004);
    K.key(w.provider!.start - 0.2, 320, -120, 1.0, 0.004);
    K.key(w.results!.end + 0.05, 320, -120, 1.0, 0.004);
    K.key(w.only!.start - 0.3, 0, 760, 0.98, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 770, 1.02, 0.004);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -960, -380, 900, 620, t, w.deep!.start - 0.15, {
      fill: '#FFFFFF', dots: 'rgba(229,50,43,0.18)', from: 'left',
      draw: (g) => {
        g.font = font(BLOCK, 44); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('DEEP NATIVE ANALYSIS NEEDS', 0, -200); g.textAlign = 'left';
        if (t < w.ghidra!.start - 0.05) { g.font = font(BLOCK, 160); g.fillStyle = 'rgba(18,18,18,0.12)'; g.textAlign = 'center'; g.fillText('? ? ?', 0, 60); g.textAlign = 'left'; }
        const eng: [string, string, string][] = [['ghidra', 'GHIDRA', RED], ['hopper', 'HOPPER', ORANGE], ['ida', 'IDA', BLUE]];
        eng.forEach(([k, name, col], i) => { if (t > w[k]!.start - 0.05) label(g, name, -200 + i * 200, -60 + (i % 2) * 90, 52, { fill: col, col: '#FFFFFF', rot: (i - 1) * 0.06 }); });
        if (t > w.installed!.start) label(g, 'REQUIRED FOR NATIVE CODE', 0, 200, 40, { fill: YEL });
      },
    });
    panel(ctx, c, -20, -420, 980, 660, t, w.provider!.start - 0.15, {
      fill: SKY, dots: 'rgba(31,95,209,0.22)', from: 'right',
      draw: (g) => {
        // cloud
        g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 7;
        g.beginPath();
        [[-150, -90, 90], [-40, -150, 110], [100, -110, 95], [180, -40, 70], [-210, -20, 70]].forEach(([x, y, r]) => { g.moveTo(x! + r!, y!); g.arc(x!, y!, r!, 0, TAU); });
        g.fill(); g.stroke();
        g.beginPath(); g.roundRect(-260, -60, 500, 110, 50); g.fill();
        // the eye
        const look = Math.sin(t * 1.4) * 10;
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(-10, -60, 70, 40, 0, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = BLUE; g.beginPath(); g.arc(-10 + look, -50, 24, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(-10 + look, -50, 11, 0, TAU); g.fill();
        label(g, 'YOUR AI PROVIDER', 0, 90, 40, { fill: YEL });
        // the results page
        const k = clamp((t - w.sees!.start) / 0.3);
        if (k > 0) {
          g.save(); g.translate(250, 170); g.rotate(0.08); g.scale(k, k);
          g.fillStyle = '#FFFFFF'; g.fillRect(-90, -70, 180, 140); g.strokeRect(-90, -70, 180, 140);
          g.font = font(BLOCK, 30); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('RESULTS', 0, -25); g.textAlign = 'left';
          g.fillStyle = '#C9D3E2'; for (let i = 0; i < 3; i++) g.fillRect(-60, 0 + i * 20, 120 - i * 20, 10);
          g.restore();
        }
      },
    });
    panel(ctx, c, -960, 420, 1920, 700, t, w.only!.start - 0.35, {
      fill: YEL, from: 'up',
      draw: (g) => {
        halftone(g, -960, -350, 1920, 700, 'rgba(18,18,18,0.12)', 3.5, 13);
        // hazard stripes
        g.save(); g.beginPath(); g.rect(-960, -350, 1920, 60); g.rect(-960, 290, 1920, 60); g.clip();
        g.fillStyle = INK; for (let x = -1100; x < 1000; x += 80) { g.beginPath(); g.moveTo(x, -350); g.lineTo(x + 40, -350); g.lineTo(x + 100, 350); g.lineTo(x + 60, 350); g.closePath(); g.fill(); }
        g.restore();
        // the sign
        g.save(); g.translate(-560, 10);
        g.fillStyle = YEL; g.strokeStyle = INK; g.lineWidth = 14; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(0, -200); g.lineTo(200, 160); g.lineTo(-200, 160); g.closePath(); g.fill(); g.stroke();
        g.font = font(BLOCK, 220); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('!', 0, 130); g.textAlign = 'left';
        g.restore();
        g.font = font(BLOCK, 76); g.fillStyle = INK;
        const k = clamp((t - w.take!.start) / 0.2);
        if (k > 0) { g.fillText('ONLY TAKE APART', -260, -40); }
        if (t > w.allowed!.start - 0.1) { g.fillStyle = RED; g.fillText("WHAT YOU'RE ALLOWED TO", -260, 60); }
        agent(g, 680, 110, 0.8, t, { mouth: 'flat' });
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    title(ctx, c, 'THE CATCH', -450, -440, 130, t, this.w.catch!.start - 0.05, { fill: RED, stroke: YEL, rot: -0.03 });
  }
}
