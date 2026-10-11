// 03 NAME: "It's called ArtCraft. It's free, open source, and it just picked up over three thousand GitHub
// stars in a single day."
// A title card in the letterbox: ArtCraft in serif with a warm glow over the dimmed, slowly turning stage. FREE ·
// OPEN SOURCE, the licences, and a star count racing to +3,222 IN ONE DAY (15.4K IN ALL).
import type { Cam } from '@kit/_vo';
import { drawParts } from '@kit/_cad3d';
import { Cinema, room, figures, title, tape, mono, AMBER, IVORY, MONOB, clamp, ease } from '@ep/cinema';
import { STAGE, cast } from '@ep/set';

export default class Name extends Cinema {
  override scene = 1;
  build() {
    this.take("It's called ArtCraft", ['called', 'ArtCraft.', 'free,', 'open', 'three', 'GitHub', 'stars', 'single', 'day.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.06, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }
  override letterbox() { return 1; }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawParts(ctx, c, 0, 120, STAGE(t, this.ctx.start, 0.2, 0.06, 1.15), [{ mesh: room() }, { mesh: figures(cast(1)) }], { a: 0.32 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'ArtCraft', 0, -40, 230, t, w.artcraft!.start - 0.1, { glow: 'rgba(245,179,66,0.45)' });
    tape(ctx, c, 'FREE · OPEN SOURCE', -260, 90, 34, { a: clamp((t - w.free!.start) / 0.2) });
    mono(ctx, c, 'MIT / APACHE-2.0', 160, 102, { a: clamp((t - w.open!.start) / 0.3), size: 26 });
    const ts = w.three!.start - 0.05;
    if (t > ts) {
      const k = ease.outExpo(clamp((t - ts) / Math.max(0.6, w.stars!.end - ts)));
      title(ctx, c, `+${Math.round(3222 * k).toLocaleString('en-US')} ★`, 0, 250, 110, t, ts, { col: AMBER, f: MONOB });
    }
    mono(ctx, c, 'GITHUB STARS IN ONE DAY · 15.4K IN ALL', 0, 320, { a: clamp((t - w.single!.start) / 0.3), align: 'center', size: 24, col: IVORY });
  }
}
