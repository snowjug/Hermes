// The God's Eye View video's look (theme `sat`): the whole video is a spy-satellite sensor feed. A night globe whose
// lights are the world's cities, with live-looking layers drawn on it (flights on great circles, ships on sea lanes,
// satellites on inclined orbits, quakes, fires, weather, camera pins); a thin HUD (corner brackets, a UTC clock, a
// sensor label, track counts, a crosshair); and four sensor modes that recolour everything: EO (clear), NVG (green
// phosphor in a tube), FLIR (ironbow heat) and CRT (amber scanlines). Titles decode from random glyphs; scenes hand
// over with a burst of sensor static. Captions sit on a HUD bar, the spoken word in the mode's accent. All globe
// layers are illustrations of what the project shows, not its live data.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';
import { CITIES, LANES, QUAKES, FIRES, CAMS, type City } from '@ep/geo';

export { clamp, ease, hash, lerp, TAU };
export const SANS = F.archivo(100, 700);
export const SANSB = F.archivo(100, 900);
export const WIDE = F.archivo(125, 900);
export const MONO = F.mono(500);
export const MONOB = F.mono(700);
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));

export type Mode = 'eo' | 'nvg' | 'flir' | 'crt';
export interface Pal { bg: [number, number, number]; grat: string; land: string; glow: [number, number, number]; plane: string; mil: string; sat: string; ship: string; quake: string; fire: string; cam: string; accent: string; text: string; dim: string; disc: string; rim: string }
export const PALS: Record<Mode, Pal> = {
  eo: { bg: [0.012, 0.024, 0.045], grat: 'rgba(110,190,255,0.16)', land: '#FFD68A', glow: [255, 196, 110], plane: '#FFF1C4', mil: '#FF5A4A', sat: '#7FE3FF', ship: '#5CFFC0', quake: '#FF6A4A', fire: '#FF8A2A', cam: '#4DE1FF', accent: '#3BE8FF', text: '#E6F6FF', dim: 'rgba(230,246,255,0.45)', disc: '#06111F', rim: 'rgba(80,170,255,0.55)' },
  nvg: { bg: [0.01, 0.05, 0.015], grat: 'rgba(140,255,140,0.18)', land: '#D8FFC0', glow: [170, 255, 150], plane: '#F0FFE8', mil: '#FFFFFF', sat: '#B8FF9A', ship: '#9CFF8C', quake: '#E8FFB0', fire: '#F4FFD8', cam: '#C6FF7A', accent: '#B4FF6E', text: '#DAFFD0', dim: 'rgba(218,255,208,0.45)', disc: '#041A08', rim: 'rgba(150,255,120,0.5)' },
  flir: { bg: [0.035, 0.012, 0.06], grat: 'rgba(255,120,60,0.16)', land: '#FFE680', glow: [255, 170, 60], plane: '#FFFFFF', mil: '#FFFFFF', sat: '#FFB347', ship: '#FF8C42', quake: '#FFFFFF', fire: '#FFFFFF', cam: '#FFD23F', accent: '#FFD23F', text: '#FFEEDD', dim: 'rgba(255,238,221,0.45)', disc: '#1A0626', rim: 'rgba(255,110,60,0.5)' },
  crt: { bg: [0.03, 0.02, 0.0], grat: 'rgba(255,176,0,0.18)', land: '#FFC64A', glow: [255, 176, 40], plane: '#FFE6A0', mil: '#FF6A00', sat: '#FFB000', ship: '#FFB000', quake: '#FF6A00', fire: '#FF8A00', cam: '#FFD27A', accent: '#FFC21A', text: '#FFDDA0', dim: 'rgba(255,221,160,0.45)', disc: '#120B00', rim: 'rgba(255,176,0,0.45)' },
};

const FEED_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
uniform vec3 uBg; uniform float uScan; uniform float uTube; uniform float uNoise; uniform float uStatic;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 col = uBg;
  // faint stars
  vec2 g = floor(sp / 3.0);
  float st = step(0.9965, hash12(g + 3.0)) * (0.5 + 0.5 * hash12(g + 9.0));
  col += vec3(st) * 0.35 * (1.0 - uTube * 0.5);
  // sensor noise
  col += (hash12(sp + floor(uTime * 30.0) * 17.0) - 0.5) * uNoise;
  // scanlines
  col *= 1.0 - uScan * 0.35 * (0.5 + 0.5 * sin(sp.y * 3.14159 / 2.0));
  // the night-vision tube
  float r = length((q - 0.5) * vec2(uRes.x / uRes.y, 1.0));
  col *= mix(1.0, smoothstep(0.62, 0.48, r), uTube);
  col *= 1.0 - 0.35 * dot(q - 0.5, q - 0.5);
  // a burst of static at scene changes
  float band = step(0.5, hash12(vec2(floor(sp.y / 6.0), floor(uTime * 40.0))));
  col = mix(col, vec3(hash12(sp * 0.7 + uTime * 91.0)) * 0.55, uStatic * (0.6 + 0.4 * band));
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Feed extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(FEED_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 },
    uBg: { value: [0, 0, 0] }, uScan: { value: 0 }, uTube: { value: 0 }, uNoise: { value: 0.02 }, uStatic: { value: 0 } });
  chunks: Chunk[] = [];
  caps = true;
  /** the sensor mode at t (plates override) */
  mode(_t: number): Mode { return 'eo'; }
  pal(t: number): Pal { return PALS[this.mode(t)]; }
  override init() {
    super.init();
    this.chunks = makeChunks(this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2), this.ctx.end);
  }
  /** static at the cut in and out */
  staticAt(t: number) { return Math.max(1 - clamp((t - this.ctx.start) / 0.16), clamp((t - (this.ctx.end - 0.08)) / 0.08)); }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    const m = this.mode(f.t), u = this.paperPass.u;
    u.uTime!.value = f.t;
    u.uBg!.value = PALS[m].bg;
    u.uScan!.value = m === 'crt' ? 1 : m === 'nvg' ? 0.25 : 0;
    u.uTube!.value = m === 'nvg' ? 1 : 0;
    u.uNoise!.value = m === 'nvg' ? 0.09 : m === 'flir' ? 0.05 : m === 'crt' ? 0.05 : 0.025;
    u.uStatic!.value = this.staticAt(f.t);
    return super.render(f, out);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.stage(ctx, t, c); }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    hud(ctx, t, this.mode(t), this.hudInfo(t));
    if (this.caps) drawChunks(ctx, this.chunks, t, this.pal(t));
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  hudInfo(_t: number): { trk?: string; alt?: string; loc?: string } { return {}; }
  override postFX(t: number) {
    const m = this.mode(t);
    return { bloom: m === 'eo' ? 0.55 : 0.75, bloomThreshold: 0.6, vignette: 0.35, grain: 0.04, halation: 0.2, ca: m === 'crt' ? 1.2 : 0.5, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
  s(k: string, d = 0) { return this.w[k]!.start + d; }
  e(k: string, d = 0) { return this.w[k]!.end + d; }
}

// ------------------------------------------------------------------ the HUD (screen space)
const MODE_LABEL: Record<Mode, string> = { eo: 'EO · DAY/NIGHT', nvg: 'NVG · GEN III', flir: 'FLIR · IRONBOW', crt: 'CRT · PHOSPHOR' };
export function hud(ctx: CanvasRenderingContext2D, t: number, m: Mode, o: { trk?: string; alt?: string; loc?: string }) {
  const P = PALS[m], M = 36, L = 54;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = P.dim; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, M + L); ctx.lineTo(M, M); ctx.lineTo(M + L, M);
  ctx.moveTo(W - M - L, M); ctx.lineTo(W - M, M); ctx.lineTo(W - M, M + L);
  ctx.moveTo(M, H - M - L); ctx.lineTo(M, H - M); ctx.lineTo(M + L, H - M);
  ctx.moveTo(W - M - L, H - M); ctx.lineTo(W - M, H - M); ctx.lineTo(W - M, H - M - L);
  ctx.stroke();
  ctx.font = font(MONOB, 18); ctx.fillStyle = P.text; ctx.textAlign = 'left';
  ctx.fillText(`SENSOR  ${MODE_LABEL[m]}`, M + 22, M + 34);
  ctx.fillStyle = P.dim; ctx.font = font(MONO, 16);
  if (o.trk) ctx.fillText(o.trk, M + 22, M + 60);
  ctx.textAlign = 'right'; ctx.font = font(MONOB, 18); ctx.fillStyle = P.text;
  const secs = 13 * 3600 + 42 * 60 + 7 + t;
  const hh = String(Math.floor(secs / 3600) % 24).padStart(2, '0'), mm = String(Math.floor(secs / 60) % 60).padStart(2, '0'), ss = String(Math.floor(secs) % 60).padStart(2, '0');
  ctx.fillText(`2026-10-11  ${hh}:${mm}:${ss}Z`, W - M - 22, M + 34);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? '#FF3B30' : 'rgba(255,59,48,0.35)'; ctx.beginPath(); ctx.arc(W - M - 22 - measure(`2026-10-11  ${hh}:${mm}:${ss}Z`, MONOB, 18) - 18, M + 28, 6, 0, TAU); ctx.fill();
  ctx.font = font(MONO, 16); ctx.fillStyle = P.dim;
  if (o.alt) ctx.fillText(o.alt, W - M - 22, M + 60);
  ctx.textAlign = 'left';
  if (o.loc) { ctx.fillText(o.loc, M + 22, H - M - 22); }
  ctx.textAlign = 'left';
}

// ------------------------------------------------------------------ captions on a HUD bar
const CAPS = { size: 46, maxW: 1300, y: 418, maxWords: 6 };
const CAPF = F.archivo(100, 800);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size);
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      const texts = cur.map((w) => w.w.toUpperCase());
      const xs: number[] = []; let x = 0;
      texts.forEach((s, i) => { xs.push(x); x += measure(s, CAPF, CAPS.size) + (i < texts.length - 1 ? sp : 0); });
      out.push({ words: cur, texts, xs, width: x, start: cur[0]!.start, end: cur[cur.length - 1]!.end });
      cur = [];
    };
    for (const w of l.words) {
      const trial = [...cur, w].map((x) => x.w.toUpperCase()).join(' ');
      if (cur.length && (cur.length >= CAPS.maxWords || measure(trial, CAPF, CAPS.size) > CAPS.maxW)) flush();
      cur.push(w);
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 2) flush();
    }
    flush();
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.08, c.end + 0.9) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number, P: Pal) {
  const size = CAPS.size;
  for (const ch of chunks) {
    if (t < ch.start - 0.08 || t > ch.end) continue;
    const a = clamp((t - ch.start + 0.08) / 0.08) * clamp((ch.end - t) / 0.07);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x0 - 28, y - size * 0.95, ch.width + 56, size * 1.35);
    ctx.strokeStyle = P.accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0 - 28, y - size * 0.95 + 12); ctx.lineTo(x0 - 28, y - size * 0.95); ctx.lineTo(x0 - 16, y - size * 0.95);
    ctx.moveTo(x0 + ch.width + 28, y + size * 0.4 - 12); ctx.lineTo(x0 + ch.width + 28, y + size * 0.4); ctx.lineTo(x0 + ch.width + 16, y + size * 0.4); ctx.stroke();
    ctx.font = font(CAPF, size); ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      ctx.fillStyle = on ? P.accent : t >= w.start - 0.03 ? P.text : 'rgba(255,255,255,0.35)';
      if (on) { ctx.shadowColor = P.accent; ctx.shadowBlur = 18; }
      ctx.fillText(ch.texts[i]!, x0 + ch.xs[i]!, y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ type
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$/<>=+*';
/** Text that decodes from random glyphs, left to right, between t0 and t0 + dur. World coords, centred. */
export function decode(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { f?: string; col?: string; dur?: number; align?: CanvasTextAlign; glow?: string; a?: number } = {}) {
  if (t < t0) return;
  const dur = o.dur ?? 0.6, n = text.length;
  let s = '';
  for (let i = 0; i < n; i++) {
    const ti = t0 + (dur * i) / n;
    const ch = text[i]!;
    if (ch === ' ' || t >= ti + 0.12) s += ch;
    else if (t >= ti - 0.25) s += GLYPHS[Math.floor(hash(i, Math.floor(t * 30)) * GLYPHS.length)]!;
    else s += ' ';
  }
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(o.f ?? WIDE, size); ctx.fillStyle = o.col ?? '#FFFFFF'; ctx.textAlign = o.align ?? 'center';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; }
  ctx.fillText(s, 0, 0);
  ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export function mono(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, o: { size?: number; col?: string; a?: number; align?: CanvasTextAlign; bold?: boolean } = {}) {
  if ((o.a ?? 1) <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(o.bold ? MONOB : MONO, o.size ?? 20); ctx.fillStyle = o.col ?? '#FFFFFF'; ctx.textAlign = o.align ?? 'left';
  ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A HUD panel: bracketed corners, a title bar, centred at (x, y). */
export function panel(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, P: Pal, a = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 0.96 + 0.04 * ease.outCubic(clamp(a)), 0);
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = P.dim; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = P.accent; ctx.lineWidth = 3; const k = 18;
  ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as [number, number][]) { ctx.moveTo(sx * w / 2, sy * h / 2 - sy * k); ctx.lineTo(sx * w / 2, sy * h / 2); ctx.lineTo(sx * w / 2 - sx * k, sy * h / 2); }
  ctx.stroke();
  ctx.fillStyle = P.accent; ctx.fillRect(-w / 2, -h / 2, w, 34);
  ctx.font = font(MONOB, 18); ctx.fillStyle = '#000'; ctx.fillText(title, -w / 2 + 14, -h / 2 + 23);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A count that races up. */
export const count = (v: number, t: number, t0: number, dur: number) => Math.round(v * ease.outExpo(clamp((t - t0) / dur)));
export const fmt = (n: number) => n.toLocaleString('en-US');

// ------------------------------------------------------------------ the globe
export interface View { lon: number; lat: number }
export interface Layers { lights?: number; grat?: number; flights?: number; mil?: number; ships?: number; sats?: number; orbits?: number; quakes?: number; fires?: number; weather?: number; cams?: number; fade?: number }
const D = Math.PI / 180;
/** Orthographic projection of (lat, lon, r) for view v: [x, y, depth] with y down; depth > 0 faces the camera. */
export function proj(v: View, lat: number, lon: number, r = 1): [number, number, number] {
  const p = lat * D, l = (lon - v.lon) * D, p0 = v.lat * D;
  const x = Math.cos(p) * Math.sin(l);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
  const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return [x * r, -y * r, z * r];
}
const toXYZ = (lat: number, lon: number): [number, number, number] => [Math.cos(lat * D) * Math.cos(lon * D), Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D)];
const toLL = (p: [number, number, number]): [number, number] => { const r = Math.hypot(p[0], p[1], p[2]); return [Math.asin(p[2] / r) / D, Math.atan2(p[1], p[0]) / D]; };
function slerp(a: [number, number, number], b: [number, number, number], u: number): [number, number, number] {
  const d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), s = Math.sin(d) || 1e-6;
  const ka = Math.sin((1 - u) * d) / s, kb = Math.sin(u * d) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}
// towns: lights scattered round every city
const TOWNS: City[] = [];
CITIES.forEach(([la, lo, w], i) => {
  TOWNS.push([la, lo, w]);
  const n = 4 + w * 4;
  for (let k = 0; k < n; k++) {
    const r = Math.pow(hash(i, k, 1), 1.6) * (1.2 + w * 0.5), a = hash(i, k, 2) * TAU;
    TOWNS.push([la + Math.sin(a) * r * 0.8, lo + (Math.cos(a) * r) / Math.max(0.3, Math.cos(la * D)), 0.4 + hash(i, k, 3) * 1.2]);
  }
});
// flights: routes between cities, weighted to the big ones
interface Route { a: [number, number, number]; b: [number, number, number]; ph: number; sp: number; mil: boolean }
const BIG = CITIES.filter((c) => c[2] >= 5);
const ROUTES: Route[] = Array.from({ length: 1500 }, (_, i) => {
  const A = BIG[Math.floor(hash(i, 11) * BIG.length)]!, pool = hash(i, 12) < 0.55 ? CITIES : BIG;
  let B = pool[Math.floor(hash(i, 13) * pool.length)]!;
  if (B === A) B = CITIES[(CITIES.indexOf(A) + 7) % CITIES.length]!;
  return { a: toXYZ(A[0], A[1]), b: toXYZ(B[0], B[1]), ph: hash(i, 14), sp: 0.02 + 0.03 * hash(i, 15), mil: i % 70 === 3 };
});
// satellites: orbits (inclination, ascending node, radius, speed)
interface Orbit { inc: number; raan: number; r: number; sp: number; ph: number }
const ORBITS: Orbit[] = Array.from({ length: 140 }, (_, i) => {
  const geo = i % 23 === 0;
  return { inc: geo ? 0 : [53, 97.6, 70, 43, 86.4, 28.5][i % 6]! * D + (hash(i, 21) - 0.5) * 0.2, raan: hash(i, 22) * TAU, r: geo ? 1.9 : 1.06 + 0.16 * hash(i, 23), sp: geo ? 0.02 : 0.12 + 0.1 * hash(i, 24), ph: hash(i, 25) * TAU };
});
function orbitPoint(o: Orbit, th: number): [number, number, number] {
  const x = Math.cos(th), y = Math.sin(th) * Math.cos(o.inc), z = Math.sin(th) * Math.sin(o.inc);
  const cr = Math.cos(o.raan), sr = Math.sin(o.raan);
  return [(x * cr - y * sr) * o.r, (x * sr + y * cr) * o.r, z * o.r];
}
// ships along the lanes
interface Ship { lane: number; ph: number; sp: number }
const SHIPS: Ship[] = Array.from({ length: 260 }, (_, i) => ({ lane: i % LANES.length, ph: hash(i, 31), sp: 0.004 + 0.006 * hash(i, 32) }));
function lanePoint(lane: [number, number][], u: number): [number, number, number] {
  const n = lane.length - 1, f = clamp(u) * n, k = Math.min(n - 1, Math.floor(f));
  return slerp(toXYZ(lane[k]![0], lane[k]![1]), toXYZ(lane[k + 1]![0], lane[k + 1]![1]), f - k);
}

/** Draw the globe centred at world (cx, cy) with radius R, seen from v, with the given layers (each 0..1). */
export function globe(ctx: CanvasRenderingContext2D, c: Cam, cx: number, cy: number, R: number, v: View, t: number, Ly: Layers, P: Pal) {
  const F = Ly.fade ?? 1;
  if (F <= 0.003) return;
  setWorld(ctx, c, cx, cy, 1, 0);
  ctx.globalAlpha = F;
  // atmosphere and disc
  const atm = ctx.createRadialGradient(0, 0, R * 0.96, 0, 0, R * 1.18);
  atm.addColorStop(0, P.rim); atm.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(0, 0, R * 1.18, 0, TAU); ctx.fill();
  const dg = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R);
  dg.addColorStop(0, P.disc); dg.addColorStop(1, '#000000');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  const P3 = (lat: number, lon: number, r = 1) => { const p = proj(v, lat, lon, r); return [p[0] * R, p[1] * R, p[2]] as [number, number, number]; };
  const PX = (q: [number, number, number]) => { const [la, lo] = toLL(q); const r = Math.hypot(q[0], q[1], q[2]); return P3(la, lo, r); };
  // graticule
  if ((Ly.grat ?? 1) > 0) {
    ctx.strokeStyle = P.grat; ctx.lineWidth = 1.2; ctx.globalAlpha = F * (Ly.grat ?? 1);
    ctx.beginPath();
    for (let lo = -180; lo < 180; lo += 15) { let pen = false; for (let la = -90; la <= 90; la += 3) { const q = P3(la, lo); if (q[2] > 0) { if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); pen = true; } else pen = false; } }
    for (let la = -75; la <= 75; la += 15) { let pen = false; for (let lo = -180; lo <= 180; lo += 3) { const q = P3(la, lo); if (q[2] > 0) { if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); pen = true; } else pen = false; } }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  // city lights
  const li = Ly.lights ?? 1;
  if (li > 0) {
    const [r0, g0, b0] = P.glow;
    for (const [la, lo, w] of TOWNS) {
      const q = P3(la, lo);
      if (q[2] <= 0.02) continue;
      const a = F * li * Math.min(1, q[2] * 2.5) * Math.min(1, 0.5 + 0.11 * w);
      ctx.fillStyle = `rgba(${r0},${g0},${b0},${a})`;
      const s = (1.1 + w * 0.6) * (R / 420);
      ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
    }
  }
  // flights
  const fl = Ly.flights ?? 0, mi = Ly.mil ?? 0;
  if (fl > 0 || mi > 0) {
    const n = ROUTES.length;
    for (let i = 0; i < n; i++) {
      const rt = ROUTES[i]!;
      const on = rt.mil ? mi : clamp(fl * 1.2 - (i / n) * 0.2);
      if (on <= 0 || (!rt.mil && i / n > fl)) continue;
      const u = (t * rt.sp + rt.ph) % 1;
      const p = slerp(rt.a, rt.b, u), pb = slerp(rt.a, rt.b, Math.max(0, u - 0.04));
      const lift = 1 + 0.012 * Math.sin(u * Math.PI);
      const q = PX([p[0] * lift, p[1] * lift, p[2] * lift]), qb = PX([pb[0] * lift, pb[1] * lift, pb[2] * lift]);
      if (q[2] <= 0) continue;
      ctx.globalAlpha = F * on * Math.min(1, q[2] * 3);
      ctx.strokeStyle = rt.mil ? P.mil : P.plane; ctx.lineWidth = rt.mil ? 2.2 : 1;
      ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.moveTo(qb[0], qb[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.globalAlpha /= 0.5;
      ctx.fillStyle = rt.mil ? P.mil : P.plane;
      const s = rt.mil ? 5.5 : 3.0 * (R / 420);
      ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
    }
  }
  // ships
  const sh = Ly.ships ?? 0;
  if (sh > 0) {
    ctx.fillStyle = P.ship;
    SHIPS.forEach((s, i) => {
      if (i / SHIPS.length > sh) return;
      const u = (s.ph + t * s.sp) % 1, p = lanePoint(LANES[s.lane]!, u), q = PX(p);
      if (q[2] <= 0) return;
      ctx.globalAlpha = F * Math.min(1, q[2] * 3);
      const k = 3.2 * (R / 420);
      ctx.beginPath(); ctx.moveTo(q[0], q[1] - k); ctx.lineTo(q[0] + k, q[1]); ctx.lineTo(q[0], q[1] + k); ctx.lineTo(q[0] - k, q[1]); ctx.closePath(); ctx.fill();
    });
  }
  // quakes
  const qk = Ly.quakes ?? 0;
  if (qk > 0) {
    QUAKES.forEach(([la, lo, m], i) => {
      const q = P3(la, lo);
      if (q[2] <= 0) return;
      const ph = (t * 0.6 + hash(i, 41)) % 1;
      ctx.strokeStyle = P.quake; ctx.lineWidth = 2;
      ctx.globalAlpha = F * qk * (1 - ph) * Math.min(1, q[2] * 3);
      ctx.beginPath(); ctx.arc(q[0], q[1], (6 + ph * 10 * m) * (R / 420), 0, TAU); ctx.stroke();
      ctx.globalAlpha = F * qk; ctx.fillStyle = P.quake; ctx.beginPath(); ctx.arc(q[0], q[1], 3 * (R / 420), 0, TAU); ctx.fill();
    });
  }
  // fires
  const fi = Ly.fires ?? 0;
  if (fi > 0) {
    ctx.fillStyle = P.fire;
    FIRES.forEach(([la, lo, spr], i) => {
      for (let k = 0; k < 40; k++) {
        const q = P3(la + (hash(i, k, 51) - 0.5) * spr, lo + (hash(i, k, 52) - 0.5) * spr * 1.4);
        if (q[2] <= 0) continue;
        ctx.globalAlpha = F * fi * (0.5 + 0.5 * Math.sin(t * 9 + k)) * Math.min(1, q[2] * 3);
        const s = 2.6 * (R / 420); ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
      }
    });
  }
  // weather: rain cells, a cyclone, lightning
  const we = Ly.weather ?? 0;
  if (we > 0) {
    const cells: City[] = [[8, -30, 9], [50, -25, 10], [15, 90, 8], [-5, 120, 9], [40, 170, 11], [-45, 60, 10], [30, -80, 7]];
    cells.forEach(([la, lo, rad], i) => {
      for (let k = 0; k < 26; k++) {
        const a = hash(i, k, 61) * TAU, rr = Math.sqrt(hash(i, k, 62)) * rad;
        const q = P3(la + Math.sin(a) * rr * 0.6, lo + Math.cos(a) * rr + t * 2);
        if (q[2] <= 0) continue;
        ctx.globalAlpha = F * we * 0.16 * Math.min(1, q[2] * 3);
        ctx.fillStyle = P.sat; ctx.beginPath(); ctx.arc(q[0], q[1], (5 + 6 * hash(i, k, 63)) * (R / 420), 0, TAU); ctx.fill();
      }
      if (Math.floor(t * 7 + i * 3) % 9 === 0) { const q = P3(la, lo + t * 2); if (q[2] > 0) { ctx.globalAlpha = F * we; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(q[0], q[1], 5 * (R / 420), 0, TAU); ctx.fill(); } }
    });
    // the cyclone
    ctx.strokeStyle = P.sat; ctx.lineWidth = 2.2;
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath(); let pen = false;
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, ang = arm * TAU / 3 - u * 4.5 - t * 1.2, rr = u * 7;
        const q = P3(18 + Math.sin(ang) * rr, 135 + Math.cos(ang) * rr);
        if (q[2] > 0) { ctx.globalAlpha = F * we * 0.6 * (1 - u * 0.6); if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); pen = true; } else pen = false;
      }
      ctx.stroke();
    }
  }
  // camera pins
  const cm = Ly.cams ?? 0;
  if (cm > 0) {
    ctx.fillStyle = P.cam;
    CAMS.forEach(([la, lo, w], i) => {
      for (let k = 0; k < w * 7; k++) {
        if (hash(i, k, 71) > cm) continue;
        const q = P3(la + (hash(i, k, 72) - 0.5) * 2.2, lo + (hash(i, k, 73) - 0.5) * 3);
        if (q[2] <= 0) continue;
        ctx.globalAlpha = F * Math.min(1, q[2] * 3);
        const s = 3.4 * (R / 420); ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
      }
    });
  }
  // satellites and their orbits
  const sa = Ly.sats ?? 0, orb = Ly.orbits ?? 0;
  if (sa > 0 || orb > 0) {
    ORBITS.forEach((o, i) => {
      if (i / ORBITS.length > Math.max(sa, orb)) return;
      if (orb > 0 && i % 4 === 0) {
        ctx.strokeStyle = P.sat; ctx.lineWidth = 1;
        let prev: [number, number, number] | null = null;
        for (let k = 0; k <= 72; k++) {
          const q = PX(orbitPoint(o, (k / 72) * TAU));
          const hidden = q[2] < 0 && Math.hypot(q[0], q[1]) < R;
          if (prev && !hidden) { ctx.globalAlpha = F * orb * (q[2] > 0 ? 0.35 : 0.12); ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
          prev = hidden ? null : q;
        }
      }
      if (sa > 0) {
        for (let j = 0; j < 3; j++) {
          const q = PX(orbitPoint(o, o.ph + j * 2.1 + t * o.sp));
          if (q[2] < 0 && Math.hypot(q[0], q[1]) < R) continue;
          ctx.globalAlpha = F * sa; ctx.fillStyle = P.sat;
          const s = 3 * (R / 420); ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
        }
      }
    });
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Where (lat, lon) lands on the globe at (cx, cy, R) seen from v; z > 0 means visible. */
export function globeAt(cx: number, cy: number, R: number, v: View, lat: number, lon: number): [number, number, number] {
  const p = proj(v, lat, lon); return [cx + p[0] * R, cy + p[1] * R, p[2]];
}

// ------------------------------------------------------------------ a public traffic camera, as an illustration
/** A CCTV tile (w x h) centred at (x, y): a noisy road scene with moving cars, a label and a timestamp. */
export function cctv(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, seed: number, t: number, label: string, P: Pal, a = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.save(); ctx.globalAlpha = a;
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#1b1f22'); g.addColorStop(1, '#2c3033');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  // the road in perspective
  const vx = (hash(seed, 1) - 0.5) * w * 0.4, vy = -h * 0.28;
  ctx.fillStyle = '#3a3f43'; ctx.beginPath(); ctx.moveTo(vx - 8, vy); ctx.lineTo(vx + 8, vy); ctx.lineTo(w * 0.55, h / 2); ctx.lineTo(-w * 0.55, h / 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -t * 60;
  ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(0, h / 2); ctx.stroke(); ctx.setLineDash([]);
  // cars
  for (let k = 0; k < 5; k++) {
    const u = (t * (0.12 + 0.1 * hash(seed, k, 2)) + hash(seed, k, 3)) % 1, side = k % 2 ? 1 : -1;
    const px = lerp(vx, side * w * 0.25, u), py = lerp(vy, h / 2 + 10, u), s = 4 + u * 30;
    ctx.fillStyle = ['#c8c8c8', '#8a2b2b', '#2b4a8a', '#e0e0d0', '#444'][k]!; ctx.fillRect(px - s, py - s * 0.6, s * 2, s * 1.2);
    ctx.fillStyle = side > 0 ? 'rgba(255,60,40,0.9)' : 'rgba(255,250,220,0.9)'; ctx.fillRect(px - s * 0.9, py - s * 0.2, s * 0.3, s * 0.2); ctx.fillRect(px + s * 0.6, py - s * 0.2, s * 0.3, s * 0.2);
  }
  // noise and scanlines
  for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(255,255,255,${0.05 * hash(seed, k, Math.floor(t * 20))})`; ctx.fillRect(-w / 2 + hash(seed, k, 5) * w, -h / 2 + hash(seed, k, 6, Math.floor(t * 20)) * h, 3, 1); }
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let yy = -h / 2; yy < h / 2; yy += 4) ctx.fillRect(-w / 2, yy, w, 1);
  ctx.restore();
  ctx.globalAlpha = a; ctx.strokeStyle = P.dim; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.font = font(MONOB, 13); ctx.fillStyle = '#FFFFFF'; ctx.fillText(label, -w / 2 + 8, -h / 2 + 18);
  ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(w / 2 - 14, -h / 2 + 13, 4, 0, TAU); ctx.fill();
  ctx.font = font(MONO, 12); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(`13:${String(42 + Math.floor(t / 60) % 10).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}`, -w / 2 + 8, h / 2 - 8);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Targeting brackets round (x, y). */
export function target(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s: number, col: string, k = 1, label?: string) {
  if (k <= 0) return;
  const kk = ease.outCubic(clamp(k)), r = s * (1.6 - 0.6 * kk);
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = clamp(k * 2); ctx.strokeStyle = col; ctx.lineWidth = 2.5; const L = r * 0.4;
  ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as [number, number][]) { ctx.moveTo(sx * r, sy * r - sy * L); ctx.lineTo(sx * r, sy * r); ctx.lineTo(sx * r - sx * L, sy * r); }
  ctx.stroke();
  if (label) { ctx.font = font(MONOB, 15); ctx.fillStyle = col; ctx.fillText(label, r + 8, -r + 12); }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
