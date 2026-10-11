// The Diagram Design Short's look (theme `artboard`): a design tool's canvas. A light grey infinite canvas with a dot
// grid, a white frame (the artboard) with its name above it, a toolbar along the top with two live cursors' avatars,
// coloured multiplayer cursors (YOU in blue, AGENT in coral) with name tags, selection boxes with square handles, and
// an inspector card whose properties change as the diagram does. Captions are a text layer being edited: bold caps
// in a selection box, the spoken word selected (white on selection blue).
import { FSPass, W, H } from '@engine/gl';
import type { Frame, PostOverrides } from '@engine/scene';
import type { Line, Word } from '@engine/lyrics';
import { F, font, measure } from '@engine/type';
import { clamp, ease, hash, lerp, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';
import { setWorld, type Cam } from '@kit/_vo';

export { clamp, ease, hash, lerp, TAU };
export const INK = '#1E1E1E';
export const GREY = '#8C8C8C';
export const LINE = '#B9BEC7';
export const SEL = '#0D99FF';
export const CORAL = '#FF6A45';
export const WHITE = '#FFFFFF';
export const SANS = F.archivo(100, 600);
export const SANSB = F.archivo(100, 800);
export const SANSX = F.archivo(100, 900);
export const SERIF = F.serif(400);
export const MONO = F.mono(400);
export const MONOB = F.mono(600);
export const ob = (x: number) => (x <= 0 ? 0 : ease.outBack(Math.min(1, x)));
export type XY = [number, number];

const CANVAS_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed; uniform float uTime;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 d = (sp - 0.5 * uRes) / uCam.z;
  vec2 p = uCam.xy + d;
  vec3 col = vec3(0.945, 0.945, 0.95);
  vec2 g = abs(fract(p / 32.0 + 0.5) - 0.5) * 32.0 * uCam.z;
  col -= vec3(0.09) * (1.0 - smoothstep(0.8, 1.8, length(g))) * smoothstep(0.25, 0.5, uCam.z);
  vec2 q = sp / uRes;
  col *= 1.0 - 0.08 * dot(q - 0.5, q - 0.5);
  col += (hash12(sp + floor(uTime * 24.0) * 7.0) - 0.5) * 0.01;
  fragColor = vec4(col, 1.0);
}`;

interface Chunk { words: Word[]; texts: string[]; xs: number[]; width: number; start: number; end: number }

export abstract class Board extends Plate {
  override paper = true;
  override showPen = false;
  override hasUnder = true;
  override paperPass = new FSPass(CANVAS_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 }, uTime: { value: 0 } });
  chunks: Chunk[] = [];
  override init() {
    super.init();
    this.chunks = makeChunks(this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2), this.ctx.end);
  }
  override render(f: Frame, out: Parameters<Plate['render']>[1]): PostOverrides {
    this.paperPass.u.uTime!.value = f.t;
    return super.render(f, out);
  }
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.stage(ctx, t, c); }
  stage(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawChunks(ctx, this.chunks, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { bloom: 0.05, bloomThreshold: 1.5, vignette: 0.12, grain: 0.02, halation: 0, ca: 0.1, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  punch(t: number, t0: number, amt = 0.02) { return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1; }
  s(k: string, d = 0) { return this.w[k]!.start + d; }
  e(k: string, d = 0) { return this.w[k]!.end + d; }
}

// ------------------------------------------------------------------ captions: a text layer, the spoken word selected
const CAPS = { size: 80, maxW: 900, y: 640, maxWords: 3 };
const CAPF = F.archivo(100, 900);
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
  out.forEach((c, i) => { const n = out[i + 1]; c.end = n ? Math.min(n.start - 0.06, c.end + 0.9) : Math.min(plateEnd + 0.05, c.end + 1.2); });
  return out;
}
function drawChunks(ctx: CanvasRenderingContext2D, chunks: Chunk[], t: number) {
  const size = CAPS.size;
  for (const ch of chunks) {
    if (t < ch.start - 0.06 || t > ch.end) continue;
    const a = clamp((t - ch.start + 0.06) / 0.06) * clamp((ch.end - t) / 0.06);
    const x0 = W / 2 - ch.width / 2, y = H / 2 + CAPS.y;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
    // the text layer's bounding box with handles
    const bx = x0 - 18, by = y - size * 0.86, bw = ch.width + 36, bh = size * 1.12;
    ctx.strokeStyle = SEL; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = WHITE;
    for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]] as XY[]) { ctx.fillRect(hx - 7, hy - 7, 14, 14); ctx.strokeRect(hx - 7, hy - 7, 14, 14); }
    ctx.font = font(CAPF, size); ctx.textAlign = 'left';
    ch.words.forEach((w, i) => {
      const on = t >= w.start - 0.03 && t < (ch.words[i + 1]?.start ?? ch.end) - 0.03;
      const x = x0 + ch.xs[i]!, tw = measure(ch.texts[i]!, CAPF, size);
      if (on) { ctx.fillStyle = SEL; ctx.fillRect(x - 6, y - size * 0.8, tw + 12, size * 1.0); }
      ctx.fillStyle = on ? WHITE : t >= w.start - 0.03 ? INK : 'rgba(30,30,30,0.35)';
      ctx.fillText(ch.texts[i]!, x, y);
    });
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ pieces (world coords)
/** A multiplayer cursor with a name tag. */
export function cursor(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, name: string, col: string, o: { a?: number; press?: number; s?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, (o.s ?? 1.6) * (1 - 0.12 * (o.press ?? 0)), 0);
  ctx.globalAlpha = a; ctx.fillStyle = col; ctx.strokeStyle = WHITE; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 24); ctx.lineTo(6.5, 18.5); ctx.lineTo(11, 28); ctx.lineTo(15, 26); ctx.lineTo(10.5, 17); ctx.lineTo(18, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.font = font(SANSB, 13); const tw = measure(name, SANSB, 13) + 14;
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(14, 26, tw, 22, 4); ctx.fill();
  ctx.fillStyle = WHITE; ctx.fillText(name, 21, 42);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** A selection box with square handles around (x, y, w, h). */
export function selection(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, a = 1, col = SEL, label?: string) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = WHITE;
  for (const [hx, hy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]] as XY[]) { ctx.fillRect(hx - 8, hy - 8, 16, 16); ctx.strokeRect(hx - 8, hy - 8, 16, 16); }
  if (label) { ctx.font = font(SANSB, 18); const tw = measure(label, SANSB, 18) + 16; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-tw / 2, h / 2 + 14, tw, 30, 4); ctx.fill(); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText(label, 0, h / 2 + 35); ctx.textAlign = 'left'; }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** The artboard: a white frame with its name above it. */
export function artboard(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, name: string, a = 1) {
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;
  ctx.fillStyle = WHITE; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.font = font(SANS, 22); ctx.fillStyle = GREY; ctx.fillText(name, -w / 2, -h / 2 - 14);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/** Text in world coords. */
export function text(ctx: CanvasRenderingContext2D, c: Cam, s: string, x: number, y: number, size: number, o: { f?: string; col?: string; a?: number; align?: CanvasTextAlign } = {}) {
  if ((o.a ?? 1) <= 0.003) return;
  setWorld(ctx, c, x, y, 1, 0);
  ctx.globalAlpha = o.a ?? 1; ctx.font = font(o.f ?? SANS, size); ctx.fillStyle = o.col ?? INK; ctx.textAlign = o.align ?? 'left';
  ctx.fillText(s, 0, 0);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ the app diagram, light (minimal light), messy → clean
interface ANode { title: string; sub: string; tag: string; clean: XY; mess: XY; mw: number; mh: number; rot: number; pastel: string; accent?: boolean }
// a portrait layout for the vertical frame
export const APP: ANode[] = [
  { title: 'Browser', sub: 'users', tag: 'EXT', clean: [0, -330], mess: [-200, -300], mw: 230, mh: 110, rot: -0.07, pastel: '#FFD6E0' },
  { title: 'CDN', sub: 'edge cache', tag: 'EDGE', clean: [0, -170], mess: [210, -60], mw: 200, mh: 100, rot: 0.06, pastel: '#FFF1A8' },
  { title: 'API', sub: 'node · express', tag: 'ORIG', clean: [0, -10], mess: [-150, 60], mw: 250, mh: 130, rot: 0.03, pastel: '#BFD7FF', accent: true },
  { title: 'Auth', sub: 'sessions', tag: 'SVC', clean: [-270, 170], mess: [230, 200], mw: 190, mh: 100, rot: -0.1, pastel: '#D9C2FF' },
  { title: 'Postgres', sub: 'primary db', tag: 'DB', clean: [0, 170], mess: [-230, 300], mw: 230, mh: 110, rot: 0.08, pastel: '#C4F0C9' },
  { title: 'Redis', sub: 'cache', tag: 'KV', clean: [270, 170], mess: [120, -240], mw: 190, mh: 100, rot: 0.1, pastel: '#FFE0B8' },
];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5], [3, 4]];
export const NW = 220, NH = 96;
const mixHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, k));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
function cleanRoute(a: number, b: number): XY[] {
  const A = APP[a]!.clean, B = APP[b]!.clean;
  if (Math.abs(A[0] - B[0]) < 1) return [[A[0], A[1] + NH / 2], [B[0], B[1] - NH / 2]];
  if (Math.abs(A[1] - B[1]) < 1) return [[A[0] + Math.sign(B[0] - A[0]) * NW / 2, A[1]], [B[0] - Math.sign(B[0] - A[0]) * NW / 2, B[1]]];
  const my = (A[1] + NH / 2 + B[1] - NH / 2) / 2;
  return [[A[0], A[1] + NH / 2], [A[0], my], [B[0], my], [B[0], B[1] - NH / 2]];
}
function messRoute(a: number, b: number, i: number, wig: number, n = 24): XY[] {
  const A = APP[a]!.mess, B = APP[b]!.mess, bend = 260 * (hash(i, 3) - 0.5) * 2;
  const mx = (A[0] + B[0]) / 2 - (B[1] - A[1]) * 0.4 + bend, my = (A[1] + B[1]) / 2 + (B[0] - A[0]) * 0.35 - bend * 0.5;
  return Array.from({ length: n + 1 }, (_, j) => {
    const u = j / n, w = Math.sin(u * Math.PI) * wig * 18 * Math.sin(u * 14 + i + wig * 6);
    return [lerp(lerp(A[0], mx, u), lerp(mx, B[0], u), u) + w, lerp(lerp(A[1], my, u), lerp(my, B[1], u), u) + w * 0.6] as XY;
  });
}
function plen(p: XY[]) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]); return L; }
function at(p: XY[], s: number): XY { let acc = 0; for (let i = 1; i < p.length; i++) { const a = p[i - 1]!, b = p[i]!, L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + L >= s || i === p.length - 1) { const u = L > 0 ? clamp((s - acc) / L) : 0; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } acc += L; } return p[0]!; }
function resample(p: XY[], n = 24): XY[] { const L = plen(p); return Array.from({ length: n + 1 }, (_, j) => at(p, (L * j) / n)); }
/**
 * The diagram at morph m (0 messy, 1 clean) inside the artboard centred at (ox, oy); `show` pops the messy boxes in;
 * `wig` makes the messy arrows wriggle like noodles; `acc` recolours the accent (brand colours).
 */
export function diagram(ctx: CanvasRenderingContext2D, c: Cam, ox: number, oy: number, m: number, o: { show?: number; wig?: number; a?: number; acc?: string; stagger?: number } = {}) {
  const show = o.show ?? 1, A = o.a ?? 1, AC = o.acc ?? CORAL, st = o.stagger ?? 0.4;
  if (A <= 0.003 || show <= 0) return;
  const mOf = (i: number) => ease.inOutCubic(clamp((m - (i / APP.length) * st) / (1 - st)));
  EDGES.forEach(([a, b], i) => {
    const mk = Math.min(mOf(a), mOf(b));
    const pM = messRoute(a, b, i, (o.wig ?? 0) * (1 - mk)), pC = resample(cleanRoute(a, b));
    const pts = pM.map((p, j) => [lerp(p[0], pC[j]![0], mk) + ox, lerp(p[1], pC[j]![1], mk) + oy] as XY);
    const k = clamp(show * 1.5 - 0.4 - i * 0.04);
    if (k <= 0) return;
    const primary = a === 1 && b === 2;
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.globalAlpha = A; ctx.strokeStyle = mk < 0.5 ? ['#E05A9B', '#2E9E5B', '#E0A21A', '#4D7CFE', '#9B59D0', '#E05A9B'][i]! : primary ? AC : LINE;
    ctx.lineWidth = lerp(5, 2, mk); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const L = plen(pts), s = L * k;
    ctx.beginPath(); ctx.moveTo(pts[0]![0], pts[0]![1]);
    let acc = 0;
    for (let j = 1; j < pts.length; j++) { const p = pts[j - 1]!, q = pts[j]!, sl = Math.hypot(q[0] - p[0], q[1] - p[1]); if (acc + sl >= s) { const u = sl ? (s - acc) / sl : 0; ctx.lineTo(lerp(p[0], q[0], u), lerp(p[1], q[1], u)); break; } ctx.lineTo(q[0], q[1]); acc += sl; }
    ctx.stroke();
    if (k >= 1) { const p1 = pts[pts.length - 1]!, p0 = pts[pts.length - 3]!, ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); ctx.fillStyle = ctx.strokeStyle; ctx.save(); ctx.translate(p1[0], p1[1]); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-14, -7); ctx.lineTo(-14, 7); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  APP.forEach((n, i) => {
    const mk = mOf(i), pk = ob(clamp(show * 1.6 - i * 0.09));
    if (pk <= 0) return;
    const x = ox + lerp(n.mess[0], n.clean[0], mk), y = oy + lerp(n.mess[1], n.clean[1], mk);
    const w = lerp(n.mw, NW, mk), h = lerp(n.mh, NH, mk);
    setWorld(ctx, c, x, y, pk, lerp(n.rot, 0, mk));
    ctx.globalAlpha = A;
    const sh = 1 - mk;
    if (sh > 0.01) { ctx.shadowColor = `rgba(0,0,0,${0.35 * sh})`; ctx.shadowBlur = 24 * sh; ctx.shadowOffsetY = 12 * sh; ctx.shadowOffsetX = 6 * sh; }
    const acc = !!n.accent;
    ctx.fillStyle = mixHex(n.pastel, acc ? (o.acc ? '#E6F7F5' : '#FFF0EB') : '#FFFFFF', mk);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, lerp(26, 8, mk)); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowOffsetX = 0;
    ctx.strokeStyle = acc && mk > 0.5 ? AC : mk > 0.5 ? LINE : '#2B2B33'; ctx.lineWidth = lerp(4, 2, mk); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = font(mk < 0.5 ? SANSX : SANS, lerp(34, 26, mk)); ctx.fillStyle = INK;
    ctx.fillText(n.title, 0, 8);
    if (mk > 0.4) {
      ctx.globalAlpha = A * clamp((mk - 0.4) / 0.4);
      ctx.font = font(MONO, 16); ctx.fillStyle = GREY; ctx.fillText(n.sub, 0, 34);
      ctx.font = font(MONO, 14); const tw = measure(n.tag, MONO, 14) + 16;
      ctx.strokeStyle = acc ? AC : LINE; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(-w / 2 + 12, -h / 2 + 12, tw, 24, 4); ctx.stroke();
      ctx.fillStyle = acc ? AC : GREY; ctx.textAlign = 'left'; ctx.fillText(n.tag, -w / 2 + 20, -h / 2 + 29);
    }
    ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}
