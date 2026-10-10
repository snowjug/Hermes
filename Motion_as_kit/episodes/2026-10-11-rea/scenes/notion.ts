// NOTION: "Another traces how Notion's clipboard works, from the window, through the bridge, into the main
// process."
// CASE FILE: NOTION. Three panels in a row, joined by ink arrows: THE WINDOW (a page with a copy icon),
// THE BRIDGE (preload), THE MAIN PROCESS (a gear). A clipboard icon travels the chain word by word.
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, inkArrow, title, sfx, appWindow, label, INK, RED, YEL, SKY, PINK, GREEN, BLOCK, clamp, ease, TAU } from '@ep/comic';

function clipboard(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#C08A4A'; g.strokeStyle = INK; g.lineWidth = 6;
  g.beginPath(); g.roundRect(-60, -80, 120, 160, 10); g.fill(); g.stroke();
  g.fillStyle = '#FFFFFF'; g.fillRect(-45, -55, 90, 120); g.strokeRect(-45, -55, 90, 120);
  g.fillStyle = '#9AA3B2'; g.beginPath(); g.roundRect(-28, -94, 56, 30, 8); g.fill(); g.stroke();
  g.fillStyle = '#C9D3E2'; for (let i = 0; i < 4; i++) g.fillRect(-32, -35 + i * 24, 64 - (i % 2) * 18, 10);
  g.restore();
}
function gear(g: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = '#9AA3B2'; g.strokeStyle = INK; g.lineWidth = 6;
  g.beginPath();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, rr = i % 2 ? r : r * 1.22; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, r * 0.4, 0, TAU); g.fill(); g.stroke();
  g.restore();
}

const PX = [-960, -300, 360];

export default class Notion extends Comic {
  build() {
    this.take('Another traces how', ['traces', "Notion's", 'clipboard', 'works,', 'window,', 'through', 'bridge,', 'main', 'process.']);
    const K = this.cam;
    K.key(this.ctx.start, -420, -110, 1.04, -0.004);
    K.key(this.w.bridge!.start - 0.1, -10, -110, 0.9, 0);
    K.key(this.ctx.end, 120, -110, 0.92, 0.004);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const stops = [w.window!.start, w.bridge!.start, w.main!.start];
    panel(ctx, c, PX[0]!, -440, 600, 640, t, this.ctx.start, {
      fill: PINK, dots: 'rgba(229,50,43,0.2)', from: 'left',
      draw: (g) => { appWindow(g, -240, -200, 480, 330, 'THE WINDOW'); g.font = font(F.mono(600), 26); g.fillStyle = INK; g.fillText('Ctrl+C', -200, 60); label(g, 'RENDERER', 0, 230, 36, { fill: YEL }); },
    });
    panel(ctx, c, PX[1]!, -440, 600, 640, t, stops[1]! - 0.15, {
      fill: YEL, dots: 'rgba(242,134,46,0.35)', from: 'up',
      draw: (g) => {
        g.strokeStyle = INK; g.lineWidth = 8; g.fillStyle = '#B87333';
        g.beginPath(); g.moveTo(-230, 60); g.quadraticCurveTo(0, -140, 230, 60); g.lineTo(230, 100); g.quadraticCurveTo(0, -90, -230, 100); g.closePath(); g.fill(); g.stroke();
        for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 60, -60 + Math.abs(i) * 18); g.lineTo(i * 60, 70 + Math.abs(i) * 4); g.stroke(); }
        g.font = font(BLOCK, 52); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('THE BRIDGE', 0, -180); g.textAlign = 'left';
        label(g, 'PRELOAD + IPC', 0, 230, 36, { fill: '#FFFFFF' });
      },
    });
    panel(ctx, c, PX[2]!, -440, 600, 640, t, stops[2]! - 0.15, {
      fill: SKY, dots: 'rgba(31,95,209,0.2)', from: 'right',
      draw: (g) => {
        gear(g, -60, -30, 110, t * 1.5); gear(g, 110, 90, 70, -t * 2.2);
        g.font = font(BLOCK, 52); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('MAIN PROCESS', 0, -210); g.textAlign = 'left';
        label(g, 'RICH CLIPBOARD FORMAT', 0, 230, 32, { fill: YEL });
      },
    });
    // arrows and the travelling clipboard (world coords)
    ctx.save();
    ctx.setTransform(c.z, 0, 0, c.z, 960 - c.cx * c.z, 540 - c.cy * c.z);
    inkArrow(ctx, -350, -120, -290, -120, clamp((t - stops[1]! + 0.2) / 0.25), { width: 10 });
    inkArrow(ctx, 310, -120, 370, -120, clamp((t - stops[2]! + 0.2) / 0.25), { width: 10 });
    const seg = t < stops[1]! ? 0 : t < stops[2]! ? 1 : 2;
    const from = seg === 0 ? PX[0]! + 300 : PX[seg - 1]! + 300, to = PX[seg]! + 300;
    const tk = seg === 0 ? 1 : ease.inOutCubic(clamp((t - stops[seg]!) / 0.4));
    if (t > w.clipboard!.start) clipboard(ctx, from + (to - from) * tk, -330 - Math.sin(Math.PI * tk) * 60, 0.9);
    ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    void RED; void GREEN;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'CASE FILE: NOTION', -560, -500, 64, t, w.notions!.start - 0.05, { fill: YEL, stroke: INK, rot: -0.02 });
    sfx(ctx, c, 'COPY!', -380, 120, 80, t, w.clipboard!.start, { fill: YEL, rot: -0.12 });
  }
}
