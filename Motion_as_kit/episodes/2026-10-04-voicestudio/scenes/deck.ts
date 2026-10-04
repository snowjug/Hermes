// DECK: "Think of it as a tape deck. The app is the deck. The voice models are the tapes. There are more
// than a dozen. The default tape, OmniVoice, learned from 581,000 hours of speech."
// A. The pen draws a cassette deck; its name plate reads VOICESTUDIO ("the app is the deck"). Tapes
//    slide in from the right, each labelled with a real engine; OmniVoice drops into the bay, PLAY goes
//    down, the reels turn and the VU needles move with the voice.
// B. A whip to the rack: sixteen tapes, one per speech engine in the app's catalogue. OmniVoice pulls out
//    and grows; its tape unspools across the frame as a ribbon of waveform while 581,000 hours rolls up.
import { type LineBatch } from '@engine/lines';
import { placeRow, rectPts, bezier, lengths, at } from '@kit/_vo';
import { Plate, ARCH, lineRows, pt, clamp, ease, prog, pulse, noise1, lerp, rgba, setWorld, label, font, F, burst, type Cam } from '@kit/_mp';
import { cassette, deckFace, vu, bayOf, odometer, waveBars, speechEnv, voiceEnv, TAPE_H, DECK_H, lin } from '@ep/vs';

const D = { x: -860, y: -330, w: 1040 };
const FAN = [
  { name: 'OmniVoice', sub: 'k2-fsa', x: 330, y: -430 },
  { name: 'CosyVoice 3', sub: 'FunAudioLLM', x: 400, y: -170 },
  { name: 'VoxCPM2', sub: 'OpenBMB', x: 470, y: 90 },
];
const ENGINES = ['OmniVoice', 'CosyVoice 3', 'VoxCPM2', 'IndexTTS 2.5', 'KittenTTS', 'MLX-Audio', 'MOSS-TTS-Nano', 'GPT-SoVITS', 'sherpa-onnx', 'OmniVoice GGUF', 'Supertonic-3', 'MOSS-TTS v1.5', 'dots.tts', 'Confucius4-TTS', 'PocketTTS', 'audio.cpp'];
const RX = 2600, RY = -60, TW = 300, GAP = 34;
const rackPos = (i: number) => ({ x: RX - (4 * TW + 3 * GAP) / 2 + (i % 4) * (TW + GAP), y: RY - (4 * TW * TAPE_H + 3 * GAP) / 2 + Math.floor(i / 4) * (TW * TAPE_H + GAP) });
const BIG = { x: RX - 330, y: -330, w: 660 };

export default class Deck extends Plate {
  tB = 0;
  tIn = 0;
  ribbon: { x: number; y: number }[] = [];
  rL = new Float32Array(0);

  build() {
    const w = this.w;
    const L7 = this.take('Think of it as a tape deck', ['Think', 'tape', 'deck.', ['app', 'app'], ['deck2', 'deck.', 1], 'voice', 'models', 'tapes.']);
    const L8 = this.take('There are more than a dozen', ['There', 'dozen.', 'default', ['tape8', 'tape,'], 'OmniVoice,', 'learned', '581,000', 'hours', 'speech.']);
    this.tB = L8.start;
    this.tIn = w.tapes!.end + 0.05;
    const fam = ARCH(100, 800);
    this.kw.push(...placeRow(this.span(L7, 'Think', 'deck.'), D.x, -420, 74, fam, 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L7, 'The', 'tapes.'), D.x, 330, 50, ARCH(100, 700), 'A', { ant: 0.2 }).words);
    this.screenKw.push(...lineRows(L8.words, -860, 410, 48, ARCH(100, 700), 'B', 1720).words);
    // the pen draws the deck on "tape deck"
    const P = this.plot;
    const td = w.tape!.start - 0.1;
    const dh = D.w * DECK_H;
    P.add(rectPts(D.x, D.y, D.w, dh), td, td + 0.75, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.6, group: 'A' });
    P.add([pt(D.x + 40, D.y + dh), pt(D.x + 40, D.y + dh + 26)], td + 0.76, td + 0.8, 'plot', { pen: true, width: 2.4, group: 'A' });
    P.add([pt(D.x + D.w - 40, D.y + dh), pt(D.x + D.w - 40, D.y + dh + 26)], td + 0.82, td + 0.86, 'plot', { pen: true, width: 2.4, group: 'A' });
    // "the app": a leader to the name plate
    P.add([pt(D.x + 60, D.y - 40), pt(D.x + 60, D.y + dh * 0.06)], w.app!.start, w.app!.start + 0.2, 'signal', { pen: true, width: 2.6, group: 'A' });
    P.note('the app', D.x + 76, D.y - 46, w.app!.start + 0.1, { size: 24, col: 'signal', group: 'A' });
    P.wp(pt(D.x + D.w + 60, D.y + dh * 0.5), this.tB - 0.3, 0.1);
    // B: the ribbon path from the big tape's bottom across the frame
    const b0 = pt(BIG.x + BIG.w / 2, BIG.y + BIG.w * TAPE_H - 20);
    this.ribbon = bezier(b0, pt(b0.x + 200, b0.y + 160), pt(b0.x + 700, b0.y - 40), pt(b0.x + 1400, b0.y + 120), 80);
    this.rL = lengths(this.ribbon);

    const K = this.cam;
    K.key(this.ctx.start, D.x + 420, -80, 1.2, -0.01);
    K.key(w.deck!.end, -200, -60, 0.98, 0.0, ease.inOutCubic);
    K.key(w.tapes!.start, 0, -60, 0.92, 0.004, ease.inOutCubic);
    K.key(this.tB - 0.05, -40, -60, 0.95, 0.004, ease.linear);
    K.key(this.tB + 0.35, RX, RY + 20, 0.95, -0.006, ease.inOutExpo);
    K.key(w.default!.start, RX, RY + 20, 0.97, -0.006, ease.linear);
    K.key(w.learned!.start, RX + 380, 0, 0.92, 0.008, ease.inOutCubic);
    K.key(this.ctx.end, RX + 460, 10, 0.9, 0.01, ease.linear);
  }

  alpha(g: string, t: number) {
    if (g === 'A') return 1 - prog(t, this.tB + 0.25, this.tB + 0.4);
    if (g === 'B') return prog(t, this.tB - 0.05, this.tB + 0.15);
    return 1;
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const aA = 1 - prog(t, this.tB + 0.25, this.tB + 0.4);
    const au = this.ctx.audio;
    if (aA > 0) {
      const fa = prog(t, w.tape!.start + 0.6, w.tape!.start + 0.9) * aA;
      const playing = t > this.tIn + 0.35;
      deckFace(ctx, c, D.x, D.y, D.w, { a: fa, name: t > w.app!.start ? 'VoiceStudio  ·  the app' : 'tape deck', press: playing ? 1 : undefined, play: playing ? 1 : 0 });
      const lvl = playing ? voiceEnv(au, t) : 0;
      vu(ctx, c, D.x + D.w * 0.6, D.y + D.w * DECK_H * 0.25, 180, lvl * 0.9, { a: fa, name: 'L' });
      vu(ctx, c, D.x + D.w * 0.6 + 200, D.y + D.w * DECK_H * 0.25, 180, voiceEnv(au, t - 0.04) * 0.85 * (playing ? 1 : 0), { a: fa, name: 'R' });
      // tapes slide in on "tapes", OmniVoice then drops into the bay
      FAN.forEach((f, i) => {
        const ts = w.voice!.start + i * 0.12;
        const s = ease.outCubic(prog(t, ts, ts + 0.35));
        if (s <= 0) return;
        let x = lerp(f.x + 900, f.x, s), y = f.y, ww = 420;
        if (i === 0) {
          const k = ease.inOutCubic(prog(t, this.tIn, this.tIn + 0.35));
          const b = bayOf(D.x, D.y, D.w);
          x = lerp(x, b.x, k); y = lerp(y, b.y, k); ww = lerp(420, b.w, k);
        }
        const spin = i === 0 && playing ? (t - this.tIn) * 5 : 0;
        cassette(ctx, c, x, y, ww, { a: aA, label: f.name, sub: f.sub, tag: i === 0 ? 'DEFAULT' : '', spin, hot: i === 0 ? pulse(t, this.tIn + 0.35, 0.3) : 0 });
      });
    }
    // B: the rack
    const aB = prog(t, this.tB - 0.05, this.tB + 0.15);
    if (aB > 0) {
      const pull = ease.inOutCubic(prog(t, w.default!.start, w.omnivoice!.end));
      // the rack first, OmniVoice (index 0) last so it sits on top as it grows
      [...ENGINES.keys()].slice(1).concat(0).forEach((i) => {
        const name = ENGINES[i]!;
        const p = rackPos(i);
        const ti = this.tB + 0.25 + i * 0.03;
        const a = prog(t, ti, ti + 0.15) * aB;
        if (a <= 0) return;
        if (i === 0) {
          const x = lerp(p.x, BIG.x, pull), y = lerp(p.y, BIG.y, pull), ww = lerp(TW, BIG.w, pull);
          const spin = t > w.learned!.start ? (t - w.learned!.start) * 4 : 0;
          cassette(ctx, c, x, y, ww, { a, label: name, sub: pull > 0.5 ? 'k2-fsa  ·  0.6B parameters' : 'default', tag: 'DEFAULT', spin, hot: pulse(t, w.default!.start, 0.4) });
        } else {
          cassette(ctx, c, p.x, p.y, TW, { a: a * (1 - 0.75 * pull), label: name, sub: 'speech engine', dim: 1 - 0.4 * pull });
        }
      });
      const ca = prog(t, this.tB + 0.3, this.tB + 0.6) * (1 - pull);
      if (ca > 0) {
        setWorld(ctx, c, RX, RY - 330);
        label(ctx, '16 SPEECH ENGINES IN THE APP’S CATALOGUE', 0, 0, { size: 22, col: rgba('ash', ca), spacing: 4, align: 'center' });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // the hours
      const ha = prog(t, w['581000']!.start - 0.1, w['581000']!.start + 0.1);
      if (ha > 0) {
        const v = 581489 * ease.outCubic(prog(t, w['581000']!.start, w.speech!.end));
        odometer(ctx, c, v, BIG.x + BIG.w + 90, -200, 112, { a: ha, col: 'signal' });
        setWorld(ctx, c, BIG.x + BIG.w + 96, -140);
        label(ctx, 'HOURS OF SPEECH IN ITS TRAINING DATA', 0, 0, { size: 21, col: rgba('ash', ha), spacing: 4 });
        label(ctx, '= 66 YEARS, NON-STOP', 0, 36, { size: 21, col: rgba('bone', ha * prog(t, w.speech!.start, w.speech!.end)), spacing: 4 });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    const w = this.w;
    // the ribbon unspools on "learned"
    const k = prog(t, w.learned!.start, w.speech!.end + 0.4, ease.outCubic);
    if (k > 0 && this.rL.length) {
      const tot = this.rL[this.rL.length - 1]!;
      const len = tot * k;
      const n = 140;
      for (let i = 0; i < n; i++) {
        const s = (i / n) * tot;
        if (s > len) break;
        const q = at(this.ribbon, this.rL, s);
        const nx = -Math.sin(q.a), ny = Math.cos(q.a);
        const amp = 26 * Math.max(0.06, speechEnv(i * 0.09 - t * 2.2, 21));
        const p0 = c.z, h0 = [q.x + nx * amp, q.y + ny * amp], h1 = [q.x - nx * amp, q.y - ny * amp];
        const A = this.w2(c, h0[0]!, h0[1]!), B = this.w2(c, h1[0]!, h1[1]!);
        X.seg2(A[0], A[1], B[0], B[1], 3.4 * p0, lin('signal', 1.2), 1);
      }
      // the tape's edges
      let prev: [number, number] | null = null;
      for (let i = 0; i <= 120; i++) {
        const s = (i / 120) * len;
        const q = at(this.ribbon, this.rL, s);
        const p = this.w2(c, q.x - Math.sin(q.a) * 34, q.y + Math.cos(q.a) * 34);
        if (prev) X.seg2(prev[0], prev[1], p[0], p[1], 1.4 * c.z, lin('ash', 0.6), 0.8);
        prev = p;
      }
    }
    // the deck's tape plays: a small trace in the bay window area
    if (t > this.tIn + 0.35 && t < this.tB + 0.4) {
      const b = bayOf(D.x, D.y, D.w);
      waveBars(X, c, b.x, b.x + b.w, D.y + D.w * DECK_H + 70, 26, 60, (u) => voiceEnv(this.ctx.audio, t - (1 - u) * 1.0), { I: 0.9, alpha: 1 - prog(t, this.tB + 0.25, this.tB + 0.4) });
    }
    burst(X, c, pt(BIG.x + BIG.w / 2, BIG.y + 30), t, w.omnivoice!.start + 0.1, 40, 8, 0.7);
    void clamp; void noise1;
  }

  w2(c: Cam, x: number, y: number): [number, number] {
    const dx = (x - c.cx) * c.z, dy = (y - c.cy) * c.z;
    const co = Math.cos(c.roll), si = Math.sin(c.roll);
    return [this.ctx.W / 2 + co * dx - si * dy, this.ctx.H / 2 + si * dx + co * dy];
  }

  postFX(t: number) {
    const hit = pulse(t, this.tIn + 0.35, 0.08) + pulse(t, this.w.omnivoice!.start + 0.1, 0.08);
    return { zoom: 1 + 0.015 * hit };
  }
}
void font; void F;
