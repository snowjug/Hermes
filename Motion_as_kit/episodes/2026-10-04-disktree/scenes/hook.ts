// HOOK: "Shopify founder Tobi Lütke just shipped a disk cleaner."
// The spark at rest on the blueprint sheet (the loop point). A nearly full home folder glows faintly
// behind as a treemap; the line lands as kinetic type; a repo card types itself and a disk bar sits at
// 94 % in the danger colour.
import { type LineBatch } from '@engine/lines';
import { placeRow } from '@kit/_vo';
import { drawTile, type Tile } from '@kit/_treemap';
import { Plate, ARCH, drawWindow, typed, pt, ease, prog, pulse, noise1, rgba, setWorld, font, F, label, type Cam } from '@kit/_mp';
import { DISK, FILL, STRIP, DANGER, layoutHome } from '@ep/home';

export default class Hook extends Plate {
  tiles: Tile[] = [];

  build() {
    const w = this.w;
    this.tiles = layoutHome();
    this.take('Shopify founder Tobi', ['Shopify', 'founder', 'Tobi', 'Lütke', 'just', 'shipped', 'a', 'disk', 'cleaner.']);
    this.kw.push(...placeRow([w.shopify!, w.founder!], -800, -250, 64, ARCH(100, 700), 'K', { ant: 0.15 }).words);
    this.kw.push(...placeRow([w.tobi!, w.ltke!], -806, -60, 172, ARCH(112.5, 900), 'K', { ant: 0.15 }).words);
    this.kw.push(...placeRow([w.just!, w.shipped!, w.a!, w.disk!, w.cleaner!], -800, 70, 70, ARCH(100, 700), 'K', { ant: 0.15 }).words);
    this.plot.wp(pt(-850, -282), 0, Math.max(0.01, w.shopify!.start - 0.02));
    this.plot.add([pt(-800, 100), pt(-800 + 700, 96)], w.cleaner!.start, w.cleaner!.end + 0.05, 'signal', { pen: true, ez: ease.inOutQuad, width: 4, group: 'K' });
    const K = this.cam;
    K.key(0, -800, -260, 2.0, 0.02);
    K.key(w.shopify!.start, -800, -260, 2.0, 0.02);
    K.key(w.tobi!.start + 0.1, -300, -120, 1.08, 0.0, ease.outCubic);
    K.key(this.ctx.end, -200, -60, 1.0, 0.0, ease.inOutCubic);
  }

  drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the home folder, faint, behind everything
    const a = 0.22 * prog(t, 0.2, 1.2);
    for (const tl of this.tiles) {
      if (tl.depth === 0) continue;
      drawTile(ctx, c, tl, { a: a * (tl.depth === 1 ? 1 : 0.8), fill: FILL[tl.node.kind], strip: STRIP[tl.node.kind], border: 'rgba(4,12,20,0.9)', labelSize: 15, text: rgba('bone', 0.6), dim: rgba('ash', 0.5) });
    }
    const g = ctx.createLinearGradient(0, 0, 1920, 0);
    g.addColorStop(0, 'rgba(7,19,31,0.92)'); g.addColorStop(0.55, 'rgba(7,19,31,0.55)'); g.addColorStop(1, 'rgba(7,19,31,0.25)');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  }
  hasUnder = true;

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the repo card
    const t0 = w.tobi!.start;
    const a = prog(t, t0, t0 + 0.25);
    if (a > 0) {
      const x = 330, y = -330;
      drawWindow(ctx, c, x, y, 560, 250, 'github.com', { a });
      typed(ctx, c, 'tobi/disktree', x + 34, y + 110, t, t0 + 0.1, 0.4, { size: 40, weight: 600, col: 'bone', a });
      typed(ctx, c, 'Tobias Lütke · Shopify', x + 34, y + 160, t, t0 + 0.35, 0.4, { size: 24, col: 'ash', a, caret: false });
      typed(ctx, c, 'Rust · MIT · ★ 2,274', x + 34, y + 205, t, t0 + 0.55, 0.4, { size: 24, col: 'signal', a, caret: false });
    }
    // the disk bar, nearly full
    const da = prog(t, w.disk!.start - 0.1, w.disk!.start + 0.15);
    if (da > 0) {
      const x = -800, y = 250, bw = 1660, used = 1 - DISK.free / DISK.total;
      setWorld(ctx, c, x, y);
      ctx.globalAlpha = da;
      label(ctx, `DISK  ·  ${DISK.total - DISK.free} OF ${DISK.total} GiB USED`, 0, -18, { size: 20, col: rgba('ash', 1), spacing: 4 });
      ctx.fillStyle = rgba('bone', 0.12); ctx.fillRect(0, 0, bw, 26);
      const blink = 0.75 + 0.25 * Math.sin(t * 12);
      ctx.fillStyle = DANGER; ctx.globalAlpha = da * blink; ctx.fillRect(0, 0, bw * used * ease.outCubic(prog(t, w.disk!.start, w.disk!.start + 0.5)), 26);
      ctx.globalAlpha = da;
      ctx.font = font(F.mono(600), 26); ctx.fillStyle = DANGER; ctx.textAlign = 'right';
      ctx.fillText(`${DISK.free} GiB free`, bw, -14); ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    const sh = 7 * pulse(t, w.tobi!.start + 0.05, 0.06);
    return {
      zoom: 1 + 0.018 * pulse(t, w.tobi!.start, 0.1) + 0.01 * pulse(t, w.cleaner!.start, 0.1), shake: [sh * noise1(t * 45, 3), sh * noise1(t * 51, 4)] as [number, number],
      frame: 1 - prog(t, w.shopify!.start - 0.05, w.shopify!.start + 0.4, ease.inOutCubic),
    };
  }
}
