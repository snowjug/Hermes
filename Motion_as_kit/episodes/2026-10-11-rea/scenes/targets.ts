// TARGETS: "It also reads websites, .NET assemblies, Android APKs, even firmware."
// A 2 x 2 grid, one panel per target, each landing on its word: a browser window, a .NET badge, an
// Android phone with an APK file, a firmware chip with pins.
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, appWindow, label, sfx, halftone, INK, RED, YEL, SKY, GREEN, BLUE, ORANGE, BLOCK, clamp } from '@ep/comic';

export default class Targets extends Comic {
  build() {
    this.take('It also reads websites', ['also', 'reads', 'websites,', '.NET', 'assemblies,', 'Android', 'APKs,', 'even', 'firmware.']);
    const K = this.cam;
    K.key(this.ctx.start, -440, -330, 1.05, -0.004);
    K.key(this.w.net!.start - 0.1, -40, -330, 1.0, 0.0);
    K.key(this.w.android!.start - 0.15, -20, -150, 0.86, 0.002);
    K.key(this.ctx.end, 0, -140, 0.85, 0.004);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const P = (x: number, y: number, t0: number, fill: string, from: 'left' | 'right' | 'up' | 'down', draw: (g: CanvasRenderingContext2D) => void, dots?: string) =>
      panel(ctx, c, x, y, 860, 330, t, t0, { fill, from, dots, draw: (g) => draw(g) });
    P(-900, -500, this.ctx.start + 0.02, SKY, 'left', (g) => {
      appWindow(g, -300, -135, 600, 270, 'WEBSITES', { bar: YEL });
      g.fillStyle = '#E5E9F0'; g.fillRect(-260, -60, 300, 30); g.fillRect(-260, -10, 520, 22); g.fillRect(-260, 30, 460, 22); g.fillRect(-260, 70, 380, 22);
    }, 'rgba(31,95,209,0.25)');
    P(0, -500, w.net!.start - 0.12, '#7A4FD3', 'right', (g) => {
      g.font = font(BLOCK, 150); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = INK; g.strokeText('.NET', 0, 60); g.fillStyle = '#FFFFFF'; g.fillText('.NET', 0, 60); g.textAlign = 'left';
      label(g, 'ASSEMBLIES', 0, 130, 34, { fill: YEL });
    }, 'rgba(255,255,255,0.18)');
    P(-900, -140, w.android!.start - 0.12, GREEN, 'left', (g) => {
      g.lineWidth = 6; g.strokeStyle = INK; g.fillStyle = '#FFFFFF';
      g.beginPath(); g.roundRect(-330, -150, 170, 300, 24); g.fill(); g.stroke();
      g.fillStyle = '#B9F5C7'; g.fillRect(-315, -120, 140, 230);
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(-60, -140); g.lineTo(120, -140); g.lineTo(170, -90); g.lineTo(170, 140); g.lineTo(-60, 140); g.closePath(); g.fill(); g.stroke();
      g.font = font(BLOCK, 64); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('APK', 55, 30); g.textAlign = 'left';
      label(g, 'ANDROID', 280, -100, 34, { fill: YEL, rot: 0.05 });
    }, 'rgba(18,18,18,0.15)');
    P(0, -140, w.firmware!.start - 0.12, ORANGE, 'right', (g) => {
      g.fillStyle = '#2B2D33'; g.strokeStyle = INK; g.lineWidth = 6;
      g.beginPath(); g.roundRect(-130, -110, 260, 220, 14); g.fill(); g.stroke();
      g.fillStyle = '#C9CED6';
      for (let i = 0; i < 7; i++) { g.fillRect(-120 + i * 37, -138, 16, 28); g.fillRect(-120 + i * 37, 110, 16, 28); }
      g.font = font(F.mono(700), 30); g.fillStyle = '#FFD21F'; g.textAlign = 'center'; g.fillText('FIRMWARE', 0, 12); g.textAlign = 'left';
      halftone(g, -430, -190, 860, 380, 'rgba(255,255,255,0.12)', 3, 12);
    });
    void clamp; void RED; void BLUE;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    sfx(ctx, c, 'EVEN THAT?!', 0, -560, 80, t, this.w.even!.start, { fill: YEL, rot: -0.06 });
  }
}
