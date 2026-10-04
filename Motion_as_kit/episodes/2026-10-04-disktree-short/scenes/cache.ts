// CACHE: "The biggest box is often a hidden cache. Striped boxes are space you can win back, like caches
// and build output."
// The whole home folder as fat tiles. The biggest box (black: a cache) bulges and takes the slammed
// label HIDDEN CACHE · 58 GiB. Then yellow stripes sweep over everything that can be had back, and a
// counter adds it up.
import { type LineBatch } from '@engine/lines';
import { drawTile, sizeOf, gib, type Tile } from '@kit/_treemap';
import { Plate, ARCH, lineRows, chip, slam, ease, prog, pulse, noise1, rgba, setWorld, type Cam, type Line } from '@kit/_mp';
import { FILL, STRIP, TEXT, STRIPE, RECT, layoutHome } from '@ep/home';

export default class Cache extends Plate {
  paper = true;
  tiles: Tile[] = [];
  lines: Line[] = [];

  build() {
    const w = this.w;
    this.tiles = layoutHome();
    const L5 = this.take('The biggest box', ['biggest', 'box', 'often', 'hidden', 'cache.']);
    const L6 = this.take('Striped boxes', ['Striped', 'boxes', 'space', 'win', 'back,', 'caches', 'build', 'output.']);
    this.lines = [L5, L6];
    this.screenKw.push(...lineRows(L5.words, -480, -800, 104, ARCH(112.5, 900), 'L0', 960).words);
    this.screenKw.push(...lineRows(L6.words, -480, -810, 78, ARCH(112.5, 900), 'L1', 960).words);
    const K = this.cam;
    K.key(this.ctx.start, 0, 90, 1.0, 0);
    K.key(w.hidden!.start, 0, 90, 1.0, 0, ease.linear);
    K.key(w.hidden!.start + 0.15, -60, 40, 1.12, -0.015, ease.outExpo);
    K.key(L6.start - 0.1, -60, 40, 1.13, -0.015, ease.linear);
    K.key(L6.start + 0.12, 0, 90, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 90, 1.03, 0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  alpha(g: string, t: number) {
    const s = this.lines[1]!.start;
    if (g === 'L0') return 1 - prog(t, s - 0.15, s);
    if (g === 'L1') return prog(t, s - 0.15, s);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const big = this.tiles.find((tl) => tl.node.name === '.cache' && tl.depth === 1)!;
    const bulge = ease.outBack(prog(t, w.biggest!.start, w.biggest!.start + 0.3));
    const stripeT0 = w.striped!.start;
    for (const tl of this.tiles) {
      if (tl.depth === 0) continue;
      const n = tl.node;
      const isBig = tl === big || tl.parent === big;
      // the big box grows a little out of the grid
      const s = isBig ? 1 + 0.06 * bulge * (1 - prog(t, this.lines[1]!.start, this.lines[1]!.start + 0.3)) : 1;
      const cx = big.x + big.w / 2, cy = big.y + big.h / 2;
      const r = { ...tl, x: cx + (tl.x - cx) * s, y: cy + (tl.y - cy) * s, w: tl.w * s, h: tl.h * s };
      const u = (tl.x - RECT.x) / RECT.w * 0.6 + (tl.y - RECT.y) / RECT.h * 0.4;
      drawTile(ctx, c, r as Tile, {
        a: 1, fill: FILL[n.kind], strip: STRIP[n.kind], border: rgba('ink', 1), text: TEXT[n.kind], dim: TEXT[n.kind], labelSize: tl.depth <= 1 ? 26 : 20, thick: 5,
        hatch: n.reclaim ? prog(t, stripeT0 + u * 0.8, stripeT0 + u * 0.8 + 0.4) : 0, hatchCol: n.kind === 'cache' ? STRIPE : rgba('ink', 1),
        sel: tl === big ? prog(t, w.hidden!.start, w.hidden!.start + 0.15) * (1 - prog(t, this.lines[1]!.start, this.lines[1]!.start + 0.2)) : 0, selCol: rgba('signal', 1),
      });
    }
    // the label on the big box
    const la = 1 - prog(t, this.lines[1]!.start, this.lines[1]!.start + 0.2);
    if (la > 0) {
      const ba0 = prog(t, w.hidden!.start, w.hidden!.start + 0.1) * la;
      if (ba0 > 0) {
        setWorld(ctx, c, big.x + 6, big.y + big.h * 0.55 - 58);
        ctx.globalAlpha = ba0; ctx.fillStyle = rgba('ink', 1); ctx.fillRect(0, 0, Math.min(big.w - 12, 300), 200);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      slam(ctx, c, 'HIDDEN', big.x + 18, big.y + big.h * 0.55, 54, t, w.hidden!.start, { wd: 125, wt: 900, col: 'signal', hotCol: 'signal', a: la });
      slam(ctx, c, 'CACHE', big.x + 18, big.y + big.h * 0.55 + 58, 54, t, w.cache!.start, { wd: 125, wt: 900, col: 'bone', hotCol: 'signal', a: la });
      chip(ctx, c, gib(sizeOf(big.node)), big.x + big.w * 0.5, big.y + big.h * 0.55 + 120, { a: la * prog(t, w.cache!.start, w.cache!.start + 0.2), size: 32, fill: rgba('bone', 1), col: rgba('ink', 1), border: rgba('ink', 1) });
    }
    // the total that can be had back
    const back = 86;
    const ba = prog(t, w.back!.start, w.back!.start + 0.2);
    if (ba > 0) {
      const v = Math.round(back * ease.outCubic(prog(t, w.back!.start, w.output!.end)));
      chip(ctx, c, `+${v} GiB TO WIN BACK`, 0, 545, { a: ba, size: 54, fill: rgba('ink', 1), col: rgba('bone', 1), border: rgba('ink', 1) });
    }
  }

  drawTop(ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = rgba('bone', 1); ctx.fillRect(0, 0, 1080, 520);
    ctx.fillStyle = rgba('ink', 1); ctx.fillRect(0, 512, 1080, 8);
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.hidden!.start + 0.1, 0.07) + 0.6 * pulse(t, w.striped!.start, 0.07);
    return { zoom: 1 + 0.025 * hit, shake: [9 * hit * noise1(t * 60, 1), 9 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.05 };
  }
}
