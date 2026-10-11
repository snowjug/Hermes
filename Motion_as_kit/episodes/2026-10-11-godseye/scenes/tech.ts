// 14–15 3D CITIES AND VOICE: "Zoom in, and cities rise in 3D, built from Google's photorealistic map tiles." "Add an
// OpenAI key, and you can even steer it with your voice."
// Over a city grid the blocks rise out of the ground on "rise", tile seams flashing across them (GOOGLE PHOTOREALISTIC
// 3D TILES · CESIUMJS); then a voice bar slides up: a microphone, a live waveform, and an example spoken command
// (YOUR OPENAI KEY · METERED). (Illustrations.)
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { box, drawParts, type Obj } from '@kit/_cad3d';
import { Feed, mono, panel, SANS, MONOB, clamp, ease, hash, type Mode } from '@ep/sat';

const BL: { x: number; y: number; w: number; d: number; h: number }[] = [];
for (let i = -5; i <= 5; i++) for (let j = -4; j <= 4; j++) {
  if (hash(i, j, 9) < 0.2) continue;
  BL.push({ x: i * 90, y: j * 90, w: 50 + 25 * hash(i, j, 1), d: 50 + 25 * hash(i, j, 2), h: 20 + 260 * Math.pow(hash(i, j, 3), 2.2) * (1.4 - Math.hypot(i, j) / 9) });
}

export default class Tech extends Feed {
  build() {
    this.take('Zoom in, and cities', ['Zoom', 'cities', 'rise', '3D,', 'built', "Google's", 'photorealistic', 'map', 'tiles.']);
    this.take('Add an OpenAI key', ['OpenAI', 'key,', 'steer', 'voice.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 0.9); K.key(this.s('rise'), 0, 0, 1.0, 0, ease.inOutQuad); K.key(e, 0, 0, 1.08, 0, ease.inOutQuad);
  }
  override mode(_t: number): Mode { return 'eo'; }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const rk = (i: number) => ease.outCubic(clamp((t - this.s('zoom') - 0.15 - (i % 11) * 0.05) / 1.0));
    const objs: Obj[] = [{ mesh: box(1000, 820, 2, { at: [0, 0, -2], col: '#0E1A26' }), edge: 'rgba(110,190,255,0.25)' }];
    BL.forEach((b, i) => { const k = rk(i); if (k > 0.01) objs.push({ mesh: box(b.w, b.d, Math.max(1, b.h * k), { at: [b.x, b.y, 0], col: hash(i, 5) < 0.5 ? '#3A4756' : '#4A5868' }), edge: 'rgba(160,215,255,0.55)' }); });
    const view = { yaw: 0.7 + (t - this.ctx.start) * 0.05, pitch: 0.55, dist: 3000, s: 1.15, target: [0, 0, 60] as [number, number, number] };
    drawParts(ctx, c, 0, 60, view, objs, { shadow: 0.4, edgeW: 1.1 });
    // tile seams sweeping
    const sw = clamp((t - this.s('tiles') + 0.4) / 1.0);
    if (sw > 0 && sw < 1) {
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.strokeStyle = 'rgba(59,232,255,0.6)'; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) { const x = -900 + (sw + k / 6) % 1 * 1800; ctx.beginPath(); ctx.moveTo(x, -500); ctx.lineTo(x - 200, 500); ctx.stroke(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  override hudInfo(t: number) { return { trk: t > this.s('openai') ? 'VOICE · OPENAI REALTIME' : 'BASEMAP · 3D TILES', alt: 'ALT 900 M', loc: 'CITY · ILLUSTRATION' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    mono(ctx, c, "GOOGLE PHOTOREALISTIC 3D TILES · CESIUMJS", 0, -390, { a: clamp((t - this.s('googles') + 0.1) / 0.3) * (1 - clamp((t - this.s('openai') + 0.2) / 0.3)), align: 'center', size: 26, bold: true, col: P.accent });
    const vk = clamp((t - this.s('openai') + 0.1) / 0.35);
    if (vk > 0) {
      panel(ctx, c, 0, 250, 1100, 190, 'VOICE · YOUR OPENAI KEY (METERED)', P, vk);
      setWorld(ctx, c, -470, 262, 1, 0);
      ctx.globalAlpha = vk; ctx.strokeStyle = P.accent; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(-16, -40, 32, 56, 16); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 30, 0.1, Math.PI - 0.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, 46); ctx.stroke();
      ctx.fillStyle = P.accent;
      for (let k = 0; k < 40; k++) { const h = 8 + 50 * Math.abs(Math.sin(t * 9 + k * 0.7)) * (0.4 + 0.6 * hash(k, Math.floor(t * 12))); ctx.fillRect(70 + k * 9, -h / 2 - 8, 5, h); }
      ctx.font = font(SANS, 34); ctx.fillStyle = '#FFFFFF';
      const cmd = '“Show me the flights over Tokyo.”';
      ctx.fillText(cmd.slice(0, Math.floor(clamp((t - this.s('steer') + 0.2) * 30, 0, cmd.length))), 470, 4);
      ctx.font = font(MONOB, 15); ctx.fillStyle = P.dim; ctx.fillText('EXAMPLE COMMAND', 470, 40);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
}
