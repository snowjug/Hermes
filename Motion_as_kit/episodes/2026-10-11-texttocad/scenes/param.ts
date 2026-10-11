// PARAM: "Every size is a number. Change the width from 40 to 60, run it again, and the whole part updates."
// The script again, WIDTH highlighted. On "60" the 40.0 is deleted and 60.0 typed in its place; on "run" the
// Run button is pressed; then the bracket really grows from 40 to 60 mm wide while its dimension counts up.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, wallBracket } from '@kit/_cad3d';
import { Viewport, panel, code, dim, at3, BODY, PART, ORANGE, GREEN, clamp, ease, lerp } from '@ep/viewport';
import { BRACKET_VIEW } from './ask';
import { BRACKET_PY } from './script';

export default class Param extends Viewport {
  build() {
    this.take('Every size is a number', ['size', 'number.', 'Change', 'width', '40', '60,', 'run', 'again,', 'whole', 'updates.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 40, 0, 1.03, 0);
  }

  width(t: number) {
    const w = this.w;
    return lerp(40, 60, ease.inOutCubic(clamp((t - w.run!.start - 0.35) / Math.max(0.6, w.updates!.end - w.run!.start - 0.35))));
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const v = BRACKET_VIEW(t);
    this.gizmoView = v;
    const wd = this.width(t);
    const grow = wd > 40.05 && wd < 59.95;
    const P = drawParts(ctx, c, 450, 40, v, [{ mesh: wallBracket(wd, PART), edge: grow ? ORANGE : undefined }], { grid: 240, gridStep: 10 });
    dim(ctx, c, at3(P, 450, 40, [-wd / 2, 50, 60]), at3(P, 450, 40, [wd / 2, 50, 60]), `${Math.round(wd)} mm`, { off: -70, size: 32, col: grow || wd > 59.9 ? GREEN : ORANGE });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -900, -330, 860, 600, 'bracket.py', { accent: ORANGE });
    // 40.0 -> 60.0, deleted then typed
    const e = clamp((t - (w['60']!.start - 0.3)) / 0.7);
    const val = e < 0.4 ? '40.0'.slice(0, Math.round(4 * (1 - e / 0.4))) : '60.0'.slice(0, Math.round(4 * ((e - 0.4) / 0.6)));
    const lines = [...BRACKET_PY];
    lines[3] = `WIDTH = ${val}   # mm`;
    const hi = t > w.size!.start ? 3 : undefined;
    code(ctx, c, -870, -250, lines, t, -100, { size: 27, hi, hiCol: e > 0 && e < 1 ? 'rgba(54,211,153,0.25)' : undefined });
    // the Run button
    const rk = clamp((t - w.run!.start) / 0.12), press = rk > 0 && rk < 1 ? 0.92 : 1;
    setWorld(ctx, c, -165, -304, 0.62 * press, 0);
    ctx.fillStyle = t > w.run!.start ? GREEN : 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect(-110, -36, 220, 72, 36); ctx.fill();
    ctx.fillStyle = t > w.run!.start ? '#0D1117' : '#FFFFFF'; ctx.font = font(BODY, 32);
    ctx.beginPath(); ctx.moveTo(-60, -16); ctx.lineTo(-60, 16); ctx.lineTo(-34, 0); ctx.closePath(); ctx.fill();
    ctx.fillText('Run', -16, 11);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.run!.start, 0.015) }; }
}
