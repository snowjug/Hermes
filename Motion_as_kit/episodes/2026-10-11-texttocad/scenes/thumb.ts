// THUMB: the thumbnail, rendered as a still after the end of the timeline
// (node scripts/render-node.mjs stills --only thumb --t <duration + 2>).
// The viewport: a prompt bubble on the left, an arrow, and a gear mid-print on the right with its glowing top
// layer under the nozzle. TYPE IT. PRINT IT. in huge type. The title says what it is; the thumbnail shows it.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, gear } from '@kit/_cad3d';
import { Viewport, nozzle, at3, HEAD, BODY, WHITE, ORANGE, BLUE, PART } from '@ep/viewport';

export default class Thumb extends Viewport {
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }
  override captionLines() { return []; }

  override stage(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const h = 7;
    const P = drawParts(ctx, c, 470, 250, { yaw: -0.5, pitch: 0.62, dist: 900, s: 11, target: [0, 0, 5] }, [{ mesh: gear(18, 30, h, PART), hot: 1 }], { grid: 120, gridStep: 10 });
    const [nx, ny] = at3(P, 470, 250, [-27, 9, h]);
    nozzle(ctx, c, nx, ny, 1.3, 1);
    // the prompt bubble
    setWorld(ctx, c, -560, 120, 1, -0.03);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40;
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.roundRect(-300, -110, 600, 220, 40); ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(180, 100); ctx.lineTo(250, 160); ctx.lineTo(120, 108); ctx.closePath(); ctx.fill();
    ctx.fillStyle = WHITE; ctx.font = font(BODY, 52);
    ctx.fillText('"a gear with', -260, -20); ctx.fillText('18 teeth"', -260, 50);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the arrow
    setWorld(ctx, c, -110, 130, 1, 0);
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(255,122,26,0.9)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(90, 0); ctx.moveTo(45, -50); ctx.lineTo(95, 0); ctx.lineTo(45, 50); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    setWorld(ctx, c, 0, -290, 1, -0.02);
    ctx.font = font(HEAD, 200); ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
    ctx.fillStyle = WHITE; ctx.fillText('TYPE IT.', -440, 0);
    ctx.shadowColor = 'rgba(255,122,26,0.8)'; ctx.shadowBlur = 50;
    ctx.fillStyle = ORANGE; ctx.fillText('PRINT IT.', 430, 0);
    ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
