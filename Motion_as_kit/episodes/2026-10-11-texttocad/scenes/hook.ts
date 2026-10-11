// HOOK: "Type one sentence, and your AI designs a real part you can 3D print. You don't need to know CAD."
// A prompt bar types the sentence. On "designs" a phone stand prints itself layer by layer under a glowing
// nozzle, lying on its side the way it would really print; on "print." it flips upright and a phone drops in.
// "You don't need to know CAD" lands as the headline.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { box, drawParts, phoneStandPrint, type View } from '@kit/_cad3d';
import { Viewport, headline, nozzle, tag, at3, BODY, WHITE, SOFT, ORANGE, PART, clamp, ease, lerp } from '@ep/viewport';

const PROMPT = 'a phone stand, tilted 15°, with a slot for the cable';

export default class Hook extends Viewport {
  build() {
    this.take('Type one sentence', ['Type', 'sentence,', 'designs', 'real', 'part', '3D', 'print.', ['you2', 'You', 1], 'know', 'CAD.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.w.print!.end, 0, 10, 1.04, 0);
    K.key(this.ctx.end, 0, 20, 1.08, 0);
  }

  view(t: number): View {
    return { yaw: -0.55 + 0.22 * t, pitch: 0.42, dist: 900, s: 4.6, target: [0, 0, 38] };
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const v = this.view(t);
    this.gizmoView = v;
    const t0 = w.designs!.start - 0.05, t1 = w.print!.start + 0.15;
    const p = clamp((t - t0) / (t1 - t0));
    const flip = ease.outBack(clamp((t - w.print!.end - 0.05) / 0.6));
    const objs = [];
    if (p > 0) {
      const mesh = phoneStandPrint(Math.max(0.6, 70 * p), PART);
      objs.push({ mesh, col: PART, hot: p < 1 ? 1 : clamp(1 - (t - t1) / 0.5), xf: { rx: (flip * Math.PI) / 2, at: [0, 35 * flip, 50 * flip] as [number, number, number] } });
    }
    // the phone drops in once the stand is upright
    const drop = ease.outCubic(clamp((t - w.you2!.start - 0.35) / 0.45));
    if (drop > 0) objs.push({ mesh: box(8, 72, 150, { col: '#1B2129', r: 3 }), a: clamp(drop * 3), xf: { ry: 0.63, at: [-36, 0, 8 + 180 * (1 - drop)] as [number, number, number] } });
    const P = drawParts(ctx, c, 0, 30, v, objs, { grid: 260, gridStep: 10, shadow: p > 0 ? 1 : 0 });
    // the nozzle rides the top layer while printing
    if (p > 0 && p < 1) {
      const k = (t * 1.7) % 1;
      const pts: [number, number, number][] = ([[-47, -50], [48, -50], [48, -44], [19, -44], [44, 50], [36, 50], [11, -44], [-47, -44]] as [number, number][]).map(([x, y]) => [x, y, 70 * p]);
      const i = Math.floor(k * pts.length), f = (k * pts.length) % 1;
      const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
      const q: [number, number, number] = [lerp(a[0], b[0], f), lerp(a[1], b[1], f), a[2]];
      const [nx, ny] = at3(P, 0, 30, q);
      nozzle(ctx, c, nx, ny, 0.85, 1);
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the prompt bar
    const out = clamp((w.you2!.start - t) / 0.25);
    const kin = ease.outCubic(clamp((t - this.ctx.start) / 0.3));
    if (out > 0) {
      const bw = 1180, bh = 96;
      setWorld(ctx, c, -bw / 2, -440 - (1 - kin) * 30, 1, 0);
      ctx.globalAlpha = kin * out;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(18,23,31,0.95)'; ctx.beginPath(); ctx.roundRect(0, 0, bw, bh, 48); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,122,26,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
      const n = Math.ceil(PROMPT.length * clamp((t - w.type!.start) / Math.max(0.6, w.sentence!.end + 0.25 - w.type!.start)));
      ctx.font = font(BODY, 38); ctx.fillStyle = n > 0 ? WHITE : SOFT;
      const txt = n > 0 ? PROMPT.slice(0, n) : 'Ask your agent for a part…';
      ctx.fillText(txt, 48, 61);
      if (n > 0 && n < PROMPT.length && Math.floor(t * 4) % 2 === 0) { ctx.fillStyle = ORANGE; ctx.fillRect(52 + measure(txt, BODY, 38), 30, 3, 40); }
      // send button
      const sent = t > w.sentence!.end + 0.25;
      ctx.fillStyle = sent ? ORANGE : 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(bw - 50, bh / 2, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = WHITE; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bw - 50, bh / 2 + 14); ctx.lineTo(bw - 50, bh / 2 - 14); ctx.moveTo(bw - 61, bh / 2 - 3); ctx.lineTo(bw - 50, bh / 2 - 14); ctx.lineTo(bw - 39, bh / 2 - 3); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    tag(ctx, c, '3D PRINT', 560, -170, 30, { a: clamp((t - w['3d']!.start) / 0.15) * out, bg: 'rgba(255,122,26,0.95)', fg: '#0D1117' });
    headline(ctx, c, "YOU DON'T NEED TO KNOW CAD", 0, -370, 84, t, w.you2!.start + 0.05, { dim: 'SKILL LEVEL: 0' });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.print!.end + 0.2, 0.02) }; }
}
