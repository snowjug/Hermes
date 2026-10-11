// The text-to-cad Short, one continuous plate: an assembly manual whose pages swipe in, one per spoken line.
//  1 cover: "POV:" and a laptop that just graduated (a mortarboard lands on it), a gear turning on its screen.
//  2 STEP 1 ASK: the request types into a speech bubble; the phone stand draws itself, 15° and the cable slot.
//  3 STEP 2: code, an arrow, the stand built in 3D, and a checklist ticking.
//  4 STEP 3: the stand sliced into layers, an arrow, a printer printing (Bambu Lab).
//  5 PARTS LIST: text-to-cad, 1x FREE, 1x OPEN SOURCE, 19,000x ★.
//  6 WORKS WITH: five agents, ticked one by one.
//  7 STEP 1: ask. STEP 2: print. The little person gives a thumbs up.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { drawParts, gear, phoneStand, phoneStandPrint, project } from '@kit/_cad3d';
import { ManualPlate, stepNo, say, arrow, callout, bubble, tick, person, laptop, printerArt, INK, YELLOW, BLUE, GREY, HEAD, BODY, MONO, clamp, ease, lerp, TAU } from '@ep/manual';

const PAGE_W = 1180;

export default class Manual extends ManualPlate {
  lineStarts: number[] = [];
  build() {
    const w = (q: string, specs: (string | [string, string, number?])[]) => this.take(q, specs);
    w('POV', ['POV:', 'learned', ['cad0', 'CAD.']]);
    w('Type one sentence', [['type', 'Type'], ['a1', 'a'], 'phone', 'stand,', 'tilted', '15', 'degrees,', 'slot', 'cable.']);
    w('It writes the code', ['writes', 'code,', 'builds', 'model,', 'checks', 'actually', ['print2', 'print.']]);
    w('Then it slices', ['slices', 'send', 'straight', 'Bambu', ['printer3', 'printer.']]);
    w("It's called", ['texttocad', 'Free,', 'open', 'source,', '19000', 'GitHub', 'stars.']);
    w('It works with', ['works', 'Claude', 'Codex,', 'Cursor,', 'Gemini', 'Grok.']);
    w('Step one', [['step1', 'Step'], 'ask.', ['step2', 'Step', 1], 'two:', ['print7', 'print.']]);
    this.lineStarts = this.ctx.lyrics.lines.map((l) => l.start);
    this.cam.key(this.ctx.start, 0, 0, 1, 0);
    this.cam.key(this.ctx.end, 0, 0, 1, 0);
  }

  /** Page position: page i is centred when pos = i; each turn takes 0.38 s, just before its line. */
  pos(t: number) {
    let p = 0;
    this.lineStarts.forEach((s, i) => { if (i > 0) p += ease.inOutCubic(clamp((t - (s - 0.3)) / 0.38)); });
    return p;
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const pos = this.pos(t);
    const pages = [this.p1, this.p2, this.p3, this.p4, this.p5, this.p6, this.p7];
    pages.forEach((fn, i) => {
      const dx = (i - pos) * PAGE_W;
      if (Math.abs(dx) >= PAGE_W) return;
      // page frame and number
      setWorld(ctx, c, dx, 0, 1, 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-500, -910, 1000, 1780);
      ctx.fillStyle = INK; ctx.font = font(BODY, 34); ctx.textAlign = 'center'; ctx.fillText(`— ${i + 1} —`, 0, 850);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
      fn.call(this, ctx, c, t, dx);
    });
  }

  // 1. cover
  p1(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    setWorld(ctx, c, ox - 400, -760, 1, -0.03);
    ctx.fillStyle = YELLOW; ctx.fillRect(-20, -120, 420, 150);
    ctx.fillStyle = INK; ctx.font = font(HEAD, 150); ctx.fillText('POV:', 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const [sx, sy] = laptop(ctx, c, ox - 40, 200, 640, 430);
    drawParts(ctx, c, sx, sy + 40, { yaw: t * 1.1, pitch: 0.6, dist: 900, s: 4.4, target: [0, 0, 5] }, [{ mesh: gear(16, 30, 10, '#FFFFFF') }], { look: 'line', shadow: 0, edgeW: 3 });
    // the mortarboard lands on the lid
    const k = ease.outBack(clamp((t - w.learned!.start + 0.05) / 0.35));
    if (k > 0) {
      setWorld(ctx, c, ox - 40, -230 - 260 * (1 - k), 1, -0.08 + 0.08 * k);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-170, 0); ctx.lineTo(0, -60); ctx.lineTo(170, 0); ctx.lineTo(0, 60); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-80, 10, 160, 70, 10); ctx.fill();
      ctx.strokeStyle = YELLOW; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(130, 30); ctx.lineTo(130, 120); ctx.stroke();
      ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(130, 130, 16, 0, TAU); ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    person(ctx, c, ox + 360, 420, 0.95, 0, 1);
    const b = clamp((t - w.cad0!.start) / 0.15);
    if (b > 0) {
      setWorld(ctx, c, ox + 250, -330, 0.7 + 0.3 * ease.outBack(b), 0.12);
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.roundRect(-150, -56, 300, 112, 20); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = font(HEAD, 64); ctx.textAlign = 'center'; ctx.fillText('+ CAD', 0, 22);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // 2. STEP 1: ask
  p2(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    stepNo(ctx, c, '1', ox - 380, -790, clamp((t - w.type!.start + 0.3) / 0.2));
    say(ctx, c, 'ASK', ox - 270, -760, 96, { align: 'left' });
    const k = clamp((t - w.a1!.start) / Math.max(0.5, w.cable!.end - w.a1!.start));
    bubble(ctx, c, ['"A phone stand, tilted', '15°, with a slot for', 'the cable."'], ox, -470, 900, k, { size: 58, a: clamp((t - w.type!.start) / 0.2) });
    const sa = clamp((t - w.phone!.start) / 0.2);
    if (sa > 0) {
      const solid = clamp((t - w.stand!.start) / 0.3);
      const v = { yaw: 0.35 + 0.1 * Math.sin(t * 0.8), pitch: 0.38, dist: 1200, s: 5.6, target: [0, 0, 45] as [number, number, number] };
      const P = drawParts(ctx, c, ox, 170, v, [{ mesh: phoneStand('#FFFFFF'), a: sa, wire: 1 - solid }], { look: 'line', shadow: solid, edgeW: 3.4 });
      // 15 degrees
      const ak = clamp((t - w.tilted!.start) / 0.3);
      if (ak > 0) {
        const b = project(P, [11, 0, 6]), tp = project(P, [36, 0, 100]), up = project(P, [11, 0, 100]);
        setWorld(ctx, c, ox, 170, 1, 0);
        ctx.globalAlpha = ak; ctx.strokeStyle = BLUE; ctx.lineWidth = 6; ctx.setLineDash([16, 12]);
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(up[0], up[1]); ctx.stroke(); ctx.setLineDash([]);
        const a0 = Math.atan2(up[1] - b[1], up[0] - b[0]), a1 = Math.atan2(tp[1] - b[1], tp[0] - b[0]);
        ctx.beginPath(); ctx.arc(b[0], b[1], 240, a0, a1, a1 < a0); ctx.stroke();
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        const mid = (a0 + a1) / 2;
        say(ctx, c, '15°', ox + b[0] + Math.cos(mid) * 290, 170 + b[1] + Math.sin(mid) * 290, 90, { a: clamp((t - w['15']!.start) / 0.15), col: BLUE });
      }
      // the cable slot
      const ck = clamp((t - w.slot!.start) / 0.25);
      if (ck > 0) {
        const s = project(P, [-44, 0, 16]);
        setWorld(ctx, c, ox, 170, 1, 0);
        ctx.globalAlpha = ck; ctx.strokeStyle = YELLOW; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(s[0], s[1], 70 * ease.outBack(ck), 0, TAU); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.lineCap = 'round';
        const cl = clamp((t - w.cable!.start) / 0.4);
        ctx.beginPath(); ctx.moveTo(s[0] - 260, s[1] + 160);
        ctx.bezierCurveTo(s[0] - 160, s[1] + 160, s[0] - 120, s[1] + 20, lerp(s[0] - 120, s[0] + 10, cl), lerp(s[1] + 20, s[1], cl)); ctx.stroke();
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
  }

  // 3. STEP 2: code -> 3D -> checks
  p3(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    stepNo(ctx, c, '2', ox - 380, -790, 1);
    say(ctx, c, 'IT BUILDS', ox - 270, -760, 96, { align: 'left' });
    // the code card
    const ca = clamp((t - w.writes!.start + 0.1) / 0.2);
    setWorld(ctx, c, ox - 440, -640, 1, 0);
    ctx.globalAlpha = ca; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(0, 0, 520, 330, 18); ctx.fill(); ctx.stroke();
    const code = ['@step(out="stand.step")', 'def stand():', '  ANGLE = 15', '  SLOT = 14', '  ...'];
    const n = Math.floor(clamp((t - w.writes!.start) / Math.max(0.5, w.code!.end - w.writes!.start)) * 80);
    ctx.font = font(MONO, 34); let used = 0;
    code.forEach((ln, i) => { ctx.fillStyle = i === 0 ? BLUE : INK; ctx.fillText(ln.slice(0, Math.max(0, n - used)), 30, 66 + i * 56); used += ln.length; });
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    arrow(ctx, c, ox + 110, -470, ox + 300, -300, clamp((t - w.builds!.start + 0.1) / 0.3));
    // the 3D stand
    const bk = ease.outBack(clamp((t - w.builds!.start) / 0.4));
    if (bk > 0) drawParts(ctx, c, ox + 120, 60, { yaw: 0.2 + t * 1.2, pitch: 0.42, dist: 1200, s: 3.9 * bk, target: [0, 0, 45] }, [{ mesh: phoneStand('#FFFFFF') }], { look: 'line', grid: 140, gridStep: 20, edgeW: 3.2 });
    // the checklist
    const rows: [string, string][] = [['walls', 'checks'], ['overhangs', 'actually'], ['printable', 'print2']];
    rows.forEach(([label, key], i) => {
      const a = clamp((t - w[key]!.start) / 0.15);
      tick(ctx, c, ox - 400, 290 + i * 92, a, true, 38);
      say(ctx, c, label, ox - 345, 306 + i * 92, 48, { a, align: 'left', f: BODY });
    });
  }

  // 4. STEP 3: slice and send
  p4(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    stepNo(ctx, c, '3', ox - 380, -790, 1);
    say(ctx, c, 'SLICE + SEND', ox - 270, -760, 96, { align: 'left' });
    const v = { yaw: -0.5 + t * 0.4, pitch: 0.55, dist: 1100, s: 4.3, target: [0, 0, 30] as [number, number, number] };
    const sl = clamp((t - w.slices!.start) / 0.8);
    const P = drawParts(ctx, c, ox - 10, -360, v, [{ mesh: phoneStandPrint(70, '#FFFFFF'), wire: sl > 0 ? 0.65 : 0 }], { look: 'line', shadow: 0.5, edgeW: 3 });
    if (sl > 0) {
      const prof: [number, number][] = [[-47, -50], [48, -50], [48, -44], [19, -44], [44, 50], [36, 50], [11, -44], [-47, -44]];
      const n = Math.ceil(12 * sl);
      setWorld(ctx, c, ox - 10, -360, 1, 0);
      for (let i = 0; i < n; i++) {
        const z = (i / 11) * 70;
        const pts = prof.map(([a, b]) => project(P, [a, b, z]));
        ctx.strokeStyle = i === n - 1 ? BLUE : INK; ctx.lineWidth = i === n - 1 ? 6 : 2.5;
        ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    arrow(ctx, c, ox, -140, ox, 20, clamp((t - w.send!.start) / 0.3));
    const pp = clamp((t - w.straight!.start) / 1.6);
    printerArt(ctx, c, ox, 290, 0.78, pp, clamp((t - w.send!.start + 0.1) / 0.2));
    const ba = clamp((t - w.bambu!.start) / 0.15);
    if (ba > 0) {
      setWorld(ctx, c, ox + 290, 120, 0.8 + 0.2 * ease.outBack(ba), 0.1);
      ctx.fillStyle = YELLOW; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-150, -50, 300, 100, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = font(HEAD, 46); ctx.textAlign = 'center'; ctx.fillText('Bambu Lab', 0, 16);
      ctx.textAlign = 'left'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // 5. parts list
  p5(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    say(ctx, c, 'PARTS LIST', ox, -800, 54, { f: BODY, col: GREY });
    say(ctx, c, 'text-to-cad', ox, -640, 150, { a: clamp((t - w.texttocad!.start + 0.1) / 0.15) });
    callout(ctx, c, '1x', 'FREE', ox, -380, 820, clamp((t - w.free!.start) / 0.2));
    callout(ctx, c, '1x', 'OPEN SOURCE', ox, -180, 820, clamp((t - w.open!.start) / 0.2));
    const ts = w['19000']!.start;
    const k = ease.outCubic(clamp((t - ts) / Math.max(0.5, w.stars!.end - ts)));
    callout(ctx, c, `${Math.round(19000 * k).toLocaleString('en-US')}x`, '★', ox, 20, 820, clamp((t - ts + 0.05) / 0.2), { fill: YELLOW });
    say(ctx, c, 'GITHUB STARS', ox, 170, 54, { a: clamp((t - w.github!.start) / 0.15), f: BODY });
    drawParts(ctx, c, ox + 300, 380, { yaw: t * 1.4, pitch: 0.6, dist: 900, s: 3.6, target: [0, 0, 5] }, [{ mesh: gear(16, 30, 10, '#FFFFFF') }], { look: 'line', shadow: 0.4, edgeW: 3 });
    person(ctx, c, ox - 260, 400, 0.9, t > w.stars!.start ? 1 : 0);
  }

  // 6. works with
  p6(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    say(ctx, c, 'WORKS WITH:', ox, -700, 110, { a: clamp((t - w.works!.start + 0.2) / 0.15) });
    const rows: [string, string][] = [['Claude Code', 'claude'], ['Codex', 'codex'], ['Cursor', 'cursor'], ['Gemini', 'gemini'], ['Grok', 'grok']];
    rows.forEach(([name, key], i) => {
      const a = clamp((t - w[key]!.start + 0.05) / 0.15);
      if (a <= 0) return;
      const y = -470 + i * 185;
      setWorld(ctx, c, ox, y, 0.85 + 0.15 * ease.outBack(a), 0);
      ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.roundRect(-400, -70, 800, 140, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = font(HEAD, 66); ctx.fillText(name, -360, 24);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      tick(ctx, c, ox + 310, y, a, true, 48);
    });
  }

  // 7. step one: ask. step two: print.
  p7(ctx: CanvasRenderingContext2D, c: Cam, t: number, ox: number) {
    const w = this.w;
    stepNo(ctx, c, '1', ox - 380, -720, clamp((t - w.step1!.start + 0.05) / 0.2), 84);
    bubble(ctx, c, ['ask.'], ox + 40, -720, 520, clamp((t - w.ask!.start) / 0.3), { size: 96, a: clamp((t - w.ask!.start + 0.1) / 0.2) });
    stepNo(ctx, c, '2', ox - 380, -330, clamp((t - w.step2!.start + 0.05) / 0.2), 84);
    say(ctx, c, 'print.', ox - 250, -300, 110, { a: clamp((t - w.print7!.start) / 0.15), align: 'left' });
    const pk = clamp((t - w.step2!.start) / 1.2);
    printerArt(ctx, c, ox - 120, 230, 0.8, pk, clamp((t - w.step2!.start + 0.1) / 0.2));
    person(ctx, c, ox + 300, 360, 1.0, t > w.print7!.start ? 1 : 0, clamp((t - w.step2!.start) / 0.2));
  }
}
