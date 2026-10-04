// TREE: five lines in one continuous treemap shot.
// "The idea is simple. Every folder becomes a box, sized by what it really costs on disk, with boxes
//  inside boxes all the way down." — the pen rules the home box; level 1 splits in, a dimension sizes
//  the biggest box, then levels 2 and 3 grow inside.
// "Scroll, and you zoom into a folder until it fills the screen, then drop straight inside." — the
//  camera dives into src until it fills the frame, then into rust-tools, where level 4 grows.
// "Color tells you what kind of data it is: code, toolchains, media, documents, caches." — back out;
//  colour sweeps in; each kind named pulses and joins the legend.
// "And diagonal stripes mark space you can get back, like caches and build output." — amber hatch.
// "It even counts hidden folders, because a hidden cache is often the biggest thing in your home
//  folder." — the dot-folders are tagged; the camera pushes in on .cache, selected in amber.
import { type LineBatch } from '@engine/lines';
import { rectPts } from '@kit/_vo';
import { drawTile, frameTile, sizeOf, gib, type Tile, type Kind } from '@kit/_treemap';
import { Plate, ARCH, SCREEN, lineRows, chip, pt, clamp, ease, lerp, prog, pulse, rgba, mixCss, setWorld, label, w2s, font, F, type Cam, type Line } from '@kit/_mp';
import { HOME, DISK, FILL, STRIP, NEUTRAL, AMBER, RECT, layoutHome, byPath } from '@ep/home';

const LEGEND: [Kind, string][] = [['code', 'Code'], ['toolchain', 'Toolchains'], ['media', 'Media'], ['documents', 'Documents'], ['cache', 'Cache'], ['git', 'Git'], ['synced', 'Synced'], ['agent', 'Agent scratch'], ['build', 'Build output']];

export default class Tree extends Plate {
  tiles: Tile[] = [];
  map = new Map<string, Tile>();
  lines: Line[] = [];
  kindT: Partial<Record<Kind, number>> = {};

  build() {
    const w = this.w;
    this.tiles = layoutHome();
    this.map = byPath(this.tiles);
    const L5 = this.take('The idea is simple', ['idea', 'simple.', 'Every', ['f5', 'folder'], 'becomes', 'box,', 'sized', 'really', 'costs', 'disk,', ['boxes1', 'boxes', 0], ['inside5', 'inside'], ['boxes2', 'boxes', 1], 'all', 'down.']);
    const L6 = this.take('Scroll, and you zoom', ['Scroll,', 'zoom', ['f6', 'folder'], 'fills', 'screen,', 'drop', 'straight', ['inside6', 'inside.']]);
    const L7 = this.take('Color tells you', ['Color', 'kind', 'code,', 'toolchains,', 'media,', 'documents,', 'caches.']);
    const L8 = this.take('And diagonal stripes', ['diagonal', 'stripes', 'space', 'back,', ['caches8', 'caches'], 'build', 'output.']);
    const L9 = this.take('It even counts hidden', ['even', 'counts', ['hidden1', 'hidden', 0], 'folders,', 'because', ['hidden2', 'hidden', 1], 'cache', 'often', 'biggest', 'home', ['f9', 'folder.']]);
    this.lines = [L5, L6, L7, L8, L9];
    this.kindT = { code: w.code!.start, toolchain: w.toolchains!.start, media: w.media!.start, documents: w.documents!.start, cache: w.caches!.start };
    const fam = ARCH(100, 700);
    this.lines.forEach((l, i) => this.screenKw.push(...lineRows(l.words, -880, 418, 50, fam, `L${i}`, 1760).words));
    // the pen rules the home box on "idea … simple"
    this.plot.add(rectPts(RECT.x, RECT.y, RECT.w, RECT.h), w.idea!.start, w.simple!.end, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.4, group: 'root' });
    // the dimension on the biggest box, on "sized … costs on disk"
    const big = this.map.get('~/.cache')!;
    this.plot.dimension(pt(big.x, big.y - 16), pt(big.x + big.w, big.y - 16), gib(sizeOf(big.node)), w.sized!.start, 'dim', 22);
    this.plot.wp(pt(RECT.x + RECT.w + 30, RECT.y + RECT.h + 20), w.down!.end, 0.1);
    // camera
    const K = this.cam;
    const src = this.map.get('~/src')!, rust = this.map.get('~/src/rust-tools')!, cache = this.map.get('~/.cache')!;
    const full = { cx: 0, cy: -10, z: 0.98 };
    const fs = frameTile(src, 1920, 1080, 0.9), fr = frameTile(rust, 1920, 1080, 0.86), fc = frameTile(cache, 1920, 1080, 0.62);
    K.key(this.ctx.start, 0, -20, 1.06, -0.004);
    K.key(w.down!.end, full.cx, full.cy, full.z, 0.0, ease.inOutCubic);
    K.key(w.zoom!.start, full.cx, full.cy, full.z, 0.0, ease.linear);
    K.key(w.screen!.end, fs.cx, fs.cy, fs.z, 0.0, ease.inOutCubic);
    K.key(w.drop!.start, fs.cx, fs.cy, fs.z * 1.03, 0.0, ease.linear);
    K.key(w.inside6!.end + 0.1, fr.cx, fr.cy, fr.z, 0.0, ease.inOutCubic);
    K.key(w.color!.start + 0.45, full.cx, full.cy - 20, full.z * 0.97, 0.0, ease.inOutCubic);
    K.key(w.even!.start, full.cx, full.cy - 20, full.z * 0.98, 0.0, ease.linear);
    K.key(w.biggest!.start + 0.2, fc.cx, fc.cy, fc.z, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, fc.cx, fc.cy, fc.z * 1.04, 0.0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  alpha(g: string, t: number) {
    if (g.startsWith('L')) {
      const i = +g.slice(1), l = this.lines[i]!, nxt = this.lines[i + 1];
      return prog(t, l.start - 0.25, l.start - 0.05) * (nxt ? 1 - prog(t, nxt.start - 0.2, nxt.start - 0.05) : 1);
    }
    if (g === 'root') return 1 - prog(t, this.w.every!.start + 0.3, this.w.every!.start + 0.8);
    if (g === 'dim') return 1 - prog(t, this.w.boxes2!.start, this.w.boxes2!.start + 0.4);
    return 1;
  }

  /** When a tile appears: level 1 across "Every … box", level 2 on "inside", 3 across "boxes … down", 4 on "drop". */
  tAppear(t: Tile) {
    const w = this.w;
    const u = (t.x - RECT.x) / RECT.w * 0.6 + (t.y - RECT.y) / RECT.h * 0.4;
    if (t.depth === 0) return w.simple!.start;
    if (t.depth === 1) return lerp(w.every!.start, w.box!.end, u);
    if (t.depth === 2) return lerp(w.inside5!.start, w.boxes2!.start, u);
    if (t.depth === 3) return lerp(w.boxes2!.start, w.down!.end, u);
    return w.drop!.start + 0.15 * u;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tc = w.color!.start;
    for (const tile of this.tiles) {
      const ta = this.tAppear(tile);
      const a = ease.outCubic(prog(t, ta, ta + 0.3));
      if (a <= 0) continue;
      const n = tile.node;
      const u = (tile.x - RECT.x) / RECT.w;
      const col = prog(t, tc + u * 0.6, tc + u * 0.6 + 0.3);
      const kt = this.kindT[n.kind];
      const kp = kt !== undefined ? pulse(t, kt, 0.35) : 0;
      const fill = mixHex(NEUTRAL.fill, FILL[n.kind], col);
      const strip = mixHex(NEUTRAL.strip, STRIP[n.kind], col);
      const hatchT = w.diagonal!.start + u * 0.7;
      const hidden = n.hidden ? prog(t, w.hidden1!.start, w.hidden1!.start + 0.3) : 0;
      const sel = n.name === '.cache' && tile.depth === 1 ? prog(t, w.cache!.start, w.cache!.start + 0.2) : 0;
      drawTile(ctx, c, tile, {
        a, fill: kp > 0.02 ? mixHex(fill, STRIP[n.kind], kp * 0.5) : fill, strip, border: 'rgba(4,12,20,0.9)',
        text: rgba('bone', 0.95), dim: rgba('ash', 0.9), labelSize: tile.depth <= 1 ? 19 : 15,
        hatch: n.reclaim ? prog(t, hatchT, hatchT + 0.6) : 0, hatchCol: AMBER,
        sel: Math.max(sel, 0.6 * hidden * (n.hidden && tile.depth <= 2 ? 1 : 0) * (1 - sel)), selCol: sel > 0 ? AMBER : rgba('signal', 0.9),
      });
      // "hidden" tags on the dot-folders
      if (hidden > 0 && n.hidden && tile.depth <= 2 && tile.w * c.z > 90) {
        setWorld(ctx, c, tile.x + tile.w - 8 / c.z, tile.y + tile.h - 10 / c.z);
        ctx.globalAlpha = hidden;
        label(ctx, 'HIDDEN', 0, 0, { size: 12 / c.z * 1.0, col: rgba('signal', 1), spacing: 2 / c.z, align: 'right', weight: 600 });
        ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // the home box's title above it, and the disk
    const ra = prog(t, w.simple!.start, w.simple!.start + 0.3);
    if (ra > 0) {
      setWorld(ctx, c, RECT.x, RECT.y - 40);
      ctx.globalAlpha = ra;
      ctx.font = font(F.mono(600), 26); ctx.fillStyle = rgba('bone', 0.95); ctx.fillText('~', 0, 0);
      ctx.font = font(F.mono(400), 22); ctx.fillStyle = rgba('ash', 0.95); ctx.fillText(`${gib(sizeOf(HOME))}  ·  disk ${DISK.total} GiB, ${DISK.free} GiB free`, 36, 0);
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // legend (screen space, top): kinds join as they are named; "Reclaimable" on the stripes line
    const H2 = 540;
    let x = -880;
    const items: { text: string; col: string; t0: number; hatch?: boolean }[] = LEGEND.map(([k, name]) => ({ text: name, col: STRIP[k], t0: this.kindT[k] ?? w.caches!.end + 0.1 }));
    items.push({ text: 'Reclaimable', col: AMBER, t0: w.stripes!.start, hatch: true });
    const legendA = 1 - prog(t, w.even!.start, w.even!.start + 0.3);
    for (const it of items) {
      const a = prog(t, it.t0 - 0.05, it.t0 + 0.15) * legendA;
      setWorld(ctx, SCREEN, x, -H2 + 44);
      ctx.font = font(F.mono(500), 21);
      const tw = ctx.measureText(it.text).width;
      if (a > 0) {
        ctx.globalAlpha = a;
        ctx.fillStyle = it.col; ctx.fillRect(0, -15, 15, 15);
        if (it.hatch) { ctx.strokeStyle = '#07131F'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let d = -15; d < 15; d += 5) { ctx.moveTo(d, 0); ctx.lineTo(d + 15, -15); } ctx.stroke(); }
        ctx.fillStyle = rgba('bone', 0.92); ctx.fillText(it.text, 22, 0);
        ctx.globalAlpha = 1;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      x += 22 + tw + 30;
    }
    // what can be had back, on "build output"
    const back = this.tiles.filter((tl) => tl.depth === 1 && tl.node.reclaim).reduce((s, tl) => s + sizeOf(tl.node), 0)
      + sizeOf(this.map.get('~/src/rust-tools/target')!.node) + sizeOf(this.map.get('~/src/shop-app/node_modules')!.node) + sizeOf(this.map.get('~/Dropbox/.dropbox.cache')!.node);
    const ba = prog(t, w.output!.start, w.output!.start + 0.2) * (1 - prog(t, w.even!.start, w.even!.start + 0.3));
    if (ba > 0) chip(ctx, SCREEN, `${back} GiB can be had back`, 660, -440, { a: ba, size: 24, fill: rgba('ink', 0.92), border: AMBER, col: AMBER });
    // "biggest thing in ~": a leader from .cache
    const tb = w.biggest!.start;
    if (t > tb) {
      const cache = this.map.get('~/.cache')!;
      const k = prog(t, tb + 0.1, tb + 0.4);
      const [sx, sy] = w2s(c, cache.x + cache.w, cache.y + cache.h * 0.5);
      ctx.globalAlpha = k;
      ctx.strokeStyle = AMBER; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + 10, sy); ctx.lineTo(sx + 10 + 70 * k, sy); ctx.stroke();
      ctx.font = font(F.mono(600), 26); ctx.fillStyle = AMBER;
      ctx.fillText('the biggest thing in ~', sx + 92, sy - 8);
      ctx.font = font(F.mono(400), 22); ctx.fillStyle = rgba('bone', 0.9);
      ctx.fillText(`.cache  ·  ${gib(sizeOf(cache.node))}  ·  hidden`, sx + 92, sy + 24);
      ctx.globalAlpha = 1;
    }
    // the scroll cursor while diving
    const z0 = w.zoom!.start, z1 = w.inside6!.end;
    const ca = prog(t, z0 - 0.2, z0) * (1 - prog(t, z1, z1 + 0.3));
    if (ca > 0) {
      const sx = 960 + 40, sy = 540 + 30;
      ctx.globalAlpha = ca;
      ctx.setTransform(1.3, 0, 0, 1.3, sx, sy);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(15, 40); ctx.lineTo(21, 37); ctx.lineTo(15, 24); ctx.lineTo(27, 24); ctx.closePath();
      ctx.fillStyle = rgba('bone', 1); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba('ink', 1); ctx.stroke();
      // scroll chevrons
      for (let i = 0; i < 3; i++) {
        const ph = ((t * 2.2 + i / 3) % 1);
        ctx.globalAlpha = ca * (1 - ph);
        ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(34, 8 + ph * 26); ctx.lineTo(42, 16 + ph * 26); ctx.lineTo(50, 8 + ph * 26); ctx.stroke();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    }
    // a dark band behind the captions
    const g = ctx.createLinearGradient(0, 1080 - 260, 0, 1080);
    g.addColorStop(0, 'rgba(7,19,31,0)'); g.addColorStop(0.45, 'rgba(7,19,31,0.82)'); g.addColorStop(1, 'rgba(7,19,31,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0, 1080 - 260, 1920, 260);
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.008 * pulse(t, w.every!.start, 0.12) + 0.006 * pulse(t, w.color!.start, 0.1), vignette: 0.38 };
  }
}

/** Mix two colours given as #rrggbb or rgb(r,g,b). */
export function mixHex(a: string, b: string, k: number) {
  const ch = (s: string) => (s.startsWith('#') ? [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) : s.match(/\d+/g)!.slice(0, 3).map(Number));
  const A = ch(a), B = ch(b), q = clamp(k);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i]! - v) * q)).join(',')})`;
}
void mixCss;
