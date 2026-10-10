// DXBALL: "One real case: the classic game DX-Ball. It followed a sound into the code that pans it left and
// right." / "The rebuilt C code passes 3,205 tests against the original, and compiles to the same 63 bytes."
// CASE FILE banner. A wide panel: a brick-breaker (bricks, paddle, a bouncing ball) between two speakers
// whose sound waves swell on the ball's side as it travels (PING!). Then the camera drops to a second row:
// the rebuilt C code, a test counter racing to 3,205 / 3,205 with a green tick, and a 63 / 63 BYTES MATCH
// stamp (EXACT!).
import type { Cam } from '@kit/_vo';
import { font, F } from '@engine/type';
import { Comic, panel, codeCard, label, sfx, title, INK, RED, YEL, BLUE, GREEN, ORANGE, PINK, SKY, BLOCK, clamp, ease, TAU } from '@ep/comic';

const ROWS = [RED, ORANGE, YEL, GREEN, BLUE];

function speaker(g: CanvasRenderingContext2D, x: number, y: number, side: number, loud: number) {
  g.fillStyle = '#2B2D33'; g.strokeStyle = INK; g.lineWidth = 6;
  g.beginPath(); g.roundRect(x - 60, y - 100, 120, 200, 14); g.fill(); g.stroke();
  g.fillStyle = '#5A5F6B'; g.beginPath(); g.arc(x, y + 30, 40, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.arc(x, y - 55, 20, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = YEL; g.lineCap = 'round';
  for (let i = 1; i <= 3; i++) {
    const a = clamp(loud * 1.4 - (i - 1) * 0.3);
    if (a <= 0) continue;
    g.lineWidth = 9 * a; g.beginPath(); g.arc(x + side * 40, y, 70 + i * 34, side > 0 ? -0.7 : Math.PI - 0.7, side > 0 ? 0.7 : Math.PI + 0.7); g.stroke();
  }
  g.lineCap = 'butt';
}

export default class DxBall extends Comic {
  build() {
    this.take('One real case', ['real', 'case:', 'classic', 'game', 'DX-Ball.', 'followed', 'sound', 'code', 'pans', 'left', 'right.']);
    this.take('The rebuilt C code', ['rebuilt', 'C', 'passes', '3,205', 'tests', 'original,', 'compiles', 'same', '63', 'bytes.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -170, 0.98, -0.004);
    K.key(w.pans!.start, 0, -160, 1.02, 0.002);
    K.key(w.rebuilt!.start - 0.25, 0, 640, 0.98, 0, ease.inOutCubic);
    K.key(this.ctx.end, 40, 650, 1.02, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -940, -520, 1880, 740, t, this.ctx.start, {
      fill: '#141824', from: 'pop',
      draw: (g) => {
        // bricks
        ROWS.forEach((col, r) => { for (let i = 0; i < 10; i++) { if ((i + r) % 7 === 3 && t > w.followed!.start) continue; g.fillStyle = col; g.fillRect(-560 + i * 112, -300 + r * 46, 104, 38); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(-560 + i * 112, -300 + r * 46, 104, 38); } });
        // ball and paddle
        const u = (t - this.ctx.start) * 0.55;
        const bx = Math.sin(u * TAU) * 480, by = 120 - Math.abs(Math.cos(u * TAU * 1.5)) * 200;
        g.fillStyle = '#9AA3B2'; g.beginPath(); g.roundRect(bx - 110, 250, 220, 30, 12); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(bx, by, 22, 0, TAU); g.fill(); g.stroke();
        // speakers: louder on the ball's side once the sound is followed
        const on = clamp((t - w.sound!.start) / 0.3);
        const pan = bx / 480;
        speaker(g, -820, 0, 1, on * clamp(0.5 - pan * 0.5));
        speaker(g, 820, 0, -1, on * clamp(0.5 + pan * 0.5));
        if (t > w.pans!.start) {
          g.font = font(F.mono(700), 34); g.fillStyle = YEL; g.textAlign = 'center';
          g.fillText(`pan = ${pan >= 0 ? '+' : ''}${(pan * 100).toFixed(0)}`, 0, 210); g.textAlign = 'left';
        }
      },
    });
    // second row: the proof
    panel(ctx, c, -940, 300, 900, 680, t, w.rebuilt!.start - 0.3, {
      fill: SKY, dots: 'rgba(31,95,209,0.2)', from: 'left',
      draw: (g) => {
        codeCard(g, -400, -270, 800, [['/* rebuilt from the x86 */', '#8C93A3'], ['int pan_for(int x) {', '#FFD21F'], ['  int d = x - CENTER;', '#E6E6E6'], ['  return d * RANGE / CENTER;', '#E6E6E6'], ['}', '#FFD21F']], t, w.rebuilt!.start, 1.2, { size: 30, title: 'REBUILT C (SKETCH)' });
      },
    });
    panel(ctx, c, 40, 300, 900, 680, t, w.passes!.start - 0.15, {
      fill: '#FFFFFF', dots: 'rgba(24,165,88,0.2)', from: 'right',
      draw: (g) => {
        const k = ease.outCubic(clamp((t - w.passes!.start) / Math.max(0.4, w.tests!.end - w.passes!.start)));
        const n = Math.round(3205 * k).toLocaleString('en-US');
        g.font = font(BLOCK, 120); g.textAlign = 'center'; g.fillStyle = INK; g.fillText(`${n} / 3,205`, 0, -120);
        g.font = font(BLOCK, 44); g.fillText('TESTS PASSED', 0, -50);
        if (k >= 1) { g.strokeStyle = GREEN; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, 40); g.lineTo(-10, 90); g.lineTo(80, -10); g.stroke(); g.lineCap = 'butt'; }
        g.textAlign = 'left';
        if (t > w['63']!.start - 0.05) label(g, '63 / 63 BYTES MATCH', 0, 200, 48, { fill: YEL, rot: -0.03 });
      },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'CASE FILE: DX-BALL', 0, -420, 80, t, w.classic!.start - 0.05, { fill: YEL, stroke: INK, rot: -0.02 });
    sfx(ctx, c, 'PING!', 560, -80, 90, t, w.sound!.start, { fill: YEL, rot: 0.12 });
    sfx(ctx, c, 'EXACT!', 700, 940, 100, t, w.bytes!.start, { fill: YEL, rot: -0.1, burst: RED });
    void PINK;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w['dxball']!.start, 0.015) * this.punch(t, this.w.bytes!.start, 0.02) }; }
}
