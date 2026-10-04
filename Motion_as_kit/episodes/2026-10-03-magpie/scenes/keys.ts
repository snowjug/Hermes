// KEYS: "Add several keys, and when one runs out of credit, it sits out half an hour while another one
// answers."
// Three keys with balance bars behind magpie. Requests from the agent go to KEY 1; its balance drains
// to zero on "runs out of credit"; a SITTING OUT stamp lands and a 30:00 timer starts on "sits out
// half an hour"; on "another one answers" the requests re-route to KEY 2.
import { type LineBatch } from '@engine/lines';
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, drawNode, packets, makeStamp, drawStamp, pt, clamp, ease, lerp, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, LIN, type Cam, type P } from '@kit/_mp';

const KEYS: { name: string; bal: number }[] = [{ name: 'KEY 1', bal: 0.24 }, { name: 'KEY 2', bal: 0.82 }, { name: 'KEY 3', bal: 0.66 }];
const KX = 480, ky = (i: number) => -170 + i * 225;
const RX = -150, RY = 60;

export default class Keys extends Plate {
  stamp!: HTMLCanvasElement;
  tDrain0 = 0; tDrain1 = 0; tOut = 0; tSwitch = 0;
  routes: P[][] = [];

  build() {
    const w = this.w;
    const L = this.take('Add several keys', ['Add', 'several', 'keys,', 'and', 'when', ['one1', 'one', 0], 'runs', ['out1', 'out', 0], 'of', 'credit,', 'it', 'sits', ['out2', 'out', 1], 'half', 'an', 'hour', 'while', 'another', ['one2', 'one', 1], 'answers.']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L, 'Add', 'credit,'), -800, -450, 58, fam, 'K', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'it', 'answers.'), -800, -375, 58, fam, 'K', { ant: 0.2 }).words);
    this.tDrain0 = w.runs!.start; this.tDrain1 = w.credit!.end;
    this.tOut = w.sits!.start;
    this.tSwitch = w.another!.start;
    this.stamp = makeStamp('SITTING OUT', 'BALANCE  $0.00', 'BACK IN 30 MIN', '#FF4D12', 11);
    this.routes = KEYS.map((_, i) => [pt(RX + 125, RY), pt(KX - 340, ky(i)), pt(KX - 240, ky(i))]);
    const K = this.cam;
    K.key(this.ctx.start, -100, -100, 0.98, -0.004);
    K.key(this.tDrain0, 100, -80, 1.06, 0.0, ease.inOutCubic);
    K.key(this.tOut + 0.2, 300, -110, 1.2, 0.008, ease.inOutCubic);
    K.key(this.tSwitch + 0.1, 80, -20, 1.0, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 80, -10, 1.02, 0.004, ease.linear);
  }

  bal(i: number, t: number) {
    const k = KEYS[i]!;
    if (i === 0) return k.bal * (1 - ease.inOutQuad(prog(t, this.tDrain0, this.tDrain1)));
    if (i === 1) return k.bal - 0.05 * prog(t, this.tSwitch, this.ctx.end);
    return k.bal;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = this.ctx.start;
    drawNode(ctx, c, -660, RY, 'CLAUDE CODE', 'sending requests', { a: prog(t, t0, t0 + 0.25), w: 360, h: 116, size: 25 });
    drawNode(ctx, c, RX, RY, 'MAGPIE', 'picks the key', { a: prog(t, t0 + 0.1, t0 + 0.35), w: 250, h: 116, size: 25, hot: pulse(t, this.tSwitch, 0.4) });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const a0 = toS(c, pt(-480, RY)), a1 = toS(c, pt(RX - 125, RY));
    ctx.strokeStyle = rgba('bone', 0.55); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
    KEYS.forEach((k, i) => {
      const ta = w.several!.start + i * 0.12;
      const a = prog(t, ta, ta + 0.2);
      const dead = i === 0 && t > this.tDrain1 - 0.05;
      const active = (i === 0 && t < this.tSwitch) || (i === 1 && t >= this.tSwitch);
      drawNode(ctx, c, KX, ky(i), '', '', { a, w: 480, h: 176, hot: i === 1 ? pulse(t, this.tSwitch + 0.2, 0.5) : 0, dim: dead ? 0.5 : 1 });
      setWorld(ctx, c, KX - 205, ky(i) - 34);
      label(ctx, `${k.name} · DEEPSEEK`, 0, 0, { size: 23, col: rgba('bone', 0.9 * a * (dead ? 0.6 : 1)), spacing: 3, weight: 600 });
      // balance bar
      const b = this.bal(i, t), bw = 410;
      ctx.fillStyle = rgba('bone', 0.15 * a); ctx.fillRect(0, 18, bw, 12);
      ctx.fillStyle = dead ? rgba('blood', a) : b < 0.1 ? mixCss('signal', 'blood', 1 - b / 0.1, a) : rgba(i === 0 ? 'signal' : 'bone', 0.85 * a);
      ctx.fillRect(0, 18, bw * clamp(b), 12);
      ctx.font = font(F.mono(400), 22);
      ctx.fillStyle = rgba('ash', 0.9 * a);
      ctx.fillText(`balance $${(b * 50).toFixed(2)}`, 0, 66);
      const st = dead ? (t > this.tOut ? 'sitting out' : 'out of credit') : active ? 'answering' : 'standing by';
      ctx.textAlign = 'right';
      ctx.fillStyle = active ? rgba('signal', a) : dead ? rgba('blood', a) : rgba('ash', 0.8 * a);
      ctx.fillText(st, bw, 66);
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // routes: the active one bright, the others hairline
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.routes.forEach((r, i) => {
      const k = prog(t, w.several!.start + i * 0.12, w.keys!.end + i * 0.12, ease.inOutCubic);
      if (k <= 0) return;
      const active = (i === 0 && t < this.tSwitch) || (i === 1 && t >= this.tSwitch);
      ctx.strokeStyle = active ? rgba('signal', 0.85) : rgba('bone', i === 0 && t >= this.tSwitch ? 0.12 : 0.3);
      ctx.lineWidth = active ? 2 : 1.2;
      ctx.beginPath();
      const s0 = toS(c, r[0]!); ctx.moveTo(s0[0], s0[1]);
      const n = r.length - 1, u = k * n;
      for (let j = 1; j <= n; j++) {
        const f = Math.min(1, u - (j - 1)); if (f <= 0) break;
        const s = toS(c, pt(lerp(r[j - 1]!.x, r[j]!.x, f), lerp(r[j - 1]!.y, r[j]!.y, f)));
        ctx.lineTo(s[0], s[1]);
      }
      ctx.stroke();
    });
  }

  drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    drawStamp(ctx, c, this.stamp, KX + 10, ky(0) - 4, t, this.tOut, 0.33, -0.06);
    if (t > this.tOut + 0.1) {
      // the timer: 30:00 counting down in real seconds
      const left = Math.max(0, 1800 - (t - this.tOut - 0.1));
      const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
      setWorld(ctx, c, KX + 262, ky(0) + 16);
      ctx.font = font(F.mono(500), 50);
      ctx.fillStyle = rgba('signal', prog(t, this.tOut + 0.1, this.tOut + 0.3));
      ctx.fillText(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const t0 = this.ctx.start + 0.2;
    packets(X, c, [pt(-480, RY), pt(RX - 125, RY)], t, { t0, speed: 600, gap: 0.28 });
    packets(X, c, this.routes[0]!, t, { t0: t0 + 0.3, t1: this.tDrain1 - 0.6, speed: 600, gap: 0.28 });
    packets(X, c, this.routes[1]!, t, { t0: this.tSwitch + 0.1, speed: 600, gap: 0.28, fadeIn: 0.2 });
    void LIN;
  }

  postFX(t: number) {
    const slam = pulse(t, this.tOut, 0.07);
    return { zoom: 1 + 0.02 * slam, shake: [6 * slam * noise1(t * 60, 1), 6 * slam * noise1(t * 60, 2)] as [number, number] };
  }
}

function toS(c: Cam, p: P): [number, number] {
  const dx = (p.x - c.cx) * c.z, dy = (p.y - c.cy) * c.z;
  const co = Math.cos(c.roll), si = Math.sin(c.roll);
  return [960 + co * dx - si * dy, 540 + si * dx + co * dy];
}
