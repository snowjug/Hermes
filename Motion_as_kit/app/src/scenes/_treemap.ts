// Treemaps for the disktree plates: a squarified layout of a directory tree (every directory a box
// sized by its bytes, boxes inside boxes) and Canvas2D drawing of its tiles in world space: fill by kind
// of data, a header strip, name and size labels that only appear when the tile is big enough on
// screen, the diagonal hatch for space that can be had back, and a "marked" (danger) overlay.
import { F, font, measure } from '@engine/type';
import { clamp } from '@engine/util';
import { setWorld, w2s, type Cam } from './_vo';

export type Kind = 'code' | 'agent' | 'toolchain' | 'synced' | 'git' | 'media' | 'documents' | 'cache' | 'build' | 'other';
export interface TNode { name: string; size: number; kind: Kind; children?: TNode[]; reclaim?: boolean; hidden?: boolean }
export interface Tile { node: TNode; x: number; y: number; w: number; h: number; depth: number; path: string; index: number; parent: Tile | null }

/** The sizes of a directory: its own, or the sum of its children's. */
export const sizeOf = (n: TNode): number => (n.children?.length ? n.children.reduce((s, c) => s + sizeOf(c), 0) : n.size);

function worst(areas: number[], side: number) {
  const s = areas.reduce((a, b) => a + b, 0);
  const mx = Math.max(...areas), mn = Math.min(...areas);
  return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
}

/** Squarified treemap (Bruls, Huizing, van Wijk) of items already sorted by size, descending. */
export function squarify<T>(items: { item: T; area: number }[], x: number, y: number, w: number, h: number) {
  const out: { item: T; x: number; y: number; w: number; h: number }[] = [];
  let rest = items.filter((i) => i.area > 0);
  while (rest.length) {
    const side = Math.min(w, h);
    const row = [rest[0]!];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]!].map((r) => r.area), side) <= worst(row.map((r) => r.area), side)) row.push(rest[i++]!);
    const ra = row.reduce((s, r) => s + r.area, 0);
    if (w >= h) {
      const cw = ra / h;
      let cy = y;
      for (const r of row) { const ch = r.area / cw; out.push({ item: r.item, x, y: cy, w: cw, h: ch }); cy += ch; }
      x += cw; w -= cw;
    } else {
      const rh = ra / w;
      let cx = x;
      for (const r of row) { const cw = r.area / rh; out.push({ item: r.item, x: cx, y, w: cw, h: rh }); cx += cw; }
      y += rh; h -= rh;
    }
    rest = rest.slice(row.length);
  }
  return out;
}

/**
 * Lay out a tree in the rectangle (x, y, w, h). Each directory keeps a header band (`header(depth)`)
 * for its label and an inner padding (`pad`). Returns every tile, parents before children.
 */
export function layoutTree(root: TNode, x: number, y: number, w: number, h: number, o: { pad?: number; header?: (d: number) => number; maxDepth?: number } = {}) {
  const pad = o.pad ?? 3, header = o.header ?? ((d: number) => (d <= 1 ? 30 : 20)), maxDepth = o.maxDepth ?? 5;
  const tiles: Tile[] = [];
  const walk = (n: TNode, tx: number, ty: number, tw: number, th: number, depth: number, path: string, index: number, parent: Tile | null) => {
    const t: Tile = { node: n, x: tx, y: ty, w: tw, h: th, depth, path, index, parent };
    tiles.push(t);
    if (!n.children?.length || depth >= maxDepth) return;
    const hd = header(depth + 1) ;
    const ix = tx + pad, iy = ty + (depth === 0 ? pad : hd), iw = tw - 2 * pad, ih = th - (depth === 0 ? 2 * pad : hd + pad);
    if (iw < 8 || ih < 8) return;
    const kids = [...n.children].sort((a, b) => sizeOf(b) - sizeOf(a));
    const total = kids.reduce((s, k) => s + sizeOf(k), 0);
    const items = kids.map((k) => ({ item: k, area: (sizeOf(k) / total) * iw * ih }));
    squarify(items, ix, iy, iw, ih).forEach((r, i) => walk(r.item, r.x + pad / 2, r.y + pad / 2, r.w - pad, r.h - pad, depth + 1, `${path}/${r.item.name}`, i, t));
  };
  walk(root, x, y, w, h, 0, root.name, 0, null);
  return tiles;
}

export const gib = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(0) : v.toFixed(1)) + ' GiB';

export interface TileStyle {
  /** 0..1 visibility (fade + grow from the tile's top-left). */
  a: number;
  fill: string;
  /** Header strip colour (the kind's colour at full strength). */
  strip?: string;
  border?: string;
  text?: string;
  dim?: string;
  /** 0..1 hatch progress (diagonal stripes, drawn in `hatch` colour). */
  hatch?: number;
  hatchCol?: string;
  /** 0..1 marked overlay (danger colour). */
  marked?: number;
  markCol?: string;
  /** 0..1 selection outline. */
  sel?: number;
  selCol?: string;
  labelSize?: number;
  showSize?: boolean;
  /** Thick comic-book borders (pop style). */
  thick?: number;
}

/** Draw one tile in world space. Labels and fine detail fade with the tile's size on screen. */
export function drawTile(ctx: CanvasRenderingContext2D, c: Cam, t: Tile, s: TileStyle) {
  if (s.a <= 0.003) return;
  const sw = t.w * c.z, sh = t.h * c.z;
  if (sw < 1.5 || sh < 1.5) return;
  const grow = 0.6 + 0.4 * s.a;
  const w = t.w * grow, h = t.h * grow;
  setWorld(ctx, c, t.x, t.y);
  ctx.globalAlpha = clamp(s.a);
  ctx.fillStyle = s.fill;
  ctx.fillRect(0, 0, w, h);
  if (s.marked && s.marked > 0) { ctx.globalAlpha = clamp(s.a) * clamp(s.marked) * 0.85; ctx.fillStyle = s.markCol ?? '#FF4E4E'; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = clamp(s.a); }
  // hatch: diagonal stripes ~9 px apart on screen, revealed left to right
  if (s.hatch && s.hatch > 0) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w * clamp(s.hatch), h); ctx.clip();
    ctx.strokeStyle = s.hatchCol ?? '#FFB23F';
    ctx.lineWidth = 1.6 / c.z;
    const step = 9 / c.z;
    ctx.beginPath();
    for (let d = -h; d < w; d += step) { ctx.moveTo(d, h); ctx.lineTo(d + h, 0); }
    ctx.globalAlpha = clamp(s.a) * 0.55;
    ctx.stroke();
    ctx.restore();
  }
  const hair = (s.thick ?? 1) / c.z;
  if (s.strip && sh > 10) { ctx.fillStyle = s.strip; ctx.fillRect(0, 0, w, Math.min(h, (s.thick ? 8 : 3) / c.z)); }
  ctx.lineWidth = hair;
  ctx.strokeStyle = s.border ?? 'rgba(0,0,0,0.5)';
  ctx.strokeRect(0, 0, w, h);
  if (s.sel && s.sel > 0) { ctx.lineWidth = (3 * s.sel) / c.z; ctx.strokeStyle = s.selCol ?? '#FFB23F'; ctx.strokeRect(-2 / c.z, -2 / c.z, w + 4 / c.z, h + 4 / c.z); }
  // labels: on screen 13..30 px, only when the tile can hold them
  const ls = s.labelSize ?? 16;
  const px = ls * c.z;
  const la = clamp((sw - 60) / 60) * clamp((sh - 26) / 20) * clamp((px - 9) / 4);
  if (la > 0.01) {
    ctx.globalAlpha = clamp(s.a) * la;
    ctx.font = font(F.mono(600), ls);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = s.text ?? '#FFFFFF';
    const maxW = w - ls * 1.2;
    let name = t.node.name;
    while (name.length > 2 && measure(name, F.mono(600), ls) > maxW) name = name.slice(0, -2) + '…';
    ctx.fillText(name, ls * 0.5, ls * 1.25);
    if (s.showSize !== false && sh > ls * 3.2) {
      ctx.font = font(F.mono(400), ls * 0.82);
      ctx.fillStyle = s.dim ?? 'rgba(255,255,255,0.6)';
      ctx.fillText(gib(sizeOf(t.node)), ls * 0.5, ls * 2.35);
    }
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The camera that frames a tile (fill = share of the screen it should take). */
export function frameTile(t: { x: number; y: number; w: number; h: number }, W: number, H: number, fill = 0.92) {
  return { cx: t.x + t.w / 2, cy: t.y + t.h / 2, z: Math.min((W * fill) / t.w, (H * fill) / t.h) };
}

/** Screen-space centre of a tile (for cursors, sparks). */
export const tileCentre = (c: Cam, t: Tile) => w2s(c, t.x + t.w / 2, t.y + t.h / 2);
