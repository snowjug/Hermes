// CHART: "Ask for it, and the charts become real chart objects. Right-click, Edit Data, and the numbers are
// there."
// A big chart slide. On "Right-click" the pointer clicks a bar and a context menu opens (Cut, Copy, Edit Data,
// Format...); on "Edit Data" that row lights and a spreadsheet window slides in with the numbers; on "the
// numbers" one value changes and its bar grows to match.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, pointer, pill, headline, BODY, HEAD, WHITE, SOFT, ORANGE, TEAL, clamp, ease, lerp } from '@ep/keynote';

const VALS = [42, 61, 38, 77];

export default class Chart extends Keynote {
  build() {
    this.take('Ask for it', ['Ask', 'charts', 'real', 'chart', 'objects.', 'Right-click,', 'Edit', 'Data,', 'numbers', 'there.']);
    const K = this.cam;
    K.key(this.ctx.start, -120, 0, 1.0, 0);
    K.key(this.w.edit!.start - 0.1, 120, 0, 0.98, 0);
    K.key(this.ctx.end, 140, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const bump = ease.outBack(clamp((t - w.numbers!.start - 0.2) / 0.4));
    const vals = VALS.map((v, i) => (i === 3 ? lerp(v, 95, bump) : v));
    // the chart slide
    setWorld(ctx, c, -380, 20, 1, 0);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-460, -260, 920, 520, 14); ctx.fill(); ctx.restore();
    ctx.font = font(HEAD, 48); ctx.fillStyle = '#141833'; ctx.fillText('Revenue by quarter', -400, -180);
    const grow = ease.outCubic(clamp((t - this.ctx.start) / 0.6));
    vals.forEach((v, i) => {
      const bh = 3.2 * v * grow;
      ctx.fillStyle = i === 3 ? ORANGE : '#C9CDE0';
      ctx.fillRect(-340 + i * 190, 200 - bh, 120, bh);
      ctx.font = font(BODY, 28); ctx.fillStyle = '#5A6080'; ctx.textAlign = 'center'; ctx.fillText(`Q${i + 1}`, -280 + i * 190, 240); ctx.textAlign = 'left';
    });
    if (t > w.real!.start) { ctx.font = font(BODY, 26); ctx.fillStyle = TEAL; ctx.fillText('● Chart object', 220, -180); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // pointer and context menu
    const tr = w.rightclick!.start - 0.35;
    if (t > tr) {
      const pk = ease.inOutCubic(clamp((t - tr) / 0.35));
      pointer(ctx, c, lerp(300, 260, pk), lerp(380, -40, pk), clamp((t - tr - 0.35) / 0.4));
      if (t > tr + 0.35) {
        const km = clamp((t - tr - 0.35) / 0.15);
        glass(ctx, c, 280, -40, 320, 270, { a: km, r: 14, tint: 'rgba(36,40,70,0.97)' });
        setWorld(ctx, c, 280, -40, 1, 0); ctx.globalAlpha = km;
        ['Cut', 'Copy', 'Edit Data', 'Format Chart...'].forEach((s, i) => {
          const hot = i === 2 && t > w.edit!.start - 0.05;
          if (hot) { ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.roundRect(10, 16 + i * 60, 300, 52, 10); ctx.fill(); }
          ctx.font = font(BODY, 30); ctx.fillStyle = hot ? '#FFFFFF' : SOFT; ctx.fillText(s, 34, 52 + i * 60);
        });
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // the spreadsheet
    const ke = clamp((t - w.data!.start) / 0.3);
    if (ke > 0) {
      const e = ease.outCubic(ke);
      glass(ctx, c, 380 + (1 - e) * 200, -330, 520, 400, { a: e, r: 16, tint: 'rgba(240,242,250,0.97)' });
      setWorld(ctx, c, 380 + (1 - e) * 200, -330, 1, 0); ctx.globalAlpha = e;
      ctx.fillStyle = '#1D7A46'; ctx.beginPath(); ctx.roundRect(0, 0, 520, 56, [16, 16, 0, 0]); ctx.fill();
      ctx.font = font(BODY, 26); ctx.fillStyle = '#FFFFFF'; ctx.fillText('Chart data', 24, 37);
      ['', 'Revenue'].forEach((s, q) => { ctx.font = font(HEAD, 26); ctx.fillStyle = '#141833'; ctx.fillText(s, 40 + q * 220, 100); });
      vals.forEach((v, i) => {
        const hot = i === 3 && t > w.numbers!.start - 0.05;
        if (hot) { ctx.fillStyle = 'rgba(255,91,58,0.18)'; ctx.fillRect(16, 118 + i * 62, 488, 54); }
        ctx.font = font(BODY, 30); ctx.fillStyle = '#141833'; ctx.fillText(`Q${i + 1}`, 40, 154 + i * 62);
        ctx.font = font(HEAD, 32); ctx.fillStyle = hot ? ORANGE : '#141833'; ctx.fillText(`${Math.round(v)}`, 260, 154 + i * 62);
      });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'REAL CHARTS. EDIT DATA.', -380, -360, 66, t, this.ctx.start + 0.05, { from: '#FFFFFF', to: '#FFB37A' });
    pill(ctx, c, 'ON REQUEST: --native-charts-and-tables', -380, 330, 26, { a: clamp((t - this.w.ask!.start) / 0.2) });
    void WHITE;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.data!.start, 0.015) }; }
}
