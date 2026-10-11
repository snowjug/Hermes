// The Diagram Design Short, one continuous plate on a design tool's canvas.
//  1 POV: a white frame on the canvas; the YOU cursor drops a comment: "draw a diagram of my app".
//  2 the default AI diagram slams into the frame: pastel boxes, shadows, tangled arrows that wriggle like noodles on
//    "spaghetti" (a SPAGHETTI reaction sticker).
//  3 the AGENT cursor drags a component, diagram-design · skill, into the frame; the comment asks again.
//  4 the same boxes glide clean while the inspector logs each change (Fill 5 → 1 accent, Stroke 4 → 1 px, Effects
//    shadow → none); on "44" the camera pulls out to a canvas of 44 frames, one per diagram type, then back in as a
//    swatch row repaints the accent in a brand teal.
//  5 the frame is renamed Diagram Design and a ★ counter in the toolbar runs to 49,421.
//  6 the AGENT cursor's tag becomes AGENT · DESIGNER; the subscribe graphic.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { W, H } from '@engine/gl';
import { font, measure } from '@engine/type';
import { subscribe } from '@kit/_subscribe';
import { Board, diagram, cursor, selection, artboard, text, INK, GREY, LINE, SEL, CORAL, WHITE, SANS, SANSB, MONO, MONOB, clamp, ease, ob, lerp, TAU } from '@ep/artboard';

const TEAL = '#14B8A6';
const AB = { x: 0, y: -210, w: 960, h: 840 };
const TYPES = ['Architecture', 'IT current-state', 'Flowchart', 'Sequence', 'State machine', 'ER model', 'Timeline', 'Swimlane', 'Quadrant',
  'Radar', 'Loop', 'Nested', 'Tree', 'Org chart', 'Layer stack', 'Venn', 'Pyramid', 'Bar chart', 'Treemap', 'Line chart', 'Gantt', 'Scatter',
  'High-level', 'Process', 'Medallion', 'Data flow', 'DP integration', 'DP security', 'Sankey', 'Fishbone', 'Wardley map', 'Kanban',
  'User journey', 'Deployment', 'Dependency', 'UML class', 'Story map', 'DB schema', 'Polar', 'Waterfall', 'Arch delta', 'Exploded',
  'Axonometric', 'Heatmap'];

/** tiny pictogram per type */
function glyph(ctx: CanvasRenderingContext2D, i: number, w: number, h: number, col: string) {
  ctx.strokeStyle = col; ctx.lineWidth = 6;
  const g = i % 8;
  ctx.beginPath();
  if (g === 0) { ctx.strokeRect(-w * 0.36, -24, 80, 48); ctx.strokeRect(w * 0.36 - 80, -h * 0.3, 80, 44); ctx.strokeRect(w * 0.36 - 80, h * 0.1, 80, 44); ctx.moveTo(-w * 0.36 + 80, 0); ctx.lineTo(w * 0.36 - 80, -h * 0.2); }
  else if (g === 1) { for (let k = 0; k < 4; k++) ctx.rect(-w * 0.36 + k * w * 0.19, h * 0.3 - (k + 1) * h * 0.13, w * 0.12, (k + 1) * h * 0.13); }
  else if (g === 2) { ctx.moveTo(-w * 0.38, h * 0.2); for (let k = 0; k <= 6; k++) ctx.lineTo(-w * 0.38 + (k * w * 0.76) / 6, h * 0.2 - Math.sin(k * 1.1 + i) * h * 0.2 - k * 6); }
  else if (g === 3) { ctx.arc(0, 0, h * 0.3, 0, TAU); ctx.moveTo(0, 0); ctx.lineTo(h * 0.3, 0); ctx.moveTo(0, 0); ctx.lineTo(-h * 0.15, -h * 0.26); }
  else if (g === 4) { ctx.moveTo(0, -h * 0.32); ctx.lineTo(w * 0.22, 0); ctx.lineTo(0, h * 0.32); ctx.lineTo(-w * 0.22, 0); ctx.closePath(); }
  else if (g === 5) { ctx.moveTo(-w * 0.38, 0); ctx.lineTo(w * 0.38, 0); for (let k = 0; k < 4; k++) { ctx.moveTo(-w * 0.3 + k * w * 0.2, -20); ctx.lineTo(-w * 0.3 + k * w * 0.2, 20); } }
  else if (g === 6) { ctx.arc(-30, 0, h * 0.24, 0, TAU); ctx.moveTo(30 + h * 0.24, 0); ctx.arc(30, 0, h * 0.24, 0, TAU); }
  else { ctx.moveTo(0, -h * 0.32); ctx.lineTo(w * 0.26, h * 0.28); ctx.lineTo(-w * 0.26, h * 0.28); ctx.closePath(); }
  ctx.stroke();
}

export default class BoardScene extends Board {
  build() {
    this.take('POV', ['POV:', 'asked', 'AI', 'diagram.']);
    this.take('It gave you', ['gave', 'spaghetti.']);
    this.take('Now add one', ['add', 'free', 'skill,', 'ask', 'again.']);
    this.take('One accent', ['accent', 'colour,', 'hairline', 'lines,', 'zero', 'shadows,', '44', ['diagram4', 'diagram'], 'types', "brand's", 'colours.']);
    this.take("It's called Diagram", ['called', ['dname', 'Diagram'], 'Design,', '49,000', 'GitHub', 'stars.']);
    this.take('Your AI just hired', [['ai6', 'AI'], 'hired', 'designer.', 'Subscribe', 'new', 'tool', 'every', 'day.']);
    const K = this.cam, s = this.ctx.start, e = this.ctx.end;
    K.key(s, 0, -60, 1.1);
    K.key(s + 0.6, 0, -60, 1.0, 0, ease.outExpo);
    K.key(this.s('gave') - 0.05, 0, -60, 1.02, 0, ease.inOutQuad);
    K.key(this.s('gave') + 0.3, 0, -100, 1.08, 0, ease.outExpo);
    K.key(this.s('add') - 0.1, 0, -100, 1.1, 0, ease.inOutQuad);
    K.key(this.s('add') + 0.5, 0, -60, 1.0, 0, ease.inOutCubic);
    K.key(this.s('44') - 0.15, 0, -60, 1.0, 0, ease.inOutQuad);
    K.key(this.s('44') + 0.55, 0, -160, 0.3, 0, ease.inOutCubic);
    K.key(this.s('brands') - 0.15, 0, -160, 0.31, 0, ease.inOutQuad);
    K.key(this.s('brands') + 0.45, 0, -60, 1.0, 0, ease.inOutCubic);
    K.key(this.s('called') - 0.1, 0, -60, 1.0, 0, ease.inOutQuad);
    K.key(this.s('called') + 0.4, 0, -230, 1.07, 0, ease.inOutCubic);
    K.key(this.s('hired') - 0.2, 0, -230, 1.09, 0, ease.inOutQuad);
    K.key(this.s('hired') + 0.4, 0, -60, 1.0, 0, ease.inOutCubic);
    K.key(e, 0, -60, 1.02, 0, ease.inOutQuad);
  }

  m(t: number) { return clamp((t - this.s('accent') + 0.1) / 2.4); }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the other 43 frames, seen when the camera pulls out
    const far = 1 - clamp((c.z - 0.35) / 0.4);
    if (far > 0) {
      let k = 1;
      for (let r = -3; r <= 3; r++) for (let q = -4; q <= 3; q++) {
        if (r >= -2 && r <= 1 && q >= -2 && q <= 1) continue;
        if (k >= TYPES.length) continue;
        const x = q * 440 + 220, y = AB.y + r * 380 + 190, kk = clamp((t - this.s('44') - 0.1 - k * 0.012) / 0.25);
        if (kk > 0) {
          setWorld(ctx, c, x, y, 0.9 + 0.1 * ob(kk), 0);
          ctx.globalAlpha = far * kk; ctx.fillStyle = WHITE; ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 12; ctx.fillRect(-190, -150, 380, 300); ctx.shadowBlur = 0;
          ctx.save(); ctx.translate(0, -10); glyph(ctx, k, 380, 230, k % 5 === 0 ? CORAL : '#9AA0AA'); ctx.restore();
          ctx.font = font(SANSB, 30); ctx.fillStyle = GREY; ctx.fillText(TYPES[k]!, -190, -166);
          ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        k++;
      }
    }
    // the frame
    const named = t > this.s('called') + 0.1;
    artboard(ctx, c, AB.x, AB.y, AB.w, AB.h, named ? 'Diagram Design' : 'Frame 1 · my app', clamp((t - this.ctx.start) / 0.3));
    if (named && t < this.s('called') + 0.8) { // the rename caret
      setWorld(ctx, c, AB.x - AB.w / 2 + measure('Diagram Design', SANS, 22) + 4, AB.y - AB.h / 2 - 32, 1, 0);
      ctx.fillStyle = SEL; ctx.fillRect(0, 0, 2, 24); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the diagram
    const show = clamp((t - this.s('gave') + 0.05) / 0.45);
    const wig = clamp((t - this.s('spaghetti') + 0.1) / 0.3) * (1 - clamp((t - this.s('accent')) / 0.6));
    const brand = clamp((t - this.s('brands') - 0.15) / 0.4);
    diagram(ctx, c, AB.x, AB.y + 20, this.m(t), { show, wig, acc: brand > 0.5 ? TEAL : undefined });
    // the skill dropped in, as a component
    const drag = ease.inOutCubic(clamp((t - this.s('add') + 0.1) / 0.9));
    if (drag > 0 && t < this.s('accent') + 0.6) {
      const x = lerp(700, 250, drag), y = lerp(200, AB.y + AB.h / 2 - 70, drag), a = 1 - clamp((t - this.s('accent') - 0.2) / 0.4);
      setWorld(ctx, c, x, y, 1, 0);
      ctx.globalAlpha = a; ctx.fillStyle = '#FFF0EB'; ctx.strokeStyle = CORAL; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(-190, -36, 380, 72, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = CORAL; ctx.save(); ctx.translate(-160, 0); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore();
      ctx.font = font(SANSB, 26); ctx.fillStyle = INK; ctx.fillText('diagram-design', -130, 4);
      ctx.font = font(MONO, 16); ctx.fillStyle = GREY; ctx.fillText('skill · component', -130, 26);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      cursor(ctx, c, x + 140, y + 10, 'AGENT', CORAL, { a });
    }
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the comment: "draw a diagram of my app" (asked, then asked again)
    const cmt = (t0: number, t1: number, again: boolean) => {
      const k = clamp((t - t0) / 0.3) * (1 - clamp((t - t1) / 0.3));
      if (k <= 0) return;
      const s = 'draw a diagram of my app', n = Math.floor(clamp((t - t0 - 0.1) * 30, 0, s.length));
      setWorld(ctx, c, -420, AB.y - 300, 0.85 + 0.15 * ob(k), 0);
      ctx.globalAlpha = k; ctx.fillStyle = WHITE; ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
      ctx.beginPath(); ctx.roundRect(0, 0, 640, 110, [24, 24, 24, 4]); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = SEL; ctx.beginPath(); ctx.arc(46, 55, 24, 0, TAU); ctx.fill();
      ctx.fillStyle = WHITE; ctx.font = font(SANSB, 24); ctx.textAlign = 'center'; ctx.fillText('Y', 46, 64); ctx.textAlign = 'left';
      ctx.fillStyle = GREY; ctx.font = font(SANS, 18); ctx.fillText(again ? 'You · again ↻' : 'You · now', 86, 40);
      ctx.fillStyle = INK; ctx.font = font(SANS, 30); ctx.fillText(s.slice(0, n), 86, 82);
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    cmt(this.s('asked') - 0.15, this.s('gave') + 0.4, false);
    cmt(this.s('ask') - 0.1, this.s('accent') + 0.2, true);
    // the YOU cursor
    const yk = clamp((t - this.ctx.start - 0.2) / 0.4) * (1 - clamp((t - this.s('add')) / 0.4));
    cursor(ctx, c, lerp(-200, -430, ease.inOutCubic(clamp((t - this.s('asked') + 0.4) / 0.4))), AB.y - 200, 'YOU', SEL, { a: yk });
    // SPAGHETTI
    const sp = clamp((t - this.s('spaghetti')) / 0.25) * (1 - clamp((t - this.s('add') + 0.1) / 0.3));
    if (sp > 0) {
      setWorld(ctx, c, 250, AB.y + 330, 0.7 + 0.3 * ob(sp), -0.12);
      ctx.globalAlpha = sp; ctx.fillStyle = '#FFD84D'; ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 16; ctx.fillRect(-170, -50, 340, 100); ctx.shadowBlur = 0;
      ctx.font = font(SANSB, 46); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('SPAGHETTI', 0, 16); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the selection round the diagram while the skill works
    const sk = clamp((t - this.s('skill') + 0.1) / 0.2) * (1 - clamp((t - this.s('44') + 0.3) / 0.3));
    selection(ctx, c, AB.x, AB.y + 20, 800, 760, sk, CORAL, 'diagram-design is editing…');
    // the inspector
    const ik = clamp((t - this.s('accent') + 0.2) / 0.3) * (1 - clamp((t - this.s('44') + 0.1) / 0.3));
    if (ik > 0) {
      setWorld(ctx, c, 0, 400, 1, 0);
      ctx.globalAlpha = ik; ctx.fillStyle = WHITE; ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(-480, -110, 960, 220, 14); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.font = font(SANSB, 20); ctx.fillStyle = GREY; ctx.fillText('INSPECTOR', -450, -72);
      const rows: [string, string, string, string][] = [['Fill', '5 colours', '1 accent', 'accent'], ['Stroke', '4 px', '1 px hairline', 'hairline'], ['Effects', 'drop shadow', 'none', 'zero']];
      rows.forEach(([lab, from, to, key], i) => {
        const y = -26 + i * 50, done = clamp((t - this.s(key) - 0.1) / 0.25);
        ctx.font = font(SANS, 26); ctx.fillStyle = INK; ctx.fillText(lab, -450, y);
        ctx.font = font(MONO, 24); ctx.fillStyle = done > 0.5 ? '#B0B4BB' : INK; ctx.fillText(from, -250, y);
        if (done > 0) { ctx.strokeStyle = '#B0B4BB'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-250, y - 8); ctx.lineTo(-250 + measure(from, MONO, 24) * done, y - 8); ctx.stroke(); }
        if (done > 0) { ctx.globalAlpha = ik * done; ctx.fillStyle = CORAL; ctx.font = font(MONOB, 24); ctx.fillText('→  ' + to, 30, y); ctx.globalAlpha = ik; }
      });
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // 44 TYPES label while zoomed out (screen space so it reads)
    const zk = clamp((t - this.s('44') - 0.2) / 0.3) * (1 - clamp((t - this.s('brands') + 0.1) / 0.3));
    if (zk > 0) {
      ctx.setTransform(1, 0, 0, 1, W / 2, 330); ctx.globalAlpha = zk;
      ctx.font = font(SANSB, 64); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('44 DIAGRAM TYPES', 0, 0); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the brand swatches
    const bk = clamp((t - this.s('brands') + 0.1) / 0.3) * (1 - clamp((t - this.s('called') + 0.1) / 0.3));
    if (bk > 0) {
      setWorld(ctx, c, 0, 400, 1, 0); ctx.globalAlpha = bk;
      ctx.fillStyle = WHITE; ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.roundRect(-330, -60, 660, 120, 14); ctx.fill(); ctx.shadowBlur = 0;
      ['#F7F5F0', '#10201E', '#6B7C79', TEAL, '#2563EB'].forEach((col, i) => {
        ctx.fillStyle = col; ctx.strokeStyle = col === TEAL ? SEL : LINE; ctx.lineWidth = col === TEAL ? 4 : 1.5;
        ctx.beginPath(); ctx.roundRect(-290 + i * 120, -36, 72, 72, 10); ctx.fill(); ctx.stroke();
      });
      ctx.font = font(SANSB, 18); ctx.fillStyle = GREY; ctx.textAlign = 'center'; ctx.fillText('YOUR BRAND', 0, 88); ctx.textAlign = 'left';
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      cursor(ctx, c, -290 + 3 * 120 + 50, 420, 'AGENT', CORAL, { a: bk, press: t > this.s('brands') + 0.15 && t < this.s('brands') + 0.3 ? 1 : 0 });
    }
    // the agent, hired
    const hk = clamp((t - this.s('hired') + 0.1) / 0.3);
    if (hk > 0) cursor(ctx, c, 90, AB.y + 120, t > this.s('designer') ? 'AGENT · DESIGNER' : 'AGENT', CORAL, { a: hk, s: 1.9 });
    this.toolbar(ctx, t);
    subscribe(ctx, t, this.s('subscribe') - 0.1, this.ctx.end + 1, { x: W / 2, y: H / 2 + 400, s: 0.95, dark: false });
    void w; void text;
  }

  /** the toolbar along the top, screen-fixed: tools, the file name, the two avatars and (later) the star badge */
  toolbar(ctx: CanvasRenderingContext2D, t: number) {
    const a = clamp((t - this.ctx.start) / 0.3);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
    ctx.fillStyle = '#2C2C2C'; ctx.fillRect(0, 0, W, 104);
    ctx.strokeStyle = '#E6E6E6'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    // move, frame, pen, text
    ctx.beginPath(); ctx.moveTo(40, 34); ctx.lineTo(40, 70); ctx.lineTo(50, 60); ctx.lineTo(58, 74); ctx.lineTo(62, 72); ctx.lineTo(55, 58); ctx.lineTo(68, 58); ctx.closePath(); ctx.stroke();
    ctx.strokeRect(100, 36, 34, 34); ctx.beginPath(); ctx.moveTo(176, 72); ctx.lineTo(200, 36); ctx.lineTo(206, 42); ctx.lineTo(184, 76); ctx.closePath(); ctx.stroke();
    ctx.font = font(SANSB, 34); ctx.fillStyle = '#E6E6E6'; ctx.fillText('T', 240, 66);
    const named = t > this.s('called') + 0.1;
    ctx.font = font(SANS, 24); ctx.fillStyle = '#E6E6E6'; ctx.textAlign = 'center'; ctx.fillText(named ? 'my-app / Diagram Design' : 'my-app / architecture', W / 2 + 40, 62); ctx.textAlign = 'left';
    [[W - 150, SEL, 'Y'], [W - 100, CORAL, 'A']].forEach(([x, col, l]) => { ctx.fillStyle = col as string; ctx.beginPath(); ctx.arc(x as number, 52, 22, 0, TAU); ctx.fill(); ctx.fillStyle = WHITE; ctx.font = font(SANSB, 20); ctx.textAlign = 'center'; ctx.fillText(l as string, x as number, 60); ctx.textAlign = 'left'; });
    const sk = clamp((t - this.s('49000') + 0.1) / 0.2);
    if (sk > 0) {
      const v = Math.round(49421 * ease.outExpo(clamp((t - this.s('49000') + 0.1) / 1.0)));
      ctx.setTransform(1, 0, 0, 1, W / 2, 190); ctx.globalAlpha = sk;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-210, -46, 420, 92, 46); ctx.fill();
      ctx.font = font(SANSB, 46); ctx.fillStyle = '#FFD84D'; ctx.textAlign = 'center'; ctx.fillText(`★ ${v.toLocaleString('en-US')}`, 0, 16); ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  override pfx(t: number) {
    return { zoom: this.punch(t, this.s('gave'), 0.03) * this.punch(t, this.s('accent'), 0.015) * this.punch(t, this.s('hired'), 0.02) };
  }
}
