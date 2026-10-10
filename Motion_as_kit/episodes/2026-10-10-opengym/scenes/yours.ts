// YOURS: "openGym runs on yours. And this week, it picked up nearly 7,000 GitHub stars."
// The data-centre print is still on the desk; on "openGym" the name lands in ransom letters, on "yours"
// the marker crosses the data centre out and it flies off as a Raspberry Pi and a laptop land (YOUR
// SERVER). On "week" a counter card counts to 6,749 stars this week while gold star stickers land.
import { drawCut, tag, ransom, crossOut, ease, prog, clamp, setWorld, springStep, hash } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, counter, PAPER } from '@ep/kit';

const DC = { x: 470, y: -40, s: 0.6, r: 0.05 };

function star(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, t: number, t0: number, seed: number) {
  if (t < t0) return;
  const sp = springStep(t - t0, 3.4, 0.4);
  setWorld(ctx, c, x, y, 0.3 + 0.7 * sp, (hash(seed, 1) - 0.5) * 0.8 + (1 - sp) * 1.2);
  const path = (rr: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? rr * 0.45 : rr; ctx.lineTo(Math.cos(an) * q, Math.sin(an) * q); }
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.translate(5, 7); path(r + 7); ctx.fill(); ctx.translate(-5, -7);
  ctx.fillStyle = PAPER; path(r + 7); ctx.fill();
  ctx.fillStyle = '#F2B824'; path(r); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Yours extends Desk {
  override uses = ['dc', 'pi', 'laptop'];
  override wipeOut = true;
  override wipeFrom: 'left' | 'right' = 'right';

  build() {
    this.take('openGym runs on yours', ['openGym', 'runs', 'yours.']);
    this.take('And this week', ['week,', 'picked', 'nearly', '7,000', 'GitHub', 'stars.']);
    const w = this.w;
    crossOut(DC.x - 270, DC.y - 190, 540, 380, 31).forEach((p, j) => this.plot.add(p, w.yours!.start + j * 0.1, w.yours!.start + 0.16 + j * 0.1, 'signal', { pen: true, width: 9, group: 'x' }));
    const K = this.cam;
    K.key(this.ctx.start, 60, -60, 1.0, 0.004);
    K.key(w.yours!.start, 80, -20, 1.02, 0.0, ease.inOutCubic);
    K.key(w.week!.start, 0, 40, 0.98, -0.004, ease.inOutCubic);
    K.key(this.ctx.end, 0, 50, 1.02, -0.006, ease.linear);
  }
  override galpha(g: string, t: number) {
    return g === 'x' ? 1 - prog(t, this.w.yours!.end + 0.25, this.w.yours!.end + 0.45) : 1;
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.dc!, DC.x, DC.y, t, { t0: this.ctx.start - 1, scale: DC.s, rot: DC.r, seed: 6, t1: w.yours!.end + 0.25, flyDir: -0.3 });
    drawCut(ctx, c, this.cuts.pi!, 380, -60, t, { t0: w.yours!.end + 0.35, scale: 0.72, rot: -0.06, seed: 9 });
    tag(ctx, c, 'YOUR SERVER', 360, 170, 34, { a: prog(t, w.yours!.end + 0.5, w.yours!.end + 0.65), rot: 0.03, seed: 10 });
    drawCut(ctx, c, this.cuts.laptop!, -520, 10, t, { t0: w.yours!.end + 0.55, scale: 0.55, rot: 0.04, seed: 11 });
    tag(ctx, c, 'OR ANY OLD PC', -520, 230, 30, { a: prog(t, w.yours!.end + 0.7, w.yours!.end + 0.85), rot: -0.04, seed: 12 });
    const tw = w.week!.start - 0.1;
    counter(ctx, c, 0, 230, 6749, ease.outCubic(prog(t, w.picked!.start, w.stars!.end)), '★ GITHUB STARS IN ONE WEEK', t, tw, { rot: -0.02, prefix: '+' });
    const spots = [[-330, 120], [330, 110], [-250, 330], [270, 340], [-420, 240], [430, 250]];
    spots.forEach(([x, y], i) => star(ctx, c, x!, y!, 34, t, w.picked!.start + i * 0.12, 40 + i));
    void clamp;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.opengym!.start, dur = Math.max(0.35, w.runs!.start - t0);
    const wd = ransom(ctx, c, 'openGym', 0, -330, 150, t, t0, dur, 17, 0);
    ransom(ctx, c, 'openGym', -wd / 2, -330, 150, t, t0, dur, 17);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.opengym!.start, 0.015) * this.punch(t, this.w.yours!.end + 0.35, 0.01) };
  }
}
