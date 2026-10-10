// The openGym video's desk: kraft paper (theme `kraft`), the AnyPS5 collage kit (cutouts, tape, string,
// marker, ransom letters, torn caption strips, sheet wipes), plus the gym props several plates share:
// a receipt, word slips, a terminal card, a folder, a drawn body map, a barbell diagram with plates.
import type { Line } from '@engine/lyrics';
import { CollagePlate, captions, captionAlpha, captionStrips, sheet, wipeCover, tag, type Caption } from '@kit/_collage';
import { rgba, setWorld, font, F, clamp, ease, prog, springStep, hash, measure, lerp } from '@kit/_collage';
import type { Cam } from '@kit/_vo';

export const PAPER = '#FBF8F0';
export const LIME = '#B5E61D';
export const GREEN = '#22B455';
export const ORANGE = '#F08A24';

export abstract class Desk extends CollagePlate {
  caps: Caption[] = [];
  wipeIn = false;
  wipeOut = false;
  wipeFrom: 'left' | 'right' = 'right';

  override async init() {
    await super.init();
    this.caps = captions(this, this.captionLines());
  }
  captionLines(): Line[] {
    return this.ctx.lyrics.lines.filter((l) => l.start >= this.ctx.start - 0.3 && l.start < this.ctx.end - 0.2);
  }
  override alpha(g: string, t: number) {
    const a = captionAlpha(this.caps, g, t);
    return a >= 0 ? a : this.galpha(g, t);
  }
  galpha(_g: string, _t: number) { return 1; }
  override hasUnder = true;
  override drawUnder(ctx: CanvasRenderingContext2D, t: number, c: Cam) { this.desk(ctx, t, c); }
  desk(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override drawTop(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    this.top(ctx, t, c);
    const cover = wipeCover(t, this.ctx.start, this.ctx.end, { inn: this.wipeIn, out: this.wipeOut });
    sheet(ctx, cover, this.wipeFrom, Math.round(this.ctx.start * 10));
    captionStrips(ctx, this.caps, t);
  }
  top(_ctx: CanvasRenderingContext2D, _t: number, _c: Cam) {}
  override postFX(t: number) {
    return { vignette: 0.32, grain: 0.055, ...this.pfx(t) };
  }
  pfx(_t: number): Record<string, unknown> { return {}; }
  /** A short zoom punch after t0. */
  punch(t: number, t0: number, amt = 0.015) {
    return t > t0 ? 1 + amt * Math.pow(0.5, (t - t0) / 0.08) : 1;
  }
}

/** Pop-in scale for paper that lands at t0 (0 before). */
export const landK = (t: number, t0: number) => (t < t0 ? 0 : springStep(t - t0, 3, 0.5));

/** A printed receipt: narrow paper with a torn zigzag bottom, mono lines; centred at (x, y). */
export function receipt(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, lines: string[], t: number, t0: number, o: { rot?: number; hot?: number[]; size?: number } = {}) {
  if (t < t0) return;
  const sp = landK(t, t0), size = o.size ?? 24, lh = size * 1.5, h = lines.length * lh + size * 2.2;
  setWorld(ctx, c, x, y, 0.6 + 0.4 * sp, (o.rot ?? 0) + (1 - sp) * 0.4);
  ctx.translate(-w / 2, -h / 2);
  const zig = (dx: number, dy: number) => {
    ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(w + dx, dy); ctx.lineTo(w + dx, h + dy);
    for (let i = 0, n = Math.round(w / 18); i <= n; i++) ctx.lineTo(w + dx - (i * w) / n, h + dy - (i % 2 ? 10 : 0));
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; zig(6, 9); ctx.fill();
  ctx.fillStyle = PAPER; zig(0, 0); ctx.fill();
  ctx.font = font(F.mono(600), size);
  lines.forEach((l, i) => {
    ctx.fillStyle = (o.hot ?? []).includes(i) ? rgba('signal', 1) : rgba('ink', 0.85);
    ctx.fillText(l, size * 0.8, size * 1.6 + i * lh);
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A paper slip with one big word, centred at (x, y); returns its width. */
export function slip(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, t: number, t0: number, o: { rot?: number; col?: string; bg?: string; a?: number } = {}) {
  const fam = F.archivo(87.5, 900), ww = measure(text, fam, size) + size * 1.2, hh = size * 1.55;
  if (t < t0) return ww;
  const sp = landK(t, t0);
  setWorld(ctx, c, x, y, 0.5 + 0.5 * sp, (o.rot ?? 0) + (1 - sp) * 0.3);
  ctx.globalAlpha = o.a ?? 1;
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-ww / 2 + 6, -hh / 2 + 9, ww, hh);
  ctx.fillStyle = o.bg ?? PAPER; ctx.fillRect(-ww / 2, -hh / 2, ww, hh);
  ctx.font = font(fam, size); ctx.fillStyle = o.col ?? rgba('ink', 1); ctx.textAlign = 'center';
  ctx.fillText(text, 0, size * 0.36);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ww;
}

/** A black terminal card with typed mono lines (each [text, start time]); top-left at (x, y). */
export function termCard(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, lines: [string, number, string?][], t: number, t0: number, o: { rot?: number; size?: number } = {}) {
  if (t < t0) return;
  const size = o.size ?? 30, lh = size * 1.6, h = lines.length * lh + size * 2.6;
  const sp = landK(t, t0);
  setWorld(ctx, c, x + w / 2, y + h / 2, 0.7 + 0.3 * sp, (o.rot ?? 0) + (1 - sp) * 0.2);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(7, 10, w, h);
  ctx.fillStyle = '#16181B'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2A2D31'; ctx.fillRect(0, 0, w, size * 1.2);
  ['#E0533F', '#E6B33B', '#4DB660'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(size * 0.7 + i * size * 0.75, size * 0.6, size * 0.2, 0, Math.PI * 2); ctx.fill(); });
  ctx.font = font(F.mono(600), size);
  lines.forEach(([text, ts, col], i) => {
    if (t < ts) return;
    const n = Math.min(text.length, Math.ceil(text.length * clamp((t - ts) / Math.max(0.15, text.length * 0.028))));
    ctx.fillStyle = col ?? '#E8E6E1';
    const yy = size * 2.5 + i * lh;
    ctx.fillText(text.slice(0, n), size * 0.8, yy);
    if (n < text.length) { ctx.fillStyle = LIME; ctx.fillRect(size * 0.8 + measure(text.slice(0, n), F.mono(600), size) + 4, yy - size * 0.8, size * 0.55, size); }
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A manila folder with a tab label; centred at (x, y). `open` 0..1 lifts the front flap. */
export function folder(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, label: string, t: number, t0: number, o: { rot?: number; col?: string; a?: number } = {}) {
  if (t < t0) return;
  const sp = landK(t, t0);
  setWorld(ctx, c, x, y, 0.6 + 0.4 * sp, (o.rot ?? 0) + (1 - sp) * 0.25);
  ctx.globalAlpha = o.a ?? 1;
  const col = o.col ?? '#E3C27A', tabW = w * 0.38, tabH = h * 0.12;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(-w / 2 + 8, -h / 2 + 11, w, h);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-w / 2 + tabW, -h / 2); ctx.lineTo(-w / 2 + tabW + tabH, -h / 2 + tabH);
  ctx.lineTo(w / 2, -h / 2 + tabH); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-w / 2, -h / 2 + tabH, w, 6);
  ctx.font = font(F.mono(700), tabH * 0.62); ctx.fillStyle = rgba('ink', 0.85);
  ctx.fillText(label, -w / 2 + tabH * 0.5, -h / 2 + tabH * 0.75);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ------------------------------------------------------------------ the body map
/** Muscle groups of the drawn body map: [x, y, rx, ry, rot] in a 600-px-tall figure, front and back. */
export const BODY = {
  front: {
    delts: [[-92, -178, 32, 26, 0.5], [92, -178, 32, 26, -0.5]],
    chest: [[-40, -152, 42, 30, 0.1], [40, -152, 42, 30, -0.1]],
    biceps: [[-112, -112, 18, 40, 0.15], [112, -112, 18, 40, -0.15]],
    forearms: [[-128, -32, 15, 42, 0.12], [128, -32, 15, 42, -0.12]],
    abs: [[0, -78, 36, 58, 0]],
    quads: [[-34, 52, 30, 78, 0.05], [34, 52, 30, 78, -0.05]],
    calves: [[-38, 186, 19, 54, 0.03], [38, 186, 19, 54, -0.03]],
  },
  back: {
    traps: [[0, -190, 56, 24, 0]],
    delts: [[-92, -176, 30, 25, 0.5], [92, -176, 30, 25, -0.5]],
    lats: [[-46, -122, 36, 56, 0.2], [46, -122, 36, 56, -0.2]],
    triceps: [[-112, -112, 18, 40, 0.15], [112, -112, 18, 40, -0.15]],
    glutes: [[-30, -6, 32, 30, 0], [30, -6, 32, 30, 0]],
    hamstrings: [[-34, 70, 28, 66, 0.04], [34, 70, 28, 66, -0.04]],
    calves: [[-38, 188, 20, 52, 0.03], [38, 188, 20, 52, -0.03]],
  },
} as const;
export type View = keyof typeof BODY;

/**
 * A drawn body map (front or back) on a white card, centred at (x, y); `fill(part)` gives each muscle's
 * colour (or null for the plain skin tone). `hatch(part)` > 0 lays grey hatching over a muscle.
 */
export function bodyMap(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, s: number, view: View, fill: (part: string) => string | null, o: { a?: number; rot?: number; hatch?: (part: string) => number; card?: boolean; label?: string } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, s, o.rot ?? 0);
  ctx.globalAlpha = a;
  if (o.card ?? true) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-190 + 7, -320 + 10, 380, 620);
    ctx.fillStyle = PAPER; ctx.fillRect(-190, -320, 380, 620);
    if (o.label) { ctx.font = font(F.mono(700), 22); ctx.fillStyle = rgba('graphite', 1); ctx.textAlign = 'center'; ctx.fillText(o.label, 0, -284); ctx.textAlign = 'left'; }
  }
  // the silhouette: head, neck, torso, arms, legs in a soft skin grey
  const skin = '#D9D2C5', line = 'rgba(26,23,20,0.55)';
  ctx.fillStyle = skin; ctx.strokeStyle = line; ctx.lineWidth = 2.2;
  const blob = (bx: number, by: number, rx: number, ry: number, r = 0) => { ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  blob(0, -246, 34, 40);
  ctx.fillRect(-14, -214, 28, 26);
  blob(0, -110, 92, 118); // torso
  blob(-120, -76, 26, 120, 0.12); blob(120, -76, 26, 120, -0.12); // arms
  blob(-36, 110, 38, 175, 0.03); blob(36, 110, 38, 175, -0.03); // legs
  const parts = BODY[view] as Record<string, readonly (readonly number[])[]>;
  for (const [name, list] of Object.entries(parts)) {
    const col = fill(name);
    for (const [px, py, rx, ry, r] of list) {
      ctx.fillStyle = col ?? '#C9C0B0';
      ctx.beginPath(); ctx.ellipse(px!, py!, rx!, ry!, r!, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 1.8; ctx.stroke();
      const hk = o.hatch ? o.hatch(name) : 0;
      if (hk > 0) {
        ctx.save(); ctx.beginPath(); ctx.ellipse(px!, py!, rx!, ry!, r!, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = `rgba(60,55,50,${0.55 * hk})`; ctx.lineWidth = 3;
        for (let k = -120; k < 120; k += 11) { ctx.beginPath(); ctx.moveTo(px! + k - 60, py! - 90); ctx.lineTo(px! + k + 60, py! + 90); ctx.stroke(); }
        ctx.restore();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Heat colour from 0 (pale) to 1 (deep green). */
export const heat = (v: number) => {
  const a = [214, 236, 196], b = [34, 140, 70], k = clamp(v);
  return `rgb(${Math.round(lerp(a[0]!, b[0]!, k))},${Math.round(lerp(a[1]!, b[1]!, k))},${Math.round(lerp(a[2]!, b[2]!, k))})`;
};

// ------------------------------------------------------------------ the barbell
export const PLATE_COL: Record<string, string> = { '25': '#D2302A', '20': '#2E5EA6', '15': '#E6B92E', '10': '#2F9E4F', '5': '#F4F1EA', '2.5': '#1A1714', '1.25': '#8F8A80' };
const PLATE_H: Record<string, number> = { '25': 1, '20': 1, '15': 0.92, '10': 0.8, '5': 0.6, '2.5': 0.46, '1.25': 0.38 };

/** One plate seen edge-on (a tall rounded bar), centred at local (px, 0) with height h. */
function plateEdge(ctx: CanvasRenderingContext2D, kg: string, px: number, h: number) {
  const ph = h * (PLATE_H[kg] ?? 0.6), pw = kg === '25' || kg === '20' ? 30 : kg === '15' ? 26 : 20;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.roundRect(px - pw / 2 + 4, -ph / 2 + 6, pw, ph, 6); ctx.fill();
  ctx.fillStyle = PLATE_COL[kg] ?? '#888'; ctx.beginPath(); ctx.roundRect(px - pw / 2, -ph / 2, pw, ph, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(26,23,20,0.7)'; ctx.lineWidth = 2; ctx.stroke();
}

/**
 * A barbell drawn edge-on, centred at (x, y), `w` wide: the bar, collars, and on each side the plates
 * (innermost first) sliding on with k[i] in 0..1.
 */
export function barDiagram(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, plates: string[], k: number[], o: { a?: number; rot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  const h = 230;
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-w / 2 + 5, -6 + 7, w, 14);
  ctx.fillStyle = '#9DA3A8'; ctx.fillRect(-w / 2, -7, w, 14);
  ctx.fillStyle = '#7E8489'; ctx.fillRect(-w * 0.27, -11, 14, 22); ctx.fillRect(w * 0.27 - 14, -11, 14, 22);
  for (const side of [-1, 1]) {
    let px = side * w * 0.27 + side * 22;
    plates.forEach((kg, i) => {
      const pw = kg === '25' || kg === '20' ? 30 : kg === '15' ? 26 : 20;
      const target = px + side * pw / 2;
      const kk = ease.outCubic(clamp(k[i] ?? 0));
      if (kk > 0) plateEdge(ctx, kg, lerp(side * (w / 2 + 160), target, kk), h);
      px += side * (pw + 4);
    });
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A plate seen face-on as a sticker (a disc with a hole and its weight), centred at (x, y). */
export function disc(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, kg: string, t: number, t0: number, o: { rot?: number } = {}) {
  if (t < t0) return;
  const sp = landK(t, t0);
  setWorld(ctx, c, x, y, 0.4 + 0.6 * sp, (o.rot ?? 0) + (1 - sp) * 0.8);
  const col = PLATE_COL[kg] ?? '#888';
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(6, 9, r + 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#3A3A3A'; ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = kg === '5' ? '#1A1714' : '#FFFFFF'; ctx.textAlign = 'center';
  ctx.font = font(F.archivo(87.5, 900), r * 0.42); ctx.fillText(kg, 0, -r * 0.36);
  ctx.font = font(F.mono(700), r * 0.2); ctx.fillText('KG', 0, r * 0.6);
  ctx.textAlign = 'left';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A white card with a big number counting to `value` (k in 0..1) and a label; centred at (x, y). */
export function counter(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, value: number, k: number, label: string, t: number, t0: number, o: { rot?: number; prefix?: string; suffix?: string; size?: number; col?: string } = {}) {
  if (t < t0) return;
  const sp = landK(t, t0), size = o.size ?? 110;
  const txt = (o.prefix ?? '') + Math.round(value * clamp(k)).toLocaleString('en-US') + (o.suffix ?? '');
  const fam = F.archivo(87.5, 900);
  const w = Math.max(measure((o.prefix ?? '') + value.toLocaleString('en-US') + (o.suffix ?? ''), fam, size), measure(label, F.mono(700), size * 0.24)) + size * 0.8;
  const h = size * 1.75;
  setWorld(ctx, c, x, y, 0.6 + 0.4 * sp, (o.rot ?? 0) + (1 - sp) * 0.25);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-w / 2 + 7, -h / 2 + 10, w, h);
  ctx.fillStyle = PAPER; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.textAlign = 'center';
  ctx.font = font(fam, size); ctx.fillStyle = o.col ?? rgba('ink', 1); ctx.fillText(txt, 0, size * 0.22);
  ctx.font = font(F.mono(700), size * 0.24); ctx.fillStyle = rgba('signal', 1); ctx.fillText(label, 0, size * 0.62);
  ctx.textAlign = 'left';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A hand-drawn-looking check box with a label; `tick` 0..1 draws the tick. Centred at (x, y). */
export function checkbox(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, label: string, tick: number, o: { size?: number; a?: number; rot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const size = o.size ?? 40;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  ctx.strokeStyle = rgba('ink', 0.9); ctx.lineWidth = 4; ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.font = font(F.archivo(87.5, 800), size * 0.9); ctx.fillStyle = rgba('ink', 1); ctx.fillText(label, size * 0.8, size * 0.32);
  const k = clamp(tick);
  if (k > 0) {
    ctx.strokeStyle = '#2F8F4E'; ctx.lineWidth = size * 0.18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-size * 0.35, 0);
    const k1 = Math.min(1, k * 2);
    ctx.lineTo(-size * 0.35 + size * 0.3 * k1, size * 0.3 * k1);
    if (k > 0.5) ctx.lineTo(-size * 0.05 + size * 0.6 * (k - 0.5) * 2, size * 0.3 - size * 0.9 * (k - 0.5) * 2);
    ctx.stroke(); ctx.lineCap = 'butt';
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A typed sheet of paper (a file, a list), top-left at world (x, y). `lines` typed in from t0 over dur. */
export function doc(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, title: string, lines: string[], t: number, t0: number, dur: number, o: { a?: number; rot?: number; size?: number; hot?: number[] } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003 || t < t0 - 0.05) return;
  const pop = springStep(t - t0 + 0.05, 3, 0.5);
  setWorld(ctx, c, x + w / 2, y + h / 2, 0.85 + 0.15 * pop, o.rot ?? 0);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = a * clamp((t - t0 + 0.05) / 0.08);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(7, 10, w, h);
  ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, 0, w, h);
  const size = o.size ?? 26;
  ctx.font = font(F.archivo(87.5, 800), size * 1.3); ctx.fillStyle = rgba('ink', 1);
  ctx.fillText(title, size * 1.1, size * 2.1);
  ctx.fillStyle = rgba('signal', 0.8); ctx.fillRect(size * 1.1, size * 2.6, w - size * 2.2, 3);
  ctx.font = font(F.mono(500), size);
  const total = lines.reduce((s, l) => s + l.length, 0) || 1;
  let shown = Math.floor(total * clamp((t - t0) / Math.max(0.05, dur)));
  lines.forEach((l, i) => {
    const n = Math.min(l.length, shown);
    shown -= l.length;
    if (n <= 0) return;
    ctx.fillStyle = (o.hot ?? []).includes(i) ? rgba('signal', 1) : rgba('ink', 0.88);
    ctx.fillText(l.slice(0, n), size * 1.1, size * (4.3 + i * 1.55));
  });
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A paper stat bar: a label, the value large, and a marker-filled bar to frac·k. Top-left at world (x, y). */
export function statBar(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, label: string, value: string, frac: number, k: number, o: { a?: number; rot?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const h = 200;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(6, 9, w, h);
  ctx.fillStyle = '#FBF8F0'; ctx.fillRect(0, 0, w, h);
  ctx.font = font(F.mono(600), 22); ctx.fillStyle = rgba('graphite', 1); ctx.fillText(label, 26, 40);
  ctx.font = font(F.archivo(87.5, 900), 58); ctx.fillStyle = rgba('ink', 1); ctx.fillText(value, 24, 104);
  const bx = 26, by = 132, bw = w - 52, bh = 40;
  ctx.strokeStyle = rgba('ink', 0.8); ctx.lineWidth = 2.5; ctx.strokeRect(bx, by, bw, bh);
  ctx.save(); ctx.beginPath(); ctx.rect(bx + 3, by + 3, (bw - 6) * frac * clamp(k), bh - 6); ctx.clip();
  ctx.fillStyle = rgba('signal', 0.9); ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
  for (let xx = bx - bh; xx < bx + bw; xx += 14) { ctx.beginPath(); ctx.moveTo(xx, by + bh); ctx.lineTo(xx + bh, by); ctx.stroke(); }
  ctx.restore();
  ctx.font = font(F.mono(700), 22); ctx.fillStyle = rgba('signal', 1); ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(frac * 100 * clamp(k))}%`, w - 26, 104); ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A round sticker with a big number (e.g. "60" / "FPS"), landing at t0. */
export function badge(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, r: number, big: string, small: string, t: number, t0: number, o: { col?: string; rot?: number } = {}) {
  if (t < t0) return;
  const sp = springStep(t - t0, 3.2, 0.42);
  setWorld(ctx, c, x, y, 0.3 + 0.7 * sp, (o.rot ?? -0.12) + (1 - sp) * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(6, 9, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FBF8F0'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(o.col ?? 'signal', 1); ctx.beginPath(); ctx.arc(0, 0, r - 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FBF8F0'; ctx.textAlign = 'center';
  ctx.font = font(F.archivo(87.5, 900), r * 0.8); ctx.fillText(big, 0, r * 0.18);
  ctx.font = font(F.mono(700), r * 0.24); ctx.fillText(small, 0, r * 0.55);
  ctx.textAlign = 'left';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A file card ("input.elf", "app.exe"): a folded-corner page with a big extension. Centred at world (x, y). */
export function fileCard(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, name: string, sub: string, o: { a?: number; rot?: number; col?: string; w?: number } = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  const w = o.w ?? 300, h = w * 1.25, f = w * 0.2;
  setWorld(ctx, c, x, y, 1, o.rot ?? 0);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(7, 10); ctx.lineTo(w - f + 7, 10); ctx.lineTo(w + 7, f + 10); ctx.lineTo(w + 7, h + 10); ctx.lineTo(7, h + 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FBF8F0';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w - f, 0); ctx.lineTo(w, f); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E2D8C4'; ctx.beginPath(); ctx.moveTo(w - f, 0); ctx.lineTo(w - f, f); ctx.lineTo(w, f); ctx.closePath(); ctx.fill();
  const fs = Math.min(w * 0.26, (w * 0.82) / Math.max(1, measure(name, F.archivo(87.5, 900), 1)));
  ctx.font = font(F.archivo(87.5, 900), fs); ctx.fillStyle = rgba(o.col ?? 'ink', 1); ctx.textAlign = 'center';
  ctx.fillText(name, w / 2, h * 0.55);
  ctx.font = font(F.mono(500), w * 0.07); ctx.fillStyle = rgba('graphite', 1);
  ctx.fillText(sub, w / 2, h * 0.7);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export { tag, hash, ease, prog, clamp };
