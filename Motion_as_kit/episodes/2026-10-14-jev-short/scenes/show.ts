// The Jev Short, one continuous plate: a quiz show in six rounds, one per spoken line. Panels slide in from the
// right, staggered, and out to the left when the next round starts.
//  1 POV: WHAT DOES THIS AI DO? essays / code / chat / multiple choice: D locks, then goes green.
//  2 JEV: THIS EMAIL IS ABOUT…? billing / technical / account: B locks "in a blink" (0.1 s), the shares appear.
//  3 CAN JEV… chat? ✗ write? ✗ decide? ✓, one per word.
//  4 the ladder: 2× … 444× CHEAPER climbs to the top rung (its makers' claim).
//  5 lifelines: SORT EMAILS and GUARD AI AGENTS light up.
//  6 FINAL ANSWER? WILL YOU SUBSCRIBE? yes / yes / obviously / all of the above: D, and the subscribe graphic.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { W, H } from '@engine/gl';
import { subscribe } from '@kit/_subscribe';
import { QuizPlate, panel, question, title, dot, lifeline, ob, MONOB, BOLD, GOLD, WHITE, GREEN, RED, clamp, ease, lerp, type PanelState } from '@ep/quiz';

const PW = 900, PH = 118;

export default class Show extends QuizPlate {
  rs: number[] = [];
  build() {
    const tk = (q: string, specs: (string | [string, string, number?])[]) => this.take(q, specs);
    tk('POV', ['POV:', 'found', 'only', 'multiple', 'choice.']);
    tk("It's called Jev", ['Jev.', 'options,', 'picks', 'blink,', 'how', 'sure']);
    tk("It can't chat", [['cant', "can't"], 'chat.', 'write.', 'decides.']);
    tk('Its makers', ['makers', '444', 'times', 'cheaper', 'typical']);
    tk('Developers already', ['Developers', 'sort', 'emails', 'guard', 'agents.']);
    tk('Final answer', ['Final', 'answer?', 'Subscribe', 'day.']);
    this.rs = this.ctx.lyrics.lines.map((l) => l.start);
    this.cam.key(this.ctx.start, 0, 0, 1, 0);
    this.cam.key(this.ctx.end, 0, 0, 1, 0);
  }

  /** 0..1 slide-in of item i of round r, and 0..1 slide-out as round r+1 begins */
  slide(t: number, r: number, i: number): [number, number] {
    const s0 = (r === 0 ? 0.05 : this.rs[r]! - 0.3) + i * 0.07;
    const inK = ease.outCubic(clamp((t - s0) / 0.35));
    const next = this.rs[r + 1];
    const outK = next === undefined ? 0 : ease.inCubic(clamp((t - (next - 0.32) - i * 0.04) / 0.28));
    return [inK, outK];
  }
  px(t: number, r: number, i: number) {
    const [a, b] = this.slide(t, r, i);
    return { x: lerp(1100, 0, a) - 1100 * b, a: a * (1 - b) };
  }
  roundOn(t: number, r: number) {
    const s = r === 0 ? 0 : this.rs[r]! - 0.35, e = this.rs[r + 1] ?? 999;
    return t >= s && t < e;
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const ys = [-170, -20, 130, 280];
    // ---- round 1
    if (this.roundOn(t, 0)) {
      const q = this.px(t, 0, 0);
      question(ctx, c, q.x, -390, 960, ['WHAT DOES THIS AI DO?'], { a: q.a });
      const ans: [string, string][] = [['A', 'Write essays'], ['B', 'Write code'], ['C', 'Chat with you'], ['D', 'Multiple choice']];
      ans.forEach(([l, s], i) => {
        const p = this.px(t, 0, i + 1);
        const st: PanelState = i === 3 ? (t > w.choice!.end + 0.15 ? 'right' : t > w.multiple!.start ? 'locked' : 'idle') : (t > w.choice!.end + 0.15 ? 'dim' : 'idle');
        panel(ctx, c, p.x, ys[i]!, PW, PH, l, s, { state: st, a: p.a, flash: i === 3 ? clamp(1 - (t - w.multiple!.start) / 0.2) * (t > w.multiple!.start ? 1 : 0) : 0 });
      });
      const dk = ob(clamp((t - w.only!.start) / 0.35));
      dot(ctx, c, -500 + this.px(t, 0, 4).x, lerp(-170, 280, ease.inOutCubic(clamp((t - w.multiple!.start + 0.2) / 0.3))), 22 * dk, this.px(t, 0, 4).a);
    }
    // ---- round 2
    if (this.roundOn(t, 1)) {
      const q = this.px(t, 1, 0);
      question(ctx, c, q.x, -390, 960, ['THIS EMAIL IS ABOUT…?'], { a: q.a * clamp((t - w.options!.start + 0.4) / 0.2) });
      const ans: [string, string, number][] = [['A', 'Billing', 6], ['B', 'Technical', 88], ['C', 'Account', 6]];
      const pk = clamp((t - w.how!.start) / 0.4);
      ans.forEach(([l, s, v], i) => {
        const p = this.px(t, 1, i + 1);
        const app = clamp((t - w.options!.start + 0.3 - i * 0.07) / 0.2);
        const st: PanelState = i === 1 ? (t > w.sure!.end ? 'right' : t > w.picks!.start ? 'locked' : 'idle') : (t > w.picks!.start ? 'dim' : 'idle');
        panel(ctx, c, p.x, ys[i]!, PW, PH, l, s, { state: st, a: p.a * app, pct: pk > 0 ? v * ease.outCubic(pk) : null, flash: i === 1 ? clamp(1 - (t - w.picks!.start) / 0.2) * (t > w.picks!.start ? 1 : 0) : 0 });
      });
      // the stopwatch: 0.1 s, in a blink
      const sk = ob(clamp((t - w.blink!.start + 0.15) / 0.3)) * this.px(t, 1, 4).a;
      if (sk > 0) {
        setWorld(ctx, c, 330 + this.px(t, 1, 4).x, 340 + 120, sk, 0);
        ctx.fillStyle = '#0A1240'; ctx.strokeStyle = GOLD; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(0, 0, 86, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = GOLD; ctx.fillRect(-14, -112, 28, 22);
        ctx.font = font(MONOB, 50); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText('0.1s', 0, 17);
        ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // ---- round 3
    if (this.roundOn(t, 2)) {
      const items: [string, string, string, boolean][] = [['A', 'Chat?', 'chat', false], ['B', 'Write?', 'write', false], ['C', 'Decide?', 'decides', true]];
      items.forEach(([l, s, key, ok], i) => {
        const p = this.px(t, 2, i);
        const done = t > w[key]!.start;
        panel(ctx, c, p.x, -260 + i * 190, PW, PH + 20, l, s, { state: done ? (ok ? 'right' : 'wrong') : 'idle', a: p.a, size: 60 });
        if (done) mark(ctx, c, p.x + 340, -260 + i * 190, ok, clamp((t - w[key]!.start) / 0.2) * p.a);
      });
    }
    // ---- round 4: the ladder
    if (this.roundOn(t, 3)) {
      const rungs = ['2×', '10×', '50×', '100×', '200×', '444×'];
      const climb = clamp((t - w['444']!.start + 0.1) / Math.max(0.6, w.times!.start - w['444']!.start));
      const lvl = Math.min(5, Math.floor(climb * 6));
      rungs.forEach((s, i) => {
        const p = this.px(t, 3, 5 - i);
        const y = 330 - i * 135;
        const st: PanelState = i === 5 && climb >= 1 ? (t > w.cheaper!.start ? 'right' : 'locked') : i === lvl && climb > 0 ? 'locked' : 'idle';
        panel(ctx, c, p.x, y, 760, 104, '', `${s} cheaper`, { state: st, a: p.a, size: 52 });
      });
      const ta = this.px(t, 3, 6);
      setWorld(ctx, c, ta.x, 430, 1, 0);
      ctx.globalAlpha = ta.a * clamp((t - w.typical!.start) / 0.3); ctx.font = font(BOLD, 34); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'center';
      ctx.fillText("* its makers' claim, vs a typical AI model", 0, 0);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // ---- round 5: lifelines
    if (this.roundOn(t, 4)) {
      const a = this.px(t, 4, 0), b = this.px(t, 4, 1);
      lifeline(ctx, c, -240 + a.x, -120, 150, 'mail', 'SORT EMAILS', (0.45 + 0.55 * clamp((t - w.sort!.start + 0.1) / 0.25)) * a.a);
      lifeline(ctx, c, 240 + b.x, -120, 150, 'shield', 'GUARD AGENTS', (0.45 + 0.55 * clamp((t - w.guard!.start + 0.1) / 0.25)) * b.a);
      const hop = ease.inOutCubic(clamp((t - w.guard!.start + 0.2) / 0.35));
      const dk = ob(clamp((t - w.sort!.start) / 0.3));
      dot(ctx, c, lerp(-240, 240, hop) + a.x, -340 - Math.sin(hop * Math.PI) * 120, 26 * dk, a.a);
    }
    // ---- round 6: final answer
    if (this.roundOn(t, 5)) {
      const q = this.px(t, 5, 0);
      question(ctx, c, q.x, -420, 960, ['WILL YOU SUBSCRIBE?'], { a: q.a });
      const ans: [string, string][] = [['A', 'Yes'], ['B', 'Yes'], ['C', 'Obviously'], ['D', 'All of the above']];
      const lock = w.subscribe!.start, right = lock + 0.35;
      ans.forEach(([l, s], i) => {
        const p = this.px(t, 5, i + 1);
        const st: PanelState = i === 3 ? (t > right ? 'right' : t > lock ? 'locked' : 'idle') : (t > right ? 'dim' : 'idle');
        panel(ctx, c, p.x, -220 + i * 140, PW, 112, l, s, { state: st, a: p.a, size: 50 });
      });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (this.roundOn(t, 0)) title(ctx, c, 'POV:', this.px(t, 0, 0).x, -640, 170, clamp((t - 0.15) / 0.2) * this.px(t, 0, 0).a);
    if (this.roundOn(t, 1)) {
      const a = clamp((t - w.jev!.start + 0.1) / 0.2) * this.px(t, 1, 0).a, x = this.px(t, 1, 0).x;
      title(ctx, c, 'JEV', x - 30, -620, 220, a);
      dot(ctx, c, x + 222, -650, 30 * ob(clamp((t - w.jev!.start - 0.15) / 0.3)), a);
    }
    if (this.roundOn(t, 2)) title(ctx, c, 'CAN JEV…', this.px(t, 2, 0).x, -560, 140, this.px(t, 2, 0).a);
    if (this.roundOn(t, 3)) {
      const p = this.px(t, 3, 0);
      title(ctx, c, '444×', p.x, -650, 210, clamp((t - w['444']!.start + 0.1) / 0.2) * p.a, GREEN);
      title(ctx, c, 'CHEAPER?', p.x, -520, 100, clamp((t - w.makers!.start) / 0.2) * p.a, WHITE);
    }
    if (this.roundOn(t, 4)) title(ctx, c, 'ALREADY USED TO:', this.px(t, 4, 0).x, -560, 84, this.px(t, 4, 0).a);
    if (this.roundOn(t, 5)) title(ctx, c, 'FINAL ANSWER?', this.px(t, 5, 0).x, -640, 104, clamp((t - w.final!.start + 0.1) / 0.2) * this.px(t, 5, 0).a);
    subscribe(ctx, t, w.subscribe!.start + 0.45, this.ctx.end + 1, { x: W / 2, y: H / 2 + 460, s: 1.0, dark: true });
    void RED;
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.multiple!.start, 0.03) * this.punch(t, w.picks!.start, 0.03) * this.punch(t, w.decides!.start, 0.03) * this.punch(t, w.cheaper!.start, 0.03) * this.punch(t, w.subscribe!.start, 0.03) };
  }
}

function mark(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, ok: boolean, a: number) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.7 + 0.3 * ob(clamp(a)), 0);
  ctx.globalAlpha = clamp(a); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 18; ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath();
  if (ok) { ctx.moveTo(-34, 2); ctx.lineTo(-8, 28); ctx.lineTo(38, -26); }
  else { ctx.moveTo(-28, -28); ctx.lineTo(28, 28); ctx.moveTo(28, -28); ctx.lineTo(-28, 28); }
  ctx.stroke(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
