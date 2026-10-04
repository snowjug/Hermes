// DELETE: "Mark them, review the list, and only then delete."
// Three beats stacked as giant words: MARK. (the reclaimable boxes turn pink), REVIEW. (the list slides
// up), THEN DELETE. (the button is pressed, the boxes drop out, the free space jumps).
import { type LineBatch } from '@engine/lines';
import { drawTile, sizeOf, gib, layoutTree, type Tile } from '@kit/_treemap';
import { Plate, slam, chip, ease, prog, pulse, noise1, rgba, setWorld, font, F, type Cam } from '@kit/_mp';
import { FILL, STRIP, TEXT, DANGER, DISK, HOME } from '@ep/home';

const MINI = { x: -480, y: 40, w: 900, h: 470 };

export default class Delete extends Plate {
  paper = true;
  tiles: Tile[] = [];
  picked: Tile[] = [];

  build() {
    const w = this.w;
    this.tiles = layoutTree(HOME, MINI.x, MINI.y, MINI.w, MINI.h, { pad: 5, header: (d) => (d <= 1 ? 34 : 24), maxDepth: 3 });
    const want = ['~/.cache', '~/src/rust-tools/target', '~/src/shop-app/node_modules'];
    this.picked = this.tiles.filter((t) => want.includes(t.path));
    this.take('Mark them', ['Mark', 'them,', 'review', 'list,', 'only', 'then', 'delete.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -40, 1.0, 0);
    K.key(w.delete!.start, 0, -40, 1.0, 0, ease.linear);
    K.key(w.delete!.start + 0.15, 0, -20, 1.05, 0.01, ease.outExpo);
    K.key(this.ctx.end, 0, -20, 1.06, 0.01, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  inPicked(tl: Tile) { return this.picked.some((p) => tl === p || tl.path.startsWith(p.path + '/')); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    slam(ctx, c, 'MARK.', -480, -620, 160, t, w.mark!.start, { wd: 125, wt: 900, col: 'ink' });
    slam(ctx, c, 'REVIEW.', -480, -450, 160, t, w.review!.start, { wd: 125, wt: 900, col: 'ink' });
    slam(ctx, c, 'THEN', -480, -280, 160, t, w.then!.start, { wd: 125, wt: 900, col: 'ink' });
    slam(ctx, c, 'DELETE.', -480, -110, 160, t, w.delete!.start, { wd: 125, wt: 900, col: 'signal', hotCol: 'signal' });
    const gone = ease.inCubic(prog(t, w.delete!.start + 0.15, w.delete!.start + 0.55));
    for (const tl of this.tiles) {
      if (tl.depth === 0) continue;
      const n = tl.node;
      const pk = this.inPicked(tl);
      const drop = pk ? gone : 0;
      const r = { ...tl, y: tl.y + drop * 900 };
      drawTile(ctx, c, r as Tile, {
        a: pk ? 1 - drop * 0.6 : 1, fill: FILL[n.kind], strip: STRIP[n.kind], border: rgba('ink', 1), text: TEXT[n.kind], dim: TEXT[n.kind], labelSize: tl.depth <= 1 ? 22 : 17, thick: 4,
        marked: pk ? prog(t, w.mark!.start + 0.05, w.mark!.start + 0.25) : 0, markCol: DANGER, showSize: false,
      });
    }
    // the list
    const la = ease.outExpo(prog(t, w.review!.start, w.review!.start + 0.35)) * (1 - prog(t, w.delete!.start, w.delete!.start + 0.2));
    if (la > 0) {
      const x = -250, y = 80 + (1 - la) * 400;
      setWorld(ctx, c, x, y);
      ctx.globalAlpha = la;
      ctx.fillStyle = rgba('bone', 1); ctx.fillRect(0, 0, 500, 330);
      ctx.lineWidth = 8; ctx.strokeStyle = rgba('ink', 1); ctx.strokeRect(0, 0, 500, 330);
      ctx.font = font(F.mono(700), 30); ctx.fillStyle = rgba('ink', 1); ctx.fillText('REVIEW', 26, 52);
      this.picked.forEach((p, i) => {
        ctx.font = font(F.mono(600), 28); ctx.fillStyle = rgba('ink', 1);
        ctx.fillText(p.node.name, 26, 112 + i * 60);
        ctx.fillStyle = DANGER; ctx.textAlign = 'right'; ctx.fillText(gib(sizeOf(p.node)), 474, 112 + i * 60); ctx.textAlign = 'left';
      });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the gain
    const ga = prog(t, w.delete!.start + 0.4, w.delete!.start + 0.6);
    if (ga > 0) {
      const sum = this.picked.reduce((s, p) => s + sizeOf(p.node), 0);
      chip(ctx, c, `${DISK.free} → ${DISK.free + sum} GiB FREE`, -30, 440, { a: ga, size: 56, fill: rgba('ink', 1), col: rgba('bone', 1), border: rgba('ink', 1) });
    }
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.mark!.start, 0.06) + pulse(t, w.review!.start, 0.06) + 1.4 * pulse(t, w.delete!.start, 0.07);
    return { zoom: 1 + 0.02 * hit, shake: [9 * hit * noise1(t * 60, 1), 9 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.05 };
  }
}
