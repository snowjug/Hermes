// The God's Eye View Short, one continuous plate: a classified file on a desk, a page per line.
//  1 the folder, PROJECT: GOD'S EYE, stamped TOP SECRET; it opens on "browser" to SUBJECT: YOUR BROWSER and a
//    satellite print of the night globe; SPY SATELLITE stamps on "spy satellite".
//  2 a page slides on: an AIRCRAFT print and a SATELLITES print, their counts unredacted as they're said (11,000,
//    838), then SHIPS / EARTHQUAKES / FIRES ticked in red pen.
//  3 a contact sheet of six traffic-camera stills, 4,000 CAMERAS unredacted; on "night vision" the stills go green.
//  4 the cover sheet: GOD'S EYE VIEW typed, FREE and OPEN SOURCE stamped, and the last stamp: THE DATA IS REAL.
//  5 the subscribe graphic.
// The prints and camera stills are illustrations, not the project's live data.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { font } from '@engine/type';
import { subscribe } from '@kit/_subscribe';
import { globe, cctv, PALS } from '@ep/sat';
import { Desk, sheet, stamp, typeOn, redact, photo, clip, tick, MANILA, PAGE, INKC, RED, TYPEB, clamp, ease } from '@ep/dossier';

const PW = 900, PH = 1180, PY = -150;

export default class FileScene extends Desk {
  build() {
    this.take('POV', ['POV:', 'turned', 'browser', 'spy', 'satellite.']);
    this.take('11,000 live', ['11,000', 'live', 'planes.', '838', 'satellites.', 'Ships,', 'earthquakes,', 'fires.']);
    this.take('Nearly 4,000', ['Nearly', '4,000', 'public', 'traffic', 'cameras.', 'Then', 'flip', 'night', 'vision.']);
    this.take("It's called God", ['called', "God's", 'free,', 'open', 'source,', 'data', 'real.']);
    this.take('Subscribe for', ['Subscribe', 'day.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, -60, 1.12); K.key(s + 0.6, 0, -60, 1.0, 0, ease.outCubic);
    K.key(this.s('called') - 0.1, 0, -60, 1.03, 0, ease.inOutQuad); K.key(this.s('called') + 0.5, 0, -60, 1.0, 0, ease.inOutCubic);
    K.key(e, 0, -60, 1.04, 0, ease.inOutQuad);
  }
  /** a page sliding onto the stack: 0 off to the right, 1 in place */
  slide(t: number, t0: number) { return ease.outCubic(clamp((t - t0) / 0.5)); }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // ---- 1 the folder, then page 1
    const open = ease.inOutCubic(clamp((t - this.s('browser') + 0.25) / 0.5));
    sheet(ctx, c, 6, PY + 10, PW + 20, PH + 20, 0.01, '#C9B27E');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // page 1 (under the cover)
    sheet(ctx, c, 0, PY, PW, PH, -0.012, PAGE);
    ctx.font = font(TYPEB, 30); ctx.fillStyle = INKC; ctx.fillText('FILE GE-01', -PW / 2 + 60, -PH / 2 + 90);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    typeOn(ctx, c, 'SUBJECT: YOUR BROWSER', -PW / 2 + 60, -PH / 2 + 150, 38, t, this.s('browser') + 0.1, { bold: true, rot: -0.012, oy: PY, cps: 50 });
    photo(ctx, c, 0, PY + 90, 700, 640, 0.03, clamp((t - this.s('browser') - 0.1) / 0.3), () => {
      globe(ctx, c, 0, PY + 90, 300, { lon: -30 + t * 4, lat: 25 }, t, { flights: 1, lights: 1, grat: 0.7, sats: 1, orbits: 0.6 }, PALS.eo);
    });
    clip(ctx, c, -280, PY - 250, 0.1);
    // the cover, flipping open to the left
    if (open < 1) {
      const sx = Math.cos(open * Math.PI);
      setWorld(ctx, c, -PW / 2 + (PW / 2) * sx, PY, 1, 0);
      ctx.save(); ctx.scale(sx, 1);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      ctx.fillStyle = sx > 0 ? MANILA : '#D6C08C'; ctx.fillRect(-PW / 2, -PH / 2, PW, PH); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
      ctx.fillRect(PW / 2 - 220, -PH / 2 - 50, 200, 60);
      if (sx > 0) {
        ctx.font = font(TYPEB, 30); ctx.fillStyle = INKC; ctx.fillText('GE-01', PW / 2 - 190, -PH / 2 - 10);
        ctx.font = font(TYPEB, 46); ctx.fillText('PROJECT: GOD\'S EYE', -PW / 2 + 70, -PH / 2 + 200);
        ctx.font = font(TYPEB, 26); ctx.fillStyle = 'rgba(30,27,24,0.7)'; ctx.fillText('EYES ONLY · COPY 1 OF 1', -PW / 2 + 70, -PH / 2 + 250);
        ctx.strokeStyle = 'rgba(30,27,24,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-PW / 2 + 70, -PH / 2 + 340 + i * 60); ctx.lineTo(PW / 2 - 70, -PH / 2 + 340 + i * 60); ctx.stroke(); }
      }
      ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (sx > 0) stamp(ctx, c, 'TOP SECRET', -PW / 2 + (PW / 2) * sx, PY + 60, 120 * Math.max(0.05, sx), -0.18, clamp((t - 0.15) / 0.25));
    }
    // ---- 2 the aircraft and the satellites
    const s2 = this.slide(t, this.s('11000') - 0.35);
    if (s2 > 0) {
      const ox = (1 - s2) * 1200, rot = 0.015 + (1 - s2) * 0.2;
      sheet(ctx, c, ox, PY + 6, PW, PH, rot, PAGE); ctx.setTransform(1, 0, 0, 1, 0, 0);
      typeOn(ctx, c, 'LAYERS OBSERVED', -PW / 2 + 60, -PH / 2 + 90, 36, t, this.s('11000') - 0.3, { bold: true, rot, ox, oy: PY + 6, cps: 60 });
      photo(ctx, c, ox - 190, PY - 210, 380, 380, -0.04, clamp((t - this.s('11000') + 0.05) / 0.3), () => {
        globe(ctx, c, ox - 190, PY - 210 + 420, 900, { lon: -35, lat: 30 }, t, { flights: 1, lights: 1, grat: 0.6 }, PALS.eo);
      });
      photo(ctx, c, ox + 210, PY - 150, 360, 360, 0.05, clamp((t - this.s('838') + 0.05) / 0.3), () => {
        globe(ctx, c, ox + 210, PY - 150, 120, { lon: t * 8, lat: 20 }, t, { lights: 1, grat: 0.5, sats: 1, orbits: 1 }, PALS.eo);
      });
      typeOn(ctx, c, 'AIRCRAFT', -PW / 2 + 60, 120, 30, t, this.s('11000'), { bold: true, rot, ox, oy: PY + 6 });
      typeOn(ctx, c, '11,000+', -PW / 2 + 60, 166, 42, t, this.s('11000'), { bold: true, rot, ox, oy: PY + 6, cps: 99 });
      redact(ctx, c, -PW / 2 + 56, 128, 210, 50, clamp((t - this.s('11000') - 0.1) / 0.35), { rot, ox, oy: PY + 6 });
      typeOn(ctx, c, 'SATELLITES', 60, 120, 30, t, this.s('838'), { bold: true, rot, ox, oy: PY + 6 });
      typeOn(ctx, c, '838', 60, 166, 42, t, this.s('838'), { bold: true, rot, ox, oy: PY + 6, cps: 99 });
      redact(ctx, c, 56, 128, 120, 50, clamp((t - this.s('838') - 0.1) / 0.35), { rot, ox, oy: PY + 6 });
      const items: [string, string][] = [['SHIPS (AIS)', 'ships'], ['EARTHQUAKES (USGS)', 'earthquakes'], ['FIRES (NASA FIRMS)', 'fires']];
      items.forEach(([s, k], i) => {
        typeOn(ctx, c, s, -PW / 2 + 110, 280 + i * 70, 34, t, this.s(k) - 0.05, { bold: true, rot, ox, oy: PY + 6, cps: 60 });
        const p = [ox + (-PW / 2 + 80), PY + 6 + 268 + i * 70];
        tick(ctx, c, p[0]!, p[1]!, clamp((t - this.s(k)) / 0.3), rot);
      });
    }
    // ---- 3 the cameras
    const s3 = this.slide(t, this.s('nearly') - 0.35);
    if (s3 > 0) {
      const ox = (1 - s3) * -1200, rot = -0.02 - (1 - s3) * 0.2;
      sheet(ctx, c, ox, PY + 12, PW, PH, rot, PAGE); ctx.setTransform(1, 0, 0, 1, 0, 0);
      typeOn(ctx, c, 'PUBLIC TRAFFIC CAMERAS', -PW / 2 + 60, -PH / 2 + 90, 36, t, this.s('nearly') - 0.3, { bold: true, rot, ox, oy: PY + 12, cps: 60 });
      typeOn(ctx, c, '≈ 4,000', -PW / 2 + 60, -PH / 2 + 160, 60, t, this.s('4000'), { bold: true, rot, ox, oy: PY + 12, cps: 99 });
      redact(ctx, c, -PW / 2 + 56, -PH / 2 + 110, 280, 66, clamp((t - this.s('4000') - 0.05) / 0.4), { rot, ox, oy: PY + 12 });
      const nv = t > this.s('night') - 0.05;
      const labels = ['AUSTIN TX', 'LONDON', 'HELSINKI', 'TORONTO', 'SYDNEY', 'OSLO'];
      labels.forEach((lab, i) => {
        const x = ox - 205 + (i % 2) * 410, y = PY + 12 - 230 + Math.floor(i / 2) * 270;
        const a = clamp((t - this.s('public') - i * 0.1) / 0.3);
        if (a <= 0) return;
        cctv(ctx, c, x, y, 380, 230, i + 11, t, 'CAM · ' + lab, PALS.eo, a);
        if (nv) { setWorld(ctx, c, x, y, 1, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#7CFF6B'; ctx.fillRect(-190, -115, 380, 230); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(40,120,40,0.35)'; ctx.fillRect(-190, -115, 380, 230); ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0); }
      });
    }
    // ---- 4 the cover sheet
    const s4 = this.slide(t, this.s('called') - 0.3);
    if (s4 > 0) {
      const oy = (1 - s4) * 1400, rot = 0.008;
      sheet(ctx, c, 0, PY + oy, PW, PH, rot, PAGE); ctx.setTransform(1, 0, 0, 1, 0, 0);
      typeOn(ctx, c, 'CODENAME', -PW / 2 + 70, -PH / 2 + 120, 30, t, this.s('called'), { bold: true, rot, oy: PY + oy });
      typeOn(ctx, c, "GOD'S EYE VIEW", -PW / 2 + 70, -PH / 2 + 210, 78, t, this.s('gods') - 0.05, { bold: true, rot, oy: PY + oy, cps: 30 });
      typeOn(ctx, c, 'github.com/bilawalsidhu/gods-eye-view', -PW / 2 + 70, -PH / 2 + 260, 26, t, this.s('gods') + 0.3, { rot, oy: PY + oy, cps: 70 });
      typeOn(ctx, c, 'A spy satellite simulator in your browser,', -PW / 2 + 70, -PH / 2 + 330, 28, t, this.s('gods') + 0.5, { rot, oy: PY + oy, cps: 70 });
      typeOn(ctx, c, 'except the data is real.', -PW / 2 + 70, -PH / 2 + 370, 28, t, this.s('gods') + 0.9, { rot, oy: PY + oy, cps: 70 });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    if (t < this.s('11000') - 0.2) stamp(ctx, c, 'SPY SATELLITE', 120, PY + 380, 92, -0.14, clamp((t - this.s('spy') + 0.05) / 0.25));
    if (t > this.s('night') - 0.05 && t < this.s('called') - 0.2) stamp(ctx, c, 'NIGHT VISION', 150, PY + 520, 84, 0.1, clamp((t - this.s('night') + 0.05) / 0.25), '#2E9E3A');
    if (t > this.s('called') - 0.3) {
      stamp(ctx, c, 'FREE', -230, PY + 120, 110, -0.12, clamp((t - this.s('free') + 0.05) / 0.25));
      stamp(ctx, c, 'OPEN SOURCE', 190, PY + 130, 76, 0.08, clamp((t - this.s('open') + 0.05) / 0.25));
      stamp(ctx, c, 'THE DATA IS REAL', 0, PY + 300, 104, -0.06, clamp((t - this.s('real') + 0.05) / 0.25), RED, 'PUBLIC SOURCES · NOT A SIMULATION');
    }
    subscribe(ctx, t, this.s('subscribe') - 0.1, this.ctx.end + 1, { x: W / 2, y: H / 2 + 470, s: 0.95, dark: true });
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.s('spy'), 0.03) * this.punch(t, this.s('night'), 0.02) * this.punch(t, this.s('real'), 0.03) };
  }
}
