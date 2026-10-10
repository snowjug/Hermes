// LOCAL: "Everything runs on your machine; only the AI model calls go out. The tool is free. You pay for the
// model: Claude, GPT, Gemini or Kimi."
// A laptop drawn in glass with the pipeline running inside it (READ → PLAN → DESIGN → EXPORT); on "only the AI
// model calls" one dotted beam leaves it for a cloud labelled AI MODEL. On "free" a big $0 tag on the tool; on
// "pay for the model" four model pills drop in under the cloud, one per name.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, pill, headline, HEAD, BODY, WHITE, SOFT, ORANGE, VIOLET, TEAL, clamp, ease, TAU } from '@ep/keynote';

const MODELS = [['claude', 'Claude'], ['gpt', 'GPT'], ['gemini', 'Gemini'], ['kimi', 'Kimi']] as const;

export default class Local extends Keynote {
  build() {
    this.take('Everything runs', ['Everything', 'runs', 'machine;', 'only', 'model', 'calls', 'out.', 'free.', 'pay', 'Claude,', 'GPT,', 'Gemini', 'Kimi.']);
    const K = this.cam;
    K.key(this.ctx.start, -300, 0, 1.0, 0);
    K.key(this.w.only!.start - 0.1, 0, 0, 0.92, 0);
    K.key(this.ctx.end, 60, 0, 0.94, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a0 = clamp((t - this.ctx.start) / 0.25);
    // the laptop
    glass(ctx, c, -900, -260, 760, 440, { a: a0, tint: 'rgba(22,26,52,0.94)' });
    setWorld(ctx, c, -900, -260, 1, 0); ctx.globalAlpha = a0;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(-60, 470); ctx.lineTo(820, 470); ctx.lineTo(760, 440); ctx.lineTo(0, 440); ctx.closePath(); ctx.fill();
    ctx.font = font(BODY, 28); ctx.fillStyle = SOFT; ctx.fillText('YOUR MACHINE', 40, 56);
    const steps = ['READ', 'PLAN', 'DESIGN', 'EXPORT'];
    steps.forEach((s, i) => {
      const on = ((t - this.ctx.start) * 2.2) % 4 >= i;
      ctx.fillStyle = on ? [ORANGE, VIOLET, TEAL, ORANGE][i]! : 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.roundRect(40 + i * 178, 160, 160, 120, 18); ctx.fill();
      ctx.font = font(HEAD, 30); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText(s, 120 + i * 178, 230); ctx.textAlign = 'left';
    });
    ctx.font = font(BODY, 26); ctx.fillStyle = TEAL; ctx.fillText('the whole pipeline runs here', 40, 360);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the cloud and the one beam
    const kb = clamp((t - w.only!.start) / 0.4);
    if (kb > 0) {
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.setLineDash([14, 12]); ctx.lineDashOffset = -t * 60; ctx.strokeStyle = 'rgba(255,179,122,0.95)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-140, -40); ctx.lineTo(-140 + 420 * kb, -40 - 120 * kb); ctx.stroke(); ctx.setLineDash([]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      setWorld(ctx, c, 470, -190, 0.8 + 0.2 * ease.outBack(kb), 0); ctx.globalAlpha = kb;
      ctx.fillStyle = 'rgba(244,245,255,0.95)';
      [[-110, 10, 70], [-30, -40, 90], [80, -10, 75], [150, 30, 55], [-160, 40, 50]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x!, y!, r!, 0, TAU); ctx.fill(); });
      ctx.beginPath(); ctx.roundRect(-200, 20, 400, 80, 40); ctx.fill();
      ctx.font = font(HEAD, 40); ctx.fillStyle = '#141833'; ctx.textAlign = 'center'; ctx.fillText('AI MODEL', 0, 40); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // $0
    const kf = clamp((t - w.free!.start) / 0.2);
    if (kf > 0) {
      setWorld(ctx, c, -520, 330, 0.7 + 0.3 * ease.outBack(kf), -0.06); ctx.globalAlpha = kf;
      ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.roundRect(-190, -70, 380, 140, 70); ctx.fill();
      ctx.font = font(HEAD, 70); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText('$0 TOOL', 0, 24); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // model pills
    MODELS.forEach(([k, name], i) => {
      const t0 = w[k]!.start - 0.05;
      if (t < t0) return;
      pill(ctx, c, name, 260 + i * 160, 60, 32, { a: clamp((t - t0) / 0.15), bg: 'rgba(30,36,72,0.95)' });
    });
    pill(ctx, c, 'YOU PAY FOR THE MODEL', 500, 160, 28, { a: clamp((t - w.pay!.start) / 0.2), bg: 'rgba(123,92,255,0.9)' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'RUNS ON YOUR MACHINE', -420, -360, 66, t, this.w.everything!.start - 0.05, { from: '#FFFFFF', to: '#2ED3C0' });
  }
}
