// 14 MORE THAN BOXES: "And it draws far more than boxes: flowcharts, timelines, Sankeys, Wardley maps, even exploded 3D
// views of a whole stack."
// One long camera run along a row of diagrams, each drawing itself as the camera whips onto it on its word: a plain
// box (BOXES?), a flowchart with a decision, a timeline with one coral milestone, a Sankey with one coral band, a
// Wardley map, and the payoff, an exploded axonometric of an AI agent stack whose four slabs float apart with
// labelled leaders (the skill's own "exploded" type, drawn here in 3D).
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { box, drawParts, project, type Obj } from '@kit/_cad3d';
import { Dgm, node, edge, header, mono, sans, orth, CORAL, BLUE, HAIR, FAINT, TEXT, MUTED, MONO, SANS, clamp, ease, ob, lerp, TAU, type XY } from '@ep/dgm';

const X = { box: -1150, flow: 0, time: 1150, sankey: 2300, wardley: 3450, stack: 4650 };

export default class Montage extends Dgm {
  build() {
    this.take('And it draws far more', ['far', 'boxes:', 'flowcharts,', 'timelines,', 'Sankeys,', 'Wardley', 'maps,', 'exploded', '3D', 'views', 'whole', 'stack.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    const go = (t: number, x: number, z = 1) => K.key(t + 0.42, x, 0, z, 0, ease.inOutCubic);
    K.key(s, X.box - 700, 0, 1);
    K.key(s + 0.45, X.box, 0, 1, 0, ease.outExpo);
    K.key(this.s('flowcharts') - 0.35, X.box + 20, 0, 1.02, 0, ease.inOutQuad);
    go(this.s('flowcharts') - 0.35, X.flow);
    K.key(this.s('timelines') - 0.35, X.flow + 20, 0, 1.0, 0, ease.inOutQuad);
    go(this.s('timelines') - 0.35, X.time);
    K.key(this.s('sankeys') - 0.35, X.time + 20, 0, 1.0, 0, ease.inOutQuad);
    go(this.s('sankeys') - 0.35, X.sankey);
    K.key(this.s('wardley') - 0.35, X.sankey + 20, 0, 1.0, 0, ease.inOutQuad);
    go(this.s('wardley') - 0.35, X.wardley);
    K.key(this.s('exploded') - 0.4, X.wardley + 20, 0, 1.0, 0, ease.inOutQuad);
    go(this.s('exploded') - 0.4, X.stack, 1.0);
    K.key(e - 0.26, X.stack + 10, -10, 1.06, 0, ease.inOutQuad);
    K.key(e, X.stack + 10, -10, 1.06 * 1.7, 0, ease.inExpo);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const vis = (x: number) => Math.abs(c.cx - x) < 1500;
    // BOXES?
    if (vis(X.box)) {
      node(ctx, c, X.box, 0, 300, 130, { k: clamp((t - this.ctx.start - 0.1) / 0.5), title: 'just boxes?', tag: 'BOX' });
    }
    // the flowchart
    if (vis(X.flow)) {
      const k0 = this.s('flowcharts') - 0.2;
      const kk = (d: number) => clamp((t - k0 - d) / 0.4);
      header(ctx, c, X.flow - 420, -320, 'FLOWCHART', 'Sign-up', t, k0, { size: 44 });
      node(ctx, c, X.flow - 330, -60, 200, 80, { k: kk(0), title: 'start', r: 40 });
      edge(ctx, c, [[X.flow - 230, -60], [X.flow - 130, -60]], kk(0.2));
      // the decision diamond
      const dk = kk(0.35);
      if (dk > 0) {
        setWorld(ctx, c, X.flow, -60, 1, 0);
        ctx.globalAlpha = dk; ctx.fillStyle = 'rgba(255,106,69,0.1)'; ctx.strokeStyle = CORAL; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(130, 0); ctx.lineTo(0, 70); ctx.lineTo(-130, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.font = font(SANS, 22); ctx.fillStyle = TEXT; ctx.textAlign = 'center'; ctx.fillText('valid email?', 0, 8); ctx.textAlign = 'left';
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      edge(ctx, c, [[X.flow + 130, -60], [X.flow + 260, -60]], kk(0.55), { label: 'YES', col: CORAL });
      node(ctx, c, X.flow + 360, -60, 200, 80, { k: kk(0.65), title: 'create account', titleSize: 22 });
      edge(ctx, c, [[X.flow, 10], [X.flow, 140]], kk(0.6), { label: 'NO', dash: true });
      node(ctx, c, X.flow, 190, 220, 80, { k: kk(0.75), title: 'show error', titleSize: 22 });
    }
    // the timeline
    if (vis(X.time)) {
      const k0 = this.s('timelines') - 0.2;
      header(ctx, c, X.time - 420, -320, 'TIMELINE', 'Launch plan', t, k0, { size: 44 });
      const lk = ease.inOutCubic(clamp((t - k0) / 0.6));
      setWorld(ctx, c, 0, 0, 1, 0); ctx.strokeStyle = HAIR; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(X.time - 420, 40); ctx.lineTo(X.time - 420 + 840 * lk, 40); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const ms: [string, string, boolean][] = [['MAR', 'spec', false], ['MAY', 'beta', false], ['JUL', 'launch', true], ['SEP', 'v2', false], ['NOV', 'scale', false]];
      ms.forEach(([mo, lab, hot], i) => {
        const x = X.time - 360 + i * 180, k = clamp((t - k0 - 0.15 - i * 0.12) / 0.3);
        if (k <= 0) return;
        setWorld(ctx, c, x, 40, ob(k), 0);
        ctx.fillStyle = hot ? CORAL : '#0B0E13'; ctx.strokeStyle = hot ? CORAL : HAIR; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, hot ? 12 : 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        mono(ctx, c, mo, x, 90, { a: k, align: 'center', size: 16 });
        sans(ctx, c, lab, x, i % 2 ? 150 : -20, 24, { a: k, col: hot ? CORAL : TEXT });
      });
    }
    // the Sankey
    if (vis(X.sankey)) {
      const k0 = this.s('sankeys') - 0.2;
      header(ctx, c, X.sankey - 420, -320, 'SANKEY', 'Where sign-ups come from', t, k0, { size: 44 });
      const L: [string, number][] = [['search', 120], ['social', 70], ['referral', 50]], R: [string, number][] = [['trial', 140], ['paid', 60], ['churn', 40]];
      const flows: [number, number, number][] = [[0, 0, 70], [0, 1, 40], [0, 2, 10], [1, 0, 40], [1, 2, 30], [2, 0, 30], [2, 1, 20]];
      const lx = X.sankey - 330, rx = X.sankey + 330, top = -170;
      const ly: number[] = [], ry: number[] = [];
      let acc = top; L.forEach(([, v]) => { ly.push(acc); acc += v * 1.4 + 28; });
      acc = top; R.forEach(([, v]) => { ry.push(acc); acc += v * 1.4 + 28; });
      const lo = L.map(() => 0), ro = R.map(() => 0);
      flows.forEach(([a, b, v], i) => {
        const k = ease.inOutCubic(clamp((t - k0 - 0.2 - i * 0.07) / 0.5));
        const y0 = ly[a]! + lo[a]!, y1 = ry[b]! + ro[b]!, h = v * 1.4; lo[a] = lo[a]! + h; ro[b] = ro[b]! + h;
        if (k <= 0) return;
        setWorld(ctx, c, 0, 0, 1, 0);
        ctx.save(); ctx.beginPath(); ctx.rect(lx + 14, -1000, (rx - lx - 28) * k, 2000); ctx.clip();
        ctx.fillStyle = a === 0 && b === 1 ? 'rgba(255,106,69,0.55)' : 'rgba(91,140,255,0.16)';
        const mx = (lx + rx) / 2;
        ctx.beginPath(); ctx.moveTo(lx + 14, y0); ctx.bezierCurveTo(mx, y0, mx, y1, rx - 14, y1); ctx.lineTo(rx - 14, y1 + h); ctx.bezierCurveTo(mx, y1 + h, mx, y0 + h, lx + 14, y0 + h); ctx.closePath(); ctx.fill();
        ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
      const bk = clamp((t - k0) / 0.3);
      [[L, ly, lx, 'right'], [R, ry, rx, 'left']].forEach(([arr, ys, x, al]) => {
        (arr as [string, number][]).forEach(([lab, v], i) => {
          setWorld(ctx, c, x as number, (ys as number[])[i]!, 1, 0); ctx.globalAlpha = bk; ctx.fillStyle = TEXT; ctx.fillRect(-7, 0, 14, v * 1.4); ctx.setTransform(1, 0, 0, 1, 0, 0);
          mono(ctx, c, lab.toUpperCase(), (x as number) + (al === 'right' ? -26 : 26), (ys as number[])[i]! + v * 0.7 + 6, { a: bk, align: al as CanvasTextAlign, size: 16, col: lab === 'paid' ? CORAL : MUTED });
        });
      });
    }
    // the Wardley map
    if (vis(X.wardley)) {
      const k0 = this.s('wardley') - 0.2, ox = X.wardley - 360, oy = 260, w = 720, h = 470;
      header(ctx, c, X.wardley - 420, -320, 'WARDLEY MAP', 'Who depends on what', t, k0, { size: 44 });
      const ak = ease.inOutCubic(clamp((t - k0) / 0.5));
      setWorld(ctx, c, 0, 0, 1, 0); ctx.strokeStyle = HAIR; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + w * ak, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - h * ak); ctx.stroke();
      ctx.strokeStyle = FAINT; ctx.setLineDash([6, 8]); [0.25, 0.5, 0.75].forEach((u) => { ctx.beginPath(); ctx.moveTo(ox + w * u, oy); ctx.lineTo(ox + w * u, oy - h * ak); ctx.stroke(); }); ctx.setLineDash([]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ['GENESIS', 'CUSTOM', 'PRODUCT', 'COMMODITY'].forEach((s, i) => mono(ctx, c, s, ox + w * (0.125 + i * 0.25), oy + 30, { a: ak, align: 'center', size: 14 }));
      mono(ctx, c, 'VISIBLE ↑', ox - 14, oy - h + 10, { a: ak, align: 'right', size: 14 });
      const pts: [string, number, number, boolean][] = [['user', 0.62, 0.92, false], ['diagram', 0.3, 0.72, true], ['agent', 0.55, 0.5, false], ['model', 0.7, 0.3, false], ['compute', 0.9, 0.1, false]];
      const P = pts.map(([, u, v]) => [ox + w * u, oy - h * v] as XY);
      pts.forEach(([lab, , , hot], i) => {
        if (i) edge(ctx, c, [P[i - 1]!, P[i]!], clamp((t - k0 - 0.3 - i * 0.12) / 0.3), { head: false, col: HAIR });
        const k = clamp((t - k0 - 0.25 - i * 0.12) / 0.3);
        if (k <= 0) return;
        setWorld(ctx, c, P[i]![0], P[i]![1], ob(k), 0);
        ctx.fillStyle = hot ? CORAL : '#0B0E13'; ctx.strokeStyle = hot ? CORAL : TEXT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        sans(ctx, c, lab, P[i]![0] + 22, P[i]![1] + 8, 22, { a: k, align: 'left', col: hot ? CORAL : TEXT });
      });
    }
    // the exploded stack
    if (vis(X.stack)) this.stack(ctx, t, c);
  }

  stack(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const k0 = this.s('exploded') - 0.25;
    header(ctx, c, X.stack - 560, -330, 'EXPLODED AXONOMETRIC', 'What sits under the prompt', t, k0, { size: 44 });
    const layers: [string, string, boolean][] = [['Model', 'the LLM', false], ['Skills', 'diagram-design', true], ['Agent harness', 'claude code · codex', false], ['Interface', 'chat or terminal', false]];
    const ek = ease.inOutCubic(clamp((t - this.s('3d') + 0.1) / 1.1));
    const gap = lerp(18, 96, ek);
    const objs: Obj[] = layers.map(([, , hot], i) => {
      const a = clamp((t - k0 - i * 0.12) / 0.35);
      return { mesh: box(300, 300, 16, { at: [0, 0, i * gap], col: hot ? '#3A1F18' : '#1A212C', r: 12 }), edge: hot ? CORAL : 'rgba(214,222,235,0.8)', a };
    });
    const cx = X.stack - 120, cy = 90;
    const view = { yaw: 0.78 + 0.05 * Math.sin(t * 0.5), pitch: 0.58, dist: 6000, s: 1.25, target: [0, 0, 1.5 * gap] as [number, number, number] };
    // guides at the corners
    const P = drawParts(ctx, c, cx, cy, view, [], {});
    setWorld(ctx, c, cx, cy, 1, 0);
    ctx.strokeStyle = FAINT; ctx.setLineDash([5, 7]); ctx.lineWidth = 1.2;
    for (const [x, y] of [[-150, -150], [150, 150], [150, -150]] as [number, number][]) { const a = project(P, [x, y, 0]), b = project(P, [x, y, 3 * gap + 16]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.setLineDash([]); ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawParts(ctx, c, cx, cy, view, objs, { shadow: 0, edgeW: 1.6 });
    // leaders and labels
    layers.forEach(([title, sub, hot], i) => {
      const a = clamp((t - this.s('views') - i * 0.12) / 0.35);
      if (a <= 0) return;
      const p = project(P, [150, -150, i * gap + 8]);
      const px = cx + p[0], py = cy + p[1];
      edge(ctx, c, [[px + 8, py], [cx + 420, py]], a, { head: false, col: hot ? CORAL : HAIR, lw: 1.2 });
      sans(ctx, c, title, cx + 440, py + 4, 28, { a, align: 'left', col: hot ? CORAL : TEXT });
      mono(ctx, c, sub, cx + 440, py + 32, { a, size: 16, col: hot ? CORAL : MUTED });
    });
    void orth; void BLUE; void MONO;
  }
}
