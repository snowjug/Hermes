// STARS: "And in two months, 16,000 people starred it on GitHub. Here's why that's a big deal."
// The repository as a printed card: name, one-line description, licence and a star counter that runs
// to 16,380. Two tear-off calendar pages (3 Aug, 9 Oct) land on "two months"; on "starred" gold star
// stickers pile up round the card. On "Here's why" the pen writes it in red marker with an arrow, and a
// sheet of paper wipes the desk.
import { tape, ransom, hash, springStep, prog, ease, clamp, rgba, setWorld, font, F, pt, arrow, TAU } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk } from '@ep/kit';

const CARD = { x: -620, y: -300, w: 980, h: 470 };

export default class Stars extends Desk {
  override wipeOut = true;
  override wipeFrom: 'left' | 'right' = 'right';

  build() {
    const w = this.w;
    this.take('And in two months', ['two', 'months,', '16,000', 'people', 'starred', 'GitHub.']);
    this.take("Here's why", [['heres', "Here's"], 'why', 'big', 'deal.']);
    const P = this.plot;
    // "here's why" in marker script, then an arrow off to the right
    P.writeWords("here's why", [w.heres!, w.why!], 'script', 120, 400, 60, 'main', { width: 6, kind: 'signal', minDur: 0.25 });
    const ar = arrow(pt(520, 110), pt(840, 230), 3, -0.2);
    P.add(ar.shaft, w.big!.start, w.deal!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 6 });
    P.add(ar.head, w.deal!.end, w.deal!.end + 0.12, 'signal', { pen: true, width: 6 });
    const K = this.cam;
    K.key(this.ctx.start, -160, -60, 1.12, 0.01);
    K.key(w.starred!.start, -120, -40, 1.0, 0.0, ease.inOutCubic);
    K.key(w.heres!.start, 470, -20, 1.08, -0.01, ease.inOutCubic);
    K.key(this.ctx.end, 540, 0, 1.14, -0.012, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a = clamp((t - this.ctx.start) / 0.15);
    // the card
    setWorld(ctx, c, CARD.x + CARD.w / 2, CARD.y + CARD.h / 2, 0.92 + 0.08 * springStep(t - this.ctx.start, 3, 0.5), -0.025);
    ctx.translate(-CARD.w / 2, -CARD.h / 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(8, 11, CARD.w, CARD.h);
    ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, 0, CARD.w, CARD.h);
    ctx.font = font(F.mono(500), 30); ctx.fillStyle = rgba('acid', 1); ctx.fillText('boykopovar /', 50, 80);
    ctx.font = font(F.archivo(87.5, 900), 92); ctx.fillStyle = rgba('ink', 1); ctx.fillText('AnyPS5', 50, 175);
    ctx.font = font(F.mono(400), 26); ctx.fillStyle = rgba('graphite', 1);
    ctx.fillText('Tool for automatic PS5 executables', 52, 232); ctx.fillText('porting to Linux and Windows', 52, 270);
    ctx.fillStyle = rgba('ink', 0.15); ctx.fillRect(50, 305, CARD.w - 100, 2);
    ctx.font = font(F.mono(600), 26); ctx.fillStyle = rgba('ink', 0.85);
    ctx.fillText('C++   ·   GPL-2.0   ·   created 3 Aug 2026', 52, 352);
    // the star counter
    const n = Math.round(16380 * ease.outCubic(prog(t, w['16000']!.start - 0.2, w.github!.end)));
    ctx.font = font(F.archivo(87.5, 900), 74); ctx.fillStyle = rgba('signal', 1);
    ctx.fillText(`★ ${n.toLocaleString('en-US')}`, 50, 440);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    tape(ctx, c, CARD.x + 40, CARD.y + 6, 160, -0.5, { seed: 11, a });
    tape(ctx, c, CARD.x + CARD.w - 40, CARD.y + 10, 150, 0.55, { seed: 12, a });
    // calendar pages on "two months"
    const cal = (x: number, y: number, mon: string, day: string, t0: number, rot: number) => {
      if (t < t0) return;
      const sp = springStep(t - t0, 3, 0.45);
      setWorld(ctx, c, x, y, 0.4 + 0.6 * sp, rot + (1 - sp) * 0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-92, -102, 190, 216);
      ctx.fillStyle = '#FBF8F0'; ctx.fillRect(-98, -110, 190, 216);
      ctx.fillStyle = rgba('signal', 1); ctx.fillRect(-98, -110, 190, 56);
      ctx.fillStyle = '#FBF8F0'; ctx.font = font(F.mono(700), 34); ctx.textAlign = 'center'; ctx.fillText(mon, -3, -70);
      ctx.fillStyle = rgba('ink', 1); ctx.font = font(F.archivo(87.5, 900), 110); ctx.fillText(day, -3, 70);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    cal(CARD.x + CARD.w + 150, CARD.y - 10, 'AUG', '3', w.two!.start - 0.1, -0.08);
    cal(CARD.x + CARD.w + 360, CARD.y + 60, 'OCT', '9', w.months!.start, 0.07);
    // star stickers
    const t0 = w.starred!.start - 0.15;
    for (let i = 0; i < 26; i++) {
      const ti = t0 + i * 0.045;
      if (t < ti) break;
      const an = hash(i, 1) * TAU, rr = 330 + 230 * hash(i, 2);
      const x = CARD.x + CARD.w / 2 + Math.cos(an) * rr * 1.25, y = CARD.y + CARD.h / 2 + Math.sin(an) * rr * 0.8;
      if (x > 300) continue;
      star(ctx, c, x, y, 26 + 22 * hash(i, 3), (hash(i, 4) - 0.5) * 1.2, springStep(t - ti, 3.5, 0.45));
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    void ransom; void ctx; void t; void c;
  }

  override pfx(t: number) {
    const k = prog(t, this.w.starred!.start, this.w.starred!.start + 0.6);
    return { zoom: 1 + 0.01 * Math.sin(k * Math.PI) };
  }
}

function star(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, rot: number, sp: number) {
  setWorld(ctx, c, x, y, Math.max(0.01, sp), rot);
  const path = (rr: number) => {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + (k * Math.PI) / 5, q = k % 2 ? rr * 0.45 : rr; ctx.lineTo(Math.cos(an) * q, Math.sin(an) * q); }
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.save(); ctx.translate(3, 5); path(r + 6); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#FBF8F0'; path(r + 6); ctx.fill();
  ctx.fillStyle = '#E9B23C'; path(r); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.25, r * 0.22, 0, TAU); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
