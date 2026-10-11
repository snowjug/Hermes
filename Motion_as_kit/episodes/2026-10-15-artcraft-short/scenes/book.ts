// The ArtCraft Short, one continuous plate: a sketchbook, a page per beat, each page flipping up over the spiral as
// the next begins.
//  1 POV: lettered in brush; a wooden mannequin sketched in pencil; on "control" it lifts its arm into a point, with
//    the rotation rings round the elbow; on "the AI draws" watercolour blooms over it.
//  2 ArtCraft in cursive; the room sketched in; the cast walks on and poses on "pose"; the camera on its tripod on
//    "camera", its field of view in red dashes; 1ST, circled, on "first".
//  3 a storyboard frame taped in, the blocking through the virtual camera; a GENERATE button; on "generate" a wet
//    wash paints the shot (an illustration); on "the poses guide" the pose lines show through the paint.
//  4 SAME ROOM, EVERY SHOT: three painted shots of the one room from three camera angles, taped in one by one.
//  5 a sticky note with a flat vase drawing; an arrow; on "3D" the vase stands up as a turning 3D prop.
//  6 FREE in brush with an ochre wash, & open source; +3,000 and doodled stars on "three thousand stars"; IN 1 DAY.
//  7 Stop prompting. scribbled out; Start directing. in red; the set again, small; the subscribe graphic.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { drawParts, lathe, mannequin, mixPose, POSES, project, xpt, type Obj, type View } from '@kit/_cad3d';
import { subscribe } from '@kit/_subscribe';
import {
  SketchPlate, sketch, wash, swipe, arrow, scribble, star, tapeBit, paintWash, frustumP, holes, room, figures, rig, cast, textW,
  POV, RIG_XF, GRAPHITE, LEAD, PAPER, VERMILION, OCHRE, COBALT, SAP, clamp, ease, lerp, ob, TAU,
} from '@ep/sketchbook';

const VASE = lathe([[0, 0], [34, 0], [44, 12], [50, 40], [46, 74], [30, 104], [22, 122], [26, 138], [32, 146], [0, 146]], 24, { col: '#EFE6D6' });
const SHOTS: View[] = [
  { yaw: 0.16, pitch: 0.05, dist: 430, s: 0.95, target: [5, 40, 112] },
  { yaw: -0.55, pitch: 0.12, dist: 520, s: 0.8, target: [0, 40, 100] },
  { yaw: 0.85, pitch: 0.2, dist: 600, s: 0.75, target: [0, 40, 100] },
];
const FLIP = 0.42;

export default class Book extends SketchPlate {
  ps: number[] = [];
  build() {
    this.take('POV', ['POV:', 'finally', 'control', 'AI', 'draws.']);
    this.take('In ArtCraft', ['ArtCraft,', 'pose', 'characters', 'place', 'camera', 'first.']);
    this.take('Then you generate', ['generate,', 'poses', 'guide', 'picture.']);
    this.take('Same room', ['Same', 'room,', 'every', 'shot.', 'Turn', ['picture2', 'picture'], 'into', '3D', 'prop.']);
    this.take("It's free", ['free', 'open', 'source,', 'three', 'thousand', 'stars', 'in', 'day.']);
    this.take('Stop prompting', ['Stop', 'prompting.', 'Start', 'directing.', 'Subscribe', ['every2', 'every'], ['day2', 'day.']]);
    const rs = this.ctx.lyrics.lines.map((l) => l.start);
    this.ps = [0, rs[1]!, rs[2]!, rs[3]!, this.w.turn!.start, rs[4]!, rs[5]!].map((s, i) => (i ? s - 0.3 : 0));
    this.cam.key(this.ctx.start, 0, 0, 1, 0);
    this.cam.key(this.ctx.end, 0, 0, 1, 0);
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    let cur = 0;
    this.ps.forEach((s, i) => { if (t >= s) cur = i; });
    // a slow push-in on each page
    const pc = (i: number): Cam => ({ ...c, z: c.z * (1 + 0.025 * clamp((t - this.ps[i]!) / 5)) });
    this.page(cur, ctx, t, pc(cur));
    holes(ctx, c);
    // the previous page lifting away over the spiral
    const u = cur > 0 ? (t - this.ps[cur]!) / FLIP : 1;
    if (u < 1) {
      const e = ease.inCubic(clamp(u)), z = c.z * (1 - 0.1 * e), lift = e * (H + 200);
      const fc: Cam = { cx: c.cx + 30 * e, cy: c.cy + lift / z, z, roll: -0.06 * e };
      // its shadow on the new page
      const yb = H / 2 + (H / 2 - lift / 1) * 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sg = ctx.createLinearGradient(0, yb, 0, yb + 160);
      sg.addColorStop(0, `rgba(40,30,20,${0.28 * (1 - e)})`); sg.addColorStop(1, 'rgba(40,30,20,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, yb, W, 160);
      setWorld(ctx, fc, 0, 0, 1, 0);
      const pg = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
      pg.addColorStop(0, '#E9E2D4'); pg.addColorStop(0.4, PAPER); pg.addColorStop(1, '#EFE9DC');
      ctx.fillStyle = pg; ctx.fillRect(-W / 2 - 4, -H / 2, W + 8, H);
      ctx.strokeStyle = 'rgba(58,58,64,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(-W / 2 - 4, -H / 2, W + 8, H);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.page(cur - 1, ctx, t, { ...pc(cur - 1), cx: fc.cx, cy: fc.cy, z: fc.z * (1 + 0.025 * clamp((t - this.ps[cur - 1]!) / 5)), roll: fc.roll });
      holes(ctx, fc);
    }
  }

  page(i: number, ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    switch (i) {
      // ---- 1 POV
      case 0: {
        this.pen(ctx, c, 'POV:', 'felix', 240, 0, -600, t, 0.12, 0.85, { lw: 12 });
        const pk = ease.inOutCubic(clamp((t - w.control!.start) / 0.55));
        const pose = mixPose(POSES.stand, POSES.point, pk);
        const view: View = { yaw: 0.55 - 0.05 * t, pitch: 0.14, dist: 900, s: 3.2, target: [0, 0, 88] };
        const dk = clamp((t - w.ai!.start + 0.1) / 0.6);
        wash(ctx, c, 20, -40, 360, 470, COBALT, dk, 11, { rot: 0.2 });
        // construction marks: the centre line and a floor ellipse round the feet
        const gk = clamp((t - 0.3) / 0.6);
        const P0 = drawParts(ctx, c, 0, -40, view, [], {});
        const ring = Array.from({ length: 41 }, (_, i) => project(P0, [95 * Math.cos((i / 40) * TAU), 95 * Math.sin((i / 40) * TAU), 0]));
        const top0 = project(P0, [0, 0, 205]), foot = project(P0, [0, 0, -30]);
        setWorld(ctx, c, 0, -40, 1, 0);
        ctx.strokeStyle = 'rgba(106,106,114,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath(); ring.slice(0, Math.max(1, Math.ceil(41 * gk))).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(top0[0], top0[1]); ctx.lineTo(top0[0], lerp(top0[1], foot[1], gk)); ctx.stroke();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const P = sketch(ctx, c, 0, -40, view, [{ mesh: mannequin(pose, '#EFE6D6', '#D9CBB5') }], { reveal: clamp((t - 0.35) / 1.1), box: [900, 1100], lw: 3 });
        wash(ctx, c, 170, -280, 210, 170, OCHRE, clamp((t - w.draws!.start + 0.1) / 0.5), 12);
        wash(ctx, c, -190, 250, 180, 130, VERMILION, clamp((t - w.draws!.start - 0.1) / 0.5), 13, { a: 0.8 });
        // the rotation rings round the elbow while it moves
        const rk = clamp((t - w.control!.start + 0.1) / 0.25) * (1 - clamp((t - w.ai!.start) / 0.3));
        if (rk > 0) {
          const e = project(P, xpt(pose.elR, {}));
          setWorld(ctx, c, e[0], -40 + e[1], ob(rk), 0);
          ctx.lineWidth = 4; ctx.globalAlpha = rk;
          ([[VERMILION, 0.25, 0.4], [SAP, 1.2, 0.95], [COBALT, -0.6, 0.6]] as [string, number, number][]).forEach(([col, rot, sq]) => {
            ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 86, 86 * sq, rot, 0, TAU * clamp((t - w.control!.start + 0.1) / 0.4)); ctx.stroke();
          });
          ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        break;
      }
      // ---- 2 pose and place
      case 1: {
        const t0 = this.ps[1]!;
        this.pen(ctx, c, 'ArtCraft', 'script', 200, 0, -640, t, w.artcraft!.start - 0.05, w.artcraft!.end + 0.1, { lw: 8 });
        swipe(ctx, c, -300, -600, 600, 26, clamp((t - w.artcraft!.end - 0.05) / 0.3), VERMILION, 0.55);
        const view: View = { yaw: 0.6 + 0.02 * (t - t0), pitch: 0.42, dist: 1500, s: 1.45, target: [0, -60, 90] };
        const fk = clamp((t - w.pose!.start + 0.35) / 0.3), pk = ease.inOutCubic(clamp((t - w.pose!.start) / 0.6));
        const ck = ob(clamp((t - w.camera!.start + 0.1) / 0.4));
        wash(ctx, c, -250, 170, 170, 120, COBALT, clamp((t - w.camera!.start) / 0.5), 22);
        const objs: Obj[] = [{ mesh: room() }];
        if (fk > 0) objs.push({ mesh: figures(cast(pk)), a: fk });
        if (ck > 0) objs.push({ mesh: rig({ ...RIG_XF, s: ck }) });
        const P = sketch(ctx, c, 0, -30, view, objs, { reveal: clamp((t - t0 - 0.35) / 0.8), box: [1080, 900] });
        wash(ctx, c, 20, 20, 250, 120, OCHRE, clamp((t - w.characters!.start) / 0.5), 21, { rot: -0.1, a: 0.9 });
        frustumP(ctx, c, 0, -30, P, [-30, -216, 150], ease.outCubic(clamp((t - w.camera!.start - 0.25) / 0.5)));
        // 1ST, circled
        const fs = clamp((t - w.first!.start + 0.05) / 0.3);
        if (fs > 0) {
          this.pen(ctx, c, '1st', 'hscript', 110, -330, 360, t, w.first!.start - 0.05, w.first!.start + 0.3, { col: VERMILION, lw: 7 });
          setWorld(ctx, c, -330, 330, 1, 0);
          ctx.strokeStyle = VERMILION; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.ellipse(0, 0, 120, 75, -0.1, -2.2, -2.2 + TAU * 1.05 * clamp((t - w.first!.start - 0.2) / 0.35)); ctx.stroke();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          arrow(ctx, c, [-230, 300], [-160, 230], [-150, 150], clamp((t - w.first!.start - 0.45) / 0.3), { col: VERMILION });
        }
        break;
      }
      // ---- 3 generate
      case 2: {
        const t0 = this.ps[2]!, fw = 920, fh = 518, fy = -380;
        const fs = cast(1), v = { ...POV, s: (2.15 * fw) / 1440 };
        // the frame, taped in
        setWorld(ctx, c, 0, fy, 1, 0);
        ctx.fillStyle = '#FBF8F2'; ctx.shadowColor = 'rgba(40,30,20,0.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
        ctx.fillRect(-fw / 2 - 16, -fh / 2 - 16, fw + 32, fh + 32); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.save(); ctx.beginPath(); ctx.rect(-fw / 2, -fh / 2, fw, fh); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        const P = sketch(ctx, c, 0, fy, v, [{ mesh: room() }, { mesh: figures(fs) }], { reveal: clamp((t - t0 - 0.3) / 0.7), box: [fw, fh] });
        paintWash(ctx, c, 0, fy, fw, fh, P, fs, { reveal: clamp((t - w.generate!.start - 0.1) / 0.9) });
        const gk = clamp((t - w.poses!.start) / 0.3);
        if (gk > 0) drawParts(ctx, c, 0, fy, v, [{ mesh: figures(fs), wire: 1, edge: '#FFF4D6', a: gk * 0.9 }], { look: 'line', shadow: 0, edgeW: 1.6 });
        ctx.restore();
        setWorld(ctx, c, 0, fy, 1, 0);
        ctx.strokeStyle = GRAPHITE; ctx.lineWidth = 3; ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        tapeBit(ctx, c, -fw / 2 + 30, fy - fh / 2 - 6, 150, -0.6);
        tapeBit(ctx, c, fw / 2 - 30, fy - fh / 2 - 6, 150, 0.6);
        this.pen(ctx, c, 'SHOT 1 · ILLUSTRATION', 'readable', 34, -fw / 2, fy + fh / 2 + 56, t, t0 + 0.4, t0 + 0.9, { align: 'left', lw: 3, col: LEAD });
        // the blocking it came from, small, and the button
        const bk = clamp((t - t0 - 0.5) / 0.6);
        sketch(ctx, c, -230, 260, { yaw: 0.4, pitch: 0.3, dist: 1200, s: 0.95, target: [0, 50, 80] }, [{ mesh: figures(fs) }], { reveal: bk, box: [420, 380] });
        arrow(ctx, c, [-150, 130], [-60, 20], [-120, -105], clamp((t - w.guide!.start + 0.1) / 0.35), { col: VERMILION, lw: 6 });
        const press = t > w.generate!.start && t < w.generate!.start + 0.12 ? 0.92 : 1;
        const ba = clamp((t - t0 - 0.4) / 0.3);
        if (ba > 0) {
          wash(ctx, c, 230, 230, 190, 70, VERMILION, clamp((t - w.generate!.start) / 0.3), 31);
          setWorld(ctx, c, 230, 230, press, -0.03);
          ctx.globalAlpha = ba; ctx.strokeStyle = GRAPHITE; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.roundRect(-170, -55, 340, 110, 55); ctx.stroke();
          ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.pen(ctx, c, 'GENERATE', 'readable', 48, 230, 247, t, t0 + 0.45, t0 + 0.9, { lw: 5 });
        }
        break;
      }
      // ---- 4 same room, every shot
      case 3: {
        const fs = cast(1);
        const spots: [number, number, number, number][] = [[-95, -650, -0.05, this.ps[3]! + 0.15], [95, -270, 0.035, w.room!.start], [-95, 110, -0.02, w.every!.start]];
        spots.forEach(([x, y, rot, ta], k) => {
          const a = clamp((t - ta) / 0.2);
          if (a <= 0) return;
          const s = 0.92 + 0.08 * ob(a), fw = 560, fh = 315;
          setWorld(ctx, c, x, y, s, rot);
          ctx.fillStyle = '#FBF8F2'; ctx.shadowColor = 'rgba(40,30,20,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
          ctx.fillRect(-fw / 2 - 14, -fh / 2 - 14, fw + 28, fh + 28); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.save(); ctx.beginPath(); ctx.rect(-fw / 2, -fh / 2, fw, fh); ctx.clip();
          const cc: Cam = { ...c };
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          const P = drawParts(ctx, cc, x, y, SHOTS[k]!, [], {});
          sketch(ctx, cc, x, y, SHOTS[k]!, [{ mesh: room() }, { mesh: figures(fs) }], {});
          paintWash(ctx, cc, x, y, fw, fh, P, fs, { reveal: clamp((t - ta - 0.1) / 0.5), seed: 5 + k });
          ctx.restore();
          setWorld(ctx, c, x, y, s, rot);
          ctx.strokeStyle = GRAPHITE; ctx.lineWidth = 2.5; ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          tapeBit(ctx, c, x + (k % 2 ? -235 : 235), y - fh / 2 - 4, 120, k % 2 ? -0.5 : 0.5, a, k === 1 ? 'rgba(74,127,181,0.5)' : 'rgba(107,163,104,0.5)');
          this.pen(ctx, c, `${k + 1}`, 'hscript', 150, k % 2 ? -340 : 345, y + 50, t, ta + 0.1, ta + 0.4, { lw: 7, col: VERMILION });
        });
        this.pen(ctx, c, 'same room!', 'hscript', 84, 250, 400, t, w.shot!.start - 0.05, w.shot!.end + 0.35, { col: VERMILION, lw: 6, rot: -0.08 });
        break;
      }
      // ---- 5 a picture into a 3D prop
      case 4: {
        const t0 = this.ps[4]!;
        const na = clamp((t - t0 - 0.05) / 0.25);
        if (na > 0) {
          setWorld(ctx, c, -230, -500, 0.9 + 0.1 * ob(na), -0.07);
          ctx.globalAlpha = na; ctx.fillStyle = '#F7D774'; ctx.shadowColor = 'rgba(40,30,20,0.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
          ctx.fillRect(-190, -190, 380, 380); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(-190, -190, 380, 40);
          // the flat vase, drawn as a 2D outline
          const pk = clamp((t - t0 - 0.2) / 0.7);
          ctx.strokeStyle = GRAPHITE; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          const prof: [number, number][] = [[34, 0], [44, 12], [50, 40], [46, 74], [30, 104], [22, 122], [26, 138], [32, 146]];
          const n = Math.ceil(prof.length * pk);
          ctx.beginPath(); prof.slice(0, n).forEach(([r, z], j) => (j ? ctx.lineTo(r * 1.7, 120 - z * 1.7) : ctx.moveTo(r * 1.7, 120 - z * 1.7))); ctx.stroke();
          ctx.beginPath(); prof.slice(0, n).forEach(([r, z], j) => (j ? ctx.lineTo(-r * 1.7, 120 - z * 1.7) : ctx.moveTo(-r * 1.7, 120 - z * 1.7))); ctx.stroke();
          if (pk >= 1) { ctx.beginPath(); ctx.moveTo(-34 * 1.7, 120); ctx.lineTo(34 * 1.7, 120); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 120 - 146 * 1.7, 32 * 1.7, 8, 0, 0, TAU); ctx.stroke(); }
          ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.pen(ctx, c, 'a picture', 'hscript', 70, -230, -250, t, w.picture2!.start - 0.05, w.picture2!.end + 0.2, { lw: 5, rot: -0.07 });
        }
        arrow(ctx, c, [-60, -420], [190, -420], [180, -230], clamp((t - w.into!.start + 0.1) / 0.4), { lw: 6 });
        const vk = clamp((t - w['3d']!.start + 0.3) / 0.45);
        if (vk > 0) {
          wash(ctx, c, 120, 70, 250, 300, COBALT, clamp((t - w['3d']!.start) / 0.6), 41, { rot: 0.15 });
          sketch(ctx, c, 120, 70, { yaw: 0.3 + 1.4 * (t - w['3d']!.start), pitch: 0.38, dist: 900, s: 2.4 * ob(vk), target: [0, 0, 73] }, [{ mesh: VASE }], { lw: 3 });
          this.pen(ctx, c, '3D PROP', 'readable', 64, 120, 420, t, w.prop!.start - 0.05, w.prop!.start + 0.4, { col: VERMILION, lw: 6 });
        }
        break;
      }
      // ---- 6 free, open source, the stars
      case 5: {
        wash(ctx, c, 0, -640, 360, 150, OCHRE, clamp((t - w.free!.start + 0.15) / 0.5), 51, { rot: -0.05 });
        this.pen(ctx, c, 'FREE', 'felix', 300, 0, -560, t, w.free!.start - 0.1, w.free!.start + 0.45, { lw: 14 });
        this.pen(ctx, c, '& open source', 'script', 120, 0, -360, t, w.open!.start - 0.05, w.source!.end, { lw: 6 });
        this.pen(ctx, c, '+3,000', 'felix', 210, -50, -40, t, w.three!.start - 0.05, w.stars!.start + 0.1, { lw: 11, col: GRAPHITE });
        star(ctx, c, 330, -110, 80, clamp((t - w.stars!.start) / 0.35), 52);
        const pts: [number, number, number][] = [[-380, -200, 40], [380, 60, 46], [-330, 120, 34], [200, -250, 30], [-200, 230, 44], [330, 250, 36], [-420, -20, 28], [60, 200, 30]];
        pts.forEach(([x, y, r], k) => star(ctx, c, x, y, r, clamp((t - w.thousand!.start - k * 0.11) / 0.3), 60 + k));
        const dk = clamp((t - w.day!.start + 0.05) / 0.3);
        if (dk > 0) {
          this.pen(ctx, c, 'IN 1 DAY', 'readable', 70, 0, 380, t, w.in!.start - 0.05, w.day!.start + 0.3, { col: VERMILION, lw: 6 });
          setWorld(ctx, c, 0, 355, 1, 0);
          ctx.strokeStyle = VERMILION; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.ellipse(0, 0, 230, 70, 0.04, -2.6, -2.6 + TAU * 1.05 * clamp((t - w.day!.start - 0.05) / 0.4)); ctx.stroke();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        break;
      }
      // ---- 7 stop prompting, start directing
      case 6: {
        const sw = textW('Stop prompting.', 'script', 130);
        this.pen(ctx, c, 'Stop prompting.', 'script', 130, 0, -620, t, w.stop!.start - 0.05, w.prompting!.end, { lw: 6 });
        scribble(ctx, c, 0, -645, sw + 20, 120, clamp((t - w.prompting!.end - 0.05) / 0.35), 71, VERMILION);
        swipe(ctx, c, -380, -415, 760, 44, clamp((t - w.directing!.end) / 0.35), OCHRE, 0.6);
        this.pen(ctx, c, 'Start directing.', 'felix', 150, 0, -400, t, w.start!.start - 0.05, w.directing!.end + 0.1, { lw: 10, col: VERMILION });
        const sk = clamp((t - w.start!.start) / 0.7);
        if (sk > 0) sketch(ctx, c, 0, -40, { yaw: 0.6, pitch: 0.4, dist: 1500, s: 0.95, target: [0, -60, 90] }, [{ mesh: room() }, { mesh: figures(cast(1)) }, { mesh: rig(RIG_XF) }], { reveal: sk, box: [900, 520] });
        break;
      }
    }
  }

  override capPen(t: number) { return t < this.w.subscribe!.start - 0.1; }

  override top(ctx: CanvasRenderingContext2D, t: number, _c: Cam) {
    subscribe(ctx, t, this.w.subscribe!.start - 0.1, this.ctx.end + 1, { x: W / 2, y: H / 2 + 310, s: 0.95, dark: false });
    void GRAPHITE; void lerp; void PAPER;
  }

  override pfx(t: number) {
    const w = this.w;
    return { zoom: this.punch(t, w.control!.start, 0.015) * this.punch(t, w.generate!.start, 0.02) * this.punch(t, w['3d']!.start, 0.02) * this.punch(t, w.free!.start, 0.02) * this.punch(t, w.start!.start, 0.02) };
  }
}
