// 09 TYPES: "Your agent picks one of 44 diagram types, tells you its plan, and writes a single HTML file."
// 44 tiles cascade in, an 11 x 4 wall of tiny pictograms of the skill's diagram types; a selection sweeps over them
// and lands on ARCHITECTURE (coral). The camera slides right: a PLAN node writes three lines, then a single file,
// diagram.html, drops out of it on "writes a single HTML file".
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Dgm, node, edge, fileIcon, mono, typed, chip, CORAL, HAIR, MUTED, TEXT, MONO, clamp, ease, ob, TAU } from '@ep/dgm';

export const TYPES = ['Architecture', 'IT current-state', 'Flowchart', 'Sequence', 'State machine', 'ER model', 'Timeline', 'Swimlane', 'Quadrant',
  'Radar', 'Loop', 'Nested', 'Tree', 'Org chart', 'Layer stack', 'Venn', 'Pyramid', 'Bar chart', 'Treemap', 'Line chart', 'Gantt', 'Scatter',
  'High-level', 'Process', 'Medallion', 'Data flow', 'DP integration', 'DP security', 'Sankey', 'Fishbone', 'Wardley map', 'Kanban',
  'User journey', 'Deployment', 'Dependency', 'UML class', 'Story map', 'DB schema', 'Polar', 'Waterfall', 'Arch delta', 'Exploded',
  'Axonometric', 'Heatmap'];

/** A tiny pictogram for diagram type i inside a w x h tile (local coords centred). */
export function glyph(ctx: CanvasRenderingContext2D, i: number, w: number, h: number, col: string) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.5;
  const g = i % 8;
  ctx.beginPath();
  if (g === 0) { ctx.strokeRect(-w * 0.36, -8, 22, 16); ctx.strokeRect(w * 0.36 - 22, -h * 0.22, 22, 14); ctx.strokeRect(w * 0.36 - 22, h * 0.1, 22, 14); ctx.moveTo(-w * 0.36 + 22, 0); ctx.lineTo(w * 0.36 - 22, -h * 0.15); ctx.moveTo(-w * 0.36 + 22, 0); ctx.lineTo(w * 0.36 - 22, h * 0.17); }
  else if (g === 1) { for (let k = 0; k < 4; k++) ctx.rect(-w * 0.36 + k * w * 0.19, h * 0.25 - (k + 1) * h * 0.11, w * 0.12, (k + 1) * h * 0.11); }
  else if (g === 2) { ctx.moveTo(-w * 0.38, h * 0.2); for (let k = 0; k <= 6; k++) ctx.lineTo(-w * 0.38 + (k * w * 0.76) / 6, h * 0.2 - Math.sin(k * 1.1 + i) * h * 0.18 - k * 2); }
  else if (g === 3) { ctx.arc(0, 0, h * 0.26, 0, TAU); ctx.moveTo(0, 0); ctx.lineTo(h * 0.26, 0); ctx.moveTo(0, 0); ctx.lineTo(-h * 0.13, -h * 0.22); }
  else if (g === 4) { ctx.moveTo(0, -h * 0.28); ctx.lineTo(w * 0.2, 0); ctx.lineTo(0, h * 0.28); ctx.lineTo(-w * 0.2, 0); ctx.closePath(); }
  else if (g === 5) { ctx.moveTo(-w * 0.38, 0); ctx.lineTo(w * 0.38, 0); for (let k = 0; k < 4; k++) { ctx.moveTo(-w * 0.3 + k * w * 0.2, -6); ctx.lineTo(-w * 0.3 + k * w * 0.2, 6); } }
  else if (g === 6) { ctx.arc(-8, 0, h * 0.2, 0, TAU); ctx.moveTo(8 + h * 0.2, 0); ctx.arc(8, 0, h * 0.2, 0, TAU); }
  else { ctx.moveTo(0, -h * 0.28); ctx.lineTo(w * 0.24, h * 0.24); ctx.lineTo(-w * 0.24, h * 0.24); ctx.closePath(); ctx.moveTo(-w * 0.12, 0); ctx.lineTo(w * 0.12, 0); }
  ctx.stroke();
}

export default class Types extends Dgm {
  build() {
    this.take('Your agent picks', ['agent', 'picks', '44', 'types,', 'tells', 'plan,', 'writes', 'single', 'HTML', 'file.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, -900, 0, 1);
    K.key(s + 0.5, 0, 0, 1, 0, ease.outExpo);
    K.key(this.s('plan') - 0.2, 0, 0, 1.03, 0, ease.inOutQuad);
    K.key(this.s('plan') + 0.45, 700, 0, 1.0, 0, ease.inOutCubic);
    K.key(e - 0.26, 760, 0, 1.03, 0, ease.inOutQuad);
    K.key(e, 760, -700, 1.03, 0, ease.inExpo);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the wall of 44 types
    const cols = 11, tw = 136, th = 96, gx = 148, gy = 108, x0 = -((cols - 1) * gx) / 2, y0 = -170;
    const appear = this.ctx.start + 0.25;
    const pick = clamp((t - this.s('picks')) / Math.max(0.6, this.s('types') + 0.2 - this.s('picks')));
    const sel = pick < 1 ? Math.floor(ease.inOutCubic(pick) * 3 * TYPES.length) % TYPES.length : 0;
    TYPES.forEach((name, i) => {
      const cx = x0 + (i % cols) * gx, cy = y0 + Math.floor(i / cols) * gy;
      const k = clamp((t - appear - ((i % cols) + Math.floor(i / cols)) * 0.035) / 0.3);
      if (k <= 0) return;
      const chosen = pick >= 1 && i === 0, hot = sel === i && pick < 1;
      setWorld(ctx, c, cx, cy, 0.85 + 0.15 * ob(k), 0);
      ctx.globalAlpha = k * (pick >= 1 && !chosen ? 0.7 : 1);
      ctx.fillStyle = chosen ? 'rgba(255,106,69,0.12)' : 'rgba(18,23,32,0.95)'; ctx.strokeStyle = chosen || hot ? CORAL : 'rgba(214,222,235,0.5)'; ctx.lineWidth = chosen ? 2 : 1.3;
      ctx.beginPath(); ctx.roundRect(-tw / 2, -th / 2, tw, th, 6); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(0, -12); glyph(ctx, i, tw, th * 0.62, chosen || hot ? CORAL : 'rgba(214,222,235,0.9)'); ctx.restore();
      ctx.font = font(MONO, 12); ctx.fillStyle = chosen ? CORAL : MUTED; ctx.textAlign = 'center'; ctx.fillText(name.toUpperCase(), 0, th / 2 - 12);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    mono(ctx, c, `${Math.min(44, Math.max(0, Math.round(clamp((t - appear) / 0.9) * 44)))} / 44 DIAGRAM TYPES`, x0 - tw / 2, y0 - 90, { a: clamp((t - appear) / 0.2), size: 18, track: 2, col: TEXT });
    // the plan, then the file
    const pk = clamp((t - this.s('tells') + 0.1) / 0.5);
    node(ctx, c, 760, -120, 460, 240, { k: pk, tag: 'PLAN', titleSize: 24 });
    if (pk > 0.6) {
      const lines = ['1  type · architecture', '2  8 nodes · 7 edges', '3  focal · API (coral)'];
      lines.forEach((s, i) => typed(ctx, c, s, 560, -110 + i * 44, t, this.s('tells') + 0.25 + i * 0.35, 40, { size: 22, caret: false }));
    }
    const fk = clamp((t - this.s('writes') + 0.05) / 0.4);
    edge(ctx, c, [[760, 0], [760, 120]], fk, { col: CORAL });
    const dk = ob(clamp((t - this.s('single') + 0.1) / 0.45));
    if (dk > 0) fileIcon(ctx, c, 760, 200, '.html', { s: 0.6 + 0.6 * dk, accent: true });
    chip(ctx, c, 'diagram.html · 1 FILE', 760, 330, { a: clamp((t - this.s('file') + 0.1) / 0.3), col: CORAL, size: 17 });
    void HAIR;
  }
}
