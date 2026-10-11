// PLUGIN: "It isn't a website. It's a plugin for your AI agent: Claude Code, Codex, Cursor, Gemini or Grok."
// A browser window with an address bar gets a red strike on "website". On "plugin" a puzzle-piece chip slides
// into a hub, YOUR AI AGENT; the five agents light up around it one by one, each wired to the hub.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts } from '@kit/_cad3d';
import { Viewport, panel, tag, BODY, HEAD, MONO, WHITE, SOFT, ORANGE, BLUE, RED, clamp, ease, lerp } from '@ep/viewport';

const AGENTS: [string, string, number, number][] = [['Claude Code', 'claude', -560, -250], ['Codex', 'codex', -620, 40], ['Cursor', 'cursor', 600, -250], ['Gemini', 'gemini', 640, 40], ['Grok', 'grok', 0, 250]];

export default class Plugin extends Viewport {
  build() {
    this.take("It isn't a website", ['website.', 'plugin', 'agent:', 'Claude', 'Codex,', 'Cursor,', 'Gemini', 'Grok.']);
    const K = this.cam;
    K.key(this.ctx.start, -300, 0, 1.12, 0);
    K.key(this.w.plugin!.start - 0.1, -260, 0, 1.12, 0);
    K.key(this.w.agent!.start, 0, 0, 0.98, 0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 0, 0.96, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawParts(ctx, c, 0, 160, { yaw: 0.3 + 0.1 * t, pitch: 0.55, dist: 1100, s: 3.6 }, [], { grid: 360, gridStep: 10, a: 0.5 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the browser window, struck out
    const ba = clamp((t - this.ctx.start) / 0.2) * clamp((w.agent!.start + 0.3 - t) / 0.3);
    if (ba > 0) {
      panel(ctx, c, -760, -300, 640, 420, 'browser', { a: ba });
      setWorld(ctx, c, -760, -300, 1, 0);
      ctx.globalAlpha = ba;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(30, 74, 580, 50, 25); ctx.fill();
      ctx.fillStyle = SOFT; ctx.font = font(MONO, 24); ctx.fillText('https://www.some-cad-site.com', 56, 108);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 4; i++) ctx.fillRect(40, 160 + i * 52, 560 - i * 90, 26);
      const sk = ease.outCubic(clamp((t - w.website!.start - 0.05) / 0.25));
      ctx.strokeStyle = RED; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(40, 390); ctx.lineTo(lerp(40, 600, sk), lerp(390, 60, sk)); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tag(ctx, c, 'NOT A WEBSITE', -440, 180, 36, { a: ba * clamp((t - w.website!.start) / 0.15), bg: 'rgba(255,90,95,0.95)' });
    }
    // the hub
    const hk = clamp((t - w.plugin!.start + 0.15) / 0.25);
    if (hk > 0) {
      const hx = 0, hy = -20;
      // wires to the agents
      AGENTS.forEach(([, key, ax, ay]) => {
        const on = clamp((t - w[key]!.start + 0.05) / 0.2);
        if (on <= 0) return;
        setWorld(ctx, c, 0, 0, 1, 0);
        ctx.globalAlpha = on; ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 60;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(lerp(hx, ax, on), lerp(hy, ay, on)); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        tag(ctx, c, AGENTS.find((a) => a[1] === key)![0], ax, ay, 40, { a: on, bg: 'rgba(22,28,37,0.96)', stroke: ORANGE });
      });
      setWorld(ctx, c, hx, hy, 0.8 + 0.2 * ease.outBack(hk), 0);
      ctx.globalAlpha = hk;
      ctx.shadowColor = 'rgba(61,139,255,0.6)'; ctx.shadowBlur = 50;
      ctx.fillStyle = 'rgba(18,23,31,0.97)'; ctx.beginPath(); ctx.roundRect(-250, -110, 500, 220, 26); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = SOFT; ctx.font = font(BODY, 26); ctx.textAlign = 'center'; ctx.fillText('YOUR AI AGENT', 0, -58);
      ctx.textAlign = 'left';
      // the plugin chip slides in from the left
      const ck = ease.outCubic(clamp((t - w.plugin!.start) / 0.45));
      ctx.save(); ctx.translate(lerp(-520, 0, ck), 20);
      ctx.fillStyle = ORANGE;
      ctx.beginPath(); ctx.roundRect(-180, -46, 360, 92, 14); ctx.fill();
      ctx.beginPath(); ctx.arc(-180, 0, 18, 0, Math.PI * 2); ctx.fillStyle = 'rgba(18,23,31,1)'; ctx.fill();
      ctx.beginPath(); ctx.arc(180, 0, 18, -Math.PI / 2, Math.PI / 2); ctx.fillStyle = ORANGE; ctx.fill();
      ctx.fillStyle = '#0D1117'; ctx.font = font(HEAD, 44); ctx.textAlign = 'center'; ctx.fillText('text-to-cad', 0, 10);
      ctx.font = font(MONO, 18); ctx.fillText('PLUGIN · SKILLS', 0, 36);
      ctx.restore();
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      void WHITE;
    }
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.plugin!.start + 0.4, 0.015) }; }
}
