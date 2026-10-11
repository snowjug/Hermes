// 17–19 THE CATCH: "The catch: its own warning says the data can be delayed, incomplete or wrong, so it's not for
// navigation or emergencies." "Traffic is simulated, camera angles are estimates, and the 3D cities need a key." "And by
// design, it won't do face recognition or track individual people."
// The feed drops to amber CRT. A warning panel types the project's own words (DELAYED · INCOMPLETE · WRONG) and
// stamps NOT FOR NAVIGATION / EMERGENCIES; three caveat lines tick in; then a shield: NO FACE RECOGNITION · NO
// TRACKING INDIVIDUALS, BY DESIGN.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Feed, panel, mono, decode, WIDE, MONOB, clamp, ob, type Mode } from '@ep/sat';

export default class Catch extends Feed {
  build() {
    this.take('The catch', ['catch:', 'warning', 'delayed,', 'incomplete', 'wrong,', 'navigation', 'emergencies.']);
    this.take('Traffic is simulated', ['Traffic', 'simulated,', 'camera', 'estimates,', '3D', 'cities', 'key.']);
    this.take('And by design', ['design,', 'face', 'recognition', 'track', 'individual', 'people.']);
    this.frameKeys();
  }
  frameKeys() { const K = this.cam; K.key(this.ctx.start, 0, 0, 1.08); K.key(this.ctx.start + 0.4, 0, 0, 1.0); K.key(this.ctx.end, 0, 0, 1.04); }
  override mode(_t: number): Mode { return 'crt'; }
  override hudInfo(_t: number) { return { trk: 'ADVISORY', alt: 'READ THE README', loc: 'SRC github.com/bilawalsidhu/gods-eye-view' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    decode(ctx, c, 'THE CATCH', 0, -360, 90, t, this.s('catch') - 0.1, { dur: 0.4, col: P.accent });
    const ak = clamp((t - this.s('warning') + 0.1) / 0.3) * (1 - clamp((t - this.s('design') + 0.2) / 0.3));
    if (ak > 0) {
      panel(ctx, c, 0, -110, 1300, 230, '⚠ IMPORTANT · FROM THE README', P, ak);
      const s = 'DATA MAY BE DELAYED, INCOMPLETE, MODELED, INFERRED, OR WRONG.';
      mono(ctx, c, s.slice(0, Math.floor(clamp((t - this.s('delayed') + 0.3) / 1.4) * s.length)), -610, -70, { size: 30, bold: true, col: P.text, a: ak });
      const nk = clamp((t - this.s('navigation') + 0.05) / 0.25);
      if (nk > 0) {
        setWorld(ctx, c, 200, -10, 0.7 + 0.3 * ob(nk), -0.05);
        ctx.globalAlpha = nk * ak; ctx.strokeStyle = P.mil; ctx.lineWidth = 5; ctx.strokeRect(-330, -34, 660, 68);
        ctx.font = font(MONOB, 32); ctx.fillStyle = P.mil; ctx.textAlign = 'center'; ctx.fillText('NOT FOR NAVIGATION · EMERGENCIES', 0, 12); ctx.textAlign = 'left';
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      const rows: [string, string][] = [['traffic', 'TRAFFIC ............ SIMULATED'], ['camera', 'CAMERA POSES ....... ESTIMATES'], ['3d', '3D CITIES .......... NEED A KEY']];
      rows.forEach(([k, s2], i) => mono(ctx, c, s2, -440, 120 + i * 56, { size: 32, bold: true, col: P.text, a: clamp((t - this.s(k) + 0.05) / 0.2) * ak }));
    }
    const dk = clamp((t - this.s('design') + 0.05) / 0.3);
    if (dk > 0) {
      setWorld(ctx, c, 0, 30, 0.8 + 0.2 * ob(dk), 0);
      ctx.globalAlpha = dk; ctx.strokeStyle = P.accent; ctx.lineWidth = 8; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(120, -105); ctx.lineTo(110, 20); ctx.quadraticCurveTo(90, 110, 0, 160); ctx.quadraticCurveTo(-90, 110, -110, 20); ctx.lineTo(-120, -105); ctx.closePath(); ctx.stroke();
      ctx.font = font(WIDE, 70); ctx.fillStyle = P.accent; ctx.textAlign = 'center'; ctx.fillText('✕', 0, 30); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'NO FACE RECOGNITION', -560, 0, { size: 36, bold: true, col: P.text, a: clamp((t - this.s('face') + 0.05) / 0.25), align: 'center' });
      mono(ctx, c, 'NO TRACKING INDIVIDUALS', 560, 0, { size: 36, bold: true, col: P.text, a: clamp((t - this.s('track') + 0.05) / 0.25), align: 'center' });
      mono(ctx, c, 'BY DESIGN', 0, 260, { size: 30, bold: true, col: P.accent, a: dk, align: 'center' });
    }
  }
}
