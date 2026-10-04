// TITLE: "It's called VoiceStudio. It clones voices, designs new ones, and dubs videos into other
// languages."
// VOICESTUDIO lands letter by letter (Archivo stepping out through its widths), with who made it. The
// real app slides in on the right in a window, and on each verb it switches to that workspace's own
// screenshot (from the project's README) while a card for the verb drops in under the name.
import { type LineBatch } from '@engine/lines';
import { layout } from '@engine/type';
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, drawWindow, pt, clamp, ease, prog, pulse, noise1, rgba, mixCss, setWorld, font, F, label, burst, type Cam } from '@kit/_mp';
import { waveBars, speechEnv, lin } from '@ep/vs';

const WIDTHS = [62, 75, 87.5, 100];
const SHOT = { x: 140, y: -330, w: 800, h: 533 + 50 };
const CARD = { y: 60, w: 270, h: 230, gap: 26, x0: -890 };

export default class Title extends Plate {
  shots: Record<string, HTMLImageElement | null> = {};
  size = 116;
  verbs: { key: string; name: string; sub: string; t: number }[] = [];

  override async init() {
    const load = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    for (const k of ['clone', 'design', 'dub']) this.shots[k] = await load(`data/shot-${k}.png`);
    super.init();
  }

  build() {
    const w = this.w;
    const L = this.take("It's called VoiceStudio", [['its', "It's"], 'called', 'VoiceStudio.', 'It', 'clones', 'voices,', 'designs', 'new', 'ones,', 'and', 'dubs', 'videos', 'into', 'other', 'languages.']);
    this.kw.push(...placeRow([w.its!, w.called!], -890, -350, 58, ARCH(100, 700), 'A', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'It', 'languages.'), -890, 410, 46, ARCH(100, 700), 'B', { ant: 0.2 }).words);
    this.verbs = [
      { key: 'clone', name: 'CLONE', sub: 'a voice from a clip', t: w.clones!.start },
      { key: 'design', name: 'DESIGN', sub: 'a voice from words', t: w.designs!.start },
      { key: 'dub', name: 'DUB', sub: 'a video, re-voiced', t: w.dubs!.start },
    ];
    // the pen underlines the name, then ticks each card in
    const P = this.plot;
    const vs = w.voicestudio!;
    P.add([pt(-890, -150), pt(-890 + 1.0 * this.nameWidth(), -156)], vs.end - 0.05, vs.end + 0.3, 'signal', { pen: true, ez: ease.inOutQuad, width: 4, group: 'A' });
    this.verbs.forEach((v, i) => {
      const x = CARD.x0 + i * (CARD.w + CARD.gap);
      P.add([pt(x, CARD.y + CARD.h + 18), pt(x + CARD.w, CARD.y + CARD.h + 18)], v.t, v.t + 0.25, 'signal', { pen: true, ez: ease.inOutQuad, width: 3, group: 'B' });
    });
    P.wp(pt(SHOT.x - 30, SHOT.y + SHOT.h + 40), this.ctx.end - 0.1, 0.1);

    const K = this.cam;
    K.key(this.ctx.start, -500, -160, 1.28, -0.01);
    K.key(vs.start + 0.2, -420, -150, 1.2, -0.006, ease.outCubic);
    K.key(w.it!.start + 0.1, 0, 20, 0.97, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 10, 25, 1.0, 0.004, ease.linear);
  }

  nameWidth() { return (layout('VOICESTUDIO', ARCH(100, 900), 100).width / 100) * this.size; }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const word = w.voicestudio!;
    // VOICESTUDIO, letter by letter
    if (t > word.start - 0.02) {
      const lay = layout('VOICESTUDIO', ARCH(100, 900), 100);
      const n = lay.glyphs.length, dur = Math.max(0.35, word.end - word.start);
      lay.glyphs.forEach((g, i) => {
        const ti = word.start + (i / n) * dur * 0.75;
        if (t < ti) return;
        const age = t - ti, k = ease.outExpo(clamp(age / 0.3));
        const fam = ARCH(WIDTHS[Math.min(3, Math.floor(k * 3.999))]!, 900);
        const cx = -890 + ((g.x + g.w / 2) / 100) * this.size;
        const gw = layout(g.ch, fam, 100).width;
        ctx.font = font(fam, 100);
        setWorld(ctx, c, cx - (gw / 2 / 100) * this.size, -180 + (1 - ease.outCubic(clamp(age / 0.25))) * -20, this.size / 100);
        const hot = Math.pow(0.5, age / 0.09), cool = prog(t, ti + 0.05, ti + 0.6);
        // VOICE stays bone, STUDIO cools to the trace colour
        const fin = i < 5 ? 'bone' : 'signal';
        ctx.fillStyle = hot > 0.08 ? mixCss('ember', 'signal', 1 - hot) : mixCss('signal', fin, cool);
        ctx.fillText(g.ch, 0, 0);
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const ia = prog(t, word.end, word.end + 0.3);
      if (ia > 0) {
        setWorld(ctx, c, -886, -96);
        ctx.globalAlpha = ia;
        ctx.font = font(F.mono(400), 26); ctx.fillStyle = rgba('ash', 1); ctx.fillText('github.com/debpalash/VoiceStudio', 0, 0);
        ctx.font = font(F.mono(500), 26); ctx.fillStyle = rgba('bone', 0.9); ctx.fillText('by Palash Debnath  ·  open source (AGPL-3.0)', 0, 40);
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // the window with the real app
    const wa = prog(t, word.start + 0.1, word.start + 0.5, ease.outCubic);
    if (wa > 0) {
      const slide = (1 - wa) * 260;
      let cur = 'clone';
      for (const v of this.verbs) if (t >= v.t - 0.05) cur = v.key;
      const sw = this.verbs.find((v) => v.key === cur)!;
      const flash = t >= sw.t - 0.05 ? pulse(t, sw.t - 0.05, 0.1) : 0;
      drawWindow(ctx, c, SHOT.x + slide, SHOT.y, SHOT.w, SHOT.h, `VoiceStudio — ${cur === 'clone' ? 'Voice cloning' : cur === 'design' ? 'Voice design' : 'Video dubbing'}`, { a: wa });
      const img = this.shots[cur];
      if (img) {
        setWorld(ctx, c, SHOT.x + slide, SHOT.y + 50);
        ctx.globalAlpha = wa;
        ctx.drawImage(img, 0, 0, SHOT.w, SHOT.h - 50);
        if (flash > 0.01) { ctx.fillStyle = rgba('signal', 0.25 * flash); ctx.fillRect(0, 0, SHOT.w, SHOT.h - 50); }
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      setWorld(ctx, c, SHOT.x + slide, SHOT.y + SHOT.h + 34);
      label(ctx, "THE REAL APP · SCREENSHOTS FROM THE PROJECT'S README", 0, 0, { size: 16, col: rgba('ash', 0.8 * wa), spacing: 3 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the verb cards
    this.verbs.forEach((v, i) => {
      const a = prog(t, v.t - 0.08, v.t + 0.12);
      if (a <= 0) return;
      const x = CARD.x0 + i * (CARD.w + CARD.gap);
      const drop = (1 - ease.outBack(clamp((t - v.t + 0.08) / 0.3))) * -40;
      const hot = pulse(t, v.t, 0.25);
      setWorld(ctx, c, x, CARD.y + drop);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba('ink2', 0.95); ctx.fillRect(0, 0, CARD.w, CARD.h);
      ctx.strokeStyle = mixCss('bone', 'signal', Math.max(hot, 0.35), 0.85); ctx.lineWidth = 1.6; ctx.strokeRect(0, 0, CARD.w, CARD.h);
      ctx.font = font(ARCH(112.5, 900), 46); ctx.fillStyle = mixCss('signal', 'bone', 1 - hot, 1); ctx.fillText(v.name, 22, 64);
      ctx.font = font(F.mono(400), 19); ctx.fillStyle = rgba('ash', 1); ctx.fillText(v.sub, 22, 98);
      label(ctx, `0${i + 1}`, CARD.w - 46, 30, { size: 14, col: rgba('signal', 0.9), spacing: 2 });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }

  drawFX(X: LineBatch, t: number, c: Cam) {
    // a tiny waveform inside each card: two identical ones for CLONE, one being shaped for DESIGN, two languages for DUB
    this.verbs.forEach((v, i) => {
      const a = prog(t, v.t, v.t + 0.3);
      if (a <= 0) return;
      const x = CARD.x0 + i * (CARD.w + CARD.gap) + 22, y = CARD.y + 160, wd = CARD.w - 44;
      if (v.key === 'clone') {
        waveBars(X, c, x, x + wd * 0.46, y, 34, 18, (u) => speechEnv(u * 2, 5), { to: a, I: 1.1 });
        waveBars(X, c, x + wd * 0.54, x + wd, y, 34, 18, (u) => speechEnv(u * 2, 5), { to: prog(t, v.t + 0.25, v.t + 0.6), I: 1.1 });
      } else if (v.key === 'design') {
        const k = prog(t, v.t, v.t + 0.9);
        waveBars(X, c, x, x + wd, y, 34, 36, (u) => speechEnv(u * 3 + k * 2, 9) * (0.4 + 0.6 * k), { to: a, I: 1.1 });
      } else {
        waveBars(X, c, x, x + wd, y - 18, 18, 36, (u) => speechEnv(u * 3, 11), { to: a, I: 0.8, col: lin('ash') });
        waveBars(X, c, x, x + wd, y + 22, 18, 36, (u) => speechEnv(u * 3, 12), { to: prog(t, v.t + 0.2, v.t + 0.7), I: 1.1 });
      }
    });
    burst(X, c, pt(-890 + this.nameWidth() * 0.5, -230), t, this.w.voicestudio!.start + 0.15, 46, 2, 0.9);
    void noise1;
  }

  postFX(t: number) {
    const w = this.w;
    const hit = pulse(t, w.voicestudio!.start + 0.12, 0.08);
    return { zoom: 1 + 0.02 * hit, shake: [6 * hit * noise1(t * 50, 1), 6 * hit * noise1(t * 50, 2)] as [number, number] };
  }
}
