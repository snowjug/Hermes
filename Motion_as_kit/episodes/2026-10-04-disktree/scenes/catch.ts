// CATCH: "The catch? It guesses what a folder is from its name, so some colors can be wrong on your
// machine. Still, seeing exactly where your space went, before deleting anything, is worth a lot."
// "The catch?" in serif. One folder, named "cache", is coloured and hatched as a cache because of its
// name; on "wrong" it opens to show what it really holds (a client's photos), turns the media colour and
// takes a stamp. Then the camera pulls back to the cleaned-up home folder and its free space.
import { type LineBatch } from '@engine/lines';
import { placeRow } from '@kit/_vo';
import { drawTile, gib, sizeOf, type Tile } from '@kit/_treemap';
import { Plate, ARCH, makeStamp, drawStamp, chip, pt, ease, lerp, prog, pulse, rgba, setWorld, font, F, label, type Cam } from '@kit/_mp';
import { HOME, DISK, FILL, STRIP, AMBER, layoutHome, without } from '@ep/home';
import { mixHex } from './tree';

const BOX = { x: 120, y: -330, w: 760, h: 540 };

export default class Catch extends Plate {
  after: Tile[] = [];
  stamp!: HTMLCanvasElement;
  tName = 0; tWrong = 0; tStill = 0;

  build() {
    const w = this.w;
    this.after = layoutHome(without(HOME, ['~/.cache']));
    const L15 = this.take('The catch?', ['catch?', 'guesses', ['f15', 'folder'], 'name,', 'colors', 'wrong', 'machine.']);
    const L16 = this.take('Still, seeing exactly', ['Still,', 'seeing', 'exactly', 'space', 'went,', 'before', 'deleting', 'worth', 'lot.']);
    const r = placeRow(L15.words.slice(0, 2), -880, -200, 170, F.serif(600, true), 'A', { ant: 0.25 });
    r.words[1]!.done = 'signal';
    this.kw.push(...r.words);
    this.kw.push(...placeRow(this.span(L15, 'It', 'name,'), -880, 330, 50, ARCH(100, 700), 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L15, 'so', 'machine.'), -880, 395, 50, ARCH(100, 700), 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L16, 'Still,', 'went,'), -880, 1330, 54, ARCH(100, 700), 'B', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L16, 'before', 'lot.'), -880, 1400, 54, ARCH(100, 700), 'B', { ant: 0.2 }).words);
    this.tName = w.name!.start; this.tWrong = w.wrong!.start; this.tStill = w.still!.start;
    this.stamp = makeStamp('NOT A CACHE', 'NAMED  "cache"', 'CHECK BEFORE YOU DELETE', '#FF4E4E', 21);
    const K = this.cam;
    K.key(this.ctx.start, -380, -140, 1.15, -0.008);
    K.key(w.guesses!.start + 0.2, 0, -20, 0.98, 0.0, ease.inOutCubic);
    K.key(this.tStill - 0.1, 20, 0, 1.0, 0.0, ease.linear);
    K.key(this.tStill + 0.5, 0, 950, 0.96, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 960, 1.0, 0.0, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the folder named "cache"
    const ba = prog(t, w.guesses!.start - 0.2, w.guesses!.start + 0.2);
    if (ba > 0) {
      const open = ease.inOutCubic(prog(t, this.tWrong, this.tWrong + 0.5));
      const fill = mixHex(FILL.cache, FILL.media, open), strip = mixHex(STRIP.cache, STRIP.media, open);
      const tile = { node: { name: 'work/cache', size: 9, kind: 'cache' as const }, x: BOX.x, y: BOX.y, w: BOX.w, h: BOX.h, depth: 1, path: '~/work/cache', index: 0, parent: null };
      drawTile(ctx, c, tile as Tile, { a: ba, fill, strip, border: 'rgba(4,12,20,0.9)', text: rgba('bone', 1), dim: rgba('ash', 1), labelSize: 30, hatch: 1 - open, hatchCol: AMBER, showSize: true });
      // the guess, from the name
      const na = prog(t, this.tName, this.tName + 0.25) * (1 - open);
      if (na > 0) {
        setWorld(ctx, c, BOX.x + 16, BOX.y + 50);
        ctx.globalAlpha = na; ctx.strokeStyle = AMBER; ctx.lineWidth = 4 / c.z;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(250, 0); ctx.stroke();
        ctx.font = font(F.mono(500), 24); ctx.fillStyle = AMBER;
        ctx.fillText('kind: cache  ←  from the name', 0, 150);
        ctx.fillText('reclaimable?', 0, 190);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // what it really holds
      if (open > 0) {
        setWorld(ctx, c, BOX.x + 30, BOX.y + 120);
        ctx.globalAlpha = open;
        for (let i = 0; i < 12; i++) {
          const x = (i % 4) * 172, y = Math.floor(i / 4) * 118;
          ctx.fillStyle = `hsl(${(i * 47) % 360} 35% ${32 + (i % 3) * 6}%)`;
          ctx.fillRect(x, y, 158, 104);
          ctx.strokeStyle = rgba('bone', 0.35); ctx.lineWidth = 1.5 / c.z; ctx.strokeRect(x, y, 158, 104);
          ctx.fillStyle = rgba('bone', 0.5); ctx.beginPath(); ctx.moveTo(x + 20, y + 84); ctx.lineTo(x + 60, y + 44); ctx.lineTo(x + 90, y + 70); ctx.lineTo(x + 110, y + 54); ctx.lineTo(x + 140, y + 84); ctx.closePath(); ctx.fill();
        }
        ctx.font = font(F.mono(500), 24); ctx.fillStyle = rgba('bone', 1);
        ctx.fillText('client-shoot-2026/  ·  the only copy', 0, 390);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // pulled back: the cleaned-up home folder
    const ha = prog(t, this.tStill + 0.2, this.tStill + 0.6);
    if (ha > 0) {
      const dy = 950 - 30;
      for (const tl of this.after) {
        if (tl.depth === 0 || tl.depth > 2) continue;
        const n = tl.node;
        drawTile(ctx, c, { ...tl, y: tl.y * 0.82 + dy, h: tl.h * 0.82 } as Tile, { a: ha, fill: FILL[n.kind], strip: STRIP[n.kind], border: 'rgba(4,12,20,0.9)', text: rgba('bone', 0.95), dim: rgba('ash', 0.9), labelSize: tl.depth <= 1 ? 19 : 15, hatch: n.reclaim ? 1 : 0, hatchCol: AMBER });
      }
      const gain = 58;
      chip(ctx, c, `disk  ·  ${DISK.free + gain} GiB free  ·  nothing deleted you didn't see`, 0, dy - 390, { a: ha, size: 24, fill: rgba('ink', 0.92), border: rgba('signal', 1), col: rgba('signal', 1) });
    }
    void gib; void sizeOf; void pt; void lerp; void label;
  }

  drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawStamp(ctx, c, this.stamp, BOX.x + BOX.w / 2, BOX.y + BOX.h - 60, t, this.tWrong + 0.35, 0.36, -0.08);
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const s = pulse(t, this.tWrong + 0.35, 0.07);
    return { zoom: 1 + 0.012 * pulse(t, this.w.catch!.start, 0.12) + 0.02 * s, shake: [6 * s * Math.sin(t * 80), 6 * s * Math.cos(t * 70)] as [number, number] };
  }
}
