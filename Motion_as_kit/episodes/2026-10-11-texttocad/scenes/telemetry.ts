// TELEMETRY: "The catch: by default it sends usage stats, never your files or prompts. One command turns that off."
// THE CATCH. Little "stats" packets stream from the laptop to a cloud; your STEP file and your prompt sit below
// with a red cross: never sent. On "One command" a terminal types `uvx cadgen telemetry off`; the stream stops.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, gear } from '@kit/_cad3d';
import { Viewport, headline, panel, fileChip, tag, BODY, MONO, SOFT, ORANGE, BLUE, GREEN, RED, WHITE, PART, clamp, ease, lerp, TAU } from '@ep/viewport';

const CMD = 'uvx cadgen telemetry off';

export default class Telemetry extends Viewport {
  build() {
    this.take('The catch', ['catch:', 'default', 'sends', 'usage', 'stats,', 'never', 'files', 'prompts.', 'One', 'command', 'off.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -20, 1.04, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the laptop
    setWorld(ctx, c, -560, -40, 1, 0);
    ctx.fillStyle = '#2A313C'; ctx.beginPath(); ctx.roundRect(-190, -150, 380, 250, 16); ctx.fill();
    ctx.fillStyle = '#0E1218'; ctx.fillRect(-172, -132, 344, 214);
    ctx.fillStyle = '#3B4452'; ctx.beginPath(); ctx.moveTo(-230, 100); ctx.lineTo(230, 100); ctx.lineTo(250, 124); ctx.lineTo(-250, 124); ctx.closePath(); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawParts(ctx, c, -560, -20, { yaw: t * 0.8, pitch: 0.55, dist: 900, s: 2.6, target: [0, 0, 5] }, [{ mesh: gear(18, 30, 10, PART) }], { shadow: 0 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    headline(ctx, c, 'THE CATCH', -560, -360, 110, t, this.ctx.start + 0.02, { col: WHITE });
    const off = t > w.off!.start + 0.1;
    // the cloud
    const ck = clamp((t - w.sends!.start + 0.2) / 0.25);
    setWorld(ctx, c, 520, -140, 1, 0);
    ctx.globalAlpha = ck * (off ? 0.35 : 1);
    ctx.fillStyle = off ? '#3B4452' : 'rgba(61,139,255,0.9)';
    for (const [x, y, r] of [[-70, 10, 60], [0, -20, 80], [80, 10, 60], [0, 30, 60]] as [number, number, number][]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#FFFFFF'; ctx.font = font(BODY, 28); ctx.textAlign = 'center'; ctx.fillText('usage stats', 0, 18);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the packets
    if (t > w.sends!.start) {
      const stop = w.off!.start + 0.1;
      for (let i = 0; i < 9; i++) {
        const born = w.sends!.start + i * 0.32;
        const tt = Math.min(t, stop + 3);
        const k = ((tt - born) / 1.6);
        if (k < 0 || k > 1) continue;
        if (t > stop && born + 0 > stop) continue;
        const x = lerp(-360, 420, k), y = lerp(-80, -140, k) - Math.sin(k * Math.PI) * 120;
        tag(ctx, c, 'stats', x, y, 22, { a: (t > stop ? clamp(1 - (t - stop) / 0.3) : 1) * clamp(k * 6) * clamp((1 - k) * 6), bg: 'rgba(255,194,75,0.95)', fg: '#0D1117', mono: true });
      }
    }
    // never sent
    const nk = clamp((t - w.never!.start) / 0.2);
    if (nk > 0) {
      fileChip(ctx, c, 300, 30, 'STEP', { col: BLUE, a: nk, s: 0.7, name: 'your file' });
      setWorld(ctx, c, 600, 30, 0.9, 0);
      ctx.globalAlpha = clamp((t - w.prompts!.start + 0.1) / 0.2);
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.roundRect(-140, -46, 280, 92, 22); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = font(BODY, 26); ctx.fillText('a wall bracket…', -116, 9);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tag(ctx, c, 'NEVER SENT ✗', 460, 150, 30, { a: clamp((t - w.prompts!.start) / 0.15), bg: 'rgba(255,90,95,0.95)' });
    }
    // the terminal
    const ta = clamp((t - w.one!.start + 0.15) / 0.25);
    if (ta > 0) {
      panel(ctx, c, -340, 200, 680, 140, 'terminal', { a: ta, accent: off ? GREEN : ORANGE });
      const n = Math.ceil(CMD.length * clamp((t - w.command!.start) / Math.max(0.5, w.off!.start - w.command!.start)));
      setWorld(ctx, c, -310, 300, 1, 0);
      ctx.globalAlpha = ta; ctx.font = font(MONO, 32);
      ctx.fillStyle = GREEN; ctx.fillText('$', 0, 0);
      ctx.fillStyle = WHITE; ctx.fillText(CMD.slice(0, n), 36, 0);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tag(ctx, c, 'TELEMETRY OFF ✓', 520, -290, 34, { a: clamp((t - w.off!.start - 0.15) / 0.15), bg: 'rgba(54,211,153,0.95)', fg: '#0D1117' });
    }
    void SOFT; void RED; void ease;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.ctx.start + 0.05, 0.02) }; }
}
