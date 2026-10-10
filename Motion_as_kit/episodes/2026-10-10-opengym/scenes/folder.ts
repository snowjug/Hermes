// FOLDER: "Your whole training history sits in one folder. Back it up, and you've backed up everything."
// File cards for the history (state-you.json, db.json, its .bak) land and slide into a manila folder marked
// ./data. On "Back it up" a copy of the folder slides out to the right along a marker arrow, and on
// "everything" a stamp lands: ONE FOLDER, THAT'S EVERYTHING.
import { tag, arrow, ease, prog, clamp, lerp } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk, folder, fileCard } from '@ep/kit';

const F0 = { x: -420, y: 40 };
const F1 = { x: 430, y: 40 };
const FILES = [
  { name: 'state-you.json', sub: 'plan · workouts · weight', x: -760, y: -300, r: -0.08, key: 'training' },
  { name: 'db.json', sub: 'profiles', x: -420, y: -340, r: 0.05, key: 'history' },
  { name: 'db.json.bak', sub: 'last good copy', x: -90, y: -300, r: 0.1, key: 'sits' },
];

export default class Folder extends Desk {
  stamp: HTMLCanvasElement | null = null;

  build() {
    this.take('Your whole training history', ['whole', 'training', 'history', 'sits', 'one', 'folder.', 'Back', 'up,', 'backed', 'everything.']);
    this.stamp = makeStamp('BACKED UP', 'ONE FOLDER', "THAT'S EVERYTHING", HEX.signal, 33);
    const w = this.w;
    const ar = arrow({ x: F0.x + 300, y: F0.y - 40 }, { x: F1.x - 300, y: F1.y - 40 }, 7, -0.25);
    this.plot.add(ar.shaft, w.back!.start, w.up!.end, 'signal', { pen: true, width: 7 });
    this.plot.add(ar.head, w.up!.end, w.up!.end + 0.12, 'signal', { pen: true, width: 7 });
    const K = this.cam;
    K.key(this.ctx.start, -400, -120, 1.08, -0.006);
    K.key(w.folder!.start, -300, 0, 1.0, 0.0, ease.inOutCubic);
    K.key(w.back!.start, 0, 10, 0.92, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 20, 20, 0.95, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tf = w.one!.start - 0.1;
    folder(ctx, c, F0.x, F0.y, 600, 420, './data', t, tf, { rot: -0.02 });
    FILES.forEach((f, i) => {
      const t0 = w[f.key]!.start - 0.1;
      if (t < t0) return;
      // land, then slide into the folder on "folder"
      const k = ease.inOutCubic(prog(t, w.folder!.start + i * 0.08, w.folder!.start + 0.35 + i * 0.08));
      const x = lerp(f.x, F0.x - 150 + i * 150, k), y = lerp(f.y, F0.y - 20, k);
      const a = 1 - prog(t, w.folder!.end + 0.1, w.folder!.end + 0.3);
      fileCard(ctx, c, x, y, f.name, f.sub, { w: 210 * (1 - 0.3 * k), rot: f.r * (1 - k), a: a * clamp((t - t0) / 0.08) });
    });
    tag(ctx, c, 'YOUR WHOLE HISTORY', F0.x, F0.y + 250, 32, { a: prog(t, w.folder!.end, w.folder!.end + 0.15), rot: 0.03, seed: 34 });
    // the copy
    const tb = w.back!.start;
    if (t > tb) {
      const k = ease.outCubic(prog(t, tb, w.up!.end + 0.1));
      folder(ctx, c, lerp(F0.x + 40, F1.x, k), F1.y + 10, 600, 420, './data  (backup)', t, tb, { rot: 0.03 * k, col: '#EAD08F' });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    if (this.stamp) drawStamp(ctx, c, this.stamp, F1.x + 40, F1.y + 30, t, this.w.everything!.start, 0.6, -0.1, 0.95);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.everything!.start, 0.018) };
  }
}
