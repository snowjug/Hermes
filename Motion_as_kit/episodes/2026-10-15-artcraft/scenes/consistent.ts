// 09 CONSISTENT: "Keep the same room for every shot, so a whole sequence stays consistent."
// A film strip slides across: four shots of the same room from four camera angles, each painted from the same
// blocking, sprocket holes top and bottom, SHOT 1 to 4. SAME ROOM, EVERY SHOT on tape.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, type View } from '@kit/_cad3d';
import { Cinema, room, figures, paintShot, tape, MONOB, IVORY, AMBER, clamp, ease } from '@ep/cinema';
import { cast } from '@ep/set';

const SHOTS: View[] = [
  { yaw: 0.16, pitch: 0.05, dist: 430, s: 0.95, target: [5, 40, 112] },
  { yaw: -0.55, pitch: 0.12, dist: 520, s: 0.8, target: [0, 40, 100] },
  { yaw: 0.85, pitch: 0.2, dist: 600, s: 0.75, target: [0, 40, 100] },
  { yaw: 0.05, pitch: 0.55, dist: 700, s: 0.6, target: [0, 40, 80] },
];

export default class Consistent extends Cinema {
  override scene = 3;
  build() {
    this.take('Keep the same room', ['same', 'room', 'every', 'shot,', 'whole', 'sequence', 'consistent.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const fs = cast(1);
    const slide = (t - this.ctx.start) * 70;
    const fw = 640, fh = 360, gap = 40;
    const x0 = -1000 + 260 - slide;
    setWorld(ctx, c, 0, 30, 1, 0);
    ctx.fillStyle = '#0A0A0C'; ctx.fillRect(-1100, -fh / 2 - 60, 2200, fh + 120);
    ctx.fillStyle = 'rgba(241,236,226,0.75)';
    for (let i = -30; i < 30; i++) { const x = ((i * 48 - slide) % 2200 + 2200) % 2200 - 1100; ctx.fillRect(x, -fh / 2 - 44, 26, 18); ctx.fillRect(x, fh / 2 + 26, 26, 18); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    SHOTS.forEach((v, i) => {
      const cx = x0 + i * (fw + gap) + fw / 2;
      const a = clamp((t - this.ctx.start - 0.1 - i * 0.25) / 0.3);
      if (a <= 0 || cx < -1300 || cx > 1300) return;
      const P = drawParts(ctx, c, cx, 30, v, [], {});
      setWorld(ctx, c, cx, 30, 1, 0); ctx.save(); ctx.beginPath(); ctx.rect(-fw / 2, -fh / 2, fw, fh); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawParts(ctx, c, cx, 30, v, [{ mesh: room() }, { mesh: figures(fs) }], { shadow: 0.6 });
      ctx.restore();
      paintShot(ctx, c, cx, 30, fw, fh, P, fs, { a, t });
      setWorld(ctx, c, cx, 30, 1, 0);
      ctx.globalAlpha = a; ctx.fillStyle = IVORY; ctx.font = font(MONOB, 20); ctx.fillText(`SHOT ${i + 1}`, -fw / 2 + 14, fh / 2 - 14);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tape(ctx, c, 'SAME ROOM, EVERY SHOT', 0, -330, 38, { a: clamp((t - w.same!.start) / 0.2) });
    tape(ctx, c, 'CONSISTENT', 0, 330, 34, { a: clamp((t - w.consistent!.start) / 0.2), col: AMBER, rot: 0.03 });
    void ease;
  }
}
