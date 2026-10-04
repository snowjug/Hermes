// NAME: "It's called disktree, from Shopify founder Tobi Lütke. Free on Linux, Mac and Windows. Full
// breakdown on the channel."
// DISKTREE slams in letter by letter across the whole width; who made it; black chips for the facts;
// then the pointer to the full video, and the sheet holds.
import { type LineBatch } from '@engine/lines';
import { layout } from '@engine/type';
import { Plate, ARCH, chip, slam, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, type Cam } from '@kit/_mp';

const WIDTHS = [62, 75, 87.5, 100, 112.5, 125];

export default class Name extends Plate {
  paper = true;
  size = 250;

  build() {
    this.take("It's called disktree", ['called', 'disktree,', 'Shopify', 'founder', 'Tobi', 'Free', 'Linux,', 'Mac', 'Windows.']);
    this.take('Full breakdown', [['full9', 'Full'], 'breakdown', 'channel.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -100, 1.05, 0);
    K.key(this.w.full9!.start, 0, -60, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, -60, 1.02, 0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    slam(ctx, c, "IT'S CALLED", -480, -620, 110, t, w.called!.start - 0.1, { wd: 125, wt: 900, col: 'ink' });
    // DISKTREE, letter by letter, widening as it lands
    const word = w.disktree!;
    if (t > word.start - 0.02) {
      const lay = layout('disktree', ARCH(125, 900), 100);
      const n = lay.glyphs.length, dur = Math.max(0.3, word.end - word.start);
      const total = (lay.width / 100) * this.size;
      const scale = Math.min(1, 960 / total);
      lay.glyphs.forEach((g, i) => {
        const ti = word.start + (i / n) * dur * 0.8;
        if (t < ti) return;
        const age = t - ti, k = ease.outExpo(clamp(age / 0.3));
        const fam = ARCH(WIDTHS[Math.min(5, Math.floor(k * 5.999))]!, 900);
        const sz = this.size * scale;
        const cx = -480 + ((g.x + g.w / 2) / 100) * sz;
        const gw = layout(g.ch, fam, 100).width;
        ctx.font = font(fam, 100);
        setWorld(ctx, c, cx - (gw / 2 / 100) * sz, -400, sz / 100);
        ctx.fillStyle = age < 0.12 ? rgba('signal', 1) : rgba('ink', 1);
        ctx.fillText(g.ch, 0, 0);
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // who
    const wa = prog(t, w.shopify!.start - 0.1, w.shopify!.start + 0.15);
    if (wa > 0) {
      setWorld(ctx, c, -480, -270);
      ctx.globalAlpha = wa;
      ctx.font = font(F.mono(700), 46); ctx.fillStyle = rgba('ink', 1);
      ctx.fillText('by Tobi Lütke', 0, 0);
      ctx.font = font(F.mono(500), 34); ctx.fillStyle = mixCss('signal', 'ink', prog(t, w.founder!.end, w.founder!.end + 0.4), 1);
      ctx.fillText('Shopify founder', 0, 56);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the facts
    const facts: [string, number, number, number][] = [['FREE', w.free!.start, -380, -40], ['LINUX', w.linux!.start, -360, 90], ['MAC', w.mac!.start, -140, 90], ['WINDOWS', w.windows!.start, 140, 90]];
    for (const [s, tt, x, y] of facts) {
      const a = prog(t, tt - 0.05, tt + 0.1);
      if (a <= 0) continue;
      chip(ctx, c, s, x, y, { a, size: 50 * (1 + 0.15 * pulse(t, tt, 0.08)), fill: rgba('ink', 1), col: rgba('bone', 1), border: rgba('ink', 1) });
    }
    // the full video
    const fa = prog(t, w.full9!.start - 0.05, w.full9!.start + 0.15);
    if (fa > 0) {
      slam(ctx, c, 'FULL BREAKDOWN', -480, 300, 74, t, w.full9!.start, { wd: 125, wt: 900, col: 'signal', hotCol: 'signal' });
      slam(ctx, c, 'ON THE CHANNEL', -480, 385, 74, t, w.channel!.start - 0.15, { wd: 125, wt: 900, col: 'ink' });
      setWorld(ctx, c, -480, 470);
      ctx.globalAlpha = fa;
      label(ctx, 'TOOL MAN · ONE NEW TOOL, EVERY DAY', 0, 0, { size: 30, col: rgba('ink', 1), spacing: 4, weight: 700 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.disktree!.start + 0.1, 0.07) + 0.6 * pulse(t, w.full9!.start, 0.07);
    return { zoom: 1 + 0.025 * hit, shake: [9 * hit * noise1(t * 60, 1), 9 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.05 };
  }
}
