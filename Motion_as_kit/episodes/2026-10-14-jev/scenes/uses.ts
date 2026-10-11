// 11 USES: "Developers use it to route tickets and police AI agents. Someone even made it play Doom."
// Three panels on the grid, lit in turn. ROUTING: tickets drop into three trays, the dot sorting them. AGENT
// GUARD: an agent wants to run `rm -rf /`; SAFE TO RUN? 0.02, BLOCKED. A FIRST-PERSON SHOOTER: a pixel
// corridor with LEFT / RIGHT / SHOOT and their odds (the Doom demo The Register wrote about; drawn here).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Swiss, ob, card, dot, label, bar, MONO, MONOB, HEAD, INK, RED, CREAM, clamp, ease, lerp, hash } from '@ep/swiss';

export default class Uses extends Swiss {
  override section = 11;
  override label = 'IN THE WILD';
  override wipeOut = '#121212';
  build() {
    this.take('Developers use it', ['Developers', 'route', 'tickets', 'police', 'agents.', 'Someone', 'play', 'Doom.']);
    const K = this.cam;
    K.key(this.ctx.start, -60, 0, 1.03, 0);
    K.key(this.w.someone!.start, 0, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 40, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // all three cards are on the page from the start, dim, and light up on their words
    const base = 0.32 * clamp((t - this.ctx.start - 0.05) / 0.3);
    // ROUTING
    const ra = clamp((t - w.route!.start + 0.2) / 0.3);
    card(ctx, c, -880, -280, 500, 520, 'ROUTING', { a: Math.max(base, ra) });
    if (ra > 0) {
      const trays: [string, number][] = [['BILLING', -790], ['TECH', -630], ['ACCOUNT', -470]];
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.globalAlpha = ra; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.font = font(MONOB, 20); ctx.fillStyle = INK; ctx.textAlign = 'center';
      for (const [n, x] of trays) { ctx.strokeRect(x - 70, 120, 140, 70); ctx.fillText(n, x, 220); }
      ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 6; i++) {
        const tb = w.tickets!.start + i * 0.3, k = ease.inOutCubic(clamp((t - tb) / 0.5));
        if (k <= 0) continue;
        const tx = trays[Math.floor(hash(i, 3) * 3)]![1];
        setWorld(ctx, c, lerp(-630, tx, k), lerp(-160, 140, k), 1, 0);
        ctx.globalAlpha = ra; ctx.fillStyle = '#FBF9F5'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.fillRect(-40, -26, 80, 52); ctx.strokeRect(-40, -26, 80, 52);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      dot(ctx, c, -630, -160, 14, { a: ra });
    }
    // AGENT GUARD
    const ga = clamp((t - w.police!.start + 0.2) / 0.3);
    card(ctx, c, -320, -280, 580, 520, 'AGENT GUARD', { a: Math.max(base, ga) });
    if (ga > 0) {
      setWorld(ctx, c, -295, -170, 1, 0);
      ctx.globalAlpha = ga; ctx.fillStyle = INK; ctx.fillRect(0, 0, 530, 150);
      ctx.font = font(MONO, 28); ctx.fillStyle = CREAM; ctx.fillText('agent wants to run:', 24, 50);
      ctx.fillStyle = '#FFB23A'; ctx.font = font(MONOB, 34); ctx.fillText('$ rm -rf /', 24, 108);
      ctx.fillStyle = INK; ctx.font = font(MONOB, 26); ctx.fillText('SAFE TO RUN?', 0, 230);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      bar(ctx, c, -295, 110, 380, 22, 0.02, clamp((t - w.agents!.start) / 0.3), { a: ga });
      const bk = clamp((t - w.agents!.end) / 0.15);
      if (bk > 0) {
        setWorld(ctx, c, -30, 190, 1.3 - 0.3 * ob(bk), -0.06);
        ctx.globalAlpha = bk; ctx.fillStyle = RED; ctx.fillRect(-160, -40, 320, 80);
        ctx.fillStyle = '#FFFFFF'; ctx.font = font(HEAD, 54); ctx.textAlign = 'center'; ctx.fillText('BLOCKED', 0, 20);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // A SHOOTER
    const da = clamp((t - w.someone!.start + 0.1) / 0.3);
    card(ctx, c, 330, -280, 530, 520, 'IT PLAYED DOOM', { a: Math.max(base, da) });
    if (da > 0) {
      corridor(ctx, c, 345, -220, 500, 250, t, da);
      const odds: [string, number][] = [['LEFT', 0.09], ['RIGHT', 0.84], ['SHOOT', 0.07]];
      odds.forEach(([n, v], i) => bar(ctx, c, 480, 80 + i * 52, 250, 18, v, clamp((t - w.play!.start - i * 0.06) / 0.3), { a: da, label: n, size: 24 }));
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    label(ctx, c, 'DRAWN FROM A DEMO REPORTED BY THE REGISTER', 345, 300, { a: clamp((t - w.doom!.start) / 0.3), size: 18 });
  }
}

/** A tiny pixel first-person corridor: walls in perspective, a doorway, a muzzle at the bottom. */
function corridor(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, t: number, a: number) {
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#2A2724'; ctx.fillRect(0, 0, w, h);
  const px = 10, cx = w / 2 + Math.sin(t * 1.3) * 8, cy = h * 0.45;
  for (let yy = 0; yy < h; yy += px) for (let xx = 0; xx < w; xx += px) {
    const dx = (xx - cx) / (w / 2), dy = (yy - cy) / (h / 2);
    const wall = Math.abs(dx) > 0.35 + 0.5 * Math.abs(dy) * 0.3;
    if (!wall) continue;
    const shade = 0.35 + 0.4 * (1 - Math.min(1, Math.abs(dx))) + 0.15 * ((Math.floor(xx / 30) + Math.floor(yy / 20)) % 2);
    ctx.fillStyle = `rgb(${Math.round(120 * shade + 40)},${Math.round(70 * shade + 20)},${Math.round(40 * shade + 10)})`;
    ctx.fillRect(xx, yy, px, px);
  }
  ctx.fillStyle = '#121212'; ctx.fillRect(cx - 40, cy - 40, 80, 90);
  ctx.fillStyle = '#5A564F'; ctx.fillRect(w / 2 - 30, h - 60, 60, 60);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
