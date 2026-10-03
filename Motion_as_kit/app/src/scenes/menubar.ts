// MENUBAR: "Click its menu bar icon and you get one list: every agent on your machine, and the model
// it's set to. Click a model, pick a new one. That's the whole app."
// The panel is magpie's own screen as its README shows it (agents and their models). A cursor clicks
// the menu-bar icon; the panel drops; agents arrive, then their models. Then the cursor opens Codex's
// model, picks deepseek/deepseek-v4-pro, and the value changes. On "the whole app" the camera pulls
// back and the pen dimensions the panel.
import { type LineBatch } from '../engine/lines';
import { placeRow, rectPts } from './_vo';
import { Plate, ARCH, typed, pt, clamp, ease, lerp, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, measure, w2s, TAU, type Cam } from './_mp';

const ROWS: [string, string][] = [
  ['Claude Code', 'claude-fable-5-1[1m]'],
  ['Codex', 'gpt-6-astra'],
  ['Gemini CLI', 'gemini-3.1-pro'],
  ['OpenCode', 'anthropic/claude-sonnet-5'],
  ['Goose', 'anthropic/claude-sonnet-5'],
  ['Cursor', 'auto'],
  ['Copilot CLI', 'claude-fable-5'],
];
const CHOICES = ['deepseek/deepseek-v4-pro', 'moonshot/kimi-k3', 'zhipu/glm-5.3', 'claude/claude-sonnet-5', 'gpt-6-astra  (native)'];
const PX = -520, PY = -390, PW = 1040, RH = 70, PH = 44 + 26 + ROWS.length * RH + 20;
const ICON = pt(380, -430);
const VX = PX + 380; // model column
const rowY = (i: number) => PY + 44 + 26 + i * RH + 40;
const DX = VX - 20, DY = rowY(1) + 28, DW = 620, DH = 26 + CHOICES.length * 60;

export default class Menubar extends Plate {
  tDrop = 0; tAgents: number[] = []; tModels: number[] = [];
  tClick1 = 0; tClick2 = 0; tPick = 0; tWhole = 0;
  cur: { t: number; p: { x: number; y: number } }[] = [];

  build() {
    const w = this.w;
    const L6 = this.take('Click its menu bar icon', [['click1', 'Click'], 'its', 'menu', 'bar', 'icon', ['and1', 'and', 0], 'you', 'get', 'one', 'list:', 'every', 'agent', 'on', 'your', 'machine,', ['and2', 'and', 1], ['the1', 'the'], ['model1', 'model'], "it's", 'set', 'to.']);
    const L7 = this.take('Click a model, pick', [['click2', 'Click'], ['a1', 'a', 0], ['model2', 'model,'], 'pick', ['a2', 'a', 1], 'new', 'one.', "That's", ['the2', 'the'], 'whole', 'app.']);
    this.tClick1 = w.icon!.start + 0.05;
    this.tDrop = w.icon!.end;
    const tA0 = w.every!.start, tA1 = w.machine!.end;
    this.tAgents = ROWS.map((_, i) => lerp(tA0, tA1, i / ROWS.length));
    const tM0 = w.model1!.start, tM1 = w.to!.end + 0.2;
    this.tModels = ROWS.map((_, i) => lerp(tM0, tM1, i / ROWS.length));
    this.tClick2 = w.click2!.start + 0.18;
    this.tPick = w.new!.start;
    this.tWhole = w.whole!.start;
    // cursor path
    this.cur = [
      { t: this.ctx.start, p: pt(620, -180) },
      { t: this.tClick1 - 0.05, p: pt(ICON.x + 4, ICON.y + 6) },
      { t: w.click2!.start - 0.2, p: pt(ICON.x + 60, ICON.y + 180) },
      { t: this.tClick2 - 0.04, p: pt(VX + 120, rowY(1) - 10) },
      { t: w.pick!.start, p: pt(VX + 120, rowY(1) - 10) },
      { t: this.tPick - 0.04, p: pt(DX + 180, DY + 26 + 30) },
      { t: this.tWhole, p: pt(DX + 260, DY + 160) },
      { t: this.ctx.end, p: pt(DX + 300, DY + 220) },
    ];
    // karaoke under the panel
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L6, 'every', 'to.'), -760, 390, 56, fam, 'K6', { ant: 0.2 }).words);
    this.kw.push(...placeRow(L7.words, -760, 390, 56, fam, 'K7', { ant: 0.2 }).words);
    // the pen dimensions the whole panel on "the whole app"
    const tw = this.tWhole;
    this.plot.add(rectPts(PX - 24, PY - 24, PW + 48, PH + 48), tw, tw + 0.5, 'signal', { pen: true, ez: ease.inOutQuad, width: 2.4, dash: 14, group: 'D' });
    this.plot.dimension(pt(PX - 24, PY + PH + 66), pt(PX + PW + 24, PY + PH + 66), 'the whole app', tw + 0.3, 'D', 28);
    const K = this.cam;
    K.key(this.ctx.start, ICON.x - 80, ICON.y + 90, 1.7, 0.01);
    K.key(this.tClick1, ICON.x - 60, ICON.y + 100, 1.75, 0.008, ease.inOutCubic);
    K.key(this.tDrop + 0.45, 0, -40, 1.04, 0.0, ease.inOutCubic);
    K.key(w.click2!.start - 0.25, 0, -30, 1.06, 0.0, ease.linear);
    K.key(this.tClick2 + 0.1, VX + 100, rowY(1) + 120, 1.45, -0.01, ease.inOutCubic);
    K.key(this.tPick + 0.2, VX + 100, rowY(1) + 140, 1.5, -0.008, ease.linear);
    K.key(this.tWhole + 0.3, 0, 0, 0.9, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 0, 0.92, 0.004, ease.linear);
  }

  alpha(g: string, t: number) {
    if (g === 'K6') return 1 - prog(t, this.w.click2!.start - 0.15, this.w.click2!.start);
    if (g === 'K7') return prog(t, this.w.click2!.start - 0.15, this.w.click2!.start);
    return 1;
  }

  cursorAt(t: number) {
    const ks = this.cur;
    if (t <= ks[0]!.t) return ks[0]!.p;
    for (let i = 1; i < ks.length; i++) {
      const b = ks[i]!;
      if (t > b.t) continue;
      const a = ks[i - 1]!;
      const k = ease.inOutCubic(clamp((t - a.t) / Math.max(1e-3, b.t - a.t)));
      return pt(lerp(a.p.x, b.p.x, k), lerp(a.p.y, b.p.y, k));
    }
    return ks[ks.length - 1]!.p;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const hair = 1.2 / c.z;
    // the menu bar
    setWorld(ctx, c, -960, ICON.y - 26);
    ctx.fillStyle = rgba('ink2', 0.96);
    ctx.fillRect(0, 0, 1920, 52);
    ctx.fillStyle = rgba('bone', 0.12);
    ctx.fillRect(0, 52, 1920, hair);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = rgba('bone', 0.35); ctx.fillRect(1500 + i * 46, 18, 22, 16); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the magpie icon
    const ih = pulse(t, this.tClick1, 0.3);
    setWorld(ctx, c, ICON.x, ICON.y);
    ctx.strokeStyle = mixCss('bone', 'signal', ih, 0.9); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.stroke();
    ctx.fillStyle = mixCss('bone', 'signal', ih, 0.95);
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill();
    if (t > this.tClick1 - 0.05) { ctx.fillStyle = rgba('bone', 0.12 * (1 - prog(t, this.tDrop, this.tDrop + 2))); ctx.fillRect(-26, -24, 52, 48); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the panel drops from the icon
    const drop = ease.outExpo(prog(t, this.tDrop - 0.05, this.tDrop + 0.4));
    if (drop > 0) {
      const h = PH * drop;
      setWorld(ctx, c, PX, PY);
      ctx.save();
      ctx.beginPath(); ctx.rect(-4, -4, PW + 8, h + 8); ctx.clip();
      ctx.fillStyle = rgba('ink2', 0.97); ctx.fillRect(0, 0, PW, PH);
      ctx.lineWidth = hair; ctx.strokeStyle = rgba('bone', 0.35); ctx.strokeRect(0, 0, PW, PH);
      // title: ◉ magpie
      ctx.strokeStyle = rgba('signal', 0.95); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(30, 24, 8, 0, TAU); ctx.stroke();
      ctx.fillStyle = rgba('signal', 0.95); ctx.beginPath(); ctx.arc(30, 24, 3.5, 0, TAU); ctx.fill();
      ctx.font = font(F.mono(600), 24); ctx.fillStyle = rgba('bone', 0.9); ctx.fillText('magpie', 48, 32);
      label(ctx, 'AGENT', 36, 44 + 26 - 2, { size: 15, col: rgba('ash', 0.8), spacing: 3 });
      label(ctx, 'MODEL', VX - PX, 44 + 26 - 2, { size: 15, col: rgba('ash', 0.8), spacing: 3 });
      ctx.fillStyle = rgba('bone', 0.12); ctx.fillRect(0, 44, PW, hair);
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ROWS.forEach(([agent, model], i) => {
        const ta = this.tAgents[i]!, tm = this.tModels[i]!;
        const a = prog(t, ta, ta + 0.18) * (h > rowY(i) - PY ? 1 : 0);
        if (a <= 0) return;
        const y = rowY(i);
        setWorld(ctx, c, PX, y);
        const sel = i === 1 && t > this.tClick2 - 0.05 && t < this.tWhole;
        if (sel) { ctx.fillStyle = rgba('signal', 0.1); ctx.fillRect(8, -44, PW - 16, RH - 4); }
        ctx.font = font(F.mono(500), 31);
        ctx.fillStyle = rgba('bone', 0.92 * a);
        ctx.fillText(agent, 36, 0);
        ctx.fillStyle = rgba('bone', 0.08 * a); ctx.fillRect(24, 24, PW - 48, hair);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // the model value: typed in, and Codex's swapped after the pick
        const swapped = i === 1 && t > this.tPick + 0.12;
        const val = swapped ? 'deepseek/deepseek-v4-pro' : model;
        const t0 = swapped ? this.tPick + 0.12 : tm;
        typed(ctx, c, val, VX, y, t, t0, swapped ? 0.3 : 0.25, { size: 30, col: swapped ? 'signal' : 'ash', caret: false, hot: swapped ? 1.2 : 0.4 });
      });
    }
    // the dropdown of models for Codex
    const dOpen = prog(t, this.tClick2, this.tClick2 + 0.2, ease.outCubic) * (1 - prog(t, this.tPick + 0.1, this.tPick + 0.25));
    if (dOpen > 0) {
      setWorld(ctx, c, DX, DY);
      ctx.save();
      ctx.beginPath(); ctx.rect(-6, -6, DW + 12, DH * dOpen + 12); ctx.clip();
      ctx.fillStyle = rgba('ink', 0.98); ctx.fillRect(0, 0, DW, DH);
      ctx.lineWidth = hair; ctx.strokeStyle = rgba('signal', 0.7); ctx.strokeRect(0, 0, DW, DH);
      CHOICES.forEach((m, k) => {
        const y = 26 + k * 60 + 20;
        const hover = k === 0 && t > this.tPick - 0.3;
        if (hover) { ctx.fillStyle = rgba('signal', 0.2); ctx.fillRect(6, y - 38, DW - 12, 56); }
        ctx.font = font(F.mono(400), 28);
        ctx.fillStyle = hover ? rgba('bone', 1) : rgba('bone', k === CHOICES.length - 1 ? 0.5 : 0.82);
        ctx.fillText(m, 22, y);
      });
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // click ripples and the cursor
    for (const tc of [this.tClick1, this.tClick2, this.tPick]) {
      const age = t - tc;
      if (age < 0 || age > 0.5) continue;
      const p = this.cursorAt(tc);
      const [sx, sy] = w2s(c, p.x, p.y);
      ctx.strokeStyle = rgba('signal', 0.9 * (1 - age / 0.5)); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, (10 + 60 * ease.outCubic(age / 0.5)) * Math.min(1.5, c.z), 0, TAU); ctx.stroke();
    }
    const p = this.cursorAt(t);
    const [sx, sy] = w2s(c, p.x, p.y);
    const s = 1.15 * Math.min(1.6, Math.max(0.8, c.z));
    const press = [this.tClick1, this.tClick2, this.tPick].reduce((m, tc) => Math.max(m, pulse(t, tc, 0.06)), 0);
    ctx.setTransform(s * (1 - 0.12 * press), 0, 0, s * (1 - 0.12 * press), sx, sy);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(15, 40); ctx.lineTo(21, 37); ctx.lineTo(15, 24); ctx.lineTo(27, 24); ctx.closePath();
    ctx.fillStyle = rgba('bone', 1); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = rgba('ink', 1); ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    void measure; void noise1;
  }

  drawFX(_X: LineBatch, _t: number, _c: Cam) {}

  postFX(t: number) {
    return { zoom: 1 + 0.008 * pulse(t, this.tDrop, 0.1) + 0.01 * pulse(t, this.tPick + 0.12, 0.1) };
  }
}
