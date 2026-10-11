// 10 QUICK: "Want a quick idea instead? Type a prompt, edit with a mask, or turn a still into video."
// Three monitors in a row, each lit on its words. PROMPT: a prompt types itself. MASK: a brush paints a red mask
// over part of a still. VIDEO: the still gets a play head running along a timeline, the figure walking. The
// clapperboard rises at the end.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font, measure } from '@engine/type';
import { drawParts, mixPose, POSES } from '@kit/_cad3d';
import { Cinema, panel, tape, room, figures, BODY, MONOB, AMBER, IVORY, REC, clamp, ease, TAU } from '@ep/cinema';
import { POV } from '@ep/set';

const P = 'a lighthouse in a storm, golden hour';

export default class Quick extends Cinema {
  override scene = 3;
  override slateOut = true;
  build() {
    this.take('Want a quick idea', ['quick', 'idea', 'Type', 'prompt,', 'edit', 'mask,', 'turn', 'still', 'video.']);
    const K = this.cam;
    K.key(this.ctx.start, 0, 0, 1.03, 0);
    K.key(this.ctx.end, 0, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const cols: [string, number, string][] = [['PROMPT', -600, 'type'], ['MASK', 0, 'edit'], ['VIDEO', 600, 'turn']];
    cols.forEach(([head, x, key]) => {
      const on = clamp((t - w[key]!.start + 0.2) / 0.25);
      panel(ctx, c, x - 270, -230, 540, 440, head, { a: 0.35 + 0.65 * on, accent: on > 0.5 ? AMBER : 'rgba(241,236,226,0.2)' });
    });
    // prompt
    const n = Math.ceil(P.length * clamp((t - w.type!.start) / 0.9));
    setWorld(ctx, c, -840, -100, 1, 0);
    ctx.font = font(BODY, 30); ctx.fillStyle = IVORY;
    const words = P.slice(0, n).split(' '); let line = '', yy = 0;
    for (const wd of words) { if (measure(line + wd, BODY, 30) > 470) { ctx.fillText(line, 0, yy); line = ''; yy += 42; } line += wd + ' '; }
    ctx.fillText(line, 0, yy);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the still under the mask and the video
    const still = (x: number, k: number) => drawParts(ctx, c, x, 40, { ...POV, s: 0.55 }, [{ mesh: room() }, { mesh: figures([{ pose: mixPose(POSES.stand, POSES.walk, k), xf: { at: [-20 + 40 * k, 60, 0], rz: 0 } }]) }], { shadow: 0.5 });
    still(0, 0);
    const mk = clamp((t - w.mask!.start + 0.1) / 0.6);
    if (mk > 0) {
      setWorld(ctx, c, 0, 40, 1, 0);
      ctx.globalAlpha = 0.45; ctx.strokeStyle = REC; ctx.lineCap = 'round'; ctx.lineWidth = 60;
      ctx.beginPath();
      for (let i = 0; i <= 30 * mk; i++) { const u = i / 30; const px = -150 + 300 * u, py = -40 + Math.sin(u * TAU * 2) * 50; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke(); ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const vk = clamp((t - w.video!.start + 0.4) / 1.6);
    still(600, vk > 0 ? (Math.sin((t - w.video!.start) * 5) * 0.5 + 0.5) : 0);
    setWorld(ctx, c, 600, 170, 1, 0);
    ctx.fillStyle = 'rgba(241,236,226,0.2)'; ctx.fillRect(-230, 0, 460, 6);
    ctx.fillStyle = AMBER; ctx.fillRect(-230, 0, 460 * vk, 6); ctx.beginPath(); ctx.arc(-230 + 460 * vk, 3, 10, 0, TAU); ctx.fill();
    ctx.font = font(MONOB, 20); ctx.fillStyle = IVORY; ctx.fillText(`00:0${Math.floor(vk * 5)}`, 170, 34);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    tape(ctx, c, 'QUICK IDEAS', 0, -330, 36, { a: clamp((t - this.w.quick!.start) / 0.2) });
    void ease;
  }
}
