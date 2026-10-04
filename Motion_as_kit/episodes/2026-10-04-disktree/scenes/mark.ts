// MARK: "Found the culprit? Mark it, and it takes the danger color, along with everything inside it.
// Nothing is deleted yet. You review the list first. Then pick the trash, which you can undo, or
// delete permanently, which always asks first. When it's done, it scans again and shows how much space
// you really got back."
// The same home folder. The cursor finds .cache; SPACE marks it red and the red runs down into its
// contents. The review panel slides in with the list and the disk before/after; the trash button lights
// (undoable), then the permanent one, which raises its confirmation. Then a scan line sweeps, .cache
// collapses, the treemap re-lays itself out, and the free space counts up.
import { type LineBatch } from '@engine/lines';
import { drawTile, sizeOf, gib, type Tile } from '@kit/_treemap';
import { Plate, ARCH, SCREEN, lineRows, drawWindow, chip, pt, clamp, ease, lerp, prog, pulse, rgba, setWorld, font, F, label, w2s, LIN, type Cam, type Line } from '@kit/_mp';
import { HOME, DISK, FILL, STRIP, DANGER, AMBER, RECT, layoutHome, byPath, without } from '@ep/home';

const GONE = '~/.cache';
const PANEL = { x: 330, y: -400, w: 560, h: 700 };

export default class Mark extends Plate {
  before: Tile[] = [];
  after = new Map<string, Tile>();
  lines: Line[] = [];
  tMark = 0; tCascade = 0; tTrash = 0; tPerm = 0; tAsk = 0; tScan = 0; tGain = 0; tPanel = 0;

  build() {
    const w = this.w;
    this.before = layoutHome();
    this.after = byPath(layoutHome(without(HOME, [GONE])));
    const L10 = this.take('Found the culprit', ['Found', 'culprit?', 'Mark', 'danger', 'along', 'everything', 'inside']);
    const L11 = this.take('Nothing is deleted yet', ['Nothing', 'deleted', 'review', 'list']);
    const L12 = this.take('Then pick the trash', ['pick', 'trash,', 'undo,', 'delete', 'permanently,', 'always', 'asks']);
    const L13 = this.take('When it\'s done', ['done,', 'scans', 'again', 'shows', 'space', 'really', 'got', 'back.']);
    this.lines = [L10, L11, L12, L13];
    const fam = ARCH(100, 700);
    this.lines.forEach((l, i) => this.screenKw.push(...lineRows(l.words, -880, 418, 50, fam, `L${i}`, 1760).words));
    this.tMark = w.mark!.start + 0.1; this.tCascade = w.everything!.start;
    this.tPanel = w.review!.start - 0.15;
    this.tTrash = w.trash!.start; this.tPerm = w.permanently!.start; this.tAsk = w.always!.start;
    this.tScan = w.scans!.start; this.tGain = w.space!.start;
    const K = this.cam;
    K.key(this.ctx.start, -380, -90, 1.15, 0.0);
    K.key(this.tCascade + 0.4, -330, -60, 1.12, 0.0, ease.inOutCubic);
    K.key(this.tPanel + 0.3, 40, -40, 0.98, 0.0, ease.inOutCubic);
    K.key(this.tScan, 40, -40, 0.98, 0.0, ease.linear);
    K.key(this.tScan + 0.6, 0, -20, 0.96, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, -20, 0.98, 0.0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  alpha(g: string, t: number) {
    if (g.startsWith('L')) {
      const i = +g.slice(1), l = this.lines[i]!, nxt = this.lines[i + 1];
      return prog(t, l.start - 0.25, l.start - 0.05) * (nxt ? 1 - prog(t, nxt.start - 0.2, nxt.start - 0.05) : 1);
    }
    return 1;
  }

  marked(tl: Tile, t: number) {
    if (tl.path === GONE) return prog(t, this.tMark, this.tMark + 0.15);
    if (tl.path.startsWith(GONE + '/')) return prog(t, this.tCascade + tl.index * 0.08, this.tCascade + tl.index * 0.08 + 0.15);
    return 0;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the treemap, re-laid out after the rescan
    const k = ease.inOutCubic(prog(t, this.tScan + 0.35, this.tScan + 1.1));
    const sweep = prog(t, this.tScan, this.tScan + 0.5);
    for (const tl of this.before) {
      const gone = tl.path === GONE || tl.path.startsWith(GONE + '/');
      const nt = this.after.get(tl.path);
      const r = gone ? { ...tl, w: tl.w * (1 - k), h: tl.h * (1 - k) } : nt ? { ...tl, x: lerp(tl.x, nt.x, k), y: lerp(tl.y, nt.y, k), w: lerp(tl.w, nt.w, k), h: lerp(tl.h, nt.h, k) } : tl;
      const a = gone ? 1 - prog(t, this.tScan + 0.3, this.tScan + 0.8) : 1;
      if (tl.depth === 0) continue;
      const n = tl.node;
      drawTile(ctx, c, r as Tile, {
        a, fill: FILL[n.kind], strip: STRIP[n.kind], border: 'rgba(4,12,20,0.9)', text: rgba('bone', 0.95), dim: rgba('ash', 0.9),
        labelSize: tl.depth <= 1 ? 19 : 15, hatch: n.reclaim ? 1 : 0, hatchCol: AMBER,
        marked: this.marked(tl, t), markCol: DANGER, sel: tl.path === GONE ? prog(t, this.tMark - 0.5, this.tMark - 0.3) * (1 - prog(t, this.tScan, this.tScan + 0.3)) : 0, selCol: AMBER,
      });
    }
    // the scan line
    if (sweep > 0 && sweep < 1) {
      const x = RECT.x + RECT.w * sweep;
      const [sx0, sy0] = w2s(c, x, RECT.y), [sx1, sy1] = w2s(c, x, RECT.y + RECT.h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.strokeStyle = rgba('signal', 0.95); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
    }
    // the review panel
    const pa = ease.outExpo(prog(t, this.tPanel, this.tPanel + 0.5)) * (1 - prog(t, this.tScan + 0.2, this.tScan + 0.6));
    if (pa > 0) {
      const dx = (1 - pa) * 300;
      const x = PANEL.x + dx, y = PANEL.y;
      drawWindow(ctx, c, x, y, PANEL.w, PANEL.h, 'review · 1 marked', { a: pa, fill: rgba('ink2', 0.98) });
      setWorld(ctx, c, x + 30, y + 110);
      ctx.globalAlpha = pa;
      ctx.fillStyle = DANGER; ctx.fillRect(0, -26, 8, 34);
      ctx.font = font(F.mono(600), 30); ctx.fillStyle = rgba('bone', 1); ctx.fillText('.cache', 24, 0);
      ctx.font = font(F.mono(400), 21); ctx.fillStyle = rgba('ash', 1); ctx.fillText('~/.cache  ·  5 folders', 24, 34);
      ctx.font = font(F.mono(600), 30); ctx.fillStyle = DANGER; ctx.textAlign = 'right'; ctx.fillText(gib(sizeOf(this.before.find((b) => b.path === GONE)!.node)), PANEL.w - 60, 0); ctx.textAlign = 'left';
      // disk now → after
      const gain = sizeOf(this.before.find((b) => b.path === GONE)!.node);
      label(ctx, 'DISK', 0, 120, { size: 15, col: rgba('ash', 1), spacing: 3 });
      ctx.font = font(F.mono(500), 26); ctx.fillStyle = rgba('bone', 0.95);
      ctx.fillText(`${DISK.free} GiB free  →  ${DISK.free + gain} GiB after`, 0, 160);
      // the two buttons
      const btn = (txt: string, sub: string, by: number, on: number, col: string) => {
        ctx.fillStyle = on > 0 ? `rgba(${col === DANGER ? '255,78,78' : '47,211,255'},${0.12 + 0.2 * on})` : rgba('bone', 0.05);
        ctx.fillRect(0, by, PANEL.w - 60, 92);
        ctx.lineWidth = (1.2 + 2 * on) / c.z; ctx.strokeStyle = on > 0 ? col : rgba('bone', 0.3); ctx.strokeRect(0, by, PANEL.w - 60, 92);
        ctx.font = font(F.mono(600), 28); ctx.fillStyle = on > 0 ? col : rgba('bone', 0.85); ctx.fillText(txt, 24, by + 42);
        ctx.font = font(F.mono(400), 19); ctx.fillStyle = rgba('ash', 1); ctx.fillText(sub, 24, by + 74);
      };
      const onT = prog(t, this.tTrash, this.tTrash + 0.15) * (1 - prog(t, this.tPerm - 0.1, this.tPerm + 0.1));
      const onP = prog(t, this.tPerm, this.tPerm + 0.15);
      btn('Move to trash', 'recoverable until the trash is emptied', 230, onT, LIN.signal ? rgba('signal', 1) : AMBER);
      btn('Delete permanently', 'always asks first', 350, onP, DANGER);
      label(ctx, 'NOTHING IS DELETED UNTIL YOU COMMIT', 0, 500, { size: 14, col: rgba('ash', 0.95 * prog(t, this.w.nothing!.start, this.w.nothing!.start + 0.3)), spacing: 3 });
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the confirmation
    const ca = ease.outBack(prog(t, this.tAsk, this.tAsk + 0.3)) * (1 - prog(t, this.tScan - 0.15, this.tScan + 0.05));
    if (ca > 0) {
      const cw = 620, ch = 250, x = -cw / 2 - 120, y = -150;
      setWorld(ctx, c, x + cw / 2, y + ch / 2, ca);
      ctx.translate(-cw / 2, -ch / 2);
      ctx.fillStyle = rgba('ink', 0.98); ctx.fillRect(0, 0, cw, ch);
      ctx.lineWidth = 2.5 / c.z; ctx.strokeStyle = DANGER; ctx.strokeRect(0, 0, cw, ch);
      ctx.font = font(F.mono(600), 30); ctx.fillStyle = rgba('bone', 1); ctx.fillText('Delete permanently?', 32, 58);
      ctx.font = font(F.mono(400), 23); ctx.fillStyle = rgba('ash', 1); ctx.fillText('.cache: 58 GiB comes back.', 32, 104);
      ctx.fillText('This cannot be undone.', 32, 138);
      ctx.fillStyle = rgba('bone', 0.08); ctx.fillRect(32, 170, 250, 54); ctx.fillStyle = 'rgba(255,78,78,0.85)'; ctx.fillRect(cw - 282, 170, 250, 54);
      ctx.font = font(F.mono(600), 24); ctx.fillStyle = rgba('bone', 1); ctx.fillText('Cancel', 112, 206); ctx.fillText('Delete', cw - 200, 206);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the gain
    const ga = prog(t, this.tGain - 0.1, this.tGain + 0.2);
    if (ga > 0) {
      const gain = sizeOf(this.before.find((b) => b.path === GONE)!.node);
      const v = Math.round(gain * ease.outCubic(prog(t, this.tGain, this.tGain + 1.2)));
      chip(ctx, SCREEN, `+${v} GiB free  ·  ${DISK.free + v} GiB free now`, 470, -470, { a: ga, size: 28, fill: rgba('ink', 0.92), border: rgba('signal', 1), col: rgba('signal', 1) });
    }
  }

  drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the cursor and the SPACE key
    const src = this.before.find((b) => b.path === GONE)!;
    const ca = prog(t, this.ctx.start, this.ctx.start + 0.3) * (1 - prog(t, this.tPanel, this.tPanel + 0.3));
    if (ca > 0) {
      const p0 = w2s(c, src.x + src.w * 0.8, src.y + src.h * 0.95), p1 = w2s(c, src.x + src.w * 0.45, src.y + src.h * 0.45);
      const m = ease.inOutCubic(prog(t, this.ctx.start + 0.1, this.tMark - 0.1));
      const sx = lerp(p0[0], p1[0], m), sy = lerp(p0[1], p1[1], m);
      const press = pulse(t, this.tMark, 0.08);
      ctx.globalAlpha = ca;
      ctx.setTransform(1.3 * (1 - 0.1 * press), 0, 0, 1.3 * (1 - 0.1 * press), sx, sy);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(15, 40); ctx.lineTo(21, 37); ctx.lineTo(15, 24); ctx.lineTo(27, 24); ctx.closePath();
      ctx.fillStyle = rgba('bone', 1); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba('ink', 1); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // the keycap
      const ka = prog(t, this.tMark - 0.35, this.tMark - 0.15) * (1 - prog(t, this.tCascade + 0.6, this.tCascade + 0.9));
      if (ka > 0) {
        const kx = sx + 70, ky = sy + 50 + 6 * press;
        ctx.globalAlpha = ka;
        ctx.fillStyle = rgba('bone', 0.95); ctx.fillRect(kx, ky, 190, 70);
        ctx.fillStyle = rgba('ink', 1); ctx.font = font(F.mono(600), 30); ctx.fillText('space', kx + 50, ky + 46);
        ctx.strokeStyle = press > 0.1 ? DANGER : rgba('ink', 0.6); ctx.lineWidth = 3; ctx.strokeRect(kx, ky, 190, 70);
      }
      ctx.globalAlpha = 1;
    }
    // a dark band behind the captions
    const g = ctx.createLinearGradient(0, 1080 - 260, 0, 1080);
    g.addColorStop(0, 'rgba(7,19,31,0)'); g.addColorStop(0.45, 'rgba(7,19,31,0.82)'); g.addColorStop(1, 'rgba(7,19,31,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0, 1080 - 260, 1920, 260);
    void pt; void clamp;
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    return { zoom: 1 + 0.012 * pulse(t, this.tMark, 0.1) + 0.012 * pulse(t, this.tAsk, 0.1) + 0.01 * pulse(t, this.tScan + 0.4, 0.1) };
  }
}
