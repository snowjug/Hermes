// SETUP: "Setup is a single npx command that backs up your agent's config first, and the analysis runs on
// your own machine."
// A terminal panel types `npx rea-agents setup`, then BACKED UP YOUR AGENT CONFIG and REA ADDED TO YOUR
// AGENT. On "runs on your own machine" a second panel: a laptop inside a house outline with a padlock,
// labelled RUNS LOCALLY.
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { Comic, panel, codeCard, label, sfx, INK, RED, YEL, SKY, GREEN, BLOCK, clamp, ease } from '@ep/comic';

export default class Setup extends Comic {
  build() {
    this.take('Setup is a single', ['Setup', 'single', 'npx', 'command', 'backs', "agent's", 'config', 'analysis', 'runs', 'own', 'machine.']);
    const K = this.cam;
    K.key(this.ctx.start, -380, -110, 1.06, -0.004);
    K.key(this.w.analysis!.start - 0.1, 140, -110, 1.0, 0.004);
    K.key(this.ctx.end, 180, -110, 1.03, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -980, -470, 1000, 720, t, this.ctx.start, {
      fill: GREEN, dots: 'rgba(18,18,18,0.16)', from: 'left',
      draw: (g) => {
        codeCard(g, -440, -260, 880, [['$ npx rea-agents setup', '#FFD21F'], ['', ''], ['backed up your agent config', '#7FD18B'], ['REA added to your agent', '#7FD18B'], ['restart your agent', '#E6E6E6']],
          t, w.npx!.start, Math.max(1.2, w.config!.end - w.npx!.start), { size: 34, title: 'ONE COMMAND' });
      },
    });
    panel(ctx, c, 80, -470, 900, 720, t, w.analysis!.start - 0.15, {
      fill: SKY, dots: 'rgba(31,95,209,0.2)', from: 'right',
      draw: (g) => {
        const k = ease.outBack(clamp((t - w.runs!.start) / 0.3));
        g.save(); g.scale(Math.max(0.01, k), Math.max(0.01, k));
        g.strokeStyle = INK; g.lineWidth = 8; g.fillStyle = '#FFF6D6';
        g.beginPath(); g.moveTo(-300, -40); g.lineTo(0, -280); g.lineTo(300, -40); g.lineTo(240, -40); g.lineTo(240, 220); g.lineTo(-240, 220); g.lineTo(-240, -40); g.closePath(); g.fill(); g.stroke();
        // the laptop
        g.fillStyle = '#2B2D33'; g.beginPath(); g.roundRect(-150, -40, 300, 180, 12); g.fill(); g.stroke();
        g.fillStyle = '#7EC8F2'; g.fillRect(-130, -22, 260, 140);
        g.fillStyle = '#9AA3B2'; g.beginPath(); g.moveTo(-190, 140); g.lineTo(190, 140); g.lineTo(220, 180); g.lineTo(-220, 180); g.closePath(); g.fill(); g.stroke();
        g.font = font(BLOCK, 40); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('REA', 0, 60); g.textAlign = 'left';
        g.restore();
        if (t > w.own!.start) label(g, 'RUNS LOCALLY', 0, 290, 50, { fill: YEL, rot: -0.02 });
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    sfx(ctx, c, 'DONE!', -150, 200, 90, t, this.w.config!.end, { fill: YEL, rot: -0.1 });
    void RED;
  }
}
