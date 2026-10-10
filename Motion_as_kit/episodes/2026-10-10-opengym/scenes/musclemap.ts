// MUSCLEMAP: "Then there's the muscle map: where your volume went, what's still recovering," / "and what
// you've quietly stopped training. Looking at you, legs."
// Two drawn body maps (front and back) on white cards, three paper tabs above them. On "volume" the
// muscles fill green by how much they were trained; on "still recovering" the recent ones turn orange;
// on "stopped training" the legs go grey and hatched. On "Looking at you, legs." the tabs give way to
// LEGS? in ransom letters and the marker rings both pairs of legs. The app's own muscle map sits taped
// in the corner.
import { drawCut, tag, ring, ransom, ease, prog, setWorld, font, F, rgba, springStep } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, bodyMap, heat, ORANGE, LIME, PAPER } from '@ep/kit';

const FR = { x: -360, y: -10, s: 0.92 };
const BK = { x: 160, y: -10, s: 0.92 };
const VOL: Record<string, number> = { chest: 0.95, delts: 0.8, triceps: 0.85, biceps: 0.55, lats: 0.7, traps: 0.5, abs: 0.35, forearms: 0.3, glutes: 0.06, quads: 0.04, hamstrings: 0.04, calves: 0.03 };
const RECOVER: Record<string, string> = { chest: ORANGE, delts: ORANGE, triceps: ORANGE, biceps: '#F6B26B' };
const LEGS = ['quads', 'hamstrings', 'calves', 'glutes'];
const TABS = [
  { text: 'VOLUME', x: -440 },
  { text: 'RECOVERING', x: -110 },
  { text: 'UNTRAINED', x: 250 },
];

export default class MuscleMap extends Desk {
  override uses = ['s_body'];

  build() {
    this.take("Then there's the muscle map", ['muscle', 'map:', 'volume', 'went,', 'still', 'recovering,']);
    this.take('and what you', ['quietly', 'stopped', 'training.', 'Looking', 'legs.']);
    const w = this.w;
    const tl = w.looking!.start;
    this.plot.add(ring(FR.x, FR.y + 120 * FR.s, 105, 190, 71), tl + 0.05, tl + 0.45, 'signal', { pen: true, ez: ease.inOutQuad, width: 7 });
    this.plot.add(ring(BK.x, BK.y + 120 * BK.s, 105, 190, 72), tl + 0.3, tl + 0.7, 'signal', { pen: true, ez: ease.inOutQuad, width: 7 });
    const K = this.cam;
    K.key(this.ctx.start, -100, -60, 1.02, -0.004);
    K.key(w.volume!.start, -90, -30, 0.96, 0.0, ease.inOutCubic);
    K.key(w.stopped!.start, -90, 0, 0.98, 0.002, ease.inOutCubic);
    K.key(tl, -110, 40, 1.06, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, -110, 50, 1.08, 0.008, ease.linear);
  }

  mode(t: number) {
    const w = this.w;
    return t >= w.stopped!.start ? 3 : t >= w.still!.start ? 2 : t >= w.volume!.start ? 1 : 0;
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const m = this.mode(t);
    const fill = (p: string) => {
      if (m === 1) return heat(VOL[p] ?? 0);
      if (m === 2) return RECOVER[p] ?? heat(0.15);
      if (m === 3) return LEGS.includes(p) ? '#A9A49B' : heat(0.35);
      return null;
    };
    const hatch = (p: string) => (m === 3 && LEGS.includes(p) ? prog(t, w.stopped!.start, w.stopped!.start + 0.4) : 0);
    // a small pop on every mode change
    const tm = [w.volume!.start, w.still!.start, w.stopped!.start].filter((x) => x <= t).pop() ?? -9;
    const pop = 1 + 0.03 * Math.exp(-(t - tm) / 0.08);
    const land = springStep(t - this.ctx.start, 2.6, 0.5);
    bodyMap(ctx, c, FR.x, FR.y, FR.s * pop * (0.85 + 0.15 * land), 'front', fill, { hatch, label: 'FRONT', rot: -0.02 });
    bodyMap(ctx, c, BK.x, BK.y, BK.s * pop * (0.85 + 0.15 * land), 'back', fill, { hatch, label: 'BACK', rot: 0.02 });
    drawCut(ctx, c, this.cuts.s_body!, 660, 120, t, { t0: w.map!.start, scale: 0.46, rot: 0.06, seed: 73 });
    tag(ctx, c, 'IN THE APP', 660, -50, 28, { a: prog(t, w.map!.end, w.map!.end + 0.15), rot: -0.04, seed: 74 });
    // the tabs
    const ta = 1 - prog(t, w.looking!.start - 0.1, w.looking!.start + 0.1);
    if (ta > 0.003 && t > w.muscle!.start) {
      TABS.forEach((tb, i) => {
        const on = m === i + 1;
        const k = springStep(t - w.muscle!.start - i * 0.08, 3, 0.5);
        setWorld(ctx, c, tb.x, -420, (0.7 + 0.3 * k) * (on ? 1.08 : 1), (i - 1) * 0.02);
        ctx.globalAlpha = ta;
        const ww = tb.text.length * 26 + 60;
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-ww / 2 + 5, -32 + 8, ww, 64);
        ctx.fillStyle = on ? LIME : PAPER; ctx.fillRect(-ww / 2, -32, ww, 64);
        ctx.font = font(F.mono(700), 36); ctx.fillStyle = rgba('ink', on ? 1 : 0.55); ctx.textAlign = 'center';
        ctx.fillText(tb.text, 0, 12); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.looking!.start + 0.1, dur = Math.max(0.4, w.legs!.end - t0);
    const wd = ransom(ctx, c, 'LEGS?', 0, -250, 150, t, t0, dur, 29, 0);
    ransom(ctx, c, 'LEGS?', -110 - wd / 2, -250, 150, t, t0, dur, 29);
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.volume!.start, 0.01) * this.punch(t, w.still!.start, 0.01) * this.punch(t, w.stopped!.start, 0.012) * this.punch(t, w.legs!.start, 0.02) };
  }
}
