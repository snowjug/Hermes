// BOXES: "This free app turns every folder into a box, sized by what it really takes up on disk.
// Folders inside folders, all the way down."
// The words at the top; under them the home folder as fat comic tiles: the disk box on "app", level 1
// on "every folder into a box", sizes on "sized … disk"; then levels 2 and 3, and a snap-zoom dive into
// src → rust-tools → target on "all the way down".
import { type LineBatch } from '@engine/lines';
import { rectPts } from '@kit/_vo';
import { drawTile, frameTile, type Tile } from '@kit/_treemap';
import { Plate, ARCH, lineRows, ease, lerp, prog, pulse, noise1, rgba, type Cam, type Line } from '@kit/_mp';
import { FILL, STRIP, TEXT, RECT, layoutHome, byPath } from '@ep/home';

export default class Boxes extends Plate {
  paper = true;
  tiles: Tile[] = [];
  lines: Line[] = [];

  build() {
    const w = this.w;
    this.tiles = layoutHome();
    const map = byPath(this.tiles);
    const L3 = this.take('This free app', ['app', 'every', ['f3', 'folder'], 'box,', 'sized', 'really', 'disk.']);
    const L4 = this.take('Folders inside folders', [['folders1', 'Folders', 0], 'inside', ['folders2', 'folders,', 0], 'all', 'way', 'down.']);
    this.lines = [L3, L4];
    this.screenKw.push(...lineRows(L3.words, -480, -810, 70, ARCH(112.5, 900), 'L0', 960).words);
    this.screenKw.push(...lineRows(L4.words, -480, -790, 110, ARCH(112.5, 900), 'L1', 960).words);
    this.plot.add(rectPts(RECT.x, RECT.y, RECT.w, RECT.h), w.app!.start, w.app!.end + 0.25, 'ink', { pen: true, ez: ease.inOutQuad, width: 6, group: 'root' });
    const src = map.get('~/src')!, rust = map.get('~/src/rust-tools')!, target = map.get('~/src/rust-tools/target')!;
    // the dive frames each folder in the lower part of the screen (the words keep the top)
    const fr = (t: Tile) => { const f = frameTile(t, 1080, 1250, 0.95); return { ...f, cy: f.cy - 330 / f.z }; };
    const f1 = fr(src), f2 = fr(rust), f3 = fr(target);
    const K = this.cam;
    const cy = 90;
    K.key(this.ctx.start, 0, cy, 1.0, 0);
    K.key(w.all!.start, 0, cy, 1.0, 0, ease.linear);
    K.key(w.all!.start + 0.18, f1.cx, f1.cy, f1.z, 0, ease.outExpo);
    K.key(w.way!.start, f1.cx, f1.cy, f1.z * 1.02, 0, ease.linear);
    K.key(w.way!.start + 0.18, f2.cx, f2.cy, f2.z, 0, ease.outExpo);
    K.key(w.down!.start, f2.cx, f2.cy, f2.z * 1.02, 0, ease.linear);
    K.key(w.down!.start + 0.18, f3.cx, f3.cy, f3.z, 0, ease.outExpo);
    K.key(this.ctx.end, f3.cx, f3.cy, f3.z * 1.04, 0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  alpha(g: string, t: number) {
    const s = this.lines[1]!.start;
    if (g === 'L0') return 1 - prog(t, s - 0.15, s);
    if (g === 'L1') return prog(t, s - 0.15, s);
    if (g === 'root') return 1 - prog(t, this.w.every!.start, this.w.every!.start + 0.3);
    return 1;
  }

  tAppear(t: Tile) {
    const w = this.w;
    const u = ((t.x - RECT.x) / RECT.w) * 0.5 + ((t.y - RECT.y) / RECT.h) * 0.5;
    if (t.depth === 0) return w.app!.end;
    if (t.depth === 1) return lerp(w.every!.start, w.box!.end, u);
    if (t.depth === 2) return lerp(w.inside!.start, w.folders2!.end, u);
    return lerp(w.all!.start, w.way!.end, u);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const sizes = prog(t, w.sized!.start, w.sized!.start + 0.3);
    for (const tl of this.tiles) {
      if (tl.depth === 0) continue;
      const ta = this.tAppear(tl);
      const a = ease.outBack(prog(t, ta, ta + 0.22));
      if (a <= 0) continue;
      const n = tl.node;
      drawTile(ctx, c, tl, { a: Math.min(1, a), fill: FILL[n.kind], strip: STRIP[n.kind], border: rgba('ink', 1), text: TEXT[n.kind], dim: TEXT[n.kind], labelSize: tl.depth <= 1 ? 26 : 20, showSize: sizes > 0.5, thick: 5 });
    }
  }

  drawTop(ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {
    // the words sit on a yellow band so the dive never runs under them
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = rgba('bone', 1); ctx.fillRect(0, 0, 1080, 520);
    ctx.fillStyle = rgba('ink', 1); ctx.fillRect(0, 512, 1080, 8);
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.all!.start + 0.12, 0.06) + pulse(t, w.way!.start + 0.12, 0.06) + pulse(t, w.down!.start + 0.12, 0.06);
    return { zoom: 1 + 0.02 * hit, shake: [8 * hit * noise1(t * 60, 1), 8 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.05 };
  }
}
