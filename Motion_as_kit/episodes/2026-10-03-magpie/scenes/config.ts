// CONFIG: "Want a different model? Get ready to dig through config files."
// Bone paper. The question in serif; under it a stack of real agent config files. On "dig",
// "through", "config" the top file flips away; the last one, ~/.codex/config.toml, stays, and on
// "files" a marker rings its model line.
import { placeRow } from '@kit/_vo';
import { Plate, ARCH, drawWindow, pt, clamp, ease, prog, pulse, noise1, rgba, F, font, measure, setWorld, type Cam } from '@kit/_mp';

const CARDS: { path: string; lines: string[]; hl?: number }[] = [
  { path: '~/.gemini/settings.json', lines: ['{', '  "model": {', '    "name": "gemini-3.1-pro"', '  },', '  "security": { "auth": { … } }', '}'] },
  { path: '~/.config/opencode/opencode.json', lines: ['{', '  "$schema": "https://opencode.ai/config.json",', '  "model": "anthropic/claude-sonnet-5",', '  "small_model": "anthropic/claude-haiku-4-5"', '}'] },
  { path: '~/.claude/settings.json', lines: ['{', '  "model": "claude-fable-5-1",', '  "env": {', '    "ANTHROPIC_BASE_URL": "…",', '    "ANTHROPIC_AUTH_TOKEN": "…"', '  }', '}'] },
  { path: '~/.codex/config.toml', lines: ['# Codex', 'model = "gpt-6-astra"', 'model_reasoning_effort = "medium"', '', '[model_providers.openai]', 'name = "OpenAI"'], hl: 1 },
];
const CW = 1080, CH = 470, CX = -CW / 2, CY = -110, FS = 34, LH = 52;

export default class Config extends Plate {
  paper = true;
  flips: number[] = [];

  build() {
    const w = this.w;
    this.take('Want a different model', ['Want', 'a', 'different', 'model?', 'Get', 'ready', 'to', 'dig', 'through', 'config', 'files.']);
    const ser = F.serif(600);
    this.kw.push(...placeRow([w.want!, w.a!, w.different!, w.model!], -600, -380, 128, ser, 'Q', { ant: 0.25 }).words);
    this.kw.push(...placeRow([w.get!, w.ready!, w.to!, w.dig!, w.through!, w.config!, w.files!], -600, -270, 56, ARCH(100, 700), 'Q', { ant: 0.2 }).words);
    this.flips = [w.dig!.start, w.through!.start, w.config!.start];
    // the marker ring around the model line of the last file
    const y = CY + 44 + 44 + 1 * LH - 12;
    const mw = measure('model = "gpt-6-astra"', F.mono(400), FS);
    const pts = [] as { x: number; y: number }[];
    for (let i = 0; i <= 70; i++) {
      const a = -0.4 + (i / 70) * (Math.PI * 2 + 0.5);
      pts.push(pt(CX + 30 + mw / 2 + Math.cos(a) * (mw / 2 + 34 + 6 * noise1(i * 0.3, 2)), y + Math.sin(a) * (36 + 4 * noise1(i * 0.4, 3))));
    }
    this.plot.add(pts, w.files!.start, w.files!.start + 0.35, 'signal', { ez: ease.inOutQuad, width: 5, group: 'm' });
    const K = this.cam;
    K.key(this.ctx.start, -20, -250, 1.02, -0.01);
    K.key(w.get!.start, 0, -170, 1.0, -0.006, ease.inOutCubic);
    K.key(w.dig!.start + 0.1, 0, 90, 1.1, 0.008, ease.inOutCubic);
    K.key(w.files!.start + 0.1, CX + 330, CY + 150, 1.45, 0.01, ease.inOutCubic);
    K.key(this.ctx.end, CX + 340, CY + 150, 1.5, 0.012, ease.linear);
  }

  drawUI(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const t0 = this.w.get!.start - 0.2;
    if (t < t0) return;
    // back to front: the last card is at the bottom of the stack
    for (let i = CARDS.length - 1; i >= 0; i--) {
      const card = CARDS[i]!;
      const tf = this.flips[i];
      const fly = tf !== undefined ? ease.inCubic(prog(t, tf, tf + 0.32)) : 0;
      if (fly >= 1) continue;
      const appear = ease.outExpo(prog(t, t0 + i * 0.05, t0 + 0.4 + i * 0.05));
      const off = (CARDS.length - 1 - i) * 18;
      const x = CX + off - 0.5 * off + fly * 380, y = CY - off * 0.6 + (1 - appear) * 80 - fly * 900;
      const a = appear * (1 - fly * 0.6);
      ctx.save();
      drawWindow(ctx, c, x, y, CW, CH, card.path, { a, paper: true });
      setWorld(ctx, c, x, y);
      ctx.font = font(F.mono(400), FS);
      card.lines.forEach((ln, k) => {
        const yy = 44 + 44 + k * LH;
        const isHl = card.hl === k && t > this.w.files!.start;
        ctx.fillStyle = ln.startsWith('#') ? rgba('graphite', 0.9 * a) : isHl ? rgba('blood', a) : rgba('ink', 0.85 * a);
        ctx.fillText(ln, 30, yy);
      });
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  postFX(t: number) {
    const f = this.flips.reduce((s, tf) => s + pulse(t, tf + 0.05, 0.08), 0);
    return { zoom: 1 + 0.006 * f + 0.012 * pulse(t, this.w.files!.start, 0.1) };
  }
  alpha() { return 1; }
}
void clamp;
