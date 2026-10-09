// WARN: "It ships no games, keys or firmware, so you need your own. And only download it from GitHub: fake
// PS5 emulators are a classic malware trap."
// Three paper slips (GAMES, KEYS, FIRMWARE), each struck through in marker as it is said, and a tag:
// bring your own, legally. Then a paper browser bar with the real GitHub address gets a tick, and a fake
// "PS5 EMULATOR FREE DOWNLOAD" button lands beside it and is stamped MALWARE TRAP.
import { tag, prog, ease, clamp, springStep, rgba, setWorld, font, F, crossOut } from '@kit/_collage';
import { makeStamp, drawStamp } from '@kit/_mp';
import { HEX } from '@engine/palette';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const SLIPS = [
  { key: 'games', text: 'GAMES', x: -820, y: -330 },
  { key: 'keys', text: 'KEYS', x: -420, y: -350 },
  { key: 'firmware', text: 'FIRMWARE', x: -60, y: -330 },
];

export default class Warn extends Desk {
  stamp: HTMLCanvasElement | null = null;
  override wipeOut = true;
  override wipeFrom: 'left' | 'right' = 'right';

  build() {
    this.take('It ships no games', ['ships', 'games,', 'keys', 'firmware,', 'need', 'own.', 'download', 'GitHub:', 'fake', 'PS5', 'emulators', 'classic', 'malware', 'trap.']);
    this.stamp = makeStamp('MALWARE TRAP', 'FAKE "PS5 EMULATORS"', 'GET IT FROM GITHUB ONLY', HEX.signal, 17);
    const w = this.w;
    SLIPS.forEach((s, i) => {
      const tw = w[s.key]!.start;
      const ww = s.text.length * 40 + 90;
      crossOut(s.x, s.y - 50, ww, 100, 101 + i).forEach((p, j) => this.plot.add(p, tw + 0.15 + j * 0.12, tw + 0.3 + j * 0.12, 'signal', { pen: true, width: 7 }));
    });
    const K = this.cam;
    K.key(this.ctx.start, -380, -200, 1.1, -0.008);
    K.key(w.need!.start, -320, -140, 1.0, -0.004, ease.inOutCubic);
    K.key(w.download!.start, 60, 120, 0.95, 0.004, ease.inOutCubic);
    K.key(w.malware!.start, 220, 170, 1.02, 0.008, ease.inOutCubic);
    K.key(this.ctx.end, 240, 180, 1.05, 0.01, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    SLIPS.forEach((s, i) => {
      const t0 = w[s.key]!.start - 0.12;
      if (t < t0) return;
      const sp = springStep(t - t0, 3, 0.5);
      const ww = s.text.length * 40 + 90;
      setWorld(ctx, c, s.x + ww / 2, s.y, 0.5 + 0.5 * sp, (i - 1) * 0.05 + (1 - sp) * 0.3);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-ww / 2 + 6, -50 + 9, ww, 100);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(-ww / 2, -50, ww, 100);
      ctx.font = font(F.archivo(87.5, 900), 64); ctx.fillStyle = rgba('ink', 1); ctx.textAlign = 'center'; ctx.fillText(s.text, 0, 24);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    tag(ctx, c, 'NOT INCLUDED · BRING YOUR OWN, LEGALLY', -460, -150, 30, { a: prog(t, w.need!.start, w.need!.start + 0.2), rot: 0.02, seed: 111 });
    // the real address
    const ta = w.download!.start - 0.1;
    if (t > ta) {
      const sp = springStep(t - ta, 3, 0.5);
      setWorld(ctx, c, -320, 120, 0.6 + 0.4 * sp, -0.03);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-440, -55, 900, 120);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(-446, -62, 900, 120);
      ctx.fillStyle = rgba('ink', 0.1); ctx.fillRect(-446, -62, 900, 34);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba(i ? 'graphite' : 'signal', 0.8); ctx.beginPath(); ctx.arc(-420 + i * 24, -45, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.font = font(F.mono(600), 34); ctx.fillStyle = rgba('acid', 1); ctx.fillText('github.com/boykopovar/AnyPS5', -420, 30);
      const tk = clamp((t - w.github!.start) / 0.25);
      if (tk > 0) {
        ctx.strokeStyle = '#2F8F4E'; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(360, 0); ctx.lineTo(360 + 22 * Math.min(1, tk * 2), 22 * Math.min(1, tk * 2));
        if (tk > 0.5) ctx.lineTo(382 + 40 * (tk - 0.5) * 2, 22 - 52 * (tk - 0.5) * 2);
        ctx.stroke(); ctx.lineCap = 'butt';
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the fake download button
    const tf = w.fake!.start - 0.1;
    if (t > tf) {
      const sp = springStep(t - tf, 3, 0.45);
      setWorld(ctx, c, 520, 330, 0.5 + 0.5 * sp, 0.06 + (1 - sp) * 0.3);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-300, -62, 610, 135);
      ctx.fillStyle = '#2FA84F'; ctx.fillRect(-306, -70, 610, 135);
      ctx.font = font(F.archivo(100, 900), 44); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
      ctx.fillText('PS5 EMULATOR', 0, -12); ctx.font = font(F.archivo(100, 700), 30); ctx.fillText('FREE DOWNLOAD  .exe', 0, 34);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (this.stamp) drawStamp(ctx, c, this.stamp, 600, 240, t, w.malware!.start, 0.4, -0.2, 0.95);
    void ease;
  }

  override pfx(t: number) {
    const k = t > this.w.malware!.start ? Math.pow(0.5, (t - this.w.malware!.start) / 0.07) : 0;
    return { zoom: 1 + 0.025 * k };
  }
}
