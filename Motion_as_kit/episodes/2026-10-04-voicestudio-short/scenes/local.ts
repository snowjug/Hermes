// LOCAL: "And it all runs on your own computer. No subscription."
// A fat laptop prints in black; its screen says OFFLINE with a struck-out Wi-Fi fan, and the voice runs
// inside it. On "No subscription" a pink $0 / MONTH stamp slams across it, and NO SUBSCRIPTION lands.
import { Plate, ease, prog, pulse, noise1, rgba, setWorld, font, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, mono, bars, speechEnv, voiceEnv, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));

export default class Local extends Plate {
  paper = true;

  build() {
    this.take('And it all runs', ['And', 'runs', 'own', 'computer.', 'No', 'subscription.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -60, 1.06, 0.0);
    K.key(w.computer!.start, 0, -40, 1.0, 0, ease.inOutCubic);
    K.key(w.no!.start + 0.08, 0, 40, 1.05, 0.012, ease.outExpo);
    K.key(this.ctx.end, 0, 60, 1.07, 0.012, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rslam(ctx, c, 'ON YOUR', -490, -640, fit('ON YOUR', 920, 190), t, w.own!.start - 0.2, { top: 'ink' });
    rslam(ctx, c, 'COMPUTER', -490, -460, fit('COMPUTER', 920, 190), t, w.computer!.start, { top: 'signal' });
    // the laptop
    const a = prog(t, this.ctx.start, this.ctx.start + 0.25);
    const L = { x: -420, y: -330, w: 840, h: 520 };
    setWorld(ctx, c, 0, 0);
    overprint(ctx, (col) => {
      ctx.strokeStyle = col; ctx.lineWidth = 16; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.roundRect(L.x, L.y, L.w, L.h, 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L.x - 80, L.y + L.h + 30); ctx.lineTo(L.x + L.w + 80, L.y + L.h + 30); ctx.lineTo(L.x + L.w + 30, L.y + L.h + 90); ctx.lineTo(L.x - 30, L.y + L.h + 90); ctx.closePath(); ctx.stroke();
    }, { top: 'ink', dx: 9, dy: 7, a });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the screen: OFFLINE and a Wi-Fi fan struck through, and the voice running inside
    mono(ctx, c, 'OFFLINE', 0, L.y + 120, 64, 'ink', { a, align: 'center', spacing: 10 });
    setWorld(ctx, c, 0, L.y + 270);
    ctx.globalAlpha = a; ctx.strokeStyle = rgba('ink', 1); ctx.lineWidth = 12; ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 40, i * 34, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); }
    ctx.strokeStyle = rgba('signal', 1); ctx.beginPath(); ctx.moveTo(-90, -70); ctx.lineTo(90, 60); ctx.stroke();
    ctx.lineCap = 'butt'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    bars(ctx, c, -360, 360, L.y + 420, 50, 40, (u) => Math.max(voiceEnv(this.ctx.audio, t - (1 - u) * 0.8), 0.2 * speechEnv(u * 5 + t, 9)), 'signal', { a });
    // the stamp
    const s = prog(t, w.subscription!.start - 0.05, w.subscription!.start + 0.05);
    if (s > 0) {
      const age = t - (w.subscription!.start - 0.05);
      const sc = 1 + 0.6 * (1 - ease.outExpo(Math.min(1, age / 0.12)));
      setWorld(ctx, c, 120, -60, sc, -0.14);
      overprint(ctx, (col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.strokeRect(-330, -120, 660, 240);
        ctx.fillStyle = col; ctx.font = font(ARCHB(125), 150); ctx.textAlign = 'center'; ctx.fillText('$0', -110, 50);
        ctx.font = font(ARCHB(100), 60); ctx.fillText('/MONTH', 150, 30); ctx.textAlign = 'left';
      }, { top: 'signal', a: s * 0.95 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    rslam(ctx, c, 'NO SUBSCRIPTION', -490, 520, fit('NO SUBSCRIPTION', 920, 140), t, w.no!.start, { top: 'ink' });
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.subscription!.start, 0.07);
    return { zoom: 1 + 0.03 * hit, shake: [10 * hit * noise1(t * 60, 1), 10 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
