// CHAT: the whole REA Short as one group chat (theme `chat`). A little history and the viewer's question are
// already on screen at frame one; Tool Man answers line by line. Each narration line arrives as a typing indicator and then a white
// bubble whose words letter in as they're spoken; the viewer reacts in blue bubbles (silent), and "photos"
// arrive as image messages: the detective with his lens, the code he pulled out, the brick-breaker with
// 63/63 BYTES MATCH, the star counter, and finally a link preview for the GitHub page. The chat scrolls up
// like a real one.
import type { Cam } from '@kit/_vo';
import type { Word, Line } from '@engine/lyrics';
import { FSPass, W, H } from '@engine/gl';
import { F, font, measure } from '@engine/type';
import { clamp, ease, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';

const CHAT_GLSL = /* glsl */ `
uniform vec4 uCam; uniform vec2 uRes; uniform float uSeed;
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 col = C_BONE;
  vec2 q = sp / 90.0; vec2 f = fract(q) - 0.5; vec2 id = floor(q);
  float h = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
  float ring = abs(length(f + vec2(h - 0.5, 0.0) * 0.3) - 0.16);
  col = mix(col, col * 0.955, smoothstep(0.035, 0.0, ring) * step(0.55, h));
  fragColor = vec4(col, 1.0);
}`;

const BLUE = '#2F7CF6', INK = '#0E1116', WHITE = '#FFFFFF', GREY = '#8A93A3', YEL = '#FFD21F', RED = '#E5322B', GREEN = '#21C063';
const TEXT = F.archivo(100, 700), BOLD = F.archivo(100, 900);
const SIZE = 58, LH = SIZE * 1.24, PADX = 42, PADY = 30, MAXW = 860, GAP = 26;
const TOP = -700, BOTTOM = 730; // the message area (screen px from centre)
const TYPE = 0.9; // how long the typing indicator shows before a narration bubble

type Media = 'detective' | 'code' | 'game' | 'stars' | 'link';
interface Msg {
  kind: 'narr' | 'react' | 'media' | 'text' | 'date';
  t0: number;
  /** narration words (timed) or reaction text */
  words?: Word[]; text?: string; media?: Media;
  w: number; h: number;
  rows?: { word: Word | null; text: string; x: number; row: number }[];
}

function layoutWords(words: { text: string; word: Word | null }[], size: number, maxW: number) {
  const sp = measure(' ', TEXT, size);
  const rows: Msg['rows'] = [];
  let x = 0, row = 0, widest = 0;
  for (const wd of words) {
    const ww = measure(wd.text, TEXT, size);
    if (x > 0 && x + sp + ww > maxW) { widest = Math.max(widest, x); row++; x = 0; }
    rows.push({ word: wd.word, text: wd.text, x: x + (x > 0 ? sp : 0), row });
    x += (x > 0 ? sp : 0) + ww;
  }
  widest = Math.max(widest, x);
  return { rows, w: widest, nrows: row + 1 };
}

export default class Chat extends Plate {
  override paper = true;
  override showPen = false;
  override paperPass = new FSPass(CHAT_GLSL, { uCam: { value: [0, 0, 1, 0] }, uRes: { value: [W, H] }, uSeed: { value: 0 } });
  msgs: Msg[] = [];

  build() {
    const L = this.ctx.lyrics.lines;
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
    const line = (q: string): Line => {
      const l = L.find((ln) => norm(ln.text).includes(norm(q)));
      if (!l) throw new Error(`chat: no line with "${q}"`);
      return l;
    };
    const narr = (l: Line, lead = 0.06): Msg => {
      const lay = layoutWords(l.words.map((w) => ({ text: w.w, word: w })), SIZE, MAXW);
      return { kind: 'narr', t0: l.start - lead, words: l.words, w: lay.w + PADX * 2, h: lay.nrows * LH + PADY * 2, rows: lay.rows };
    };
    const react = (text: string, t0: number): Msg => {
      const lay = layoutWords(text.split(' ').map((s) => ({ text: s, word: null })), SIZE * 0.92, MAXW * 0.8);
      return { kind: 'react', t0, text, w: lay.w + PADX * 2, h: lay.nrows * LH * 0.92 + PADY * 2, rows: lay.rows };
    };
    const media = (m: Media, t0: number, h = 440): Msg => ({ kind: 'media', t0, media: m, w: m === 'link' ? 940 : 860, h });
    const text = (s: string, t0: number): Msg => {
      const lay = layoutWords(s.split(' ').map((x) => ({ text: x, word: null })), SIZE, MAXW);
      return { kind: 'text', t0, text: s, w: lay.w + PADX * 2, h: lay.nrows * LH + PADY * 2, rows: lay.rows };
    };
    const l1 = line('This AI tool'), l2 = line('Point your agent'), l3 = line('pulls out'), l4 = line('It even rebuilt'), l5 = line('Then your agent'), l6 = line("It's called"), l7 = line('Free, open source');
    this.msgs = [
      { kind: 'date', t0: -10, w: 240, h: 64 },
      react('the gym app one was great', -10),
      text('every day, a new tool.', -10),
      react("what's today's tool?", -10),
      text("you'll want to see this one", -10),
      react('how do I copy a feature from an app I like??', -10),
      narr(l1),
      react('wait. ANY app?', l1.end + 0.05),
      narr(l2),
      media('detective', l2.end - 0.2),
      narr(l3),
      media('code', l3.words[3]!.start),
      react('show me how', l3.end + 0.05),
      narr(l4),
      media('game', l4.words[5]!.start, 400),
      react('no way', l4.end + 0.05),
      narr(l5),
      narr(l6),
      media('stars', l6.words[3]!.start, 320),
      react('link??', l6.end + 0.05),
      narr(l7),
      media('link', l7.words[4]!.start, 310),
    ];
    this.cam.key(0, 0, 0, 1, 0);
  }
  override camAt(_t: number): Cam { return { cx: 0, cy: 0, z: 1, roll: 0 }; }

  /** Height a message occupies once it has appeared (0..1 growth while it arrives). */
  grow(m: Msg, t: number) { return ease.outCubic(clamp((t - m.t0) / 0.22)); }

  override drawUI(ctx: CanvasRenderingContext2D, t: number) {
    // the column of messages, bottom-anchored once it fills the area
    let total = 0;
    const ys: number[] = [];
    for (const m of this.msgs) {
      const g = m.t0 <= t ? this.grow(m, t) : 0;
      ys.push(total);
      total += (m.h + GAP) * g;
    }
    // a typing indicator under the last message while the next narration is on its way
    const next = this.msgs.find((m) => m.kind === 'narr' && m.t0 > t && m.t0 - t < TYPE);
    const tk = next ? clamp((TYPE - (next.t0 - t)) / 0.15) : 0;
    const typingH = 116 * tk;
    // bottom-anchored, like a real chat: the newest message sits just above the input bar
    const y0 = BOTTOM - typingH - total;
    ctx.setTransform(1, 0, 0, 1, W / 2, H / 2);
    this.msgs.forEach((m, i) => {
      if (t < m.t0) return;
      const y = y0 + ys[i]!;
      if (y + m.h < TOP - 260) return;
      this.drawMsg(ctx, m, y, t, this.grow(m, t));
    });
    if (next) this.drawTyping(ctx, BOTTOM - typingH + GAP * 0.4, t, tk);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawMsg(ctx: CanvasRenderingContext2D, m: Msg, y: number, t: number, g: number) {
    const right = m.kind === 'react';
    const x = right ? W / 2 - 40 - m.w : -W / 2 + 40;
    const sp = springStep(t - m.t0, 3.4, 0.55);
    ctx.save();
    ctx.translate(right ? x + m.w : x, y + m.h);
    ctx.scale(0.85 + 0.15 * sp, 0.85 + 0.15 * sp);
    ctx.translate(right ? -m.w : 0, -m.h);
    ctx.globalAlpha = clamp(g * 1.5);
    if (m.kind === 'media') { this.drawMedia(ctx, m, t); ctx.restore(); return; }
    if (m.kind === 'date') {
      ctx.restore(); ctx.save(); ctx.translate(-m.w / 2, y);
      ctx.fillStyle = 'rgba(14,17,22,0.12)'; ctx.beginPath(); ctx.roundRect(0, 0, m.w, m.h, 32); ctx.fill();
      ctx.font = font(BOLD, 30); ctx.fillStyle = '#4A5260'; ctx.textAlign = 'center'; ctx.fillText('TODAY', m.w / 2, 43); ctx.textAlign = 'left';
      ctx.restore(); return;
    }
    // the bubble
    ctx.fillStyle = 'rgba(14,17,22,0.08)'; ctx.beginPath(); ctx.roundRect(0, 6, m.w, m.h, 38); ctx.fill();
    ctx.fillStyle = right ? BLUE : WHITE; ctx.beginPath(); ctx.roundRect(0, 0, m.w, m.h, 38); ctx.fill();
    // tail
    ctx.beginPath();
    if (right) { ctx.moveTo(m.w - 30, m.h - 4); ctx.quadraticCurveTo(m.w + 6, m.h + 6, m.w + 14, m.h - 2); ctx.quadraticCurveTo(m.w - 2, m.h - 12, m.w - 4, m.h - 40); }
    else { ctx.moveTo(30, m.h - 4); ctx.quadraticCurveTo(-6, m.h + 6, -14, m.h - 2); ctx.quadraticCurveTo(2, m.h - 12, 4, m.h - 40); }
    ctx.fill();
    const size = right ? SIZE * 0.92 : SIZE, lh = right ? LH * 0.92 : LH;
    ctx.font = font(TEXT, size); ctx.textBaseline = 'alphabetic';
    for (const r of m.rows ?? []) {
      if (r.word && t < r.word.start - 0.02) continue;
      const age = r.word ? t - r.word.start : 1;
      ctx.globalAlpha = clamp(age / 0.08 + 0.2);
      ctx.fillStyle = right ? WHITE : INK;
      ctx.fillText(r.text, PADX + r.x, PADY + (r.row + 1) * lh - size * 0.26);
    }
    ctx.globalAlpha = 1;
    // time and ticks
    ctx.font = font(F.mono(500), 22); ctx.fillStyle = right ? 'rgba(255,255,255,0.8)' : GREY; ctx.textAlign = 'right';
    ctx.fillText(right ? '18:00 ✓✓' : '18:00', m.w - 26, m.h - 12); ctx.textAlign = 'left';
    ctx.restore();
  }

  drawTyping(ctx: CanvasRenderingContext2D, y: number, t: number, k: number) {
    if (k <= 0) return;
    const x = -W / 2 + 40;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = k;
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.roundRect(0, 0, 190, 90, 40); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const b = 0.5 + 0.5 * Math.sin(t * 12 - i * 0.9);
      ctx.fillStyle = `rgba(138,147,163,${0.45 + 0.55 * b})`;
      ctx.beginPath(); ctx.arc(50 + i * 45, 45 - 8 * b, 13, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  drawMedia(ctx: CanvasRenderingContext2D, m: Msg, t: number) {
    const w = m.w, h = m.h;
    ctx.fillStyle = 'rgba(14,17,22,0.08)'; ctx.beginPath(); ctx.roundRect(0, 6, w, h, 30); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, w, h, 30); ctx.clip();
    const age = t - m.t0;
    if (m.media === 'detective') {
      ctx.fillStyle = YEL; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * 120, h / 2 + Math.sin(a) * 120); ctx.lineTo(w / 2 + Math.cos(a) * 600, h / 2 + Math.sin(a) * 600); ctx.stroke(); }
      robot(ctx, w * 0.36, h * 0.6, 0.95, t);
      ctx.fillStyle = '#16181D'; ctx.beginPath(); ctx.roundRect(w * 0.58, h * 0.18, w * 0.36, h * 0.64, 16); ctx.fill();
      ctx.font = font(F.mono(700), 30); ctx.fillStyle = '#7EC8F2';
      ['4D 5A 90', '00 03 00', 'E8 2F 1C', '8B 45 08'].forEach((s, i) => ctx.fillText(s, w * 0.61, h * 0.3 + i * 52));
      tagBox(ctx, 'NO SOURCE CODE', w * 0.76, h * 0.9, 30, RED, WHITE);
    } else if (m.media === 'code') {
      ctx.fillStyle = '#16181D'; ctx.fillRect(0, 0, w, h);
      ctx.font = font(F.mono(700), 34);
      const lines: [string, string][] = [['ASSEMBLY', GREY], ['mov  eax, [ebp+8]', '#7EC8F2'], ['call SetPan', YEL], ['PSEUDOCODE', GREY], ['int pan(int x) {', '#E6E6E6'], ['  return (x-320)*100/320;', '#E6E6E6']];
      const n = Math.floor(clamp(age / 1.0) * lines.length * 1.0 + 0.999);
      lines.slice(0, n).forEach(([s, col], i) => { ctx.fillStyle = col; ctx.fillText(s, 40, 70 + i * 58); });
    } else if (m.media === 'game') {
      ctx.fillStyle = '#141824'; ctx.fillRect(0, 0, w, h);
      const cols = [RED, '#F2862E', YEL, GREEN, BLUE];
      cols.forEach((c, r) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = c; ctx.fillRect(28 + i * 84, 30 + r * 34, 76, 26); } });
      const bx = w / 2 + Math.sin(t * 3) * 260;
      ctx.fillStyle = '#9AA3B2'; ctx.beginPath(); ctx.roundRect(bx - 80, h - 70, 160, 22, 10); ctx.fill();
      ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(bx + 30 * Math.cos(t * 5), h - 140 - 50 * Math.abs(Math.sin(t * 4)), 16, 0, TAU); ctx.fill();
      tagBox(ctx, '63 / 63 BYTES MATCH', w / 2, h - 170, 40, YEL, INK);
    } else if (m.media === 'stars') {
      ctx.fillStyle = BLUE; ctx.fillRect(0, 0, w, h);
      const k = ease.outCubic(clamp(age / 1.2));
      ctx.font = font(BOLD, 130); ctx.fillStyle = WHITE; ctx.textAlign = 'center';
      ctx.fillText(Math.round(25784 * k).toLocaleString('en-US'), w / 2, h * 0.55);
      ctx.font = font(BOLD, 40); ctx.fillStyle = YEL; ctx.fillText('★ GITHUB STARS IN ONE DAY', w / 2, h * 0.82); ctx.textAlign = 'left';
    } else if (m.media === 'link') {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#16181D'; ctx.fillRect(0, 0, 200, h);
      ctx.font = font(BOLD, 64); ctx.fillStyle = YEL; ctx.textAlign = 'center'; ctx.fillText('REA', 100, h / 2 + 22); ctx.textAlign = 'left';
      ctx.font = font(BOLD, 40); ctx.fillStyle = INK; ctx.fillText('REA: Reverse Engineer', 230, 80); ctx.fillText('Anything', 230, 128);
      ctx.font = font(TEXT, 30); ctx.fillStyle = GREY; ctx.fillText('Free · open source · MIT', 230, 186);
      ctx.font = font(F.mono(600), 30); ctx.fillStyle = BLUE; ctx.fillText('github.com/morluto/rea', 230, 250);
    }
    ctx.restore();
  }

  override drawTop(ctx: CanvasRenderingContext2D, t: number) {
    // the header bar: avatar, name, typing… or online
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.fillRect(0, 0, W, 210);
    ctx.fillStyle = 'rgba(14,17,22,0.08)'; ctx.fillRect(0, 210, W, 3);
    ctx.font = font(F.mono(600), 30); ctx.fillStyle = INK; ctx.fillText('18:00', 60, 62);
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(150, 140, 50, 0, TAU); ctx.fill();
    ctx.font = font(BOLD, 40); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText('TM', 150, 154); ctx.textAlign = 'left';
    ctx.font = font(BOLD, 46); ctx.fillStyle = INK; ctx.fillText('Tool Man', 225, 132);
    const typing = this.msgs.some((m) => m.kind === 'narr' && m.t0 > t && m.t0 - t < TYPE);
    ctx.font = font(TEXT, 32); ctx.fillStyle = typing ? BLUE : GREY; ctx.fillText(typing ? 'typing…' : 'online', 225, 178);
    // the input bar
    ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.fillRect(0, H - 170, W, 170);
    ctx.fillStyle = '#EEF1F6'; ctx.beginPath(); ctx.roundRect(40, H - 140, W - 200, 90, 45); ctx.fill();
    ctx.font = font(TEXT, 36); ctx.fillStyle = GREY; ctx.fillText('Message', 90, H - 82);
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(W - 90, H - 95, 45, 0, TAU); ctx.fill();
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(W - 110, H - 120); ctx.lineTo(W - 62, H - 95); ctx.lineTo(W - 110, H - 70); ctx.closePath(); ctx.fill();
  }

  override postFX() { return { vignette: 0.12, grain: 0.02, bloom: 0.05 }; }
}

function tagBox(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, bg: string, fg: string) {
  const tw = measure(text, BOLD, size), w = tw + size, h = size * 1.5;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 12); ctx.fill();
  ctx.font = font(BOLD, size); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(text, x, y + size * 0.36); ctx.textAlign = 'left';
}

function robot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.fillStyle = '#9FB7D6'; ctx.beginPath(); ctx.roundRect(-60, 10, 120, 100, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#C9D8EA'; ctx.beginPath(); ctx.roundRect(-75, -100, 150, 110, 26); ctx.fill(); ctx.stroke();
  for (const ex of [-32, 32]) { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(ex, -48, 22, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 8, -45, 9, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#6B4A2E'; ctx.beginPath(); ctx.ellipse(0, -100, 105, 20, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-62, -104); ctx.quadraticCurveTo(-64, -170, 0, -166); ctx.quadraticCurveTo(64, -170, 62, -104); ctx.closePath(); ctx.fill(); ctx.stroke();
  const gx = 100, gy = -60 + 6 * Math.sin(t * 3);
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(55, 40); ctx.lineTo(gx - 10, gy + 40); ctx.stroke();
  ctx.lineWidth = 7; ctx.fillStyle = 'rgba(126,200,242,0.6)'; ctx.beginPath(); ctx.arc(gx + 10, gy, 38, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
