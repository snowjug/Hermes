// FILES: "Out comes a real CAD file: STEP for engineering software, or STL and 3MF for your 3D printer."
// The bracket turns in the middle. A STEP file pops out of it and flies left into an engineering app (the part
// as a blue wireframe there); STL and 3MF fly right into a printer, which starts printing.
import type { Cam } from '@kit/_vo';
import { drawParts, wallBracket } from '@kit/_cad3d';
import { Viewport, panel, fileChip, printer, tag, PART, BLUE, ORANGE, GREEN, clamp, ease, lerp } from '@ep/viewport';
import { BRACKET_VIEW } from './ask';

export default class Files extends Viewport {
  build() {
    this.take('Out comes a real CAD file', ['Out', 'real', 'file:', 'STEP', 'engineering', 'software,', 'STL', '3MF', '3D', 'printer.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.05, 0);
    K.key(this.ctx.end, 0, 0, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = { ...BRACKET_VIEW(t), yaw: BRACKET_VIEW(t).yaw + 0.5 * t, s: 4.6 };
    this.gizmoView = v;
    drawParts(ctx, c, 0, 70, v, [{ mesh: wallBracket(60, PART) }], { grid: 220, gridStep: 10 });
    // the engineering app on the left
    const ea = clamp((t - w.engineering!.start + 0.2) / 0.25);
    if (ea > 0) {
      panel(ctx, c, -900, -260, 520, 420, 'engineering software', { a: ea, accent: BLUE });
      drawParts(ctx, c, -640, -20, { ...v, s: 2.6 }, [{ mesh: wallBracket(60, PART), wire: 1, edge: '#6FB1FF', a: ea }], { shadow: 0 });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // printer on the right
    const pa = clamp((t - w.stl!.start + 0.2) / 0.25);
    const prog = clamp((t - w.printer!.start) / 1.6);
    printer(ctx, c, 640, 10, 1, { a: pa, progress: prog, glow: prog > 0 && prog < 1 ? 1 : 0 });
    // the files: born at the part, then flying out
    const fly = (ext: string, col: string, tb: number, tf: number, tx: number, ty: number, rot: number) => {
      const born = ease.outBack(clamp((t - tb) / 0.3));
      if (born <= 0) return;
      const f = ease.inOutCubic(clamp((t - tf) / 0.5));
      const gone = clamp((t - tf - 0.5) / 0.25);
      const x = lerp(0, tx, f), y = lerp(-250, ty, f) - Math.sin(f * Math.PI) * 120;
      fileChip(ctx, c, x, y, ext, { col, a: born * (1 - 0.85 * gone), s: lerp(1, 0.55, f) * (0.5 + 0.5 * born), rot: rot * f, name: `bracket.${ext.toLowerCase()}` });
    };
    fly('STEP', BLUE, w.file!.start - 0.05, w.step!.start, -640, -20, -0.1);
    fly('STL', ORANGE, w.stl!.start - 0.25, w.stl!.start + 0.1, 640, -60, 0.12);
    fly('3MF', GREEN, w['3mf']!.start - 0.25, w['3mf']!.start + 0.1, 640, -40, -0.08);
    tag(ctx, c, 'FOR ENGINEERS', -640, 230, 30, { a: clamp((t - w.software!.start) / 0.15), stroke: BLUE });
    tag(ctx, c, 'FOR YOUR PRINTER', 640, 250, 30, { a: clamp((t - w.printer!.start) / 0.15), stroke: ORANGE });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.file!.start, 0.015) }; }
}
