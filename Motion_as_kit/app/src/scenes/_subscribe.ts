// The channel's subscribe motion graphic, used at the end of every video and Short (and as a smaller mid-video
// reminder). Drawn in screen space:
//   0.00  the card rises on a spring: the Tool Man flame avatar, the name and the handle
//   0.35  a cursor glides in from the bottom right
//   0.90  click: SUBSCRIBE presses in, ripples, and turns into a grey SUBSCRIBED ✓
//   1.20  the cursor moves to the bell; 1.45 click: the bell fills and rings, a few red sparks burst
//   t1    the card drops away
// subscribeSfx() lists the matching sound cues (seconds after t0) for an episode's sfx_cues.py.
import { F, font, measure } from '@engine/type';
import { clamp, ease, lerp, springStep, TAU } from '@engine/util';

const NAME = F.archivo(100, 800);
const SMALL = F.archivo(100, 500);
const BTN = F.archivo(100, 800);
const RED = '#FF0033';

export interface SubOpts {
  /** card centre, screen px */
  x: number;
  y: number;
  /** overall scale (1 = 860 px wide) */
  s?: number;
  dark?: boolean;
  name?: string;
  handle?: string;
}

/** The Tool Man avatar: a flame in an orange-red disc. */
export function avatar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = ctx.createLinearGradient(x, y - r, x, y + r);
  g.addColorStop(0, '#FFB23A'); g.addColorStop(1, '#F23A1D');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.62);
  ctx.bezierCurveTo(x - r * 0.5, y + r * 0.6, x - r * 0.58, y + r * 0.05, x - r * 0.22, y - r * 0.22);
  ctx.bezierCurveTo(x - r * 0.2, y + r * 0.02, x - r * 0.06, y + r * 0.08, x - r * 0.02, y - r * 0.05);
  ctx.bezierCurveTo(x - r * 0.12, y - r * 0.35, x + r * 0.02, y - r * 0.55, x + r * 0.12, y - r * 0.68);
  ctx.bezierCurveTo(x + r * 0.16, y - r * 0.38, x + r * 0.52, y - r * 0.18, x + r * 0.44, y + r * 0.22);
  ctx.bezierCurveTo(x + r * 0.4, y + r * 0.5, x + r * 0.22, y + r * 0.62, x, y + r * 0.62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F23A1D';
  ctx.beginPath(); ctx.ellipse(x + r * 0.02, y + r * 0.34, r * 0.16, r * 0.24, 0, 0, TAU); ctx.fill();
}

function bell(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, filled: boolean, col: string, rot: number) {
  ctx.save(); ctx.translate(x, y - r * 0.9); ctx.rotate(rot); ctx.translate(0, r * 0.9);
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, r * 0.45);
  ctx.quadraticCurveTo(-r * 0.62, r * 0.25, -r * 0.62, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.62, -r * 0.72, 0, -r * 0.78);
  ctx.quadraticCurveTo(r * 0.62, -r * 0.72, r * 0.62, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.62, r * 0.25, r * 0.75, r * 0.45);
  ctx.closePath();
  ctx.lineWidth = r * 0.16; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineJoin = 'round';
  if (filled) ctx.fill(); else ctx.stroke();
  ctx.beginPath(); ctx.arc(0, r * 0.62, r * 0.17, 0, TAU); ctx.fill();
  ctx.restore();
}

function cursor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, press: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - 0.12 * press), s * (1 - 0.12 * press));
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#111111'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 52); ctx.lineTo(13, 40); ctx.lineTo(23, 61); ctx.lineTo(32, 57); ctx.lineTo(22, 36); ctx.lineTo(40, 36); ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.stroke();
  ctx.restore();
}

/** Draw the subscribe card at time t; it plays from t0 and leaves at t1. Screen coordinates. */
export function subscribe(ctx: CanvasRenderingContext2D, t: number, t0: number, t1: number, o: SubOpts) {
  const tt = t - t0;
  if (tt < 0 || t > t1 + 0.4) return;
  const s = o.s ?? 1, dark = o.dark ?? false;
  const rise = springStep(tt, 3.4, 0.55), out = ease.inCubic(clamp((t - t1) / 0.35));
  const a = clamp(tt / 0.15) * (1 - out);
  const W = 860, H = 172;
  ctx.save();
  ctx.setTransform(s, 0, 0, s, o.x, o.y + (1 - rise) * 120 * s + out * 160 * s);
  ctx.globalAlpha = a;
  // card
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = dark ? '#1C1C1E' : '#FFFFFF';
  ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, H / 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // avatar, name, handle
  avatar(ctx, -W / 2 + 92, 0, 60);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = dark ? '#FFFFFF' : '#0F0F0F'; ctx.font = font(NAME, 44); ctx.fillText(o.name ?? 'Tool Man', -W / 2 + 176, -6);
  ctx.fillStyle = dark ? '#AAAAAA' : '#606060'; ctx.font = font(SMALL, 26); ctx.fillText(o.handle ?? '@tooladay', -W / 2 + 178, 36);
  // the button
  const click1 = 0.9, click2 = 1.45;
  const done = tt >= click1;
  const press1 = tt > click1 - 0.06 && tt < click1 + 0.12 ? 1 - Math.abs(tt - click1 - 0.03) / 0.09 : 0;
  const label = done ? 'SUBSCRIBED' : 'SUBSCRIBE';
  ctx.font = font(BTN, 30);
  const bw = Math.max(measure('SUBSCRIBED', BTN, 30), measure('SUBSCRIBE', BTN, 30)) + 64 + (done ? 34 : 0);
  const bx = W / 2 - 150 - bw, by = -34, bh = 68;
  ctx.save(); ctx.translate(bx + bw / 2, 0); ctx.scale(1 - 0.06 * clamp(press1), 1 - 0.06 * clamp(press1)); ctx.translate(-(bx + bw / 2), 0);
  ctx.fillStyle = done ? (dark ? '#3A3A3C' : '#E8E8E8') : RED;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
  ctx.fillStyle = done ? (dark ? '#FFFFFF' : '#0F0F0F') : '#FFFFFF';
  ctx.textAlign = 'center'; ctx.fillText(label, bx + bw / 2 + (done ? 14 : 0), 11);
  if (done) {
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const cx = bx + 34;
    ctx.beginPath(); ctx.moveTo(cx - 9, 0); ctx.lineTo(cx - 2, 8); ctx.lineTo(cx + 11, -9); ctx.stroke();
  }
  ctx.restore();
  // the click ripple
  if (tt > click1 && tt < click1 + 0.5) {
    const k = (tt - click1) / 0.5;
    ctx.strokeStyle = `rgba(255,0,51,${0.6 * (1 - k)})`; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(bx - 18 * k, by - 18 * k, bw + 36 * k, bh + 36 * k, (bh + 36 * k) / 2); ctx.stroke();
  }
  // the bell
  const bellX = W / 2 - 80, ring = tt > click2 ? Math.sin((tt - click2) * 34) * 0.4 * Math.exp(-(tt - click2) * 3.2) : 0;
  bell(ctx, bellX, 2, 30, tt > click2, dark ? '#FFFFFF' : '#0F0F0F', ring);
  if (tt > click2 && tt < click2 + 0.7) {
    const k = (tt - click2) / 0.7;
    ctx.strokeStyle = dark ? `rgba(255,255,255,${1 - k})` : `rgba(15,15,15,${1 - k})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const a0 of [-0.6, Math.PI - 0.6]) { ctx.beginPath(); ctx.arc(bellX, -2, 40 + 10 * k, a0, a0 + 1.2); ctx.stroke(); }
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * TAU + 0.3, d = 30 + 70 * ease.outCubic(k);
      ctx.fillStyle = i % 3 ? RED : '#FFB23A'; ctx.globalAlpha = a * (1 - k);
      ctx.beginPath(); ctx.arc(bellX + Math.cos(ang) * d, -2 + Math.sin(ang) * d, 5 * (1 - k) + 2, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = a;
  }
  // the cursor: in from the bottom right, to the button, to the bell, away
  const p0: [number, number] = [W / 2 + 140, H / 2 + 160], p1: [number, number] = [bx + bw * 0.6, 8], p2: [number, number] = [bellX + 4, 10];
  let cx = p0[0], cy = p0[1];
  if (tt >= 0.35 && tt < 1.2) { const k = ease.inOutCubic(clamp((tt - 0.35) / 0.5)); cx = lerp(p0[0], p1[0], k); cy = lerp(p0[1], p1[1], k); }
  else if (tt >= 1.2) { const k = ease.inOutCubic(clamp((tt - 1.15) / 0.28)); cx = lerp(p1[0], p2[0], k); cy = lerp(p1[1], p2[1], k); }
  const press2 = tt > click2 - 0.06 && tt < click2 + 0.12 ? 1 - Math.abs(tt - click2 - 0.03) / 0.09 : 0;
  const leave = clamp((tt - 2.1) / 0.4);
  if (tt > 0.3) { ctx.globalAlpha = a * clamp((tt - 0.3) / 0.1) * (1 - leave); cursor(ctx, cx + leave * 160, cy + leave * 120, 1.05, clamp(Math.max(press1, press2))); }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** The sound cues of the graphic, as (seconds after t0, sound, dB). */
export const SUBSCRIBE_SFX: [number, string, number][] = [[0.02, 'whoosh_soft', -24], [0.9, 'mouse_click', -18], [0.92, 'ui_blip', -22], [1.45, 'mouse_click', -19], [1.47, 'confirm_chime', -21]];
