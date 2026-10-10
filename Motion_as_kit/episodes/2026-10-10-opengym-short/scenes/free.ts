// FREE: "No subscription. No ads. It runs on your own server, or right on your Android phone."
// A receipt (BILLED MONTHLY) lands under NO SUBSCRIPTION and a pink marker swipes through it; NO ADS
// slams in. On "runs" the receipt flies off and a Raspberry Pi lands (YOUR SERVER); on "Android" the
// app's home screen lands beside it (OR YOUR PHONE).
import { drawCut, tag, prog } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { receipt } from '@ep/kit';
import { Court, cslam, fitSize, swipe, LIME, PINK } from '@ep/court';

export default class Free extends Court {
  override uses = ['pi', 's_home'];

  build() {
    this.take('No subscription', ['subscription.', ['no2', 'No', 1], 'ads.', 'runs', 'own', 'server,', 'right', 'Android', 'phone.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, -30, 1.04, -0.006);
    K.key(this.w.runs!.start, 0, 0, 1.0, 0.004);
    K.key(this.ctx.end, 0, 20, 1.04, 0.008);
  }

  override under(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tr = w.runs!.start;
    if (t < tr + 0.3) {
      const fly = prog(t, tr, tr + 0.3);
      receipt(ctx, c, 0 + fly * 900, 0 - fly * 300, 640, ['WORKOUT APP PRO', 'PLAN ......... PREMIUM', 'BILLED MONTHLY', 'ADS ................ ON', 'AUTO-RENEW ......... ON'], t, this.ctx.start, { rot: -0.05 + fly * 0.6, hot: [2], size: 38 });
      swipe(ctx, c, 0, -20, 600, 34, t, w.subscription!.start + 0.1, { col: PINK, rot: -0.08, seed: 3 });
      swipe(ctx, c, 0, 105, 600, 34, t, w.ads!.start + 0.05, { col: PINK, rot: -0.05, seed: 4 });
    }
    drawCut(ctx, c, this.cuts.pi!, -170, -40, t, { t0: tr - 0.05, scale: 0.82, rot: -0.06, seed: 41 });
    tag(ctx, c, 'YOUR SERVER', -170, 200, 40, { a: prog(t, w.server!.start, w.server!.start + 0.12), rot: 0.04, seed: 42, bg: LIME });
    drawCut(ctx, c, this.cuts.s_home!, 250, 300, t, { t0: w.android!.start - 0.1, scale: 0.72, rot: 0.06, seed: 43 });
    tag(ctx, c, 'ANDROID APP', 250, 30, 40, { a: prog(t, w.android!.start, w.android!.start + 0.12), rot: -0.05, seed: 44, bg: LIME });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const tr = w.runs!.start - 0.05;
    if (t < w.no2!.start - 0.05) {
      cslam(ctx, c, 'NO', 0, -730, fitSize('NO', 400, 170), t, this.ctx.start + 0.02, { align: 'center' });
      cslam(ctx, c, 'SUBSCRIPTION', 0, -570, fitSize('SUBSCRIPTION', 960, 200), t, w.subscription!.start - 0.05, { align: 'center', col: LIME });
    } else if (t < tr) {
      cslam(ctx, c, 'NO ADS', 0, -600, fitSize('NO ADS', 860, 230), t, w.no2!.start - 0.05, { align: 'center', col: LIME });
    } else if (t < w.android!.start - 0.1) {
      cslam(ctx, c, 'YOUR OWN', 0, -720, fitSize('YOUR OWN', 800, 160), t, tr, { align: 'center' });
      cslam(ctx, c, 'SERVER', 0, -560, fitSize('SERVER', 820, 200), t, w.server!.start - 0.05, { align: 'center', col: LIME });
    } else {
      cslam(ctx, c, 'OR YOUR', 0, -720, fitSize('OR YOUR', 760, 160), t, w.android!.start - 0.1, { align: 'center' });
      cslam(ctx, c, 'PHONE', 0, -560, fitSize('PHONE', 760, 200), t, w.phone!.start - 0.05, { align: 'center', col: LIME });
    }
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.no2!.start, 0.03) * this.punch(t, w.runs!.start, 0.02) * this.punch(t, w.android!.start, 0.02) };
  }
}
