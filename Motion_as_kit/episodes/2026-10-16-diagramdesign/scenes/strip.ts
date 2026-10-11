// 11–12 SUBTRACT: "Now, the trick: it's not what it adds. It's what it refuses to add." "One accent colour, saved for the
// one thing that matters. Hairline borders. Zero shadows. Everything snapped to a 4-pixel grid."
// The sealed node from before unlocks: THE TRICK becomes SUBTRACT. Below it, the app diagram over-designed: five fill
// colours, fat borders, drop shadows, boxes a few pixels off, plus the extras an AI loves (a gradient banner, sparkle
// badges, a bevel). On "refuses" each extra is crossed and thrown out. Then the four rules land one by one, each on
// its words, each with a call-out: the colours drain to one coral box (1 ACCENT), the borders thin to hairlines (a
// magnified 1px dimension), the shadows go (0), and the boxes snap onto the grid as it flashes (dimensions ÷ 4).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { Dgm, node, chip, mark, dim, subCam, APP, APP_EDGES, NW, NH, cleanRoute, edge, CORAL, HAIR, TEXT, MUTED, PANEL, SANS, SANSB, MONO, BLUE, clamp, ease, ob, hash, lerp, TAU } from '@ep/dgm';
import { lock } from './trick';

const FILLS = ['#E8577A', '#F2B33D', '#4D7CFE', '#9B59D0', '#2E9E5B', '#E8577A', '#F2B33D', '#4D7CFE'];
const S = 0.8, OX = 60, OY = 70;

export default class Strip extends Dgm {
  build() {
    this.take('Now, the trick', ['trick:', 'adds.', 'refuses', 'add.']);
    this.take('One accent colour', ['accent', 'colour,', 'matters.', 'Hairline', 'borders.', 'Zero', 'shadows.', 'Everything', 'snapped', 'grid.']);
    this.frame(0, 0, 1, { from: [900, 0, 1], to: [0, 0, 0.6], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const show = clamp((t - this.ctx.start - 0.25) / 0.5);
    if (show <= 0) return;
    const colK = ease.inOutCubic(clamp((t - this.s('accent')) / 0.8));
    const bordK = ease.inOutCubic(clamp((t - this.s('hairline')) / 0.5));
    const shK = ease.inOutCubic(clamp((t - this.s('zero')) / 0.5));
    const snapK = ease.outBack(clamp((t - this.s('snapped')) / 0.5));
    const extIn = clamp((t - this.s('adds') + 0.15) / 0.3), extOut = clamp((t - this.s('refuses') + 0.05) / 0.9), ext = extIn * (1 - extOut);
    const sc = subCam(c, OX, OY, S);
    // the grid flash when everything snaps
    const gf = clamp((t - this.s('snapped')) / 0.25) * (1 - clamp((t - this.s('grid') - 0.4) / 0.5));
    if (gf > 0) {
      setWorld(ctx, sc, 0, 0, 1, 0);
      ctx.strokeStyle = `rgba(255,106,69,${0.18 * gf})`; ctx.lineWidth = 1;
      for (let x = -800; x <= 800; x += 20) { ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, 300); ctx.stroke(); }
      for (let y = -300; y <= 300; y += 20) { ctx.beginPath(); ctx.moveTo(-800, y); ctx.lineTo(800, y); ctx.stroke(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // edges
    APP_EDGES.forEach(([a, b], i) => {
      const col = colK < 0.5 ? FILLS[(i + 2) % FILLS.length]! : a === 'cdn' && b === 'api' ? CORAL : a === 'web' ? BLUE : HAIR;
      edge(ctx, sc, cleanRoute(a, b), clamp(show * 1.5 - 0.3), { col, lw: lerp(4, 1.6, bordK) });
    });
    // boxes
    APP.forEach((n, i) => {
      const jx = Math.round((hash(i, 7) - 0.5) * 34) | 1, jy = Math.round((hash(i, 8) - 0.5) * 26) | 1;
      const x = n.clean[0] + jx * (1 - snapK), y = n.clean[1] + jy * (1 - snapK);
      const k = ob(clamp(show * 1.6 - i * 0.07));
      if (k <= 0) return;
      setWorld(ctx, sc, x, y, k, 0);
      if (shK < 1) { ctx.shadowColor = `rgba(0,0,0,${0.7 * (1 - shK)})`; ctx.shadowBlur = 30 * (1 - shK); ctx.shadowOffsetY = 14 * (1 - shK); }
      const acc = !!n.accent;
      const fillA = acc ? lerp(1, 0.14, colK) : 1 - colK;
      ctx.fillStyle = PANEL; ctx.beginPath(); ctx.roundRect(-NW / 2, -NH / 2, NW, NH, lerp(20, 8, bordK)); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.globalAlpha = fillA; ctx.fillStyle = acc ? CORAL : FILLS[i]!; ctx.fill(); ctx.globalAlpha = 1;
      // the bevel extra
      if (ext > 0) { const g = ctx.createLinearGradient(0, -NH / 2, 0, NH / 2); g.addColorStop(0, `rgba(255,255,255,${0.35 * ext})`); g.addColorStop(0.5, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fill(); }
      ctx.strokeStyle = acc && colK > 0.5 ? CORAL : colK > 0.5 ? HAIR : '#1B1B22'; ctx.lineWidth = lerp(5, 1.6, bordK); ctx.stroke();
      ctx.textAlign = 'center'; ctx.font = font(colK < 0.5 ? SANSB : SANS, 26); ctx.fillStyle = colK < 0.5 ? '#FFFFFF' : TEXT;
      ctx.fillText(n.title, 0, 2); ctx.font = font(MONO, 16); ctx.fillStyle = colK < 0.5 ? 'rgba(255,255,255,0.8)' : MUTED; ctx.fillText(n.sub, 0, 30);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
      // sparkle badges (an extra)
      if (ext > 0 && i % 3 === 0) {
        const fly = extOut, bx = x + NW / 2 - 6 + fly * 300 * (i % 2 ? 1 : -1), by = y - NH / 2 + 4 - fly * 260;
        setWorld(ctx, sc, bx, by, 1, fly * 4);
        ctx.globalAlpha = ext; ctx.fillStyle = '#FFD84D'; ctx.beginPath();
        for (let j = 0; j < 10; j++) { const r = j % 2 ? 9 : 22, a = (j * Math.PI) / 5 - Math.PI / 2; if (j) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    });
    // the gradient banner (an extra)
    if (ext > 0) {
      const fly = extOut;
      setWorld(ctx, sc, 0, -330 - fly * 400, 1, -fly * 0.4);
      ctx.globalAlpha = ext;
      const g = ctx.createLinearGradient(-420, 0, 420, 0); g.addColorStop(0, '#9B59D0'); g.addColorStop(0.5, '#E8577A'); g.addColorStop(1, '#F2B33D');
      ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.roundRect(-420, -44, 840, 88, 44); ctx.fill(); ctx.shadowBlur = 0;
      ctx.font = font(SANSB, 40); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText('✨ SYSTEM ARCHITECTURE ✨', 0, 14);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // crosses over the extras as they're refused
    const rk = clamp((t - this.s('refuses') + 0.1) / 0.3) * (1 - clamp((t - this.s('add') - 0.4) / 0.3));
    if (rk > 0) { const p: [number, number][] = [[OX, OY - 330 * S], [OX + 410 * S, OY - 248 * S], [OX - 640 * S + 110 * S, OY - 50 * S]]; p.forEach(([x, y], i) => mark(ctx, c, x, y, false, clamp(rk * 2 - i * 0.3), 1.6)); }
    void TAU; void measure;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the trick unlocks
    const tk = clamp((t - this.ctx.start) / 0.4) * (1 - clamp((t - this.s('accent') + 0.4) / 0.4));
    if (tk > 0) {
      const open = ease.outBack(clamp((t - this.s('trick') - 0.1) / 0.4));
      const rev = clamp((t - this.s('trick') - 0.3) / 0.3);
      node(ctx, c, 0, -390, 340, 100, { a: tk, title: rev > 0.5 ? 'SUBTRACT' : 'THE TRICK', tag: rev > 0.5 ? 'OPENED' : 'SEALED', accent: true, titleSize: 32, glow: 0.4 });
      lock(ctx, c, 205, -390, open, tk * (1 - rev), 0.8);
      if (rev > 0) { setWorld(ctx, c, -230, -392, ob(rev), 0); ctx.globalAlpha = tk; ctx.fillStyle = CORAL; ctx.fillRect(-26, -5, 52, 10); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); }
    }
    // the four rules
    const rules: [string, string][] = [['1 ACCENT', 'accent'], ['1PX HAIRLINES', 'hairline'], ['0 SHADOWS', 'zero'], ['4PX GRID', 'snapped']];
    rules.forEach(([lab, key], i) => {
      const k = clamp((t - this.s(key) + 0.05) / 0.3);
      if (k <= 0) return;
      chip(ctx, c, lab, -570 + i * 380, -390, { a: k, col: CORAL, size: 20, scale: 0.85 + 0.15 * ob(k) });
    });
    // call-outs
    const sc = subCam(c, OX, OY, S);
    const api = APP.find((n) => n.accent)!;
    chip(ctx, sc, 'THE ONE THING THAT MATTERS', api.clean[0], api.clean[1] - 110, { a: clamp((t - this.s('matters') + 0.1) / 0.3) * (1 - clamp((t - this.s('hairline')) / 0.3)), col: CORAL, size: 16 });
    // a magnifier on a corner: 1px
    const mk = clamp((t - this.s('borders') + 0.1) / 0.3) * (1 - clamp((t - this.s('zero') - 0.1) / 0.3));
    if (mk > 0) {
      const db = APP.find((n) => n.id === 'db')!;
      const [sx, sy] = [OX + (db.clean[0] + NW / 2) * S, OY + (db.clean[1] - NH / 2) * S];
      setWorld(ctx, c, sx + 150, sy - 120, ob(mk), 0);
      ctx.fillStyle = 'rgba(11,14,19,0.95)'; ctx.strokeStyle = CORAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 88, 0, TAU); ctx.clip();
      ctx.strokeStyle = HAIR; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-120, 20); ctx.lineTo(10, 20); ctx.quadraticCurveTo(30, 20, 30, 40); ctx.lineTo(30, 140); ctx.stroke();
      ctx.restore();
      ctx.font = font(MONO, 18); ctx.fillStyle = CORAL; ctx.textAlign = 'center'; ctx.fillText('1px', 0, -36); ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, 0, 0, 1, 0); ctx.globalAlpha = mk; ctx.strokeStyle = CORAL; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 86, sy - 64); ctx.stroke(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const zk = clamp((t - this.s('shadows') + 0.1) / 0.3) * (1 - clamp((t - this.s('everything')) / 0.3));
    chip(ctx, c, 'box-shadow: none', 560, 330, { a: zk, col: CORAL, size: 17 });
    // the grid dimensions
    const gk = clamp((t - this.s('grid') + 0.1) / 0.4);
    if (gk > 0) {
      const web = APP[0]!, cdn = APP[1]!;
      dim(ctx, sc, [web.clean[0] - NW / 2, web.clean[1] + NH / 2 + 30], [web.clean[0] + NW / 2, web.clean[1] + NH / 2 + 30], '220 ÷ 4', gk);
      dim(ctx, sc, [web.clean[0] + NW / 2, web.clean[1] - NH / 2 - 30], [cdn.clean[0] - NW / 2, cdn.clean[1] - NH / 2 - 30], '80 ÷ 4', gk);
      dim(ctx, sc, [web.clean[0] - NW / 2 - 34, web.clean[1] - NH / 2], [web.clean[0] - NW / 2 - 34, web.clean[1] + NH / 2], '96', gk);
    }
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('accent'), 0.012) * this.punch(t, this.s('snapped'), 0.015) }; }
}
