// BUILD: "Then your agent can explain the feature, or build a version of it for your own project."
// The detective explains (speech balloon: HERE'S HOW IT WORKS); on "build" a blueprint panel draws the
// feature in white lines, and on "your own project" an app window labelled YOUR PROJECT lands with the
// feature lit up (TA-DA!).
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { Comic, panel, agent, balloon, sfx, appWindow, inkArrow, star, INK, YEL, BLUE, GREEN, BLOCK, clamp } from '@ep/comic';

export default class Build extends Comic {
  build() {
    this.take('Then your agent can explain', ['agent', 'explain', 'feature,', 'build', 'version', 'own', 'project.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -460, -110, 1.06, -0.004);
    K.key(w.build!.start - 0.1, -200, -110, 0.9, 0.002);
    K.key(w.own!.start - 0.1, 0, -110, 0.88, 0.004);
    K.key(this.ctx.end, 20, -110, 0.9, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -1000, -470, 620, 720, t, this.ctx.start, {
      fill: '#FFE7A8', dots: 'rgba(242,134,46,0.35)', from: 'left',
      draw: (g) => { agent(g, 0, 120, 1.2, t, { mouth: 'o', look: -0.4 }); },
    });
    panel(ctx, c, -340, -470, 600, 720, t, w.build!.start - 0.12, {
      fill: BLUE, from: 'up',
      draw: (g) => {
        g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2;
        for (let x = -300; x <= 300; x += 40) { g.beginPath(); g.moveTo(x, -360); g.lineTo(x, 360); g.stroke(); }
        for (let y = -360; y <= 360; y += 40) { g.beginPath(); g.moveTo(-300, y); g.lineTo(300, y); g.stroke(); }
        const k = clamp((t - w.build!.start) / 0.8);
        g.strokeStyle = '#FFFFFF'; g.lineWidth = 5; g.setLineDash([16, 10]);
        g.beginPath(); g.roundRect(-220, -200, 440 * Math.min(1, k * 1.5), 360 * Math.min(1, k * 1.5), 14); g.stroke();
        g.setLineDash([]); g.beginPath(); g.roundRect(-170, -130, 340 * clamp(k * 2 - 0.6), 70, 35); g.stroke();
        g.font = font(BLOCK, 40); g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.fillText('BLUEPRINT', 0, 250); g.textAlign = 'left';
      },
    });
    panel(ctx, c, 320, -470, 700, 720, t, w.own!.start - 0.15, {
      fill: GREEN, dots: 'rgba(18,18,18,0.15)', from: 'right',
      draw: (g) => {
        appWindow(g, -290, -230, 580, 440, 'YOUR PROJECT');
        g.fillStyle = YEL; g.beginPath(); g.roundRect(-210, -130, 420, 76, 38); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
        g.font = font(BLOCK, 32); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('YOUR VERSION', 0, -80); g.textAlign = 'left';
        g.fillStyle = '#E9EEF5'; for (let i = 0; i < 3; i++) g.fillRect(-230, -10 + i * 52, 380 - i * 70, 26);
        for (let i = 0; i < 4; i++) star(g, -250 + i * 165, 270 - (i % 2) * 40, 22, YEL);
      },
    });
    const k = clamp((t - w.build!.start + 0.2) / 0.4);
    if (k > 0) {
      ctx.save();
      ctx.setTransform(c.z, 0, 0, c.z, 960 - c.cx * c.z, 540 - c.cy * c.z);
      inkArrow(ctx, -420, 300, -330, 300, k, { width: 10 });
      inkArrow(ctx, 270, 300, 340, 300, clamp((t - w.own!.start + 0.2) / 0.3), { width: 10 });
      ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    balloon(ctx, c, -560, -330, ["HERE'S HOW", 'IT WORKS!'], t, w.explain!.start - 0.05, { size: 46, tail: [-110, 150] });
    sfx(ctx, c, 'TA-DA!', 700, 230, 96, t, w.project!.start, { fill: YEL, rot: -0.1, burst: '#FFFFFF' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.project!.start, 0.015) }; }
}
