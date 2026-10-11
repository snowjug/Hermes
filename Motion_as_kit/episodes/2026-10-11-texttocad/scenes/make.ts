// MAKE: "It draws dimensioned engineering drawings, slices the model into G-code, and can send it to a Bambu
// Lab printer."
// Three beats. A white drawing sheet: front, top and side views of the bracket in black line, dimensions and a
// title block. Then the gear sliced into glowing layers beside a scrolling G-code panel. Then the printer:
// sending, 100 %, and the print starts.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, gear, gearProfile, project, wallBracket, type V3 } from '@kit/_cad3d';
import { Viewport, panel, printer, tag, dim, at3, MONO, BODY, PART, ORANGE, GREEN, clamp, ease, lerp } from '@ep/viewport';

const GCODE = Array.from({ length: 40 }, (_, i) => {
  const a = i * 0.7;
  return `G1 X${(100 + 30 * Math.cos(a)).toFixed(2)} Y${(100 + 30 * Math.sin(a)).toFixed(2)} E${(0.03 + 0.002 * (i % 7)).toFixed(4)}`;
});

export default class Make extends Viewport {
  build() {
    this.take('It draws dimensioned', ['draws', 'dimensioned', 'drawings,', 'slices', 'Gcode,', 'send', 'Bambu', 'printer.']);
    const K = this.cam;
    K.key(this.ctx.start, -600, 0, 1.12, 0);
    K.key(this.w.slices!.start - 0.15, -580, 0, 1.12, 0);
    K.key(this.w.slices!.start + 0.35, 0, 0, 1.12, 0, ease.inOutCubic);
    K.key(this.w.send!.start - 0.15, 20, 0, 1.12, 0);
    K.key(this.w.send!.start + 0.35, 900, 0, 1.12, 0, ease.inOutCubic);
    K.key(this.ctx.end, 910, 0, 1.1, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // 1. the drawing sheet
    const sa = ease.outCubic(clamp((t - this.ctx.start) / 0.35));
    setWorld(ctx, c, -600, -10, 0.9 + 0.1 * sa, 0);
    ctx.globalAlpha = sa;
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#FBFBF8'; ctx.fillRect(-400, -280, 800, 560); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(-380, -260, 760, 520);
    ctx.lineWidth = 2; ctx.strokeRect(150, 170, 230, 90); ctx.beginPath(); ctx.moveTo(150, 205); ctx.lineTo(380, 205); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.font = font(BODY, 22); ctx.fillText('BRACKET', 166, 196);
    ctx.font = font(MONO, 18); ctx.fillText('SCALE 1:1   UNITS mm', 166, 236);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const views: [number, number, number, number][] = [[-810, -110, 3.14159, 0.0], [-810, 150, 3.14159, 1.5], [-430, -110, 1.5708, 0.0]];
    const draw = clamp((t - w.draws!.start) / 0.6);
    views.forEach(([x, y, yaw, pitch], i) => {
      const k = clamp(draw * 3 - i);
      if (k <= 0) return;
      const P = drawParts(ctx, c, x, y, { yaw, pitch, dist: 6000, s: 2.4, target: [0, 25, 30] }, [{ mesh: wallBracket(40, '#FFFFFF'), a: sa * k }], { look: 'line', shadow: 0, edgeW: 2.2 });
      if (i === 0 && t > w.dimensioned!.start) dim(ctx, c, at3(P, x, y, [-20, 0, 0]), at3(P, x, y, [20, 0, 0]), '40', { off: 26, size: 20, col: '#111', al: sa * clamp((t - w.dimensioned!.start) / 0.2) });
      if (i === 2 && t > w.dimensioned!.start) dim(ctx, c, at3(P, x, y, [0, 0, 0]), at3(P, x, y, [0, 0, 60]), '60', { off: 30, size: 20, col: '#111', al: sa * clamp((t - w.dimensioned!.start - 0.15) / 0.2) });
    });
    // 2. the gear in layers
    const la = clamp((t - w.slices!.start + 0.3) / 0.3);
    if (la > 0) {
      const v = { yaw: 0.5 + 0.3 * t, pitch: 0.55, dist: 900, s: 5.2, target: [0, 0, 6] as V3 };
      drawParts(ctx, c, -90, 40, v, [{ mesh: gear(18, 30, 10, PART), a: la * 0.25, wire: 0.6 }], { grid: 90, gridStep: 10, shadow: 0 });
      const P = drawParts(ctx, c, -90, 40, v, [], {});
      const prof = gearProfile(18, 26, 30);
      const n = Math.floor(14 * clamp((t - w.slices!.start) / 0.9));
      setWorld(ctx, c, -90, 40, 1, 0);
      for (let i = 0; i < n; i++) {
        const z = i * 0.75;
        const pts = prof.map(([a, b]) => project(P, [a, b, z]));
        ctx.globalAlpha = la * (i === n - 1 ? 1 : 0.55);
        ctx.strokeStyle = i === n - 1 ? '#FFD08A' : ORANGE; ctx.lineWidth = i === n - 1 ? 3.5 : 2;
        ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tag(ctx, c, 'ENGINEERING DRAWING · PDF', -600, -330, 30, { a: clamp((t - w.draws!.start) / 0.15), bg: 'rgba(255,255,255,0.95)', fg: '#111' });
    // G-code panel
    const ga = clamp((t - w.gcode!.start + 0.1) / 0.25);
    if (ga > 0) {
      panel(ctx, c, 220, -300, 380, 520, 'gear.gcode', { a: ga, accent: ORANGE });
      setWorld(ctx, c, 240, -220, 1, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 350, 420); ctx.clip();
      ctx.font = font(MONO, 20); ctx.globalAlpha = ga;
      const off = (t - w.gcode!.start) * 120;
      GCODE.forEach((s, i) => { const y = i * 30 - off; if (y < -30 || y > 450) return; ctx.fillStyle = i % 5 === 0 ? ORANGE : '#C7D0DC'; ctx.fillText(s, 0, y + 24); });
      ctx.restore(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    tag(ctx, c, 'SLICED · ORCASLICER', 0, -330, 30, { a: clamp((t - w.slices!.start) / 0.15), bg: 'rgba(255,122,26,0.95)', fg: '#0D1117' });
    // the printer
    const pa = clamp((t - w.send!.start + 0.2) / 0.25);
    if (pa > 0) {
      const sendK = clamp((t - w.send!.start) / Math.max(0.6, w.printer!.end - w.send!.start));
      printer(ctx, c, 900, 0, 1.05, { a: pa, progress: clamp((t - w.printer!.end) / 2), glow: 1 });
      setWorld(ctx, c, 900, -300, 1, 0);
      ctx.globalAlpha = pa;
      ctx.fillStyle = 'rgba(18,23,31,0.96)'; ctx.beginPath(); ctx.roundRect(-230, -40, 460, 80, 40); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.roundRect(-200, 10, 400, 12, 6); ctx.fill();
      ctx.fillStyle = GREEN; ctx.beginPath(); ctx.roundRect(-200, 10, 400 * sendK, 12, 6); ctx.fill();
      ctx.fillStyle = '#F2F5FA'; ctx.font = font(BODY, 24); ctx.textAlign = 'center';
      ctx.fillText(sendK < 1 ? `Sending to printer…  ${Math.round(sendK * 100)}%` : 'Sent ✓  printing', 0, -6);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tag(ctx, c, 'BAMBU LAB · VIA BAMBU CONNECT', 900, 270, 28, { a: clamp((t - w.bambu!.start) / 0.15), stroke: GREEN });
      void lerp;
    }
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.slices!.start, 0.01) }; }
}
