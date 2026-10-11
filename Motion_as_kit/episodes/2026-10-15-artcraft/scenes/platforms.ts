// 13 PLATFORMS: "It runs on Windows and Mac, and on Linux if you build it yourself."
// Three film canisters turn on the stage, each with a tape label: WINDOWS ✓, MAC ✓ and LINUX · BUILD FROM SOURCE,
// lit on their words. The clapperboard rises at the end.
import type { Cam } from '@kit/_vo';
import { drawParts, lathe } from '@kit/_cad3d';
import { Cinema, tape, title, SERIFI, IVORY, AMBER, clamp, ob } from '@ep/cinema';

const CAN = lathe([[0, 0], [62, 0], [64, 3], [64, 22], [60, 24], [60, 28], [64, 30], [64, 34], [0, 34]], 36, { col: '#8F9296' });

export default class Platforms extends Cinema {
  override scene = 4;
  override slateOut = true;
  build() {
    this.take('It runs on Windows', ['runs', 'Windows', 'Mac,', 'Linux', 'build', 'yourself.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.03, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    ([['windows', -560], ['mac', 0], ['linux', 560]] as [string, number][]).forEach(([key, x], i) => {
      const k = ob(clamp((t - w[key]!.start + 0.15) / 0.35));
      if (k <= 0) return;
      drawParts(ctx, c, x, 40, { yaw: 0.4 + t * 0.6 + i, pitch: 0.55, dist: 900, s: 2.6, target: [0, 0, 17] }, [{ mesh: CAN, xf: { s: k } }], { grid: 0, shadow: 0.8 });
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    title(ctx, c, 'Where it runs', 0, -290, 84, t, this.ctx.start + 0.05, { f: SERIFI, col: IVORY });
    tape(ctx, c, 'WINDOWS ✓', -560, 230, 38, { a: clamp((t - w.windows!.start) / 0.2) });
    tape(ctx, c, 'MAC ✓', 0, 230, 38, { a: clamp((t - w.mac!.start) / 0.2), rot: 0.03 });
    tape(ctx, c, 'LINUX · BUILD FROM SOURCE', 560, 230, 30, { a: clamp((t - w.build!.start) / 0.2), col: AMBER });
  }
}
