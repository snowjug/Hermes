// CATCH: "The catch: phone passkeys need HTTPS on a domain. And on iPhone, it's a web app, not an App
// Store one." / "No server at all? The Android app runs entirely on the phone."
// THE CATCH in ransom letters. A paper browser bar types https://gym.your-domain.com with a padlock;
// on "iPhone" a slip lands with WEB APP (PWA), and APP STORE is struck out. Then the camera slides down
// the desk: the Raspberry Pi is crossed out on "server at all?", and the phone lands: ANDROID APP,
// NO SERVER NEEDED.
import { drawCut, tag, ransom, crossOut, ease, prog, setWorld, font, F, rgba, springStep, clamp } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, slip, PAPER } from '@ep/kit';

const DOWN = 900;

export default class Catch extends Desk {
  override uses = ['pi', 's_home'];
  override wipeOut = true;

  build() {
    this.take('The catch', ['catch:', 'phone', 'passkeys', 'HTTPS', 'domain.', 'iPhone,', 'web', ['app2', 'App', 1], 'Store']);
    this.take('No server at all', ['server', 'all?', 'Android', 'runs', 'entirely']);
    const w = this.w;
    const sw = 'APP STORE'.length * 56 * 0.68 + 56 * 1.2;
    crossOut(480 - sw / 2, 170 - 45, sw, 90, 61).forEach((p, j) => this.plot.add(p, w.store!.start + 0.1 + j * 0.1, w.store!.start + 0.25 + j * 0.1, 'signal', { pen: true, width: 8 }));
    crossOut(-560, DOWN - 230, 520, 360, 62).forEach((p, j) => this.plot.add(p, w.all!.start + j * 0.12, w.all!.start + 0.2 + j * 0.12, 'signal', { pen: true, width: 9 }));
    const K = this.cam;
    K.key(this.ctx.start, 0, -120, 1.0, -0.004);
    K.key(w.phone!.start, -220, -40, 1.02, -0.002, ease.inOutCubic);
    K.key(w.iphone!.start - 0.1, 200, 0, 0.98, 0.004, ease.inOutCubic);
    K.key(w.store!.end + 0.05, 220, 10, 0.98, 0.004, ease.linear);
    K.key(w.server!.start - 0.3, 0, DOWN - 40, 0.98, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 40, DOWN - 20, 1.02, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the address bar
    const ta = w.phone!.start - 0.1;
    if (t > ta) {
      const sp = springStep(t - ta, 3, 0.5);
      setWorld(ctx, c, -380, -120, 0.6 + 0.4 * sp, -0.03);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-430 + 6, -60 + 9, 860, 120);
      ctx.fillStyle = PAPER; ctx.fillRect(-430, -60, 860, 120);
      ctx.fillStyle = rgba('ink', 0.1); ctx.fillRect(-430, -60, 860, 30);
      // padlock
      ctx.strokeStyle = '#2F8F4E'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-385, 8, 13, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#2F8F4E'; ctx.fillRect(-403, 8, 36, 28);
      const url = 'https://gym.your-domain.com';
      const n = Math.ceil(url.length * clamp((t - w.https!.start) / 0.6));
      ctx.font = font(F.mono(600), 36); ctx.fillStyle = rgba('acid', 1);
      if (n > 0) ctx.fillText(url.slice(0, n), -350, 30);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    tag(ctx, c, 'PASSKEYS ON A PHONE NEED HTTPS + A DOMAIN', -380, 60, 26, { a: prog(t, w.domain!.start, w.domain!.start + 0.15), rot: 0.02, seed: 121 });
    slip(ctx, c, 'iPHONE', 480, -100, 64, t, w.iphone!.start - 0.1, { rot: 0.04 });
    tag(ctx, c, 'WEB APP (PWA)', 480, 10, 32, { a: prog(t, w.web!.start, w.web!.start + 0.15), rot: -0.03, seed: 122, bg: '#E8F7B8' });
    slip(ctx, c, 'APP STORE', 480, 170, 56, t, w.app2!.start - 0.1, { rot: -0.02 });
    // further down the desk
    drawCut(ctx, c, this.cuts.pi!, -300, DOWN - 50, t, { t0: w.server!.start - 0.25, scale: 0.62, rot: -0.05, seed: 123 });
    tag(ctx, c, 'NO SERVER?', -300, DOWN + 180, 34, { a: prog(t, w.server!.start, w.server!.start + 0.15), rot: 0.04, seed: 124 });
    drawCut(ctx, c, this.cuts.s_home!, 360, DOWN - 20, t, { t0: w.android!.start - 0.1, scale: 0.66, rot: 0.04, seed: 125 });
    tag(ctx, c, 'ANDROID APP', 680, DOWN - 220, 36, { a: prog(t, w.android!.start, w.android!.start + 0.15), rot: -0.05, seed: 126, sub: 'EVERYTHING STAYS ON THE PHONE' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = w.catch!.start - 0.1, dur = Math.max(0.35, w.catch!.end - t0 + 0.1);
    const wd = ransom(ctx, c, 'THE CATCH', 0, -330, 120, t, t0, dur, 37, 0);
    ransom(ctx, c, 'THE CATCH', -wd / 2, -330, 120, t, t0, dur, 37);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.catch!.start, 0.015) * this.punch(t, this.w.store!.start + 0.1, 0.01) };
  }
}
