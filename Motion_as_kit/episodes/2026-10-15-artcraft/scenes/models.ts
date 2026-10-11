// 11 MODELS: "It plugs into a long list of models, including Midjourney, Sora, Grok and World Labs' 3D worlds."
// The clapper claps scene 4 open on rolling credits: STARRING, then the models in serif, scrolling up the
// letterbox; the four the narration names light amber as they are said. A 62-MODEL CATALOG note in mono.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Cinema, mono, SERIF, MONOB, AMBER, IVORY, SMOKE, clamp } from '@ep/cinema';

const CREDITS: [string, string, string | null][] = [
  ['MIDJOURNEY', 'image', 'midjourney'], ['SORA 2', 'video', 'sora'], ['GROK IMAGINE', 'image · video', 'grok'],
  ['WORLD LABS · MARBLE', '3D worlds', 'world'], ['NANO BANANA PRO', 'image', null], ['GPT IMAGE 1.5', 'image', null],
  ['SEEDANCE 2.0', 'video', null], ['KLING 3.0 PRO', 'video', null], ['AND MANY MORE', '', null],
];

export default class Models extends Cinema {
  override slateIn = true;
  override scene = 4;
  build() {
    this.take('It plugs into', ['plugs', 'list', 'models,', 'Midjourney,', 'Sora,', 'Grok', 'World', 'worlds.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.0, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }
  override letterbox() { return 1; }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const scroll = (t - this.ctx.start) * 95;
    setWorld(ctx, c, 0, 0, 1, 0);
    ctx.textAlign = 'center';
    // credits fade in above the caption band and out below the top letterbox bar
    const band = (y: number) => clamp((300 - y) / 90) * clamp((y + 330) / 90);
    ctx.globalAlpha = band(300 - scroll); ctx.font = font(MONOB, 26); ctx.fillStyle = SMOKE; ctx.fillText('S T A R R I N G', 0, 300 - scroll);
    CREDITS.forEach(([name, kind, key], i) => {
      const y = 420 + i * 125 - scroll;
      const a = band(y + 20);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      const lit = key ? clamp((t - w[key]!.start + 0.05) / 0.15) : 0;
      ctx.font = font(SERIF, 78); ctx.fillStyle = lit > 0 ? AMBER : IVORY;
      ctx.shadowColor = lit > 0 ? 'rgba(245,179,66,0.6)' : 'rgba(0,0,0,0)'; ctx.shadowBlur = 30 * lit;
      ctx.fillText(name, 0, y);
      ctx.shadowBlur = 0; ctx.font = font(MONOB, 22); ctx.fillStyle = SMOKE; ctx.fillText(kind.toUpperCase(), 0, y + 38);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    mono(ctx, c, '62-MODEL CATALOG · PLUS YOUR OWN SUBSCRIPTIONS', -760, -280, { a: clamp((t - w.list!.start) / 0.3), size: 22, col: AMBER });
  }
}
