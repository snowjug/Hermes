// DOCKER: "One Docker command, and it's live on your own machine. No ads, no subscription, no telemetry."
// A terminal card types `docker compose up -d` and its two containers start; on "live" the laptop
// lands with the address it serves (localhost:8080). Then three slips, ADS, SUBSCRIPTION, TELEMETRY,
// land one per word and the red marker strikes each one out.
import { drawCut, tag, crossOut, ease, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, termCard, slip } from '@ep/kit';

const SLIPS = [
  { key: 'ads', text: 'ADS', x: -560, y: 220, r: -0.05 },
  { key: 'subscription', text: 'SUBSCRIPTION', x: -20, y: 250, r: 0.03 },
  { key: 'telemetry', text: 'TELEMETRY', x: 560, y: 215, r: -0.03 },
];
const SIZE = 66;

export default class Docker extends Desk {
  override uses = ['laptop'];
  override wipeIn = true;
  override wipeFrom: 'left' | 'right' = 'left';

  build() {
    this.take('One Docker command', ['One', 'Docker', 'command,', 'live', 'own', 'machine.', 'ads,', 'subscription,', 'telemetry.']);
    const w = this.w;
    SLIPS.forEach((s, i) => {
      const tw = w[s.key]!.start;
      const ww = s.text.length * SIZE * 0.68 + SIZE * 1.2;
      crossOut(s.x - ww / 2, s.y - 52, ww, 104, 51 + i).forEach((p, j) => this.plot.add(p, tw + 0.18 + j * 0.1, tw + 0.32 + j * 0.1, 'signal', { pen: true, width: 8 }));
    });
    const K = this.cam;
    K.key(this.ctx.start, -260, -150, 1.12, -0.006);
    K.key(w.live!.start, 20, -100, 1.0, 0.0, ease.inOutCubic);
    K.key(w.ads!.start - 0.15, 0, 60, 0.96, 0.004, ease.inOutCubic);
    K.key(this.ctx.end, 0, 70, 0.98, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    termCard(ctx, c, -860, -430, 900, [
      ['$ docker compose up -d', w.docker!.start],
      ['Container opengym-api   Started', w.live!.start - 0.25, '#7FD18B'],
      ['Container opengym-web   Started', w.live!.start, '#7FD18B'],
    ], t, w.one!.start - 0.15, { rot: -0.02, size: 32 });
    drawCut(ctx, c, this.cuts.laptop!, 470, -170, t, { t0: w.live!.start - 0.05, scale: 0.6, rot: 0.04, seed: 21 });
    tag(ctx, c, 'localhost:8080', 470, 50, 34, { a: prog(t, w.own!.start, w.own!.start + 0.15), rot: -0.03, seed: 22, sub: 'YOUR OWN MACHINE' });
    SLIPS.forEach((s) => slip(ctx, c, s.text, s.x, s.y, SIZE, t, w[s.key]!.start - 0.1, { rot: s.r }));
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.ads!.start, 0.01) * this.punch(t, w.subscription!.start, 0.01) * this.punch(t, w.telemetry!.start, 0.012) };
  }
}
