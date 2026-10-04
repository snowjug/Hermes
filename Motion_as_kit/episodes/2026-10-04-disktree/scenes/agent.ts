// AGENT: "One key even copies the list as a prompt for your coding agent, to check each path before
// removing it."
// The A key is pressed; the review list becomes a prompt that types itself onto a card (paraphrasing the
// README); the card slides into a terminal labelled "your coding agent", where each path gets a check.
import { type LineBatch } from '@engine/lines';
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, drawWindow, typed, pt, ease, lerp, prog, pulse, rgba, setWorld, font, F, label, type Cam } from '@kit/_mp';

const PROMPT = [
  'Free up the space by removing what I picked:',
  '  ~/.cache                       58 GiB',
  'Check each path first: git work that exists',
  "nowhere else, a tool's own clean command.",
  'Touch nothing else.',
];

export default class Agent extends Plate {
  tKey = 0; tSend = 0;

  build() {
    const w = this.w;
    const L = this.take('One key even copies', ['One', 'key', 'copies', 'list', 'prompt', 'coding', 'agent,', 'check', 'path', 'removing']);
    this.kw.push(...placeRow(this.span(L, 'One', 'prompt'), -880, 340, 54, ARCH(100, 700), 'K', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'for', 'it.'), -880, 410, 54, ARCH(100, 700), 'K', { ant: 0.2 }).words);
    this.tKey = w.key!.start; this.tSend = w.coding!.start;
    const K = this.cam;
    K.key(this.ctx.start, -560, -90, 1.25, -0.01);
    K.key(this.tKey + 0.3, -300, -60, 1.08, -0.004, ease.inOutCubic);
    K.key(this.tSend + 0.3, 40, -40, 0.98, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 50, -40, 1.0, 0.003, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the A key
    const press = pulse(t, this.tKey, 0.08);
    const ka = prog(t, this.ctx.start, this.ctx.start + 0.25);
    setWorld(ctx, c, -760, -200 + 10 * press);
    ctx.globalAlpha = ka;
    ctx.fillStyle = rgba('bone', 0.95); ctx.fillRect(0, 0, 170, 170);
    ctx.fillStyle = rgba('ink2', 1); ctx.fillRect(10, 10, 150, 150);
    ctx.font = font(F.mono(600), 96); ctx.fillStyle = press > 0.1 ? rgba('signal', 1) : rgba('bone', 1); ctx.fillText('a', 56, 118);
    ctx.lineWidth = 3 / c.z; ctx.strokeStyle = press > 0.1 ? rgba('signal', 1) : rgba('bone', 0.6); ctx.strokeRect(0, 0, 170, 170);
    label(ctx, 'ON THE REVIEW SCREEN', 0, 210, { size: 16, col: rgba('ash', 1), spacing: 3 });
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the prompt card, then the terminal
    const mv = ease.inOutCubic(prog(t, this.tSend, this.tSend + 0.6));
    const cx = lerp(-480, 40, mv), cy = lerp(-250, -230, mv);
    const ta = prog(t, this.tKey + 0.1, this.tKey + 0.3);
    const tw = prog(t, this.tSend - 0.2, this.tSend + 0.2);
    if (tw > 0) {
      drawWindow(ctx, c, 0, -330, 880, 560, 'your coding agent', { a: tw });
      setWorld(ctx, c, 30, 210);
      ctx.globalAlpha = tw; ctx.font = font(F.mono(500), 26); ctx.fillStyle = rgba('signal', 1); ctx.fillText('>', 0, 0);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (ta > 0) {
      drawWindow(ctx, c, cx, cy, 820, 330, 'clipboard · prompt', { a: ta, fill: rgba('#0F2B42', 0.98) });
      const per = 0.33;
      PROMPT.forEach((ln, i) => typed(ctx, c, ln, cx + 30, cy + 100 + i * 44, t, this.tKey + 0.2 + i * per, per * 0.95, { size: 24, col: i === 1 ? 'acid' : 'bone', a: ta, caret: i === PROMPT.length - 1 }));
      setWorld(ctx, c, cx + 820, cy + 360);
      ctx.globalAlpha = ta;
      label(ctx, 'PARAPHRASED FROM THE README', 0, 0, { size: 14, col: rgba('ash', 0.9), spacing: 3, align: 'right' });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the agent's checks
    const ck = prog(t, w.check!.start, w.check!.start + 0.2);
    if (ck > 0) {
      setWorld(ctx, c, 70, 120);
      ctx.globalAlpha = ck; ctx.font = font(F.mono(400), 24);
      const rows: [string, string, number][] = [['git status ~/.cache', 'nothing to keep', w.check!.start], ['what owns it?', 'caches; tools rebuild them', w.path!.start], ['remove ~/.cache', 'only what was picked', w.removing!.start]];
      rows.forEach(([a, b, tt], i) => {
        const k = prog(t, tt, tt + 0.2);
        if (k <= 0) return;
        ctx.globalAlpha = ck * k;
        ctx.fillStyle = rgba('signal', 1); ctx.fillText('✓', 0, i * 44);
        ctx.fillStyle = rgba('bone', 0.95); ctx.fillText(a, 34, i * 44);
        ctx.fillStyle = rgba('ash', 1); ctx.fillText(`  ${b}`, 34 + ctx.measureText(a).width, i * 44);
      });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    void pt;
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}
  postFX(t: number) { return { zoom: 1 + 0.014 * pulse(t, this.tKey, 0.1) }; }
}
