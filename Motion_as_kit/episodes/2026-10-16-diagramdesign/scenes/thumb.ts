// THUMB: the thumbnail, rendered as a still after the end of the timeline.
// The whole idea in one frame: the same diagram twice. Left, the default AI diagram (pastel boxes, shadows, tangled
// curves) under BEFORE; right, the clean one under AFTER; a coral arrow between; SAME DIAGRAM. in serif on top.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { Dgm, appDiagram, subCam, serif, mono, CORAL, TEXT, MUTED } from '@ep/dgm';

export default class Thumb extends Dgm {
  override caps = false;
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); }

  override stage(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    // the left half lighter, like a pasted screenshot
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.fillStyle = '#E9ECF1'; ctx.fillRect(-960, -540, 940, 1080);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    appDiagram(ctx, subCam(c, -490, 110, 0.6), 0, 0, 0, { noAccent: true });
    appDiagram(ctx, subCam(c, 530, 110, 0.55), 0, 0, 1, { hot: 0.8 });
    setWorld(ctx, c, -30, 110, 1, 0);
    ctx.strokeStyle = CORAL; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(255,106,69,0.8)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(50, 0); ctx.moveTo(10, -40); ctx.lineTo(54, 0); ctx.lineTo(10, 40); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the title crosses the split: ink over the light half, white over the dark half
    const sp = -20;
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(-960, -540, 960 + sp, 1080); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    serif(ctx, c, 'Same diagram.', 0, -300, 180, t, this.ctx.start - 5, { col: '#1B1E24' });
    ctx.restore();
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(sp, -540, 960 - sp, 1080); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    serif(ctx, c, 'Same diagram.', 0, -300, 180, t, this.ctx.start - 5, { col: TEXT });
    ctx.restore();
    mono(ctx, c, 'BEFORE', -490, -150, { align: 'center', size: 40, bold: true, col: '#5A6070', track: 6 });
    mono(ctx, c, 'AFTER', 530, -150, { align: 'center', size: 40, bold: true, col: CORAL, track: 6 });
    void MUTED;
  }
}
