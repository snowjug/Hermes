// NAME: "It's called openGym. Nearly 7,000 GitHub stars this week."
// openGym lands in ransom letters across the top; on "Nearly" a counter card counts to +6,749 while gold
// star stickers land around it; the app's stats screen sits behind, and a tag says FREE · OPEN SOURCE.
import { drawCut, tag, ransom, ease, prog, setWorld, springStep, hash } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { counter, PAPER } from '@ep/kit';
import { Court, LIME } from '@ep/court';

function star(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, t: number, t0: number, seed: number) {
  if (t < t0) return;
  const sp = springStep(t - t0, 3.4, 0.4);
  setWorld(ctx, c, x, y, 0.3 + 0.7 * sp, (hash(seed, 1) - 0.5) * 0.8 + (1 - sp) * 1.2);
  const path = (rr: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? rr * 0.45 : rr; ctx.lineTo(Math.cos(an) * q, Math.sin(an) * q); }
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.translate(5, 7); path(r + 8); ctx.fill(); ctx.translate(-5, -7);
  ctx.fillStyle = PAPER; path(r + 8); ctx.fill();
  ctx.fillStyle = '#F2B824'; path(r); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Name extends Court {
  override uses = ['s_stats'];

  build() {
    this.take("It's called openGym", ['called', 'openGym.', 'Nearly', '7,000', 'GitHub', 'stars', 'week.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -60, 1.06, 0.006);
    K.key(this.w.nearly!.start, 0, 0, 1.0, -0.004);
    K.key(this.ctx.end, 0, 10, 1.03, -0.008);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.s_stats!, 230, 330, t, { t0: this.ctx.start + 0.1, scale: 0.7, rot: 0.08, seed: 51 });
    counter(ctx, c, -40, -60, 6749, ease.outCubic(prog(t, w.nearly!.start, w.stars!.end)), '★ GITHUB STARS THIS WEEK', t, w.nearly!.start - 0.1, { prefix: '+', size: 170, rot: -0.03 });
    [[-330, -330], [320, -310], [-360, 190], [-150, 330], [380, 120]].forEach(([x, y], i) => star(ctx, c, x!, y!, 46, t, w.github!.start + i * 0.1, 60 + i));
    tag(ctx, c, 'FREE · OPEN SOURCE · AGPL-3.0', -120, 560, 34, { a: prog(t, w.week!.start, w.week!.start + 0.12), rot: 0.03, seed: 52, bg: LIME });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = this.ctx.start + 0.02, dur = Math.max(0.3, w.opengym!.end - t0);
    const size = 220;
    const wd = ransom(ctx, c, 'openGym', 0, -560, size, t, t0, dur, 17, 0);
    const s2 = Math.min(size, (size * 960) / wd);
    const wd2 = ransom(ctx, c, 'openGym', 0, -560, s2, t, t0, dur, 17, 0);
    ransom(ctx, c, 'openGym', -wd2 / 2, -560, s2, t, t0, dur, 17);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.opengym!.start, 0.03) * this.punch(t, this.w.stars!.start, 0.02) };
  }
}
