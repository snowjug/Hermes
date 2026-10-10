// ELECTRON: "An Electron or JavaScript app? It maps the modules, the imports, and the messages passed
// between processes."
// A wide panel: two app windows (RENDERER and MAIN). On "modules" a little map of module boxes grows in
// the left window; on "imports" ink arrows join them; on "messages" envelopes fly back and forth between
// the windows along a dashed line (ZIP!).
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, appWindow, inkArrow, sfx, label, INK, RED, YEL, SKY, PINK, BLOCK, clamp, ease } from '@ep/comic';

const MODS = [[-640, -110, 'app.js'], [-460, -10, 'ui.js'], [-640, 90, 'store.js'], [-460, 190, 'ipc.js']] as const;

function envelope(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath(); g.roundRect(-50, -32, 100, 64, 6); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-50, -32); g.lineTo(0, 6); g.lineTo(50, -32); g.stroke();
  g.restore();
}

export default class Electron extends Comic {
  build() {
    this.take('An Electron or JavaScript', ['Electron', 'JavaScript', 'app?', 'maps', 'modules,', 'imports,', 'messages', 'passed', 'between', 'processes.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -300, -100, 1.05, -0.004);
    K.key(w.messages!.start - 0.1, 0, -100, 0.96, 0.004);
    K.key(this.ctx.end, 20, -100, 0.98, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -980, -480, 1960, 760, t, this.ctx.start, {
      fill: '#FFFFFF', dots: 'rgba(31,95,209,0.16)', from: 'pop',
      draw: (g) => {
        appWindow(g, -900, -300, 760, 600, 'RENDERER', { bar: PINK });
        appWindow(g, 140, -300, 760, 600, 'MAIN PROCESS', { bar: SKY });
        // the module map
        MODS.forEach(([x, y, name], i) => {
          const t0 = w.modules!.start + i * 0.1;
          if (t < t0) return;
          const k = ease.outBack(clamp((t - t0) / 0.25));
          g.save(); g.translate(x + 60, y); g.scale(k, k); label(g, name, 0, 0, 30, { fill: YEL }); g.restore();
        });
        const ki = clamp((t - w.imports!.start) / 0.5);
        inkArrow(g, -580, -80, -490, -40, ki * 3, { width: 6 });
        inkArrow(g, -520, 20, -580, 60, ki * 3 - 1, { width: 6 });
        inkArrow(g, -580, 120, -490, 160, ki * 3 - 2, { width: 6 });
        // the IPC lane
        if (t > w.messages!.start - 0.1) {
          g.setLineDash([22, 16]); g.lineWidth = 6; g.strokeStyle = INK;
          g.beginPath(); g.moveTo(-160, 40); g.lineTo(180, 40); g.stroke(); g.setLineDash([]);
          for (let i = 0; i < 4; i++) {
            const ph = ((t - w.messages!.start) * 0.9 + i * 0.25) % 1;
            const dir = i % 2 ? -1 : 1;
            const x = dir > 0 ? -160 + 340 * ph : 180 - 340 * ph;
            envelope(g, x, 40 - Math.sin(Math.PI * ph) * 120 * dir, 0.9, i % 2 ? YEL : '#FFFFFF');
          }
        }
        g.font = font(F.mono(700), 30); g.fillStyle = INK;
        if (t > w.processes!.start) { g.fillText('ipcRenderer.send(...)', -860, 260); g.fillText('ipcMain.on(...)', 200, 260); }
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    sfx(ctx, c, 'ZIP!', 0, -330, 110, t, this.w.passed!.start, { fill: YEL, rot: -0.14, burst: RED });
    void BLOCK;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.messages!.start, 0.012) }; }
}
