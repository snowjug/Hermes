// The ArtCraft video's look (theme `cinema`): the video is seen through a director's monitor on a film set.
// A dark stage with haze and a key light from above; a viewfinder overlay (REC, timecode, lens, frame brackets)
// and letterbox bars that close in for the cinematic beats; scenes change behind a clapperboard that rises and
// claps. The 3D staging is grey-box: wooden mannequins, a camera on a tripod, a room (app/src/scenes/_cad3d.ts).
// The "generated" shots are painted from that same blocking: the figures as rim-lit silhouettes where they were
// posed. Captions are serif subtitles, the spoken word in tungsten amber.
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';
import { box, cameraRig, extrude, join, mannequin, project, rect, xform, xpt, type Face, type Pose, type Proj, type V3, type Xf } from '@kit/_cad3d';

export { clamp, ease, hash, lerp, springStep, TAU };
export const AMBER = '#F5B342';
export const REC = '#FF3B30';
export const IVORY = '#F1ECE2';
export const SMOKE = '#9A9AA2';
export const TEAL = '#3E8E9A';
export const WOOD = '#C9A27A';
export const SERIF = F.serif(600);
export const SERIFI = F.serif(400, true);
export const HEAD = F.archivo(75, 800);
export const BODY = F.archivo(100, 600);
export const MONO = F.mono(500);
export const MONOB = F.mono(700);
/** outBack that is exactly 0 at 0 */
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));

const STAGE_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 q = sp / uRes;
  vec3 col = vec3(0.035, 0.035, 0.042);
  // the key light from above, a soft cone with haze in it
  float cone = smoothstep(0.55, 0.0, abs(q.x - 0.5 - 0.04 * sin(uTime * 0.2)) - q.y * 0.32) * smoothstep(1.15, 0.1, q.y);
  float haze = vn(sp * 0.004 + vec2(uTime * 0.03, uTime * 0.01)) * 0.6 + vn(sp * 0.011 - uTime * 0.02) * 0.4;
  col += vec3(1.0, 0.86, 0.66) * 0.10 * cone * (0.6 + 0.6 * haze);
  // a warm pool on the floor
  col += vec3(0.95, 0.62, 0.3) * 0.07 * smoothstep(0.45, 0.0, length((q - vec2(0.5, 0.86)) * vec2(0.9, 3.0)));
  col *= 1.0 - 0.55 * dot(q - 0.5, q - 0.5);
  col += (h21(sp + floor(uTime * 24.0)) - 0.5) * 0.03;
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Cinema extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(STAGE_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
  /** scene number on the slate and in the viewfinder */
  scene = 0;
  /** clapperboards: rise at the end of this plate / clap away at its start */
  slateIn = false;
  slateOut = false;
  hud = true;
  override init() {
    super.init();
    this.chunks = makeChunks(this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2), this.ctx.end);
  }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    this.paperPass.u.uTime!.value = f.t;
    return super.render(f, out);
  }
  /** 0..1 letterbox closing in (2.39:1) */
  letterbox(_t: number) { return 0; }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.stage(ctx, t, c); }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const lb = ease.inOutCubic(clamp(this.letterbox(t)));
    if (lb > 0) { const bh = ((H - W / 2.39) / 2) * lb; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
    if (this.hud) viewfinder(ctx, t, this.scene, clamp((t - this.ctx.start - 0.1) / 0.3));
    drawChunks(ctx, this.chunks, t);
    // the clapperboard
    if (this.slateIn) { const k = clamp((t - this.ctx.start) / 0.55); if (k < 1) slate(ctx, this.scene, 'in', k); }
    if (this.slateOut) { const k = clamp((t - (this.ctx.end - 0.32)) / 0.32); if (k > 0) slate(ctx, this.scene + 1, 'out', k); }
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.5, bloomThreshold: 0.7, vignette: 0.42, grain: 0.05, halation: 0.18, ca: 0.45, paper: 0, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.015) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
}

// ------------------------------------------------------------------ the monitor
function viewfinder(ctx: CanvasRenderingContext2D, t: number, scene: number, a: number) {
  if (a <= 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a * 0.85;
  ctx.strokeStyle = 'rgba(241,236,226,0.75)'; ctx.lineWidth = 2.5;
  const m = 70, L = 46;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(W / 2 - 14, H / 2); ctx.lineTo(W / 2 + 14, H / 2); ctx.moveTo(W / 2, H / 2 - 14); ctx.lineTo(W / 2, H / 2 + 14); ctx.globalAlpha = a * 0.35; ctx.stroke();
  ctx.globalAlpha = a * 0.9;
  ctx.font = font(MONOB, 22); ctx.textBaseline = 'alphabetic';
  if (Math.floor(t * 1.6) % 2 === 0) { ctx.fillStyle = REC; ctx.beginPath(); ctx.arc(m + 22, m + 34, 9, 0, TAU); ctx.fill(); }
  ctx.fillStyle = IVORY; ctx.fillText('REC', m + 40, m + 42);
  const fr = Math.floor(t * 24) % 24, s = Math.floor(t) % 60, mi = Math.floor(t / 60);
  ctx.fillText(`00:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, m + 104, m + 42);
  ctx.textAlign = 'center';
  if (scene) ctx.fillText(`SC ${String(scene).padStart(2, '0')} · TK 1`, W / 2, m + 42);
  ctx.textAlign = 'right';
  ctx.fillText('A-CAM  35mm  T2.8  ISO 800', W - m - 10, m + 42);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}

/** The clapperboard. 'out': it rises over the end of a plate; 'in': it claps and leaves at the start of the next. */
function slate(ctx: CanvasRenderingContext2D, scene: number, dir: 'in' | 'out', k: number) {
  const bw = 860, bh = 520;
  let y: number, clap: number;
  if (dir === 'out') { y = lerp(H + bh / 2 + 120, H / 2 + 40, ease.outCubic(k)); clap = 0.5; }
  else { clap = k < 0.25 ? lerp(0.5, 0, ease.inQuad(k / 0.25)) : 0; y = H / 2 + 40 - ease.inCubic(clamp((k - 0.35) / 0.65)) * (H / 2 + bh + 200); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, W / 2, y); ctx.rotate(-0.04);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50;
  ctx.fillStyle = '#18181B'; ctx.fillRect(-bw / 2, -bh / 2 + 80, bw, bh - 80);
  ctx.shadowBlur = 0;
  // the board
  ctx.strokeStyle = 'rgba(241,236,226,0.85)'; ctx.lineWidth = 3;
  ctx.strokeRect(-bw / 2 + 24, -bh / 2 + 104, bw - 48, bh - 128);
  ctx.beginPath(); ctx.moveTo(-bw / 2 + 24, -bh / 2 + 250); ctx.lineTo(bw / 2 - 24, -bh / 2 + 250); ctx.moveTo(0, -bh / 2 + 250); ctx.lineTo(0, bh / 2 - 24); ctx.stroke();
  ctx.fillStyle = IVORY; ctx.font = font(SERIF, 96); ctx.textAlign = 'center'; ctx.fillText('ArtCraft', 0, -bh / 2 + 210);
  ctx.font = font(MONOB, 24); ctx.fillStyle = SMOKE; ctx.fillText('SCENE', -bw / 4, -bh / 2 + 290); ctx.fillText('TAKE', bw / 4, -bh / 2 + 290);
  ctx.font = font(HEAD, 110); ctx.fillStyle = IVORY; ctx.fillText(String(scene), -bw / 4, -bh / 2 + 410); ctx.fillText('1', bw / 4, -bh / 2 + 410);
  // the clapper sticks
  const stripes = (yy: number) => { for (let i = -8; i < 9; i++) { ctx.fillStyle = i % 2 ? '#F1ECE2' : '#18181B'; ctx.beginPath(); ctx.moveTo(i * 54, yy); ctx.lineTo(i * 54 + 54, yy); ctx.lineTo(i * 54 + 30, yy + 64); ctx.lineTo(i * 54 - 24, yy + 64); ctx.closePath(); ctx.fill(); } };
  ctx.save(); ctx.beginPath(); ctx.rect(-bw / 2, -bh / 2 + 16, bw, 64); ctx.clip(); stripes(-bh / 2 + 16); ctx.restore();
  ctx.save(); ctx.translate(-bw / 2, -bh / 2 + 10); ctx.rotate(-clap * 0.6);
  ctx.beginPath(); ctx.rect(0, -66, bw, 64); ctx.clip(); ctx.translate(bw / 2, 0); stripes(-66);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.restore();
}

// ------------------------------------------------------------------ captions: serif subtitles
const CAPS = { size: 60, maxW: 1500, y: 432, maxWords: 7 };
const CAPF = F.serif(600);
function makeChunks(lines: Line[], plateEnd: number): Chunk[] {
  const out: Chunk[] = [];
  const sp = measure(' ', CAPF, CAPS.size);
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      const texts = cur.map((w) => w.w);
      const xs: number[] = []; let x = 0;
      texts.forEach((s, i) => { xs.push(x); x += measure(s, CAPF, CAPS.size) + (i < texts.length - 1 ? sp : 0); });
      out.push({ words: cur, texts, xs, width: x, start: cur[0]!.start, end: cur[cur.length - 1]!.end });
      cur = [];
    };
    for (const w of l.words) {
      const trial = [...cur, w].map((x) => x.w).join(' ');
      if (cur.length && (cur.length >= CAPS.maxWords || measure(trial, CAPF, CAPS.size) > CAPS.maxW)) flush();
      cur.push(w);
      if (/[.,:;?!]$/.test(w.w) && cur.length >= 3) flush();
    }
    flush();
  }
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.1, c.end + 1.0) : Math.min(plateEnd + 0.05, c.end + 1.0); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const ch of chunks) {
    if (t < ch.start - 0.1 || t > ch.end) continue;
    const a = clamp((t - ch.start + 0.1) / 0.14) * clamp((ch.end - t) / 0.08);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.font = font(CAPF, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      const x = x0 + ch.xs[i]!;
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const said = t >= w.start - 0.03;
      ctx.globalAlpha = a;
      ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
      ctx.fillStyle = on ? AMBER : said ? IVORY : 'rgba(241,236,226,0.5)';
      if (on) { ctx.shadowColor = 'rgba(245,179,66,0.65)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 0; }
      ctx.fillText(ch.texts[i]!, x, y);
    });
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ type and panels (world coords of the plate camera)
/** A serif title, centred, rising through a soft blur. */
export function title(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { col?: string; f?: string; a?: number; align?: CanvasTextAlign; glow?: string } = {}) {
  const k = ease.outCubic(clamp((t - t0) / 0.6));
  if (k <= 0) return;
  setWorld(ctx, c, x, y + (1 - k) * 20, 1, 0);
  ctx.globalAlpha = (o.a ?? 1) * k;
  ctx.font = font(o.f ?? SERIF, size); ctx.textAlign = o.align ?? 'center';
  ctx.shadowColor = o.glow ?? 'rgba(0,0,0,0.7)'; ctx.shadowBlur = o.glow ? 40 : 20;
  ctx.fillStyle = o.col ?? IVORY; ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Gaffer tape with a marker label, centred at (x, y). */
export function tape(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, o: { a?: number; rot?: number; col?: string; ink?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const tw = measure(text, HEAD, size);
  setWorld(ctx, c, x, y, 0.9 + 0.1 * ob(clamp(a * 1.3)), o.rot ?? -0.03);
  ctx.globalAlpha = a;
  ctx.fillStyle = o.col ?? '#E9E2D0';
  ctx.beginPath(); ctx.moveTo(-tw / 2 - 26, -size * 0.75); ctx.lineTo(tw / 2 + 24, -size * 0.8); ctx.lineTo(tw / 2 + 30, size * 0.72); ctx.lineTo(-tw / 2 - 22, size * 0.78); ctx.closePath(); ctx.fill();
  ctx.fillStyle = o.ink ?? '#141416'; ctx.font = font(HEAD, size); ctx.textAlign = 'center'; ctx.fillText(text, 0, size * 0.36);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export function mono(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, o: { a?: number; size?: number; col?: string; align?: CanvasTextAlign } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a; ctx.font = font(MONOB, o.size ?? 24); ctx.fillStyle = o.col ?? SMOKE; ctx.textAlign = o.align ?? 'left';
  ctx.fillText(text, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A dark app window, top-left at (x, y). */
export function panel(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, head: string, o: { a?: number; accent?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = 'rgba(22,22,26,0.96)'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 14); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(241,236,226,0.16)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = o.accent ?? AMBER; ctx.fillRect(0, 46, w, 2);
  ctx.fillStyle = SMOKE; ctx.font = font(MONOB, 20); ctx.fillText(head, 20, 31);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ the set
/** A room: floor, a back wall and a left wall with a window. Centred on the origin, 500 x 400, 260 high. */
export function room(o: { col?: string; floor?: string } = {}): Face[] {
  const wall = o.col ?? '#5C5A5E', floor = o.floor ?? '#3C3B40';
  return join(
    box(520, 420, 4, { at: [0, 0, -4], col: floor }),
    box(520, 10, 260, { at: [0, 205, 0], col: wall }),
    extrude(rect(410, 260, 0, 130), [rect(120, 130, 30, 150)], 10, { plane: 'yz', w0: -265, col: wall }),
  );
}
export interface Figure { pose: Pose; xf: Xf; col?: string }
export function figures(fs: Figure[]): Face[] {
  return join(...fs.map((f) => xform(mannequin(f.pose, f.col), f.xf)));
}
export function rig(xf: Xf): Face[] { return xform(cameraRig(), xf); }

/**
 * The "generated" shot: a painting made from the blocking, inside the rect (cx, cy, w, h) of the plate world,
 * through projector P (whose viewport centre is cx, cy). Wall and floor in grade colours, a shaft of window
 * light, haze, and each figure as a dark silhouette with a warm rim, exactly where it stands.
 */
export function paintShot(ctx: CanvasRenderingContext2D, c: Cam, cx: number, cy: number, w: number, h: number, P: Proj, fs: Figure[], o: { a?: number; reveal?: number; t?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const rv = o.reveal ?? 1;
  setWorld(ctx, c, cx, cy, 1, 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w * rv, h); ctx.clip();
  ctx.globalAlpha = a;
  // wall and floor
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#1F3A44'); g.addColorStop(0.55, '#3A4E50'); g.addColorStop(0.56, '#4A3526'); g.addColorStop(1, '#1C130D');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  // the window light
  const win = [[-258, 90, 215], [-258, 90, 85], [-258, -30, 85], [-258, -30, 215]].map(([x, y, z]) => project(P, [x!, y!, z!]));
  ctx.fillStyle = 'rgba(255,214,150,0.9)'; ctx.beginPath(); win.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
  const fl = [[-258, -30, 0], [-258, 90, 0], [80, 170, 0], [80, 10, 0]].map(([x, y, z]) => project(P, [x!, y!, z!]));
  const sg = ctx.createLinearGradient(win[0]![0], win[0]![1], fl[2]![0], fl[2]![1]);
  sg.addColorStop(0, 'rgba(255,200,120,0.55)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(win[0]![0], win[0]![1]); ctx.lineTo(win[3]![0], win[3]![1]); ctx.lineTo(fl[3]![0], fl[3]![1]); ctx.lineTo(fl[2]![0], fl[2]![1]); ctx.closePath(); ctx.fill();
  // haze
  for (let i = 0; i < 6; i++) {
    const hx = -w / 2 + w * hash(i, 4) + 30 * Math.sin((o.t ?? 0) * 0.3 + i), hy = -h / 2 + h * 0.6 * hash(i, 5);
    const r = 120 + 140 * hash(i, 6);
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r); hg.addColorStop(0, 'rgba(255,225,190,0.10)'); hg.addColorStop(1, 'rgba(255,225,190,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fill();
  }
  // the figures: silhouettes with a warm rim
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const f of fs) {
    const j = (k: keyof Pose) => project(P, xpt(f.pose[k], f.xf));
    const bones: [keyof Pose, keyof Pose, number][] = [['pelvis', 'chest', 26], ['shL', 'shR', 13], ['hipL', 'hipR', 16], ['shL', 'elL', 10], ['elL', 'haL', 9], ['shR', 'elR', 10], ['elR', 'haR', 9], ['hipL', 'knL', 14], ['knL', 'ftL', 11], ['hipR', 'knR', 14], ['knR', 'ftR', 11], ['neck', 'head', 9]];
    for (const pass of [0, 1]) {
      for (const [p, q, r] of bones) {
        const A = j(p), B = j(q), k = P.dist / A[2] * P.s;
        ctx.strokeStyle = pass === 0 ? 'rgba(255,170,80,0.85)' : '#0B0A0C';
        ctx.lineWidth = r * k * (pass === 0 ? 1.0 : 0.86);
        ctx.beginPath(); ctx.moveTo(A[0] + (pass === 0 ? -2.5 : 0), A[1]); ctx.lineTo(B[0] + (pass === 0 ? -2.5 : 0), B[1]); ctx.stroke();
      }
      const hd = j('head'), k = P.dist / hd[2] * P.s;
      ctx.fillStyle = pass === 0 ? 'rgba(255,170,80,0.85)' : '#0B0A0C';
      ctx.beginPath(); ctx.arc(hd[0] + (pass === 0 ? -2.5 : 0), hd[1], 11.5 * k * (pass === 0 ? 1.0 : 0.9), 0, TAU); ctx.fill();
    }
  }
  // grade: teal shadows, warm highlights, and a vignette
  const vg = ctx.createRadialGradient(0, 0, Math.min(w, h) * 0.3, 0, 0, Math.max(w, h) * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,14,0.65)');
  ctx.fillStyle = vg; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
  // the scan line of the render
  if (rv < 1) { ctx.fillStyle = AMBER; ctx.shadowColor = 'rgba(245,179,66,0.9)'; ctx.shadowBlur = 24; ctx.fillRect(-w / 2 + w * rv - 2, -h / 2, 4, h); ctx.shadowBlur = 0; }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Lines of a camera's field of view, from the lens at P-space point `lens` towards the four corners. */
export function frustum(ctx: CanvasRenderingContext2D, c: Cam, vx: number, vy: number, P: Proj, lens: V3, dir: V3, k: number, col = AMBER) {
  if (k <= 0) return;
  const right: V3 = [-dir[1], dir[0], 0];
  const corners: V3[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [lens[0] + dir[0] * 220 * k + right[0] * 130 * u! * k, lens[1] + dir[1] * 220 * k + right[1] * 130 * u! * k, lens[2] + 75 * v! * k]);
  const L = project(P, lens), cs = corners.map((p) => project(P, p));
  setWorld(ctx, c, vx, vy, 1, 0);
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
  ctx.beginPath(); cs.forEach((p) => { ctx.moveTo(L[0], L[1]); ctx.lineTo(p[0], p[1]); }); ctx.stroke();
  ctx.beginPath(); cs.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(245,179,66,0.08)'; ctx.fill();
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** An abstract "prompted" thumbnail: random blobs of colour, a different mess each seed. Centred at (x, y). */
export function messThumb(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, seed: number, a = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.save(); ctx.globalAlpha = a;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.clip();
  const hue = Math.floor(360 * hash(seed, 1));
  ctx.fillStyle = `hsl(${hue},40%,22%)`; ctx.fillRect(-w / 2, -h / 2, w, h);
  for (let i = 0; i < 7; i++) {
    const hx = -w / 2 + w * hash(seed, i, 2), hy = -h / 2 + h * hash(seed, i, 3), r = 20 + 80 * hash(seed, i, 4);
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
    g.addColorStop(0, `hsla(${(hue + 120 * hash(seed, i, 5)) % 360},70%,60%,0.9)`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
