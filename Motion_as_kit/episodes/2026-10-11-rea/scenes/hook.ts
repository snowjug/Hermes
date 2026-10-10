// HOOK: "You see a feature in someone else's app, and you think: how did they build that?"
// Page one. A big panel: someone else's app with a glowing feature (WOW!). On "think" a second panel
// slides in: you, eyebrows up, and a thought balloon: HOW DID THEY BUILD THAT?
import type { Cam } from '@kit/_vo';
import { font } from '@engine/type';
import { Comic, panel, appWindow, speedLines, sfx, balloon, star, INK, YEL, SKY, PINK, BLUE, BLOCK, clamp, TAU } from '@ep/comic';

function viewer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#F4C9A0'; ctx.beginPath(); ctx.ellipse(0, 0, 120, 140, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3A2A20'; ctx.beginPath(); ctx.moveTo(-122, -20); ctx.quadraticCurveTo(-130, -150, 0, -150); ctx.quadraticCurveTo(130, -150, 122, -20);
  ctx.quadraticCurveTo(80, -100, 0, -96); ctx.quadraticCurveTo(-80, -100, -122, -20); ctx.fill(); ctx.stroke();
  const up = 8 * Math.sin(t * 2.2);
  ctx.beginPath(); ctx.moveTo(-70, -48 - up); ctx.quadraticCurveTo(-45, -66 - up, -18, -52 - up); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18, -56 - up); ctx.quadraticCurveTo(45, -72 - up, 70, -52 - up); ctx.stroke();
  for (const ex of [-44, 44]) { ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.ellipse(ex, -14, 20, 24, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 6, -20, 9, 0, TAU); ctx.fill(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, 62, 14, 18, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

export default class Hook extends Comic {
  build() {
    this.take('You see a feature', ['see', 'feature', 'else\'s', 'app,', 'think:', 'how', 'build', 'that?']);
    const w = this.w;
    const K = this.cam;
    K.key(0, -420, -120, 1.18, -0.01);
    K.key(w.app!.start, -380, -110, 1.05, -0.006);
    K.key(w.think!.start - 0.1, 160, -110, 1.0, 0.004);
    K.key(this.ctx.end, 200, -100, 1.03, 0.006);
  }

  override page(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    panel(ctx, c, -900, -480, 820, 720, t, 0, {
      fill: SKY, dots: 'rgba(31,95,209,0.35)', rot: -0.01,
      draw: (g) => {
        const glow = clamp((t - w.feature!.start) / 0.3);
        speedLines(g, 0, 0, 210, 700, 46, 3, '#FFFFFF', 0.55 * glow);
        appWindow(g, -300, -260, 600, 470, 'SOMEONE ELSE\'S APP');
        g.fillStyle = '#E9EEF5'; for (let i = 0; i < 4; i++) { g.fillRect(-250, -40 + i * 52, 380 - (i % 2) * 90, 26); }
        // the feature: a glowing button
        const s = 1 + 0.06 * Math.sin(t * 6) * glow;
        g.save(); g.translate(0, -125); g.scale(s, s);
        g.fillStyle = glow > 0 ? YEL : '#DDE3EC'; g.beginPath(); g.roundRect(-210, -40, 420, 80, 40); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
        g.font = font(BLOCK, 34); g.fillStyle = INK; g.textAlign = 'center'; g.fillText('THE COOL FEATURE', 0, 12); g.textAlign = 'left';
        g.restore();
        if (glow > 0) for (let i = 0; i < 5; i++) star(g, -230 + i * 115, -215 + (i % 2) * 190, 16 + 6 * Math.sin(t * 5 + i), YEL);
      },
    });
    panel(ctx, c, -20, -480, 900, 720, t, w.think!.start - 0.15, {
      from: 'right', fill: PINK, dots: 'rgba(229,50,43,0.25)', rot: 0.012,
      draw: (g) => { viewer(g, -150, 140, 1.25, t); },
    });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    sfx(ctx, c, 'WOW!', -300, -330, 120, t, w.feature!.start + 0.05, { fill: YEL, rot: -0.15, burst: '#FFFFFF' });
    balloon(ctx, c, 530, -230, ['HOW DID THEY', 'BUILD THAT?'], t, w.how!.start - 0.05, { thought: true, size: 50, tail: [-260, 170] });
    void BLUE;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.w.feature!.start, 0.015) * this.punch(t, this.w.how!.start, 0.012) }; }
}
