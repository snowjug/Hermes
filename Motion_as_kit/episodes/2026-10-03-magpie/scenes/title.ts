// TITLE: "It's called magpie. It's free, open source, and already past four thousand GitHub stars."
// MAGPIE lands as kinetic type (each letter steps through Archivo's widths, condensed → normal).
// Then three facts: FREE, OPEN SOURCE · MIT, and a plotted star with a counter that rolls to the
// repository's star count on the day this was made.
import { type LineBatch } from '@engine/lines';
import { layout } from '@engine/type';
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, chip, typed, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, burst, type Cam } from '@kit/_mp';

const WIDTHS = [62, 75, 87.5, 100];
const STARS = 4422;

export default class Title extends Plate {
  size = 330;
  x0 = 0;
  starC = pt(290, 262);

  build() {
    const w = this.w;
    this.take("It's called magpie", [['its1', "It's", 0], 'called', 'magpie.', ['its2', "It's", 1], 'free,', 'open', 'source,', 'and', 'already', 'past', 'four', 'thousand', 'GitHub', 'stars.']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow([w.its1!, w.called!], -520, -250, 72, fam, 'T', { ant: 0.2 }).words);
    const lay = layout('magpie', ARCH(100, 900), 100);
    this.x0 = -(lay.width / 100) * this.size / 2;
    // the star: five points, plotted on "stars"
    const R = 42, r = 17, pts = [];
    for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r : R; pts.push(pt(this.starC.x + Math.cos(a) * rr, this.starC.y + Math.sin(a) * rr)); }
    this.plot.add(pts, w.four!.start - 0.1, w.four!.start + 0.3, 'signal', { pen: true, ez: ease.inOutQuad, width: 2.6, group: 'S' });
    this.plot.wp(pt(this.x0 - 30, 60), w.magpie!.start - 0.05, 0.05);
    this.plot.wp(pt(this.starC.x + 60, this.starC.y + 40), w.stars!.end, 0.3);
    const K = this.cam;
    K.key(this.ctx.start, -200, -160, 1.3, -0.01);
    K.key(w.magpie!.start - 0.05, -120, -120, 1.25, -0.008, ease.linear);
    K.key(w.magpie!.start + 0.3, 0, -30, 1.05, 0.0, ease.outExpo);
    K.key(w.free!.start, 0, 20, 1.0, 0.0, ease.inOutCubic);
    K.key(w.four!.start, 60, 90, 1.02, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, 80, 100, 1.05, 0.008, ease.linear);
  }

  alpha(g: string, t: number) { return g === 'T' ? 1 - 0.6 * prog(t, this.w.free!.start, this.w.free!.start + 0.4) : 1; }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // MAGPIE, letter by letter
    const word = w.magpie!;
    if (t > word.start - 0.02) {
      const lay = layout('magpie', ARCH(100, 900), 100);
      const n = lay.glyphs.length, dur = Math.max(0.25, word.end - word.start);
      lay.glyphs.forEach((g, i) => {
        const ti = word.start + (i / n) * dur * 0.8;
        if (t < ti) return;
        const age = t - ti;
        const k = ease.outExpo(clamp(age / 0.32));
        const wd = WIDTHS[Math.min(3, Math.floor(k * 3.999))]!;
        const dy = (1 - ease.outCubic(clamp(age / 0.25))) * -0.1 * this.size;
        const fam = ARCH(wd, 900);
        const cx = this.x0 + ((g.x + g.w / 2) / 100) * this.size;
        const gw = layout(g.ch, fam, 100).width;
        ctx.font = font(fam, 100);
        setWorld(ctx, c, cx - (gw / 2 / 100) * this.size, 80 + dy, this.size / 100);
        const hot = Math.pow(0.5, age / 0.09), cool = prog(t, ti + 0.05, ti + 0.5);
        ctx.fillStyle = hot > 0.08 ? mixCss('ember', 'signal', 1 - hot) : mixCss('signal', 'bone', cool);
        ctx.fillText(g.ch, 0, 0);
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      typed(ctx, c, 'github.com/yetone/magpie', this.x0 + 8, 156, t, word.end + 0.05, 0.45, { size: 30, col: 'ash' });
    }
    // the facts
    const ch = (txt: string, x: number, tt: number) => {
      const a = prog(t, tt - 0.05, tt + 0.15);
      if (a <= 0) return;
      const pop = 1 + 0.12 * pulse(t, tt, 0.08);
      chip(ctx, c, txt, x, 262, { a, size: 34 * pop, border: rgba('signal', 0.8 * a), col: rgba('bone', 0.95) });
    };
    ch('FREE', -600, w.free!.start);
    ch('OPEN SOURCE · MIT', -190, w.open!.start);
    // the counter
    const t0 = w.four!.start, t1 = w.stars!.end;
    if (t > t0 - 0.1) {
      const v = Math.round(STARS * ease.outCubic(prog(t, t0, t1)));
      const a = prog(t, t0 - 0.1, t0 + 0.1);
      setWorld(ctx, c, this.starC.x + 66, this.starC.y + 28);
      ctx.font = font(F.mono(500), 84);
      ctx.fillStyle = mixCss('signal', 'bone', prog(t, t1, t1 + 0.4), a);
      ctx.fillText(v.toLocaleString('en-US'), 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, this.starC.x + 70, this.starC.y + 76);
      label(ctx, 'GITHUB STARS · 3 OCT 2026', 0, 0, { size: 20, col: rgba('ash', 0.9 * a), spacing: 3 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    burst(X, c, this.starC, t, this.w.stars!.end - 0.05, 40, 5, 0.8);
  }

  postFX(t: number) {
    const w = this.w;
    const sh = 6 * pulse(t, w.magpie!.start + 0.05, 0.07);
    return { zoom: 1 + 0.02 * pulse(t, w.magpie!.start + 0.05, 0.1), shake: [sh * noise1(t * 45, 3), sh * noise1(t * 51, 4)] as [number, number], bloom: 0.7 };
  }
}
