// AGENT: "REA lets your AI agent find out, without the source code."
// REA lands as a red block title. The detective (your AI agent) steps into a big panel and raises his
// magnifying glass on "find out"; beside him a SOURCE CODE file gets a fat red NOT NEEDED stamp on
// "without".
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { Comic, panel, agent, title, sfx, label, speedLines, INK, RED, YEL, BLUE, BLOCK, clamp, ease } from '@ep/comic';

export default class Agent extends Comic {
  build() {
    this.take('REA lets your AI agent', ['REA', 'lets', 'agent', 'find', 'out,', 'without', 'source', 'code.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -200, -100, 1.08, -0.006);
    K.key(w.find!.start, -120, -80, 1.0, 0);
    K.key(this.ctx.end, 40, -80, 1.02, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -900, -420, 1000, 660, t, this.ctx.start, {
      fill: YEL, dots: 'rgba(242,134,46,0.45)', from: 'left',
      draw: (g) => {
        speedLines(g, 0, 0, 260, 800, 40, 9, '#FFFFFF', 0.5);
        const glass = ease.inOutCubic(clamp((t - w.find!.start) / 0.35));
        agent(g, -20, 60, 1.45, t, { glass, look: 0.6 * glass, mouth: glass > 0.5 ? 'o' : 'smile' });
      },
    });
    panel(ctx, c, 160, -420, 740, 660, t, w.agent!.start, {
      fill: '#FFFFFF', dots: 'rgba(31,95,209,0.18)', from: 'right', rot: 0.01,
      draw: (g) => {
        // a file of source code
        g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 6;
        g.beginPath(); g.moveTo(-200, -250); g.lineTo(120, -250); g.lineTo(200, -170); g.lineTo(200, 230); g.lineTo(-200, 230); g.closePath(); g.fill(); g.stroke();
        g.font = font(BLOCK, 40); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('SOURCE CODE', 0, -170); g.textAlign = 'left';
        g.fillStyle = '#C9D3E2'; for (let i = 0; i < 8; i++) g.fillRect(-160 + (i % 3) * 18, -120 + i * 40, 280 - (i % 4) * 50, 18);
        const k = clamp((t - w.without!.start) / 0.3);
        if (k > 0) { g.strokeStyle = RED; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(-220, -260); g.lineTo(-220 + 440 * Math.min(1, k * 2), -260 + 520 * Math.min(1, k * 2)); g.stroke(); if (k > 0.5) { g.beginPath(); g.moveTo(220, -260); g.lineTo(220 - 440 * (k - 0.5) * 2, -260 + 520 * (k - 0.5) * 2); g.stroke(); } g.lineCap = 'butt'; }
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'REA', -620, -300, 150, t, w.rea!.start - 0.05, { fill: RED, stroke: YEL, rot: -0.06 });
    sfx(ctx, c, 'NOT NEEDED!', 540, 120, 76, t, w.source!.start, { fill: RED, rot: -0.1 });
    void label; void BLUE;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.rea!.start, 0.015) * this.punch(t, this.w.source!.start, 0.02) }; }
}
