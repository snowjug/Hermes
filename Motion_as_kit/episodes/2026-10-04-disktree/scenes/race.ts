// RACE: "Run it as administrator on Windows, and it reads a four-million-file drive in about three
// point four seconds. In his test, WizTree took eleven."
// The README's own benchmark as a race on a stopwatch that runs while the line is said: disktree
// reading the NTFS master file table finishes on "seconds" at 3.4 s; WizTree finishes on "eleven" at
// 11.2 s. The test conditions sit above the tracks; the source sits under them.
import { type LineBatch } from '@engine/lines';
import { placeRow } from '@kit/_vo';
import { sparkHead } from '@kit/_motifs';
import { Plate, ARCH, chip, pt, clamp, ease, lerp, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, w2s, burst, LIN, type Cam } from '@kit/_mp';

const X0 = -560, XW = 1360; // track: 0 .. 11.2 s
const TRACKS = [
  { name: 'disktree', sub: 'reads the NTFS master file table', secs: 3.4, y: -90 },
  { name: 'WizTree', sub: 'the usual speed champion', secs: 11.2, y: 110 },
];

export default class Race extends Plate {
  t0 = 0; t1 = 0; t2 = 0;

  build() {
    const w = this.w;
    const L2 = this.take('Run it as administrator', ['Run', 'administrator', 'Windows,', 'reads', ['four', 'four-million-file'], 'drive', 'three', 'seconds.']);
    const L3 = this.take('In his test', ['In', 'his', 'test,', 'WizTree', 'took', 'eleven.']);
    this.t0 = w.reads!.start; this.t1 = w.seconds!.end; this.t2 = w.eleven!.end;
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(L2.words.slice(0, 6), -880, -400, 50, fam, 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(L2.words.slice(6), -880, -340, 50, fam, 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(L3.words, -880, 390, 62, ARCH(100, 800), 'B', { ant: 0.2 }).words);
    const K = this.cam;
    K.key(this.ctx.start, -120, -150, 1.12, -0.006);
    K.key(this.t0, -60, -60, 1.0, 0.0, ease.inOutCubic);
    K.key(this.t1 + 0.2, -40, -30, 0.98, 0.0, ease.inOutCubic);
    K.key(this.t2, 40, 40, 1.03, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 50, 50, 1.05, 0.006, ease.linear);
  }

  /** The stopwatch: 0 at "reads", 3.4 at "seconds", 11.2 at "eleven". */
  clock(t: number) {
    if (t <= this.t0) return 0;
    if (t <= this.t1) return lerp(0, 3.4, ease.inOutQuad(prog(t, this.t0, this.t1)));
    return lerp(3.4, 11.2, ease.inOutQuad(prog(t, this.t1, this.t2)));
  }

  alpha(g: string, t: number) { return g === 'A' ? 1 - 0.55 * prog(t, this.w.in!.start - 0.2, this.w.in!.start + 0.1) : 1; }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = this.clock(t);
    const show = prog(t, w.windows!.start - 0.2, w.windows!.start + 0.2);
    // test conditions
    const conds: [string, number][] = [['C:\\', w.windows!.start], ['4,000,000 FILES', w.four!.start], ['RUN AS ADMINISTRATOR', w.administrator!.start]];
    let cx = -880;
    for (const [s, tt] of conds) {
      const a = prog(t, tt - 0.1, tt + 0.1);
      const wd = chip(ctx, c, s, cx + 10 + s.length * 8.6, -250, { a, size: 22, border: rgba('signal', 0.8 * a) });
      cx += (wd || s.length * 17 + 36) + 18;
    }
    for (const tr of TRACKS) {
      if (show <= 0) continue;
      const done = v >= tr.secs - 1e-3;
      const fin = done ? pulse(t, tr.secs === 3.4 ? this.t1 : this.t2, 0.4) : 0;
      setWorld(ctx, c, -880, tr.y);
      ctx.globalAlpha = show;
      ctx.font = font(F.mono(600), 38); ctx.fillStyle = mixCss('bone', 'signal', done ? 1 : 0, 1); ctx.fillText(tr.name, 0, 8);
      ctx.font = font(F.mono(400), 19); ctx.fillStyle = rgba('ash', 0.95); ctx.fillText(tr.sub, 0, 40);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, X0, tr.y - 22);
      ctx.fillStyle = rgba('bone', 0.08); ctx.fillRect(0, 0, XW, 44);
      // second ticks
      ctx.fillStyle = rgba('bone', 0.25);
      for (let s = 0; s <= 11; s++) ctx.fillRect((s / 11.2) * XW, 44, 1.5 / c.z, s % 5 === 0 ? 14 : 8);
      const len = (Math.min(v, tr.secs) / 11.2) * XW;
      ctx.fillStyle = mixCss('signal', 'ember', fin, 1);
      ctx.fillRect(0, 0, len, 44);
      if (done) {
        ctx.font = font(F.mono(600), 34); ctx.fillStyle = mixCss('bone', 'signal', 1 - fin, 1);
        ctx.fillText(`${tr.secs.toFixed(1)} s`, len + 22, 34);
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // second labels under the WizTree track
    if (show > 0) {
      setWorld(ctx, c, X0, 210);
      ctx.globalAlpha = show; ctx.font = font(F.mono(400), 18); ctx.fillStyle = rgba('ash', 0.9);
      for (const s of [0, 5, 10]) ctx.fillText(`${s} s`, (s / 11.2) * XW - 8, 0);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the stopwatch
    if (show > 0) {
      setWorld(ctx, c, 560, -250);
      ctx.globalAlpha = show;
      ctx.font = font(F.mono(500), 64); ctx.fillStyle = rgba('bone', 0.95);
      const sec = Math.floor(v), cs = Math.floor((v - sec) * 10);
      ctx.fillText(`00:${String(sec).padStart(2, '0')}.${cs}`, 0, 0);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the source
    const fa = prog(t, w.his!.start, w.his!.start + 0.3);
    if (fa > 0) {
      setWorld(ctx, c, 880, 300);
      ctx.globalAlpha = fa;
      label(ctx, "THE AUTHOR'S TEST, FROM THE DISKTREE README", 0, 0, { size: 16, col: rgba('ash', 0.95), spacing: 3, align: 'right' });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void clamp; void noise1;
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const v = this.clock(t);
    for (const tr of TRACKS) {
      if (v <= 0.01 || v >= tr.secs) continue;
      const [sx, sy] = w2s(c, X0 + (v / 11.2) * XW, tr.y);
      sparkHead(X, sx, sy, t, 1.1, 1);
    }
    burst(X, c, pt(X0 + (3.4 / 11.2) * XW, TRACKS[0]!.y), t, this.t1, 50, 3, 0.9);
    burst(X, c, pt(X0 + XW, TRACKS[1]!.y), t, this.t2, 40, 4, 0.8);
    void LIN;
  }

  postFX(t: number) {
    return { zoom: 1 + 0.014 * pulse(t, this.t1, 0.1) + 0.01 * pulse(t, this.t2, 0.1) };
  }
}
