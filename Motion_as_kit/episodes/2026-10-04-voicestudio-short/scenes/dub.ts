// DUB: "It even dubs your videos into other languages."
// A video frame on the sheet, a speaker's bubble on it. On "dubs" DUBBED slams; on "other languages" the
// bubble flips through hello in six languages, each one printed off-register.
import { Plate, ease, prog, pulse, noise1, rgba, setWorld, font, type Cam } from '@kit/_mp';
import { measure } from '@engine/type';
import { rslam, overprint, card, mono, bars, speechEnv, ARCHB } from '@ep/riso';

const fit = (s: string, maxW: number, max: number) => Math.min(max, maxW / measure(s, ARCHB(), 1));
const HELLO = ['HELLO!', '¡HOLA!', 'BONJOUR!', 'CIAO!', 'HALLO!', 'OLÁ!', 'NAMASTE!'];

export default class Dub extends Plate {
  paper = true;

  build() {
    this.take('It even dubs', ['It', 'even', 'dubs', 'videos', 'into', 'other', 'languages.']);
    const w = this.w;
    const K = this.cam;
    K.key(this.ctx.start, 0, -100, 1.05, 0.0);
    K.key(w.dubs!.start + 0.1, 0, -60, 1.0, -0.01, ease.outExpo);
    K.key(this.ctx.end, 0, -40, 1.04, 0.01, ease.linear);
  }

  override camAt(t: number): Cam { return this.cam.at(t); }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the video
    const V = { x: -480, y: -520, w: 960, h: 540 };
    card(ctx, c, V.x, V.y, V.w, V.h, { fill: 'ink2', r: 12 });
    setWorld(ctx, c, V.x + 120, V.y + V.h - 110);
    ctx.fillStyle = rgba('bone', 0.95);
    ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(56, 0); ctx.lineTo(0, 36); ctx.closePath(); ctx.fill();
    ctx.fillRect(110, -6, 640, 12);
    ctx.fillStyle = rgba('signal', 1); ctx.fillRect(110, -6, 640 * ((t * 0.08) % 1), 12);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the speaker (a head and shoulders in pink halftone-less flat)
    setWorld(ctx, c, V.x + 300, V.y + 330);
    ctx.fillStyle = rgba('signal', 1);
    ctx.beginPath(); ctx.arc(0, -90, 70, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 60, 140, 110, 0, Math.PI, 0); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the bubble
    const li = prog(t, w.into!.start, w.languages!.end + 0.2);
    const i = li <= 0 ? 0 : Math.min(HELLO.length - 1, 1 + Math.floor(li * (HELLO.length - 1)));
    const s = HELLO[i]!;
    const flip = li > 0 ? pulse(t, w.into!.start + (Math.max(0, i - 1) / (HELLO.length - 1)) * (w.languages!.end + 0.2 - w.into!.start), 0.06) : 0;
    setWorld(ctx, c, V.x + 640, V.y + 150, 1 + 0.15 * flip);
    ctx.fillStyle = rgba('bone', 1); ctx.strokeStyle = rgba('ink', 1); ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(-230, -90, 460, 150, 60); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-150, 56); ctx.lineTo(-210, 120); ctx.lineTo(-90, 58); ctx.fill(); ctx.stroke();
    ctx.font = font(ARCHB(100), Math.min(88, 400 / measure(s, ARCHB(100), 1)));
    overprint(ctx, (col) => { ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(s, 0, 20); ctx.textAlign = 'left'; }, { top: 'ink', dx: 5, dy: 4 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // under the video: the speech track
    bars(ctx, c, -470, 470, 140, 70, 48, (u) => speechEnv(u * 9 + t * 1.5, 23), 'ink');
    rslam(ctx, c, 'DUBBED', -490, 470, fit('DUBBED', 920, 260), t, w.dubs!.start, { top: 'signal' });
    mono(ctx, c, 'INTO OTHER LANGUAGES', -486, 560, 44, 'ink', { a: prog(t, w.other!.start, w.other!.start + 0.15) });
  }

  postFX(t: number) {
    const hit = pulse(t, this.w.dubs!.start, 0.07);
    return { zoom: 1 + 0.025 * hit, shake: [8 * hit * noise1(t * 60, 1), 8 * hit * noise1(t * 60, 2)] as [number, number], grain: 0.06 };
  }
}
