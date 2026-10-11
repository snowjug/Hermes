// 12–13 FLIP THE SENSOR: "Now flip the sensor. Night vision. Thermal. An old CRT screen." "And your browser looks like a
// surveillance feed from a spy movie."
// A low orbit over a city block (grey-box buildings) that switches sensor on each word: NVG green, FLIR ironbow with
// hot rooftops and engines, CRT amber with scanlines, each with a burst of static. On "surveillance" target brackets
// lock onto vehicles and the telemetry types out like a film. (An illustration of the sensor styles.)
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { box, drawParts, project, type Obj } from '@kit/_cad3d';
import { Feed, target, mono, PALS, MONO, clamp, ease, hash, type Mode } from '@ep/sat';

const BLDG: { x: number; y: number; w: number; d: number; h: number }[] = [];
for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
  if (i === 0 || j === 0) continue;
  const n = 1 + Math.floor(hash(i, j, 1) * 2);
  for (let k = 0; k < n; k++) BLDG.push({ x: i * 120 - 60 * Math.sign(i) + (k - 0.5) * 50, y: j * 120 - 60 * Math.sign(j) + (hash(i, j, k) - 0.5) * 40, w: 40 + 30 * hash(i, j, k, 2), d: 40 + 30 * hash(i, j, k, 3), h: 30 + 180 * Math.pow(hash(i, j, k, 4), 2) });
}

export default class Sensors extends Feed {
  build() {
    this.take('Now flip the sensor', ['flip', 'sensor.', 'Night', 'vision.', 'Thermal.', 'old', 'CRT', 'screen.']);
    this.take('And your browser looks', ['browser', 'looks', 'surveillance', 'feed', 'spy', 'movie.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, 0, 1.2); K.key(s + 0.45, 0, 0, 1.0, 0, ease.outExpo); K.key(e, 0, 0, 1.1, 0, ease.inOutQuad);
  }
  override mode(t: number): Mode {
    if (t >= this.s('crt') - 0.05) return 'crt';
    if (t >= this.s('thermal') - 0.05) return 'flir';
    if (t >= this.s('night') - 0.05) return 'nvg';
    return 'eo';
  }
  override staticAt(t: number) {
    const base = super.staticAt(t);
    const hits = ['night', 'thermal', 'crt'].map((k) => { const d = t - this.s(k) + 0.05; return d >= 0 && d < 0.14 ? 1 - d / 0.14 : 0; });
    return Math.max(base, ...hits);
  }
  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const m = this.mode(t), P = PALS[m];
    const heat = m === 'flir';
    const objs: Obj[] = [
      { mesh: box(900, 900, 2, { at: [0, 0, -2], col: heat ? '#1A0626' : m === 'nvg' ? '#06200A' : m === 'crt' ? '#150D00' : '#0A121C' }), edge: P.grat },
      ...BLDG.map((b, i) => ({ mesh: box(b.w, b.d, b.h, { at: [b.x, b.y, 0], col: heat ? (i % 5 === 0 ? '#FFB347' : '#3A1250') : m === 'nvg' ? '#123A16' : m === 'crt' ? '#2A1A00' : '#1A2633' }), edge: heat && i % 5 === 0 ? '#FFF2C0' : P.rim } as Obj)),
    ];
    const view = { yaw: 0.6 + (t - this.ctx.start) * 0.06, pitch: 0.75, dist: 2600, s: 1.1, target: [0, 0, 40] as [number, number, number] };
    const Pj = drawParts(ctx, c, 0, 40, view, objs, { shadow: 0, edgeW: 1.2 });
    // cars on the avenues
    for (let k = 0; k < 14; k++) {
      const along = ((t * 40 + k * 97) % 860) - 430, lane = (k % 2 ? 1 : -1) * 14;
      const p = k % 3 ? project(Pj, [along, lane, 4]) : project(Pj, [lane, along, 4]);
      setWorld(ctx, c, p[0], 40 + p[1], 1, 0);
      ctx.fillStyle = heat ? '#FFFFFF' : P.plane; ctx.fillRect(-4, -3, 8, 6);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    (this as unknown as { pj: typeof Pj }).pj = Pj;
  }
  override hudInfo(t: number) { return { trk: t > this.s('surveillance') ? 'TRACKING 3 VEHICLES' : 'TARGET AREA · CITY BLOCK', alt: 'ALT 1,200 M', loc: 'SCENE · ILLUSTRATION' }; }
  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const P = this.pal(t);
    const lab = ([['night', 'NIGHT VISION'], ['thermal', 'THERMAL'], ['crt', 'CRT']] as [string, string][]).filter(([k]) => t >= this.s(k) - 0.05).pop();
    if (lab && t < this.s('browser') - 0.1) mono(ctx, c, lab[1], 0, -330, { align: 'center', size: 64, bold: true, col: P.accent, a: clamp((t - this.s(lab[0]) + 0.05) / 0.15) });
    const sk = clamp((t - this.s('surveillance') + 0.1) / 0.3);
    if (sk > 0) {
      const pj = (this as unknown as { pj?: Parameters<typeof project>[0] }).pj;
      if (pj) [0, 3, 6].forEach((k, i) => {
        const along = ((t * 40 + k * 97) % 860) - 430, lane = (k % 2 ? 1 : -1) * 14;
        const p = k % 3 ? project(pj, [along, lane, 4]) : project(pj, [lane, along, 4]);
        target(ctx, c, p[0], 40 + p[1], 22, P.accent, clamp(sk * 2 - i * 0.3), `TGT 0${i + 1}`);
      });
      const lines = ['> ACQUIRE', '> LOCK  TGT 01  TGT 02  TGT 03', '> RANGE 1.2 KM  ·  BRG 047°'];
      setWorld(ctx, c, -840, 230, 1, 0); ctx.font = font(MONO, 20); ctx.fillStyle = P.accent;
      lines.forEach((s, i) => ctx.fillText(s.slice(0, Math.floor(clamp((t - this.s('feed') - i * 0.3) * 40, 0, s.length))), 0, i * 30));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  override pfx(t: number) { return { zoom: this.punch(t, this.s('night'), 0.02) * this.punch(t, this.s('thermal'), 0.02) * this.punch(t, this.s('crt'), 0.02) }; }
}
