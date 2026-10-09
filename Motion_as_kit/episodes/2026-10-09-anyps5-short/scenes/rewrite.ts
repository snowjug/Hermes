// REWRITE: "This free tool rewrites the game itself into a Windows program."
// FREE TOOL, then REWRITES tears in. A terminal types the relinker's real command; the file name below
// scrambles from GAME.ELF into APP.EXE on "Windows program".
import { Screen, gtext, term, fit, hash, clamp, rgba, setWorld, font, HEAVY } from '@ep/glitch';
import type { Cam } from '@kit/_vo';
import { ease, prog } from '@engine/util';

export default class Rewrite extends Screen {
  build() {
    this.take('This free tool rewrites', ['free', 'tool', 'rewrites', 'game', 'itself', 'Windows', 'program.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -40, 1.06, 0);
    K.key(w.rewrites!.start, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.ctx.end, 0, 30, 1.04, 0, ease.linear);
  }
  override hits() { const w = this.w; return [w.rewrites!.start, w.windows!.start]; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    gtext(ctx, c, 'FREE TOOL', 0, -600, fit('FREE TOOL', 900, 150), t, w.free!.start - 0.05, { align: 'center', col: 'acid' });
    gtext(ctx, c, 'REWRITES', 0, -400, fit('REWRITES', 980, 230), t, w.rewrites!.start, { align: 'center' });
    gtext(ctx, c, 'THE GAME ITSELF', 0, -250, fit('THE GAME ITSELF', 960, 110), t, w.game!.start, { align: 'center', col: 'signal' });
    term(ctx, c, '$ relinker --windows game.elf app.exe', -500, -60, 34, t, w.game!.start, 1.0, 'acid');
    // the file name, scrambling into APP.EXE
    const from = 'GAME.ELF', to = 'APP.EXE ';
    const k = prog(t, w.windows!.start - 0.1, w.program!.end, ease.inOutCubic);
    const fr = Math.round(t * 30);
    let s = '';
    for (let i = 0; i < from.length; i++) {
      const u = clamp(k * 1.4 - i * 0.05);
      s += u >= 1 ? to[i] : u > 0 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.#$%&'[Math.floor(hash(i, fr) * 31)] : from[i];
    }
    if (t > w.itself!.start) {
      const size = fit('GAME.ELF', 900, 210);
      setWorld(ctx, c, 0, 300);
      ctx.font = font(HEAVY(112.5), size); ctx.textAlign = 'center';
      ctx.fillStyle = rgba(k >= 1 ? 'acid' : 'bone', 1);
      ctx.fillText(s.trimEnd(), 0, 0);
      ctx.font = font(HEAVY(100), 52); ctx.fillStyle = rgba('ash', 1);
      ctx.fillText(k >= 1 ? 'A WINDOWS PROGRAM' : 'A PS5 EXECUTABLE', 0, 110);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
}
