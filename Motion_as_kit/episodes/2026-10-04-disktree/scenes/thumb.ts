// THUMB: the thumbnail, rendered as a still after the end (render-node.mjs stills --only thumb).
// WHAT'S EATING YOUR DISK? over the home folder's treemap, its biggest box selected in amber.
import { type LineBatch } from '@engine/lines';
import { drawTile, gib, sizeOf } from '@kit/_treemap';
import { Plate, slam, chip, rgba, setWorld, font, F, type Cam } from '@kit/_mp';
import { FILL, STRIP, AMBER, layoutHome } from '@ep/home';
import { layoutTree } from '@kit/_treemap';
import { HOME } from '@ep/home';

export default class Thumb extends Plate {
  tiles = layoutTree(HOME, 40, -470, 900, 940, { pad: 5, header: (d) => (d <= 1 ? 40 : 28), maxDepth: 2 });
  build() { this.cam.key(this.ctx.start, 0, 0, 1, 0); this.showPen = false; void layoutHome; }
  gridOpts() { return { ink: 1.3 }; }
  drawUI(ctx: CanvasRenderingContext2D, _t: number, c: Cam) {
    const t = this.ctx.start + 10;
    for (const tl of this.tiles) {
      if (tl.depth === 0) continue;
      const big = tl.node.name === '.cache' && tl.depth === 1;
      drawTile(ctx, c, tl, { a: 1, fill: FILL[tl.node.kind], strip: STRIP[tl.node.kind], border: 'rgba(4,12,20,0.9)', text: rgba('bone', 1), dim: rgba('ash', 1), labelSize: big ? 34 : 20, hatch: tl.node.reclaim ? 1 : 0, hatchCol: AMBER, sel: big ? 1 : 0, selCol: AMBER });
    }
    const cache = this.tiles.find((tl) => tl.node.name === '.cache' && tl.depth === 1)!;
    chip(ctx, c, `.cache · ${gib(sizeOf(cache.node))}`, cache.x + cache.w / 2, cache.y + cache.h / 2, { size: 46, fill: rgba('ink', 0.95), border: AMBER, col: AMBER });
    const g = ctx.createLinearGradient(0, 0, 1100, 0);
    g.addColorStop(0, 'rgba(7,19,31,0.97)'); g.addColorStop(0.75, 'rgba(7,19,31,0.85)'); g.addColorStop(1, 'rgba(7,19,31,0)');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, 0, 1100, 1080);
    slam(ctx, c, "WHAT'S", -880, -190, 190, t, 0, { wt: 900, col: 'bone' });
    slam(ctx, c, 'EATING', -880, 10, 190, t, 0, { wt: 900, col: 'bone' });
    slam(ctx, c, 'YOUR DISK?', -880, 210, 150, t, 0, { wt: 900, col: 'signal' });
    setWorld(ctx, c, -876, 330);
    ctx.font = font(F.mono(600), 40); ctx.fillStyle = rgba('acid', 1); ctx.fillText('disktree · free · 3.4 s scans', 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  drawFX(_X: LineBatch, _t: number, _c: Cam) {}
  postFX() { return { bloom: 0.75, vignette: 0.45, grain: 0.04 }; }
}
