// DESKTOP: the whole PPT Master Short on one 90s desktop (theme `retro`). Teal wallpaper, icons, a taskbar and
// a clock at 11:58 PM. Windows pop open with the old zoom-outline on the beats of the narration:
//   1. a Reminder dialog (Presentation due: TOMORROW 9:00 AM) and an empty presentation.pptx;
//   2. the PPT Master window converting report.pdf → deck.pptx while a deck window fills with slides;
//   3. a screenshot.png struck out, then a real slide with selection handles, a chart, a table, animations;
//   4. a chat with the agent: "turn this into a PPT" types in, "On it." comes back;
//   5. an About box: PPT Master, ★ 59,000 GitHub stars, MIT;
//   6. Shut Down?: "Go to sleep?" [Yes] [Yes] → the screen goes dark with a moon.
// Captions are meme-style at the top: white heavy type with a black outline, the spoken word in yellow.
import type { Cam } from '@kit/_vo';
import type { Line, Word } from '@engine/lyrics';
import { W, H } from '@engine/gl';
import { F, font, measure } from '@engine/type';
import { clamp, ease, springStep, TAU } from '@engine/util';
import { Plate } from '@kit/_mp';

const TEAL = '#008080', GREY = '#C0C0C0', DARK = '#808080', NAVY = '#000080', WHITE = '#FFFFFF', BLACK = '#000000', YEL = '#FFE500', RED = '#E01B1B';
const UI = F.archivo(100, 700), UIB = F.archivo(100, 900), MONO = F.mono(600), MEME = F.archivo(75, 900);

interface Win { t0: number; t1: number; x: number; y: number; w: number; h: number; title: string; draw: (g: CanvasRenderingContext2D, w: number, h: number, t: number) => void; z: number }

function bevel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, inset = false) {
  g.fillStyle = GREY; g.fillRect(x, y, w, h);
  g.fillStyle = inset ? DARK : WHITE; g.fillRect(x, y, w, 4); g.fillRect(x, y, 4, h);
  g.fillStyle = inset ? WHITE : '#404040'; g.fillRect(x, y + h - 4, w, 4); g.fillRect(x + w - 4, y, 4, h);
}
function button(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, pressed = false) {
  bevel(g, x, y, w, h, pressed);
  g.font = font(UI, 34); g.fillStyle = BLACK; g.textAlign = 'center'; g.fillText(label, x + w / 2, y + h / 2 + 12); g.textAlign = 'left';
}
function progress(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number) {
  bevel(g, x, y, w, h, true);
  const n = Math.floor(((w - 16) / 30) * clamp(k));
  g.fillStyle = NAVY; for (let i = 0; i < n; i++) g.fillRect(x + 8 + i * 30, y + 8, 24, h - 16);
}
function miniSlide(g: CanvasRenderingContext2D, x: number, y: number, w: number, i: number) {
  const h = w * 9 / 16;
  g.fillStyle = WHITE; g.fillRect(x, y, w, h); g.strokeStyle = BLACK; g.lineWidth = 2; g.strokeRect(x, y, w, h);
  const col = ['#E8542F', '#3D5AFE', '#13A89E'][i % 3]!;
  g.fillStyle = col; g.fillRect(x + w * 0.08, y + h * 0.12, w * 0.5, h * 0.12);
  if (i % 3 === 0) { [0.4, 0.7, 0.55, 0.9].forEach((v, k) => { g.fillStyle = k === 3 ? col : '#BBBBBB'; g.fillRect(x + w * (0.12 + k * 0.2), y + h * (0.88 - 0.5 * v), w * 0.12, h * 0.5 * v); }); }
  else if (i % 3 === 1) { for (let k = 0; k < 3; k++) { g.fillStyle = '#CCCCCC'; g.fillRect(x + w * 0.12, y + h * (0.38 + k * 0.17), w * (0.7 - k * 0.12), h * 0.08); } }
  else { for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) { g.fillStyle = r === 0 ? col : '#DDDDDD'; g.fillRect(x + w * (0.1 + q * 0.27), y + h * (0.35 + r * 0.18), w * 0.25, h * 0.15); } }
}

export default class Desktop extends Plate {
  override paper = true;
  override showPen = false;
  wins: Win[] = [];
  L: Line[] = [];

  build() {
    const L = this.ctx.lyrics.lines;
    this.L = L;
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
    const line = (q: string) => { const l = L.find((ln) => norm(ln.text).includes(norm(q))); if (!l) throw new Error(`desktop: no line "${q}"`); return l; };
    const word = (l: Line, q: string, n = 0) => { const ws = l.words.filter((w) => norm(w.w) === norm(q)); if (!ws[n]) throw new Error(`desktop: no word "${q}"`); return ws[n]!; };
    const l1 = line('POV'), l2 = line('This free AI tool'), l3 = line('Not screenshots'), l4 = line('Your AI agent'), l5 = line("It's called"), l6 = line("You'll still polish");
    const due = word(l1, 'due'), started = word(l1, 'started.');
    const turns = word(l2, 'turns'), real = word(l2, 'real');
    const shots = word(l3, 'screenshots'), editable = word(l3, 'editable'), charts = word(l3, 'charts,'), tables = word(l3, 'tables'), anims = word(l3, 'animations.');
    const type = word(l4, 'type:'), agent = word(l4, 'agent');
    const called = word(l5, 'called'), stars = word(l5, 'stars.');
    const polish = word(l6, 'polish'), sleep = word(l6, 'sleep.');
    const END = this.ctx.end;
    this.wins = [
      { t0: 0.12, t1: turns.start - 0.1, x: -470, y: -470, w: 940, h: 420, title: 'Reminder', z: 2, draw: (g, w, h, t) => {
        g.fillStyle = YEL; g.beginPath(); g.moveTo(90, 90); g.lineTo(160, 210); g.lineTo(20, 210); g.closePath(); g.fill(); g.strokeStyle = BLACK; g.lineWidth = 4; g.stroke();
        g.font = font(UIB, 80); g.fillStyle = BLACK; g.fillText('!', 78, 196);
        g.font = font(UI, 40); g.fillText('Presentation due:', 200, 120);
        g.font = font(UIB, 52); g.fillStyle = RED; g.fillText('TOMORROW 9:00 AM', 200, 190);
        button(g, 160, h - 120, 260, 76, 'Snooze'); button(g, 480, h - 120, 260, 76, 'Panic', (t * 3) % 1 < 0.5);
        void w;
      } },
      { t0: started.start - 0.1, t1: turns.start + 0.4, x: -440, y: 30, w: 880, h: 560, title: 'presentation.pptx', z: 1, draw: (g, w, h) => {
        g.fillStyle = WHITE; g.fillRect(30, 30, w - 60, h - 110);
        g.setLineDash([12, 10]); g.strokeStyle = DARK; g.lineWidth = 3; g.strokeRect(80, 120, w - 160, 140); g.setLineDash([]);
        g.font = font(UI, 40); g.fillStyle = DARK; g.textAlign = 'center'; g.fillText('Click to add title', w / 2, 205);
        g.font = font(UIB, 36); g.fillStyle = BLACK; g.fillText('Slide 0 of 0', w / 2, h - 34); g.textAlign = 'left';
      } },
      { t0: turns.start - 0.1, t1: shots.start - 0.05, x: -470, y: -560, w: 940, h: 380, title: 'PPT Master', z: 3, draw: (g, w, _h, t) => {
        g.font = font(MONO, 34); g.fillStyle = BLACK; g.fillText('report.pdf  →  deck.pptx', 40, 90);
        progress(g, 40, 130, w - 80, 70, (t - turns.start) / Math.max(0.6, real.end + 0.6 - turns.start));
        g.font = font(UI, 32); g.fillText(`Building slides... ${Math.min(10, Math.max(0, Math.floor((t - turns.start) * 4)))} of 10`, 40, 270);
      } },
      { t0: turns.start + 0.25, t1: agent.start - 0.1, x: -470, y: -140, w: 940, h: 760, title: 'deck.pptx', z: 2, draw: (g, w, _h, t) => {
        g.fillStyle = '#808080'; g.fillRect(24, 24, w - 48, 650);
        const n = Math.min(9, Math.max(0, Math.floor((t - turns.start - 0.3) * 4.5)));
        for (let i = 0; i < n; i++) miniSlide(g, 50 + (i % 3) * 285, 50 + Math.floor(i / 3) * 190, 260, i);
        if (t > editable.start - 0.05) {
          const x = 50, y = 50, sw = 260, sh = 146;
          g.strokeStyle = '#0060FF'; g.lineWidth = 4; g.setLineDash([10, 6]); g.strokeRect(x - 6, y - 6, sw + 12, sh + 12); g.setLineDash([]);
          g.fillStyle = WHITE; for (const [hx, hy] of [[0, 0], [sw, 0], [0, sh], [sw, sh]]) { g.fillRect(x - 6 + hx! - 8, y - 6 + hy! - 8, 16, 16); g.strokeRect(x - 6 + hx! - 8, y - 6 + hy! - 8, 16, 16); }
          g.font = font(UIB, 30); g.fillStyle = YEL; g.fillText('EDITABLE', x + 20, y + sh + 50);
        }
        const tags: [string, number, number][] = [['CHARTS', charts.start, 0], ['TABLES', tables.start, 1], ['ANIMATIONS', anims.start, 2]];
        tags.forEach(([s, t0, i]) => { if (t > t0 - 0.05) { bevel(g, 330 + i * 0, 420 + i * 70, 400, 60); g.font = font(UIB, 32); g.fillStyle = BLACK; g.fillText(`✓ ${s}`, 350, 462 + i * 70); } });
      } },
      { t0: shots.start - 0.05, t1: editable.start, x: -300, y: -520, w: 600, h: 400, title: 'screenshot.png', z: 4, draw: (g, w, h, t) => {
        g.fillStyle = '#444466'; g.fillRect(24, 24, w - 48, h - 104);
        g.font = font(UI, 30); g.fillStyle = '#AAAACC'; g.textAlign = 'center'; g.fillText('flat picture of a slide', w / 2, h / 2 - 20); g.textAlign = 'left';
        const k = clamp((t - shots.start - 0.15) / 0.25);
        g.strokeStyle = RED; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, 40); g.lineTo(40 + (w - 80) * k, 40 + (h - 120) * k); g.stroke(); g.lineCap = 'butt';
      } },
      { t0: agent.start - 0.1, t1: called.start - 0.05, x: -470, y: -480, w: 940, h: 900, title: 'Agent Chat', z: 3, draw: (g, w, _h, t) => {
        g.fillStyle = WHITE; g.fillRect(24, 24, w - 48, 700);
        g.font = font(MONO, 34); g.fillStyle = BLACK; g.fillText('agent: Ready. Drop a file or paste text.', 44, 80);
        const msg = 'you: turn this into a PPT';
        const n = Math.ceil(msg.length * clamp((t - type.start) / 1.0));
        if (n > 0) { g.fillStyle = NAVY; g.fillText(msg.slice(0, n), 44, 150); }
        if (t > type.start + 1.1) { g.fillStyle = BLACK; g.fillText('agent: On it.', 44, 220); }
        if (t > type.start + 1.4) { g.fillStyle = '#006600'; g.fillText('agent: Confirming the design spec...', 44, 290); }
        bevel(g, 24, 744, w - 48, 90, true);
        g.fillStyle = BLACK; g.fillText(t > type.start ? '' : '_', 50, 800);
      } },
      { t0: called.start - 0.05, t1: polish.start - 0.15, x: -420, y: -380, w: 840, h: 700, title: 'About PPT Master', z: 4, draw: (g, w, h, t) => {
        g.font = font(UIB, 96); g.fillStyle = NAVY; g.fillText('PPT Master', 60, 170);
        g.font = font(UI, 36); g.fillStyle = BLACK; g.fillText('AI → native, editable PowerPoint', 60, 240);
        const k = ease.outCubic(clamp((t - stars.start + 0.6) / 0.8));
        g.font = font(UIB, 76); g.fillStyle = '#C08A00'; g.fillText(`★ ${Math.round(59000 * k).toLocaleString('en-US')}`, 60, 360);
        g.font = font(UI, 34); g.fillStyle = BLACK; g.fillText('GitHub stars · MIT License · free', 60, 420);
        button(g, w / 2 - 130, h - 116, 260, 80, 'OK');
      } },
      { t0: polish.start - 0.1, t1: END + 1, x: -420, y: -300, w: 840, h: 520, title: 'Shut Down', z: 5, draw: (g, w, h, t) => {
        g.font = font(UIB, 56); g.fillStyle = BLACK; g.fillText('Go to sleep?', 60, 150);
        g.font = font(UI, 34); g.fillText('The deck can wait for a polish.', 60, 220);
        const press = t > sleep.start - 0.2;
        button(g, 120, h - 150, 260, 84, 'Yes', press); button(g, 460, h - 150, 260, 84, 'Yes');
        void w;
      } },
    ];
    this.cam.key(0, 0, 0, 1, 0);
  }
  override camAt(_t: number): Cam { return { cx: 0, cy: 0, z: 1, roll: 0 }; }

  override drawUI(ctx: CanvasRenderingContext2D, t: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // wallpaper (a little dither) and icons
    ctx.fillStyle = TEAL; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let y = 0; y < H; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < W; x += 6) ctx.fillRect(x, y, 2, 2);
    const icons: [string, string][] = [['report.pdf', '#E01B1B'], ['presentation.pptx', '#D24726'], ['Recycle Bin', '#C0C0C0']];
    icons.forEach(([name, col], i) => {
      const x = 70, y = 470 + i * 230;
      ctx.fillStyle = WHITE; ctx.fillRect(x + 20, y, 110, 130); ctx.fillStyle = col; ctx.fillRect(x + 20, y + 80, 110, 50);
      ctx.strokeStyle = BLACK; ctx.lineWidth = 3; ctx.strokeRect(x + 20, y, 110, 130);
      ctx.font = font(UI, 28); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.fillText(name, x + 75, y + 175); ctx.textAlign = 'left';
    });
    // desktop widgets: a big clock and a sticky note
    {
      const mins = t < this.ctx.end - 2.6 ? '11:58' : '11:59';
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(70 + 10, H - 520 + 10, 420, 220);
      bevel(ctx, 70, H - 520, 420, 220, true);
      ctx.fillStyle = '#001800'; ctx.fillRect(86, H - 504, 388, 188);
      ctx.font = font(MONO, 120); ctx.fillStyle = '#39FF6A'; ctx.fillText(mins, 104, H - 360);
      ctx.font = font(MONO, 26); ctx.fillText('PM · DEADLINE 9:00 AM', 104, H - 328, 352);
      const nx = W - 470, ny = H - 560;
      ctx.save(); ctx.translate(nx + 200, ny + 190); ctx.rotate(0.05);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-190, -170, 400, 360);
      ctx.fillStyle = '#FFF27A'; ctx.fillRect(-200, -180, 400, 360);
      ctx.font = font(UIB, 52); ctx.fillStyle = BLACK; ctx.fillText('TODO:', -160, -90);
      ctx.font = font(UI, 46); ctx.fillText('12 slides!!', -160, -10); ctx.fillText('sleep?', -160, 70);
      const done = clamp((t - (this.L[1]?.end ?? 1e9)) / 0.3);
      if (done > 0) { ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-170, -26); ctx.lineTo(-170 + 260 * done, -26); ctx.stroke(); }
      ctx.restore();
    }
    // windows, by stacking order
    const live = this.wins.filter((w) => t >= w.t0 && t < w.t1 + 0.12).sort((a, b) => a.z - b.z || a.t0 - b.t0);
    for (const wn of live) {
      const open = clamp((t - wn.t0) / 0.14), close = clamp((wn.t1 + 0.12 - t) / 0.12);
      const cx = W / 2 + wn.x + wn.w / 2, cy = H / 2 + wn.y + wn.h / 2;
      if (open < 1) {
        // the zoom-outline
        const s = 0.2 + 0.8 * open;
        ctx.strokeStyle = BLACK; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.strokeRect(cx - wn.w * s / 2, cy - wn.h * s / 2, wn.w * s, wn.h * s); ctx.setLineDash([]);
        continue;
      }
      ctx.save(); ctx.globalAlpha = close;
      ctx.translate(W / 2 + wn.x, H / 2 + wn.y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(14, 14, wn.w, wn.h);
      bevel(ctx, 0, 0, wn.w, wn.h);
      const bar = ctx.createLinearGradient(0, 0, wn.w, 0); bar.addColorStop(0, NAVY); bar.addColorStop(1, '#1084D0');
      ctx.fillStyle = bar; ctx.fillRect(8, 8, wn.w - 16, 64);
      ctx.font = font(UIB, 34); ctx.fillStyle = WHITE; ctx.fillText(wn.title, 26, 52);
      bevel(ctx, wn.w - 70, 16, 50, 46); ctx.font = font(UIB, 30); ctx.fillStyle = BLACK; ctx.fillText('×', wn.w - 56, 50);
      ctx.translate(8, 76);
      wn.draw(ctx, wn.w - 16, wn.h - 84, t);
      ctx.restore();
    }
    // taskbar and clock
    bevel(ctx, 0, H - 96, W, 96);
    bevel(ctx, 12, H - 84, 200, 72); ctx.font = font(UIB, 36); ctx.fillStyle = BLACK; ctx.fillText('Start', 70, H - 34);
    bevel(ctx, W - 230, H - 84, 218, 72, true); ctx.font = font(UI, 32); ctx.fillText(t < this.ctx.end - 2.6 ? '11:58 PM' : '11:59 PM', W - 205, H - 36);
    // night falls on "sleep"
    const sl = this.wins[this.wins.length - 1]!;
    const nk = clamp((t - (this.L[this.L.length - 1]!.words.at(-1)!.start - 0.1)) / 0.5);
    if (nk > 0) {
      ctx.fillStyle = `rgba(4,6,24,${0.9 * nk})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,236,170,${nk})`; ctx.beginPath(); ctx.arc(W / 2, H / 2 - 120, 140, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(4,6,24,${nk})`; ctx.beginPath(); ctx.arc(W / 2 + 60, H / 2 - 160, 130, 0, TAU); ctx.fill();
      ctx.font = font(UIB, 80); ctx.fillStyle = `rgba(255,255,255,${nk})`; ctx.textAlign = 'center'; ctx.fillText('Goodnight.', W / 2, H / 2 + 140); ctx.textAlign = 'left';
    }
    void sl; void springStep;
  }

  override drawTop(ctx: CanvasRenderingContext2D, t: number) {
    // meme captions at the top: the current phrase, the spoken word in yellow
    const words: Word[] = this.L.flatMap((l) => l.words);
    const chunks: Word[][] = [];
    let cur: Word[] = [];
    for (const w of words) { cur.push(w); if (cur.length >= 4 || /[.,:?!]$/.test(w.w)) { chunks.push(cur); cur = []; } }
    if (cur.length) chunks.push(cur);
    const ch = chunks.find((c, i) => t >= c[0]!.start - 0.05 && t < (chunks[i + 1]?.[0]!.start ?? this.ctx.end) - 0.05);
    if (!ch) return;
    const text = ch.map((w) => w.w.toUpperCase());
    let size = 92;
    const sp = () => measure(' ', MEME, size) + size * 0.16;
    let width = text.reduce((a, s) => a + measure(s, MEME, size), 0) + sp() * (text.length - 1);
    if (width > W - 100) { size *= (W - 100) / width; width = W - 100; }
    let x = W / 2 - width / 2;
    const y = 300;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = font(MEME, size); ctx.lineJoin = 'round'; ctx.textBaseline = 'alphabetic';
    ch.forEach((w, i) => {
      const s = text[i]!, tw = measure(s, MEME, size);
      const on = t >= w.start - 0.03;
      const pop = on ? 1 + 0.15 * (1 - ease.outCubic(clamp((t - w.start + 0.03) / 0.1))) : 1;
      ctx.save(); ctx.translate(x + tw / 2, y); ctx.scale(pop, pop);
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = BLACK; ctx.strokeText(s, -tw / 2, 0);
      ctx.fillStyle = on && t < (ch[i + 1]?.start ?? 1e9) ? YEL : WHITE; ctx.fillText(s, -tw / 2, 0);
      ctx.restore();
      x += tw + sp();
    });
  }

  override postFX() { return { vignette: 0.15, grain: 0.04, bloom: 0.05, paper: 0 }; }
}
