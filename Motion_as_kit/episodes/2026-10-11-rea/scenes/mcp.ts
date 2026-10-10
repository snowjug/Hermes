// MCP: "REA is a free, open-source MCP server. Claude Code, Codex, Cursor or Gemini call it like a
// toolbox. The same tools work straight from your terminal, too."
// Panel one: a red toolbox labelled REA, with FREE · OPEN SOURCE · MIT and MCP SERVER tags. Panel two: four
// agents (CLAUDE CODE, CODEX, CURSOR, GEMINI) land as name tags and plug in with ink cables (CLICK!).
// Panel three, on "terminal": a terminal runs `rea analyze-javascript-application ./app --json` (from the README).
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { F } from '@engine/type';
import { Comic, panel, label, sfx, codeCard, inkArrow, INK, RED, YEL, SKY, GREEN, BLOCK, clamp, ease } from '@ep/comic';

function toolbox(g: CanvasRenderingContext2D, x: number, y: number, s: number, open: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineWidth = 7; g.strokeStyle = INK; g.lineJoin = 'round';
  // tools sticking out
  g.save(); g.translate(0, -60 * open);
  g.fillStyle = '#BFC6CF'; g.beginPath(); g.roundRect(-120, -150, 26, 170, 8); g.fill(); g.stroke();
  g.beginPath(); g.arc(-107, -165, 30, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = SKY; g.beginPath(); g.arc(70, -150, 46, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#6B4A2E'; g.beginPath(); g.roundRect(60, -110, 22, 130, 8); g.fill(); g.stroke();
  g.restore();
  g.fillStyle = RED; g.beginPath(); g.roundRect(-210, -40, 420, 220, 20); g.fill(); g.stroke();
  g.fillStyle = '#B4231D'; g.fillRect(-210, 20, 420, 26); g.strokeRect(-210, 20, 420, 26);
  g.fillStyle = YEL; g.beginPath(); g.roundRect(-70, 90, 140, 56, 10); g.fill(); g.stroke();
  g.font = font(BLOCK, 44); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('REA', 0, 134); g.textAlign = 'left';
  g.restore();
}

const AGENTS = [
  { key: 'claude', name: 'CLAUDE CODE', y: -230, col: '#F2B48C' },
  { key: 'codex', name: 'CODEX', y: -90, col: '#D7DBE2' },
  { key: 'cursor', name: 'CURSOR', y: 50, col: '#C9E7FA' },
  { key: 'gemini', name: 'GEMINI', y: 190, col: '#D8C9F5' },
];

export default class Mcp extends Comic {
  build() {
    this.take('REA is a free', ['free,', 'open-source', 'MCP', 'server.', 'Claude', 'Codex,', 'Cursor', 'Gemini', 'toolbox.', 'same', 'tools', 'terminal,']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, -420, -110, 1.12, -0.006);
    K.key(w.claude!.start - 0.1, -60, -110, 0.96, 0.0);
    K.key(w.same!.start - 0.1, 420, -110, 1.02, 0.004);
    K.key(this.ctx.end, 470, -110, 1.04, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tb = { x: -560, y: -60 };
    panel(ctx, c, -980, -470, 830, 720, t, this.ctx.start, {
      fill: '#FFFFFF', dots: 'rgba(229,50,43,0.22)', from: 'left',
      draw: (g) => {
        toolbox(g, 0, 40, 1.15, ease.outBack(clamp((t - w.toolbox!.start) / 0.3)));
        if (t > w.free!.start) label(g, 'FREE · OPEN SOURCE · MIT', 0, -250, 36, { fill: YEL, rot: -0.03 });
        if (t > w.mcp!.start) label(g, 'MCP SERVER', 0, 300, 42, { fill: SKY, rot: 0.02 });
      },
    });
    panel(ctx, c, -120, -470, 640, 720, t, w.claude!.start - 0.15, {
      fill: '#FFF6D6', dots: 'rgba(242,134,46,0.3)', from: 'up',
      draw: (g) => {
        AGENTS.forEach((a) => {
          const t0 = w[a.key]!.start;
          if (t < t0) return;
          const k = ease.outBack(clamp((t - t0) / 0.25));
          inkArrow(g, 170, a.y, -300 + 40, 40 + (a.y + 20) * 0.2, clamp((t - t0 - 0.1) / 0.25), { width: 8, bend: 0.12 });
          g.save(); g.translate(60, a.y); g.scale(k, k); label(g, a.name, 0, 0, 40, { fill: a.col }); g.restore();
        });
      },
    });
    panel(ctx, c, 560, -470, 760, 720, t, w.same!.start - 0.12, {
      fill: GREEN, dots: 'rgba(18,18,18,0.18)', from: 'right',
      draw: (g) => {
        codeCard(g, -350, -230, 700, [['$ rea analyze-javascript-application', '#FFD21F'], ['      ./app --json', '#FFD21F'], ['{ "modules": [ ... ],', '#E6E6E6'], ['  "imports": [ ... ],', '#E6E6E6'], ['  "evidence": [ ... ] }', '#7EC8F2']], t, w.same!.start, 1.6, { size: 24, title: 'TERMINAL' });
      },
    });
    void tb; void F;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    sfx(ctx, c, 'CLICK!', 120, 300, 90, t, this.w.toolbox!.start, { fill: YEL, rot: -0.12 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.toolbox!.start, 0.015) }; }
}
