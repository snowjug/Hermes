// SHADERS: "Graphics too: shaders written for the PS5's AMD chip are recompiled for Vulkan, so ordinary PC
// graphics cards can draw them."
// A paper production line the camera rides along: a typed card of GPU code for the PS5's chip, a marker
// arrow through a RECOMPILER tag, a card of SPIR-V, another arrow to a GTX 1050 Ti photo tagged VULKAN.
// At the end a stat bar: 1,166 of the 1,166 GPU instructions it has met are translated.
import { drawCut, tag, prog, ease, pt, arrow, highlight, setWorld, font, F, rgba } from '@kit/_collage';
import type { Cam } from '@kit/_vo';
import { Desk, doc, statBar } from '@ep/kit';

const A = { x: -900, y: -260 };
const B = { x: 120, y: -260 };
const GPU = { x: 1250, y: -20 };

export default class Shaders extends Desk {
  override uses = ['gtx'];
  override wipeOut = true;
  override wipeFrom: 'left' | 'right' = 'right';

  build() {
    this.take('Graphics too', ['Graphics', 'too:', 'shaders', 'written', "PS5's", 'AMD', 'chip', 'recompiled', 'Vulkan,', 'ordinary', 'PC', ['graphics2', 'graphics', 1], 'cards', 'draw', 'them.']);
    const w = this.w;
    const P = this.plot;
    const a1 = arrow(pt(A.x + 590, A.y + 200), pt(B.x - 40, B.y + 200), 5, 0.12);
    P.add(a1.shaft, w.recompiled!.start, w.recompiled!.end + 0.1, 'signal', { pen: true, ez: ease.inOutQuad, width: 6.5 });
    P.add(a1.head, w.recompiled!.end + 0.1, w.recompiled!.end + 0.22, 'signal', { pen: true, width: 6.5 });
    const a2 = arrow(pt(B.x + 600, B.y + 220), pt(GPU.x - 360, GPU.y - 40), 6, -0.15);
    P.add(a2.shaft, w.ordinary!.start, w.pc!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 6.5 });
    P.add(a2.head, w.pc!.end, w.pc!.end + 0.12, 'signal', { pen: true, width: 6.5 });
    const K = this.cam;
    K.key(this.ctx.start, A.x + 300, A.y + 150, 1.18, -0.008);
    K.key(w.chip!.end, A.x + 380, A.y + 220, 1.18, -0.004, ease.inOutCubic);
    K.key(w.vulkan!.start + 0.1, B.x + 300, -40, 0.98, 0.004, ease.inOutCubic);
    K.key(w.cards!.start, GPU.x - 260, -20, 0.95, 0.006, ease.inOutCubic);
    K.key(this.ctx.end, GPU.x - 240, -10, 0.97, 0.006, ease.linear);
  }

  override desk(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const t0 = this.ctx.start;
    // the headline, a highlighter under it on "shaders"
    highlight(ctx, c, A.x - 10, A.y - 175, 600, 112, prog(t, w.shaders!.start, w.shaders!.end, ease.inOutCubic), { a: 0.55, seed: 8 });
    setWorld(ctx, c, A.x, A.y - 80);
    ctx.globalAlpha = prog(t, t0, t0 + 0.2);
    ctx.font = font(F.archivo(75, 900), 128); ctx.fillStyle = rgba('ink', 1); ctx.fillText('SHADERS', 0, 0);
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    doc(ctx, c, A.x, A.y, 560, 430, "PS5 GPU code", ['v_mov_b32  v0, s2', 'v_mul_f32  v1, v0, v4', 's_waitcnt  lgkmcnt(0)', 'exp  pos0, v1, v2, v3, v0'], t, t0 + 0.05, 1.6, { rot: -0.03, size: 26 });
    tag(ctx, c, 'FOR THE PS5’S AMD CHIP', A.x + 300, A.y + 480, 28, { a: prog(t, w.amd!.start, w.amd!.start + 0.2), rot: 0.03, seed: 61 });
    tag(ctx, c, 'RECOMPILER', (A.x + 590 + B.x) / 2 - 10, A.y + 110, 30, { a: prog(t, w.recompiled!.start, w.recompiled!.start + 0.15), rot: -0.05, seed: 62, bg: '#F0CF55' });
    doc(ctx, c, B.x, B.y, 560, 430, 'SPIR-V', ['%12 = OpLoad %v4float %pos', '%13 = OpFMul %float %12 %4', 'OpStore %out %13', 'OpReturn'], t, w.recompiled!.end, 1.0, { rot: 0.03, size: 26 });
    drawCut(ctx, c, this.cuts.gtx!, GPU.x, GPU.y, t, { t0: w.graphics2!.start - 0.1, scale: 0.62, rot: 0.04, seed: 63 });
    tag(ctx, c, 'VULKAN', GPU.x - 120, GPU.y - 230, 40, { a: prog(t, w.vulkan!.start, w.vulkan!.start + 0.15), rot: -0.06, seed: 64, col: '#D2302A' });
    tag(ctx, c, 'GTX 1050 Ti', GPU.x + 160, GPU.y + 210, 30, { a: prog(t, w.cards!.start, w.cards!.start + 0.2), rot: 0.04, seed: 65 });
    const ts = w.draw!.start;
    statBar(ctx, c, GPU.x - 560, GPU.y + 140, 360, 'GPU INSTRUCTIONS', '1,166 / 1,166', 1, prog(t, ts, ts + 0.7, ease.outCubic), { a: prog(t, ts - 0.1, ts + 0.1), rot: -0.03 });
  }
}
