// LANGUAGES: "That's how it speaks 646 languages. But look at the split. English got over 200,000 hours.
// Half the languages got about ten each."
// One bar per language, its height the hours of speech OmniVoice trained on, sorted, at one linear
// scale. The row fills in while "646 languages" is said; the camera then climbs the right-hand end
// with an altimeter in hours, past Spanish, Japanese and Chinese, to the top of English (206,061 h).
// On "Half" it drops back to the floor, where a line marks the median: 10.2 hours.
import { type LineBatch } from '@engine/lines';
import { placeRow, rowWidth } from '@kit/_vo';
import { Plate, ARCH, SCREEN, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, w2s, type Cam } from '@kit/_mp';
import { HOURS, TOP, MEDIAN } from '@ep/langs';
import { lin } from '@ep/vs';

const K = 20; // world px per hour
const STEP = 9, BX0 = -2907, FLOOR = 300;
const N = HOURS.length;
const bx = (i: number) => BX0 + i * STEP + 3;
const topY = (h: number) => FLOOR - h * K;
const FLOORCAM = { cx: 0, cy: FLOOR - 330, z: 0.315 };
const ENG = N - 1;

export default class Languages extends Plate {
  tB = 0;

  build() {
    const w = this.w;
    const L9 = this.take("That's how it speaks", [['thats', "That's"], 'speaks', '646', ['lang9', 'languages.'], 'But', 'look', 'split.']);
    const L10 = this.take('English got over', ['English', 'got', 'over', '200,000', 'hours.', 'Half', ['lang10', 'languages'], 'about', 'ten', 'each.']);
    this.tB = L10.start;
    const fam = ARCH(100, 800);
    const c1 = this.span(L9, "That's", 'languages.');
    const s1 = 64;
    this.screenKw.push(...placeRow(c1, -rowWidth(c1.map((x) => x.w), s1, fam) / 2, -400, s1, fam, 'A', { ant: 0.2 }).words);
    const c2 = this.span(L9, 'But', 'split.');
    this.screenKw.push(...placeRow(c2, -rowWidth(c2.map((x) => x.w), s1, fam) / 2, -310, s1, fam, 'A2', { ant: 0.2 }).words);
    const c3 = this.span(L10, 'English', 'hours.');
    this.screenKw.push(...placeRow(c3, -rowWidth(c3.map((x) => x.w), 70, fam) / 2, -400, 70, fam, 'B', { ant: 0.2 }).words);
    const c4 = this.span(L10, 'Half', 'each.');
    this.screenKw.push(...placeRow(c4, -rowWidth(c4.map((x) => x.w), 70, fam) / 2, -400, 70, fam, 'C', { ant: 0.2 }).words);
    this.showPen = false;
    const top = topY(HOURS[ENG]!);
    const C = this.cam;
    const F0 = FLOORCAM;
    C.key(this.ctx.start, F0.cx - 200, F0.cy + 40, F0.z * 1.25, 0);
    C.key(w['646']!.start, F0.cx, F0.cy, F0.z, 0, ease.inOutCubic);
    C.key(w.but!.start, F0.cx + 120, F0.cy - 20, F0.z * 0.98, 0, ease.linear);
    // the climb: along the right-hand end, zooming out as the bars get taller
    C.key(w.split!.end, bx(N - 40), FLOOR - 1600, 0.12, -0.01, ease.inOutCubic);
    C.key(this.tB + 0.05, bx(N - 8), FLOOR - 40000, 0.012, -0.012, ease.inOutCubic);
    // the top view: the needle from the floor (screen y 1000) to English's top (screen y ~260)
    const zT = 740 / (FLOOR - top), cyT = FLOOR - 460 / zT;
    C.key(w.over!.start, bx(N - 3), cyT * 0.8, zT * 1.5, -0.01, ease.inOutCubic);
    C.key(w.hours!.start, bx(N - 20), cyT, zT, 0, ease.outCubic);
    C.key(w.half!.start - 0.08, bx(N - 20), cyT, zT * 1.02, 0, ease.linear);
    // the drop back to the floor
    C.key(w.lang10!.start + 0.15, F0.cx - 900, F0.cy + 40, F0.z * 1.05, 0.0, ease.inOutExpo);
    C.key(this.ctx.end, F0.cx - 1000, F0.cy + 30, F0.z * 1.12, 0.0, ease.linear);
  }

  camAt(t: number): Cam { return this.cam.at(t); }

  alpha(g: string, t: number) {
    const w = this.w;
    if (g === 'A') return 1 - prog(t, this.tB - 0.12, this.tB + 0.05);
    if (g === 'A2') return 1 - prog(t, this.tB - 0.12, this.tB + 0.05);
    if (g === 'B') return prog(t, this.tB - 0.1, this.tB + 0.05) * (1 - prog(t, w.half!.start - 0.15, w.half!.start));
    if (g === 'C') return prog(t, w.half!.start - 0.15, w.half!.start);
    return 1;
  }

  /** how far the row has filled in (0..1, left to right) */
  fill(t: number) { return prog(t, this.w.speaks!.start, this.w.lang9!.end + 0.2, ease.inOutCubic); }

  drawStrokes(L: LineBatch, t: number, c: Cam) {
    const w = this.w;
    const fill = this.fill(t);
    const half = prog(t, w.half!.start, w.half!.start + 0.3);
    const wd0 = (STEP - 3) * c.z;
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const g = clamp((fill * 1.09 - u) * 12);
      if (g <= 0) break;
      const h = HOURS[i]!;
      const a = w2s(c, bx(i), FLOOR), b = w2s(c, bx(i), FLOOR - h * K * ease.outCubic(g));
      const lowHalf = i < N / 2;
      const giant = i >= N - 8;
      const col = half > 0 ? (lowHalf ? lin('signal', 1.1 + 0.6 * half) : lin('ash', 0.5)) : giant ? lin('ember', 1.3) : lin('signal', 1.05);
      L.seg2(a[0], a[1], b[0], b[1], Math.max(giant ? 5 : 1.6, wd0), col, 1);
    }
    // the floor and, on "Half", the median line
    const f0 = w2s(c, bx(0) - 60, FLOOR), f1 = w2s(c, bx(N - 1) + 60, FLOOR);
    L.seg2(f0[0], f0[1], f1[0], f1[1], 1.6, lin('ash', 0.7), 0.9);
    if (half > 0) {
      const m0 = w2s(c, bx(0) - 60, FLOOR - MEDIAN * K), m1 = w2s(c, bx(0) + (bx(N - 1) - bx(0)) * half, FLOOR - MEDIAN * K);
      L.seg2(m0[0], m0[1], m1[0], m1[1], 3, lin('acid', 1.4), 1);
    }
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const fill = this.fill(t);
    // the count, under the row
    const ca = prog(t, w['646']!.start - 0.1, w['646']!.start + 0.1) * (1 - prog(t, w.split!.start, w.split!.end));
    if (ca > 0) {
      const n = Math.round(N * clamp(fill));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = ca;
      ctx.font = font(ARCH(100, 900), 92); ctx.fillStyle = rgba('signal', 1); ctx.textAlign = 'center';
      ctx.fillText(String(n), 960, 930);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      label(ctx, 'LANGUAGES  ·  ONE BAR EACH  ·  HEIGHT = HOURS OF TRAINING SPEECH', 960, 990, { size: 20, col: rgba('ash', ca), spacing: 4, align: 'center' });
    }
    // labels on the giants (screen-size type at the bar tops)
    let lastY = -1e9;
    for (let k = TOP.length - 1; k >= 0; k--) {
      const i = N - TOP.length + k;
      const [name, h] = TOP[k]!;
      const p = w2s(c, bx(i), FLOOR - h * K);
      const hpx = h * K * c.z;
      const a = clamp((hpx - 160) / 120) * prog(t, w.split!.start, w.split!.end) * (1 - prog(t, w.half!.start - 0.1, w.half!.start + 0.1));
      if (a <= 0.01 || p[1] < -40 || p[1] > 1120 || p[1] - lastY < 34) continue;
      lastY = p[1];
      const big = name === 'English';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = a;
      ctx.font = font(F.mono(big ? 700 : 500), big ? 34 : 20);
      ctx.fillStyle = big ? rgba('signal', 1) : rgba('bone', 0.9);
      ctx.textAlign = 'right';
      ctx.fillText(`${name.toUpperCase()}  ${h.toLocaleString('en-US')} h`, p[0] - 14, p[1] + (big ? 12 : 6) + (k % 2) * 0);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      ctx.fillStyle = rgba(big ? 'signal' : 'bone', a); ctx.fillRect(p[0] - 10, p[1] - 1, 8, 2);
    }
    // the altimeter, while climbing
    const al = prog(t, w.split!.start, w.split!.end) * (1 - prog(t, w.half!.start - 0.1, w.half!.start + 0.1));
    if (al > 0) {
      const hTop = Math.max(0, (FLOOR - (c.cy - 540 / c.z)) / K);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = al;
      ctx.fillStyle = rgba('ink', 0.75); ctx.fillRect(1500, 470, 380, 150);
      ctx.strokeStyle = rgba('signal', 0.6); ctx.lineWidth = 1.2; ctx.strokeRect(1500, 470, 380, 150);
      label(ctx, 'TOP OF FRAME', 1524, 506, { size: 18, col: rgba('ash', 1), spacing: 4 });
      ctx.font = font(F.mono(600), 52); ctx.fillStyle = rgba('signal', 1);
      ctx.fillText(`${Math.round(hTop).toLocaleString('en-US')} h`, 1524, 584);
      ctx.globalAlpha = 1;
    }
    // at the top: where everything else is
    const fl = prog(t, w.hours!.start, w.hours!.start + 0.25) * (1 - prog(t, w.half!.start - 0.1, w.half!.start + 0.05));
    if (fl > 0) {
      const p = w2s(c, bx(N - 1), FLOOR);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = fl;
      ctx.font = font(F.mono(600), 26); ctx.fillStyle = rgba('bone', 0.95); ctx.textAlign = 'left';
      ctx.fillText('← THE OTHER 644 LANGUAGES', p[0] + 40, p[1] - 12);
      ctx.font = font(F.mono(400), 20); ctx.fillStyle = rgba('ash', 1);
      ctx.fillText('all of them, down here', p[0] + 76, p[1] + 20);
      ctx.globalAlpha = 1;
    }
    // the median, on "Half"
    const ma = prog(t, w.half!.start + 0.1, w.half!.start + 0.4);
    if (ma > 0) {
      const p = w2s(c, bx(0), FLOOR - MEDIAN * K);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = ma;
      ctx.font = font(F.mono(700), 30); ctx.fillStyle = rgba('acid', 1);
      ctx.fillText('HALF OF ALL 646 LANGUAGES: 10.2 HOURS OR LESS EACH', Math.max(40, p[0]), p[1] - 22);
      ctx.globalAlpha = 1;
    }
    void mixCss; void setWorld; void SCREEN; void pt;
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.hours!.start, 0.1) + pulse(t, w.lang10!.start + 0.15, 0.08);
    return { zoom: 1 + 0.02 * hit, shake: [6 * hit * noise1(t * 50, 1), 6 * hit * noise1(t * 50, 2)] as [number, number] };
  }
}
