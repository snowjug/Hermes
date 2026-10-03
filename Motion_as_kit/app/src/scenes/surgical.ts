// SURGICAL: "And when it edits a config file, it changes only the one setting you picked. Your comments
// survive."
// Bone paper: a Codex config file with the owner's comments. On "changes only the one setting" the pen
// strikes the model value and the new one is typed beside it; "1 key changed". On "comments survive"
// every comment line gets a tick in the margin.
import { placeRow } from './_vo';
import { Plate, ARCH, typed, pt, ease, prog, pulse, rgba, setWorld, font, F, label, measure, type Cam } from './_mp';

const DOC = [
  '# Codex: my defaults',
  'model = "gpt-6-astra"',
  'model_reasoning_effort = "medium"   # fast enough',
  '',
  '# projects I trust',
  '[projects."/home/me/app"]',
  '    trust_level = "trusted"',
];
const DX = -580, DY = -250, LH = 58, FS = 32;
const lineY = (i: number) => DY + 70 + i * LH;

export default class Surgical extends Plate {
  paper = true;
  tCut = 0; tNew = 0;

  build() {
    const w = this.w;
    const L = this.take('And when it edits', ['And', 'when', ['it1', 'it', 0], 'edits', 'a', 'config', 'file,', ['it2', 'it', 1], 'changes', 'only', 'the', 'one', 'setting', 'you', 'picked.', 'Your', 'comments', 'survive.']);
    const fam = ARCH(100, 700);
    this.kw.push(...placeRow(this.span(L, 'And', 'file,'), -780, -420, 56, fam, 'K', { ant: 0.2 }).words);
    this.kw.push(...placeRow(this.span(L, 'it', 'picked.', 1), -780, -352, 56, fam, 'K', { ant: 0.2 }).words);
    const r3 = placeRow([w.your!, w.comments!, w.survive!], -360, 380, 72, ARCH(100, 800), 'K', { ant: 0.2 });
    this.kw.push(...r3.words);
    this.tCut = w.only!.start;
    this.tNew = w.setting!.start;
    // strike the old value
    const fam30 = F.mono(400);
    const x0 = DX + 40 + measure('model = ', fam30, FS), x1 = x0 + measure('"gpt-6-astra"', fam30, FS);
    const y = lineY(1) - 10;
    this.plot.add([pt(x0 - 4, y + 2), pt(x1 + 4, y - 2)], this.tCut, this.tCut + 0.2, 'signal', { ez: ease.inOutQuad, width: 4, group: 'cut' });
    // ticks on the comment lines
    const ticks = [0, 2, 4];
    ticks.forEach((li, k) => {
      const tt = w.comments!.start + k * 0.12, ty = lineY(li) - 10;
      this.plot.add([pt(DX - 64, ty), pt(DX - 52, ty + 12), pt(DX - 28, ty - 14)], tt, tt + 0.12, 'signal', { width: 5, group: 'ticks' });
    });
    const K = this.cam;
    K.key(this.ctx.start, -60, -190, 1.0, -0.006);
    K.key(w.file!.end, -40, -130, 1.02, -0.004, ease.inOutCubic);
    K.key(this.tCut + 0.2, x0 + 120, y + 30, 1.55, 0.006, ease.inOutCubic);
    K.key(w.picked!.end, x0 + 160, y + 30, 1.58, 0.008, ease.linear);
    K.key(w.your!.start + 0.25, 0, 40, 0.98, 0.0, ease.inOutCubic);
    K.key(this.ctx.end, 0, 50, 1.0, -0.004, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a = prog(t, w.edits!.start - 0.2, w.edits!.start + 0.15);
    if (a <= 0) return;
    const slide = (1 - ease.outExpo(prog(t, w.edits!.start - 0.2, w.edits!.start + 0.4))) * 50;
    setWorld(ctx, c, DX, DY + slide);
    ctx.fillStyle = rgba('#FBF8F1', 0.98 * a);
    ctx.fillRect(0, 0, 1160, 70 + DOC.length * LH);
    ctx.lineWidth = 1.2 / c.z; ctx.strokeStyle = rgba('ink', 0.55 * a);
    ctx.strokeRect(0, 0, 1160, 70 + DOC.length * LH);
    label(ctx, '~/.codex/config.toml', 24, 33, { size: 19, col: rgba('ink', 0.7 * a), spacing: 2 });
    ctx.fillStyle = rgba('ink', 0.2 * a); ctx.fillRect(0, 48, 1160, 1.2 / c.z);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    DOC.forEach((ln, i) => {
      setWorld(ctx, c, DX + 40, lineY(i) + slide);
      ctx.font = font(F.mono(400), FS);
      const hash = ln.indexOf('#');
      if (hash === 0) { ctx.fillStyle = rgba('graphite', 0.95 * a); ctx.fillText(ln, 0, 0); }
      else if (hash > 0) {
        ctx.fillStyle = rgba('ink', 0.9 * a); ctx.fillText(ln.slice(0, hash), 0, 0);
        ctx.fillStyle = rgba('graphite', 0.95 * a); ctx.fillText(ln.slice(hash), measure(ln.slice(0, hash), F.mono(400), FS), 0);
      } else if (i === 1) {
        // the model line: the old value fades once struck, the new one is typed in its place
        const old = 1 - prog(t, this.tCut + 0.25, this.tCut + 0.4);
        ctx.fillStyle = rgba('ink', 0.9 * a); ctx.fillText('model = ', 0, 0);
        ctx.fillStyle = rgba('ink', 0.9 * a * old); ctx.fillText('"gpt-6-astra"', measure('model = ', F.mono(400), FS), 0);
      } else { ctx.fillStyle = rgba('ink', 0.9 * a); ctx.fillText(ln, 0, 0); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // the new value, typed above the struck one
    const x0 = DX + 40 + measure('model = ', F.mono(400), FS);
    typed(ctx, c, '"deepseek/deepseek-v4-pro"', x0, lineY(1) + slide, t, this.tNew, 0.45, { size: FS, col: 'blood', paper: true, weight: 500 });
    if (t > this.tNew + 0.5) {
      setWorld(ctx, c, x0 + measure('"deepseek/deepseek-v4-pro"', F.mono(500), FS) + 36, lineY(1) - 4);
      label(ctx, '<- 1 KEY CHANGED', 0, 0, { size: 19, col: rgba('blood', prog(t, this.tNew + 0.5, this.tNew + 0.7)), spacing: 3, weight: 600 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (t > w.survive!.start) {
      setWorld(ctx, c, DX + 1160 + 28, lineY(4) - 8);
      const k = prog(t, w.survive!.start, w.survive!.start + 0.3);
      label(ctx, 'COMMENTS · ORDER', 0, 0, { size: 19, col: rgba('ink', 0.85 * k), spacing: 3 });
      label(ctx, 'INDENTATION: KEPT', 0, 32, { size: 19, col: rgba('ink', 0.85 * k), spacing: 3 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  alpha(g: string, t: number) { return g === 'cut' ? 1 - prog(t, this.tCut + 0.25, this.tCut + 0.4) : 1; }

  postFX(t: number) {
    return { zoom: 1 + 0.01 * pulse(t, this.tCut, 0.1) };
  }
}
