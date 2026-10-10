// PASSKEY: "It signs you in with a passkey, works offline, and keeps your phone and laptop in sync. Two
// devices editing at once merge field by field."
// An old key print lands with a drawn fingerprint card: PASSKEY (FACE ID, TOUCH ID, FINGERPRINT). On
// "offline" a Wi-Fi sign is struck through and tagged WORKS OFFLINE. On "phone" the app's home screen
// lands, on "laptop" the laptop, and on "sync" two marker arrows loop between them. On "merge" a tag:
// two edits at once are merged field by field.
import { drawCut, tag, arrow, wobble, ease, prog, setWorld, clamp } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, PAPER } from '@ep/kit';

const PH = { x: 120, y: 40 };
const LP = { x: 640, y: 60 };

function fingerprint(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, k: number, a: number) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.8 + 0.2 * a, -0.05);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-150 + 6, -170 + 9, 300, 340);
  ctx.fillStyle = PAPER; ctx.fillRect(-150, -170, 300, 340);
  ctx.strokeStyle = '#2F8F4E'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const r = 18 + i * 15, span = Math.PI * (1.25 - i * 0.04) * clamp(k * 1.4 - i * 0.08);
    if (span <= 0) continue;
    ctx.beginPath(); ctx.ellipse(0, -10, r * 0.8, r, 0, -Math.PI / 2 - span / 2, -Math.PI / 2 + span / 2); ctx.stroke();
  }
  ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function wifi(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, a: number) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0.04);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-110 + 6, -100 + 9, 220, 190);
  ctx.fillStyle = PAPER; ctx.fillRect(-110, -100, 220, 190);
  ctx.strokeStyle = '#1A1714'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 50, i * 34, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke(); }
  ctx.fillStyle = '#1A1714'; ctx.beginPath(); ctx.arc(0, 50, 10, 0, Math.PI * 2); ctx.fill();
  ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default class Passkey extends Desk {
  override uses = ['key', 's_home', 'laptop'];

  build() {
    this.take('It signs you in', ['signs', 'passkey,', 'works', 'offline,', 'keeps', 'phone', 'laptop', 'sync.', 'devices', 'merge', 'field']);
    const w = this.w;
    // strike the wifi through
    this.plot.add(wobble({ x: -330, y: -420 }, { x: -130, y: -250 }, 31), w.offline!.start + 0.1, w.offline!.start + 0.3, 'signal', { pen: true, width: 10 });
    const a1 = arrow({ x: PH.x + 150, y: PH.y - 170 }, { x: LP.x - 200, y: LP.y - 170 }, 3, -0.35);
    const a2 = arrow({ x: LP.x - 190, y: LP.y + 190 }, { x: PH.x + 160, y: PH.y + 200 }, 4, -0.35);
    const ts = w.sync!.start - 0.25;
    this.plot.add(a1.shaft, ts, ts + 0.3, 'signal', { pen: true, width: 7 });
    this.plot.add(a1.head, ts + 0.3, ts + 0.38, 'signal', { pen: true, width: 7 });
    this.plot.add(a2.shaft, ts + 0.3, ts + 0.6, 'signal', { pen: true, width: 7 });
    this.plot.add(a2.head, ts + 0.6, ts + 0.68, 'signal', { pen: true, width: 7 });
    const K = this.cam;
    K.key(this.ctx.start, -420, -120, 1.06, -0.006);
    K.key(w.offline!.start - 0.1, -260, -150, 1.04, -0.002, ease.inOutCubic);
    K.key(w.phone!.start - 0.1, 120, -20, 0.95, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 150, -10, 0.97, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    drawCut(ctx, c, this.cuts.key!, -640, -260, t, { t0: this.ctx.start + 0.05, scale: 0.6, rot: -0.08, seed: 101 });
    fingerprint(ctx, c, -640, 110, prog(t, w.passkey!.start, w.passkey!.end + 0.3), prog(t, w.passkey!.start - 0.1, w.passkey!.start + 0.05));
    tag(ctx, c, 'PASSKEY', -640, 320, 34, { a: prog(t, w.passkey!.start, w.passkey!.start + 0.15), rot: 0.03, seed: 102, sub: 'FACE ID · TOUCH ID · FINGERPRINT' });
    wifi(ctx, c, -230, -330, prog(t, w.works!.start, w.works!.start + 0.12));
    tag(ctx, c, 'WORKS OFFLINE', -230, -150, 30, { a: prog(t, w.offline!.end, w.offline!.end + 0.15), rot: -0.04, seed: 103 });
    drawCut(ctx, c, this.cuts.s_home!, PH.x, PH.y, t, { t0: w.phone!.start - 0.08, scale: 0.62, rot: -0.04, seed: 104 });
    drawCut(ctx, c, this.cuts.laptop!, LP.x, LP.y, t, { t0: w.laptop!.start - 0.08, scale: 0.55, rot: 0.04, seed: 105 });
    tag(ctx, c, 'TWO EDITS AT ONCE? MERGED FIELD BY FIELD', 380, -330, 26, { a: prog(t, w.merge!.start, w.merge!.start + 0.15), rot: -0.02, seed: 107 });
    tag(ctx, c, 'SYNCED', 380, 330, 32, { a: prog(t, w.sync!.start, w.sync!.start + 0.15), rot: 0.02, seed: 106, bg: '#E8F7B8' });
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.w.sync!.start, 0.012) };
  }
}
