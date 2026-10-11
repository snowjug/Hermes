// SCRIPT: "Your agent writes a short Python script, and that script is the part. You can spin it around right
// in the chat."
// bracket.py types itself on the left (the shape of text-to-cad's model contract: a decorated function that
// returns a build123d shape, every size a named number). On "that script is the part" a wire of light joins the
// code to the bracket; on "spin it around" the bracket whirls inside a CAD viewer card from the chat.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { drawParts, wallBracket } from '@kit/_cad3d';
import { Viewport, panel, code, tag, at3, PART, ORANGE, clamp, ease, lerp } from '@ep/viewport';
import { BRACKET_VIEW } from './ask';

export const BRACKET_PY = [
  'from cadgen import build123d as bd',
  'from cadgen import step',
  '',
  'WIDTH = 40.0   # mm',
  'HOLE = 6.0',
  '',
  '@step(out="bracket.step")',
  'def bracket():',
  '    wall = bd.Box(WIDTH, 5, 60)',
  '    arm = bd.Box(WIDTH, 50, 5)',
  '    return wall + arm - holes(HOLE)',
];

export default class Script extends Viewport {
  build() {
    this.take('Your agent writes', ['writes', 'Python', ['script2', 'script', 1], 'part.', 'spin', 'around', 'chat.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.03, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const spin = (Math.PI * 2) * ease.inOutCubic(clamp((t - w.spin!.start) / 1.7));
    const v = { ...BRACKET_VIEW(t), yaw: BRACKET_VIEW(t).yaw + spin };
    this.gizmoView = v;
    // the viewer card from the chat, behind the part
    const card = clamp((t - w.chat!.start + 0.2) / 0.3);
    if (card > 0) panel(ctx, c, 70, -330, 760, 640, 'CAD viewer · in your chat', { a: card, accent: ORANGE });
    const link = clamp((t - w.script2!.start) / 0.3);
    const P = drawParts(ctx, c, 450, 40, v, [{ mesh: wallBracket(40, PART), edge: link > 0 && t < w.part!.end + 0.5 ? ORANGE : undefined }], { grid: 240, gridStep: 10 });
    // the wire of light from the code to the part
    if (link > 0) {
      const [px, py] = at3(P, 450, 40, [0, 20, 30]);
      const fade = clamp((w.spin!.start + 0.3 - t) / 0.4);
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(255,122,26,0.9)'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.moveTo(-40, -60);
      ctx.bezierCurveTo(lerp(-40, px, 0.5), -220, lerp(-40, px, 0.6), py, lerp(-40, px, link), lerp(-60, py, link)); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const pa = clamp((t - this.ctx.start) / 0.25);
    panel(ctx, c, -900, -330, 860, 600, 'bracket.py', { a: pa, accent: ORANGE });
    const t0 = w.writes!.start;
    const total = BRACKET_PY.join('\n').length;
    code(ctx, c, -870, -250, BRACKET_PY, t, t0, { size: 27, a: pa, cps: total / Math.max(1, w.part!.end - t0) });
    tag(ctx, c, 'illustrative', -150, 300, 22, { a: pa * 0.8, mono: true });
    tag(ctx, c, 'ORBIT IT ↻', 450, 250, 32, { a: clamp((t - w.around!.start) / 0.15), bg: 'rgba(255,122,26,0.95)', fg: '#0D1117' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.script2!.start, 0.012) }; }
}
