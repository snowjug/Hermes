// SKILL: "It isn't an app. It's a skill your AI agent runs, in Claude Code, Cursor or Codex."
// An app icon (rounded square) lands and is struck through on "app" (NOT AN APP). On "skill" a skill card
// slides in (ppt-master · SKILL · runs inside your agent) and the three agents land as pills, one per name,
// wired to the card with glowing lines.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Keynote, glass, pill, headline, HEAD, BODY, ORANGE, VIOLET, TEAL, WHITE, SOFT, clamp, ease } from '@ep/keynote';

const AGENTS = [
  { key: 'claude', name: 'Claude Code', x: 520, y: -220 },
  { key: 'cursor', name: 'Cursor', x: 560, y: 0 },
  { key: 'codex', name: 'Codex', x: 520, y: 220 },
];

export default class Skill extends Keynote {
  build() {
    this.take("It isn't an app", ["isn't", 'app.', 'skill', 'agent', 'runs,', 'Claude', 'Cursor', 'Codex.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -420, -30, 1.08, 0);
    K.key(w.skill!.start - 0.1, 0, 0, 0.96, 0);
    K.key(this.ctx.end, 20, 0, 0.98, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the app icon, struck out
    const ka = clamp((t - this.ctx.start) / 0.25);
    const fade = 1 - 0.6 * clamp((t - w.skill!.start) / 0.3);
    setWorld(ctx, c, -560, -40, 0.8 + 0.2 * ease.outBack(ka), 0);
    ctx.globalAlpha = ka * fade;
    const g = ctx.createLinearGradient(-130, -130, 130, 130); g.addColorStop(0, VIOLET); g.addColorStop(1, ORANGE);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-130, -130, 260, 260, 60); ctx.fill();
    ctx.font = font(HEAD, 64); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText('APP', 0, 22);
    ctx.font = font(BODY, 36); ctx.fillStyle = SOFT; ctx.fillText('NOT AN APP', 0, 200); ctx.textAlign = 'left';
    const kx = clamp((t - w.app!.start) / 0.25);
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-160, 160); ctx.lineTo(-160 + 320 * kx, 160 - 320 * kx); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the skill card
    const ks = clamp((t - w.skill!.start + 0.05) / 0.3);
    if (ks > 0) {
      const e = ease.outCubic(ks);
      glass(ctx, c, -240 + (1 - e) * -120, -200, 480, 400, { a: e });
      setWorld(ctx, c, -240 + (1 - e) * -120, -200, 1, 0);
      ctx.globalAlpha = e;
      ctx.fillStyle = 'rgba(255,91,58,0.18)'; ctx.beginPath(); ctx.roundRect(30, 30, 90, 90, 22); ctx.fill();
      ctx.font = font(HEAD, 50); ctx.fillStyle = ORANGE; ctx.fillText('P', 58, 94);
      ctx.font = font(HEAD, 44); ctx.fillStyle = WHITE; ctx.fillText('ppt-master', 140, 76);
      ctx.font = font(BODY, 28); ctx.fillStyle = SOFT; ctx.fillText('SKILL', 140, 112);
      ctx.font = font(BODY, 30); ctx.fillStyle = WHITE;
      ['Reads your documents', 'Plans the deck', 'Exports a real .pptx'].forEach((s, i) => { ctx.fillStyle = TEAL; ctx.fillText('✓', 34, 200 + i * 60); ctx.fillStyle = WHITE; ctx.fillText(s, 76, 200 + i * 60); });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the agents, wired in
    AGENTS.forEach((a) => {
      const t0 = w[a.key]!.start - 0.05;
      if (t < t0) return;
      const k = clamp((t - t0) / 0.25);
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.strokeStyle = `rgba(123,92,255,${0.8 * k})`; ctx.lineWidth = 4; ctx.shadowColor = 'rgba(123,92,255,0.9)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(240, a.y * 0.4); ctx.lineTo(240 + (a.x - 120 - 240) * k, a.y * 0.4 + (a.y - a.y * 0.4) * k); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      pill(ctx, c, a.name, a.x, a.y, 40, { a: k, bg: 'rgba(30,36,72,0.95)' });
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    headline(ctx, c, 'A SKILL FOR YOUR AI AGENT', 0, -330, 76, t, this.w.agent!.start, { from: '#FFFFFF', to: '#C9C2FF' });
  }
}
