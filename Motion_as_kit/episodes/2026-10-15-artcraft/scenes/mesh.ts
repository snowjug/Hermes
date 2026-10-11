// 07 MESH: "Turn any picture into a 3D object you can rotate, and kitbash whole sets from asset kits."
// Left: a flat picture of a vase on a card; on "3D object" the card falls away and the vase stands up as a real
// turned 3D object that spins on "rotate". Right: an asset kit (an arch, columns, crates) flies piece by piece
// into a set on "kitbash", and the set settles on "asset kits". The clapperboard rises at the end.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { box, cyl, drawParts, join, lathe, xform, extrude, rect, type Face, type Obj } from '@kit/_cad3d';
import { Cinema, tape, AMBER, clamp, ease, lerp, TAU } from '@ep/cinema';

const VASE: [number, number][] = [[0, 0], [18, 0], [24, 8], [30, 30], [28, 52], [16, 70], [12, 82], [16, 92], [14, 94], [0, 94]];
function kit(): { mesh: Face[]; from: [number, number, number] }[] {
  const arch = extrude([[-60, 0], [60, 0], [60, 150], [-60, 150]], [[[-35, 0], [35, 0], [35, 95], [0, 120], [-35, 95]]], 30, { plane: 'xz', col: '#7D7468' });
  return [
    { mesh: xform(arch, { at: [0, 40, 0] }), from: [0, 40, 400] },
    { mesh: cyl(14, 170, { at: [-110, 20, 0], col: '#8A8073' }), from: [-400, 20, 0] },
    { mesh: cyl(14, 170, { at: [110, 20, 0], col: '#8A8073' }), from: [400, 20, 0] },
    { mesh: box(50, 50, 50, { at: [-60, -60, 0], col: '#8C6A45' }), from: [-300, -300, 200] },
    { mesh: join(box(40, 40, 40, { at: [-20, -70, 50], col: '#9A7650' })), from: [-200, -300, 400] },
    { mesh: box(60, 40, 36, { at: [70, -70, 0], col: '#8C6A45' }), from: [300, -300, 200] },
  ];
}

export default class Mesh extends Cinema {
  override scene = 2;
  override slateOut = true;
  build() {
    this.take('Turn any picture', ['picture', '3D', 'object', 'rotate,', 'kitbash', 'sets', 'asset', 'kits.']);
    const K = this.cam;
    K.key(this.ctx.start, -120, 0, 1.06, 0);
    K.key(this.w.kitbash!.start - 0.1, -80, 0, 1.04, 0);
    K.key(this.w.kitbash!.start + 0.5, 60, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.ctx.end, 80, 0, 1.0, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the picture card
    const pa = clamp((t - w.picture!.start + 0.2) / 0.25), up = ease.inOutCubic(clamp((t - w['3d']!.start) / 0.5));
    if (pa > 0 && up < 1) {
      setWorld(ctx, c, -480, 20, 1, 0);
      ctx.globalAlpha = pa * (1 - up);
      ctx.fillStyle = '#EDE6D6'; ctx.fillRect(-170, -210, 340, 400);
      const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#2E5E6B'); g.addColorStop(0.5, '#6FB0B8'); g.addColorStop(1, '#2E5E6B');
      ctx.fillStyle = g; ctx.beginPath();
      VASE.forEach(([r, z], i) => (i ? ctx.lineTo(r * 2.2, 140 - z * 3) : ctx.moveTo(r * 2.2, 140 - z * 3)));
      [...VASE].reverse().forEach(([r, z]) => ctx.lineTo(-r * 2.2, 140 - z * 3)); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (up > 0) {
      const spin = (t - w['3d']!.start) * 1.6;
      drawParts(ctx, c, -480, 120, { yaw: spin, pitch: 0.3, dist: 900, s: 3.4, target: [0, 0, 47] }, [{ mesh: lathe(VASE, 28, { col: '#4F98A2' }), a: up, xf: { s: lerp(0.6, 1, up) } }], { grid: 90, gridStep: 15 });
    }
    // the kit flying into a set
    const objs: Obj[] = [];
    kit().forEach((k, i) => {
      const f = ease.outCubic(clamp((t - w.kitbash!.start - i * 0.14) / 0.5));
      if (f <= 0) return;
      objs.push({ mesh: k.mesh, a: clamp(f * 3), xf: { at: [(1 - f) * k.from[0], (1 - f) * k.from[1], (1 - f) * k.from[2]] } });
    });
    if (objs.length) drawParts(ctx, c, 470, 150, { yaw: 0.5 + 0.15 * (t - w.kitbash!.start), pitch: 0.35, dist: 1100, s: 1.9, target: [0, 0, 70] }, objs, { grid: 220, gridStep: 20 });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    tape(ctx, c, 'IMAGE → 3D MESH', -480, -330, 34, { a: clamp((t - w['3d']!.start) / 0.2) });
    tape(ctx, c, 'KITBASH', 470, -330, 34, { a: clamp((t - w.kitbash!.start) / 0.2), col: AMBER });
    void TAU;
  }
}
