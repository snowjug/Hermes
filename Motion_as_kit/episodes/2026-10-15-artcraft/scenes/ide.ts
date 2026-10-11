// 04 IDE: "Its makers call it the IDE for artists: one app where you compose in 2D and stage scenes in 3D."
// "The IDE for artists" lands big in serif italic (their words), then the app window opens on "app" and the quote
// moves to tape above it. Left, 2D CANVAS: three layers (sky, a figure cut-out, a foreground plant) slide in and stack
// on "compose". Right, 3D STAGE: a ghost room fills in and turns with the cast on "stage". The clapperboard rises at
// the end.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { drawParts } from '@kit/_cad3d';
import { Cinema, panel, tape, mono, title, room, figures, SERIFI, AMBER, IVORY, TEAL, clamp, ease, lerp, TAU } from '@ep/cinema';
import { cast } from '@ep/set';

export default class Ide extends Cinema {
  override scene = 1;
  override slateOut = true;
  build() {
    this.take('Its makers call it', ['makers', 'IDE', 'artists:', 'app', 'compose', '2D', 'stage', '3D.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.05, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const pa = clamp((t - w.app!.start + 0.2) / 0.35);
    panel(ctx, c, -860, -250, 1720, 600, 'ArtCraft', { a: pa });
    if (pa <= 0) return;
    // divider
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.globalAlpha = pa; ctx.fillStyle = 'rgba(241,236,226,0.12)'; ctx.fillRect(-2, -200, 4, 540);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the empty app first: a transparency checkerboard on the canvas side, a floor grid on the stage side
    setWorld(ctx, c, -430, 90, 1, 0);
    ctx.globalAlpha = pa * 0.5;
    for (let gy = 0; gy < 14; gy++) for (let gx = 0; gx < 25; gx++) { ctx.fillStyle = (gx + gy) % 2 ? '#26262A' : '#1C1C1F'; ctx.fillRect(-380 + gx * 30.4, -220 + gy * 30, 30.4, 30); }
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 2D canvas: three layers
    const lk = (i: number) => ease.outCubic(clamp((t - w.compose!.start + 0.1 - i * 0.18) / 0.4));
    const L0 = lk(0), L1 = lk(1), L2 = lk(2);
    setWorld(ctx, c, -430, 90, 1, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(-380, -220, 760, 420); ctx.clip();
    if (L0 > 0) { const g = ctx.createLinearGradient(0, -220, 0, 200); g.addColorStop(0, '#2B4A5A'); g.addColorStop(1, '#E39A5A'); ctx.globalAlpha = L0; ctx.fillStyle = g; ctx.fillRect(-380 + (1 - L0) * -400, -220, 760, 420); ctx.fillStyle = '#FFE2A8'; ctx.beginPath(); ctx.arc(150 + (1 - L0) * -400, -40, 50, 0, TAU); ctx.fill(); }
    if (L1 > 0) { ctx.globalAlpha = L1; ctx.fillStyle = '#121014'; const x = lerp(400, -40, L1); ctx.beginPath(); ctx.arc(x, -40, 26, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.roundRect(x - 34, -12, 68, 120, 20); ctx.fill(); ctx.fillRect(x - 28, 100, 20, 100); ctx.fillRect(x + 8, 100, 20, 100); }
    if (L2 > 0) { ctx.globalAlpha = L2; ctx.fillStyle = '#1D3A2A'; const y = lerp(300, 0, L2); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(-300 + i * 22, 170 + y - i * 6, 60, 18, -0.8 + i * 0.25, 0, TAU); ctx.fill(); } }
    ctx.restore(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 3D stage
    const sk = clamp((t - w.stage!.start + 0.1) / 0.4);
    const view = { yaw: 0.3 + 0.35 * (t - w.app!.start), pitch: 0.4, dist: 1500, s: 0.85, target: [0, 20, 100] as [number, number, number] };
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(4, -212, 852, 558); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawParts(ctx, c, 430, 150, view, [{ mesh: room(), a: pa * lerp(0.2, 1, sk) }, ...(sk > 0 ? [{ mesh: figures(cast(1)), a: sk }] : [])], { shadow: sk });
    ctx.restore();
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const gone = 1 - clamp((t - w.app!.start + 0.25) / 0.25);
    mono(ctx, c, 'ITS MAKERS CALL IT', 0, -120, { a: clamp((t - this.ctx.start - 0.1) / 0.3) * gone, align: 'center', size: 28, col: AMBER });
    title(ctx, c, '“The IDE for artists”', 0, 40, 150, t, w.ide!.start - 0.15, { f: SERIFI, col: IVORY, a: gone, glow: 'rgba(245,179,66,0.35)' });
    tape(ctx, c, '“THE IDE FOR ARTISTS”', 0, -360, 40, { a: clamp((t - w.app!.start) / 0.2) });
    mono(ctx, c, '2D CANVAS', -820, -150, { a: clamp((t - w.compose!.start) / 0.2), col: AMBER });
    mono(ctx, c, '3D STAGE', 40, -150, { a: clamp((t - w.stage!.start) / 0.2), col: AMBER });
    void TEAL;
  }
}
