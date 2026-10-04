// NAME: "It's called disktree. It's free, open source, and runs on Linux, Mac and Windows."
// DISKTREE lands letter by letter (Archivo stepping through its widths); the real app slides in on the
// right, its own README screenshot in a window; the facts arrive as chips.
import { type LineBatch } from '@engine/lines';
import { layout } from '@engine/type';
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, chip, drawWindow, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, burst, type Cam } from '@kit/_mp';

const WIDTHS = [62, 75, 87.5, 100];
const SHOT = { x: 60, y: -300, w: 860, h: 665 + 50 };

export default class Name extends Plate {
  img: HTMLImageElement | null = null;
  size = 190;

  override async init() {
    this.img = await new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data/screenshot.png'; });
    super.init();
  }

  build() {
    const w = this.w;
    const L4 = this.take("It's called disktree", [['its1', "It's", 0], 'called', 'disktree.', ['its2', "It's", 1], 'free,', 'open', 'source,', 'runs', 'Linux,', 'Mac', 'Windows.']);
    this.kw.push(...placeRow([w.its1!, w.called!], -860, -250, 64, ARCH(100, 700), 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L4, "It's", 'Windows.', 1), -880, 420, 46, ARCH(100, 700), 'B', { ant: 0.2 }).words);
    const K = this.cam;
    K.key(this.ctx.start, -420, -120, 1.25, -0.01);
    K.key(w.disktree!.start + 0.25, -300, -60, 1.1, -0.004, ease.outCubic);
    K.key(w.its2!.start + 0.2, 0, 20, 0.96, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 10, 25, 0.98, 0.003, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // DISKTREE
    const word = w.disktree!;
    if (t > word.start - 0.02) {
      const lay = layout('disktree', ARCH(100, 900), 100);
      const n = lay.glyphs.length, dur = Math.max(0.3, word.end - word.start);
      lay.glyphs.forEach((g, i) => {
        const ti = word.start + (i / n) * dur * 0.8;
        if (t < ti) return;
        const age = t - ti, k = ease.outExpo(clamp(age / 0.32));
        const fam = ARCH(WIDTHS[Math.min(3, Math.floor(k * 3.999))]!, 900);
        const cx = -860 + ((g.x + g.w / 2) / 100) * this.size;
        const gw = layout(g.ch, fam, 100).width;
        ctx.font = font(fam, 100);
        setWorld(ctx, c, cx - (gw / 2 / 100) * this.size, -40 + (1 - ease.outCubic(clamp(age / 0.25))) * -18, this.size / 100);
        const hot = Math.pow(0.5, age / 0.09), cool = prog(t, ti + 0.05, ti + 0.5);
        ctx.fillStyle = hot > 0.08 ? mixCss('ember', 'signal', 1 - hot) : mixCss('signal', 'bone', cool);
        ctx.fillText(g.ch, 0, 0);
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, -856, 20);
      ctx.globalAlpha = prog(t, word.end, word.end + 0.3);
      ctx.font = font(F.mono(400), 26); ctx.fillStyle = rgba('ash', 1); ctx.fillText('github.com/tobi/disktree', 0, 0);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // facts
    const facts: [string, number, number][] = [['FREE', w.free!.start, -860], ['OPEN SOURCE · MIT', w.open!.start, -640], ['LINUX', w.linux!.start, -860], ['MAC', w.mac!.start, -700], ['WINDOWS', w.windows!.start, -560]];
    facts.forEach(([s, tt, x], i) => {
      const a = prog(t, tt - 0.05, tt + 0.12);
      if (a <= 0) return;
      const y = i < 2 ? 120 : 210, pop = 1 + 0.12 * pulse(t, tt, 0.08);
      chip(ctx, c, s, x + s.length * 10.5 + 26, y, { a, size: 30 * pop, border: rgba('signal', 0.85), col: rgba('bone', 1) });
    });
    // the real app
    const sa = ease.outExpo(prog(t, word.start + 0.1, word.start + 0.7));
    if (sa > 0 && this.img) {
      const dy = (1 - sa) * 160;
      drawWindow(ctx, c, SHOT.x, SHOT.y + dy, SHOT.w, SHOT.h, 'disktree', { a: sa });
      setWorld(ctx, c, SHOT.x + 2, SHOT.y + dy + 50);
      ctx.globalAlpha = sa;
      const ih = (SHOT.w - 4) * (this.img.height / this.img.width);
      ctx.drawImage(this.img, 0, 0, SHOT.w - 4, Math.min(ih, SHOT.h - 52));
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, SHOT.x + SHOT.w, SHOT.y + SHOT.h + dy + 30);
      ctx.globalAlpha = sa;
      label(ctx, 'THE REAL APP · SCREENSHOT FROM ITS README (MIT)', 0, 0, { size: 15, col: rgba('ash', 0.95), spacing: 3, align: 'right' });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) { burst(X, c, pt(-860 + 0.5 * this.size * 4.3, -100), t, this.w.disktree!.start + 0.05, 40, 9, 0.9); void noise1; }

  postFX(t: number) {
    const w = this.w;
    const sh = 6 * pulse(t, w.disktree!.start + 0.05, 0.07);
    return { zoom: 1 + 0.016 * pulse(t, w.disktree!.start, 0.1), shake: [sh * noise1(t * 45, 3), sh * noise1(t * 51, 4)] as [number, number] };
  }
}
