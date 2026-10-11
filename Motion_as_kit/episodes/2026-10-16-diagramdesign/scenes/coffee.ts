// 01 COFFEE: "AI can write a whole app before your coffee cools."
// A terminal pours out code at an absurd rate while a file tree grows beside it and a LINES WRITTEN counter spins;
// on the right a hairline coffee cup steams, its temperature ticking down; on "cools" the steam thins out and the
// counter lands. FIG. 01 · SPEED as the header.
import type { Cam } from '@kit/_vo';
import { setWorld } from '@kit/_vo';
import { font } from '@engine/type';
import { Dgm, card, header, mono, TEXT, MUTED, CORAL, BLUE, HAIR, MONO, MONOB, clamp, ease, fmt } from '@ep/dgm';

const CODE = [
  "import { Router } from 'express';", 'import { db } from "./db";', '', 'export const api = Router();', '',
  "api.get('/users/:id', async (req, res) => {", '  const user = await db.user.find(req.params.id);', '  if (!user) return res.status(404).end();', '  res.json(user);', '});', '',
  "api.post('/upload', auth, async (req, res) => {", '  const key = await store.put(req.file);', "  await queue.add('thumb', { key });", '  res.status(201).json({ key });', '});', '',
  'export async function session(token: string) {', '  const hit = await cache.get(token);', '  if (hit) return JSON.parse(hit);', '  const s = await auth.verify(token);', '  await cache.set(token, JSON.stringify(s), 3600);', '  return s;', '}', '',
  'worker.process(async (job) => {', '  const img = await store.get(job.data.key);', '  await thumbs.make(img, [64, 256, 1024]);', '  await mail.send(job.data.owner, "ready");', '});',
];
const FILES = ['src/', '  api.ts', '  auth.ts', '  db.ts', '  cache.ts', '  worker.ts', '  store.ts', '  mail.ts', 'tests/', '  api.test.ts', '  auth.test.ts', 'package.json'];

export default class Coffee extends Dgm {
  build() {
    this.take('AI can write', ['AI', 'write', 'whole', 'app', 'coffee', 'cools.']);
    this.frame(0, 0, 1, { from: [0, 0, 0.82], to: [0, 0, 1.6], drift: 0.05 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const t0 = this.ctx.start;
    // the terminal
    const ck = clamp((t - t0 - 0.05) / 0.4);
    card(ctx, c, -250, 10, 1060, 640, { k: ck, title: 'agent · building your app' });
    if (ck > 0.3) {
      // the file tree
      const nf = Math.floor(clamp((t - this.s('write')) * 6, 0, FILES.length));
      FILES.slice(0, nf).forEach((f, i) => mono(ctx, c, f, -760, -240 + i * 34, { size: 17, col: f.endsWith('/') ? TEXT : MUTED }));
      setWorld(ctx, c, 0, 0, 1, 0); ctx.strokeStyle = 'rgba(214,222,235,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-560, -270); ctx.lineTo(-560, 320); ctx.stroke(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      // the code, scrolling as it pours
      const n = Math.max(0, (t - this.s('write') + 0.2) * 22);
      const top = Math.max(0, n - 15);
      setWorld(ctx, c, 0, 0, 1, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(-540, -270, 820, 590); ctx.clip();
      for (let i = Math.floor(top); i < Math.min(n, top + 17); i++) {
        const s = CODE[i % CODE.length]!, y = -240 + (i - top) * 34;
        const part = i === Math.floor(n) - 0 ? s.slice(0, Math.floor((n % 1) * s.length)) : s;
        ctx.font = font(MONO, 18);
        ctx.fillStyle = 'rgba(138,148,166,0.6)'; ctx.fillText(String(i + 1).padStart(3, ' '), -530, y);
        ctx.fillStyle = /^(import|export|const|await|if|return)/.test(s.trim()) ? BLUE : s.includes("'") || s.includes('"') ? CORAL : TEXT;
        ctx.fillText(part, -470, y);
      }
      ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // the cup
    const cup = clamp((t - t0 - 0.2) / 0.4);
    if (cup > 0) {
      setWorld(ctx, c, 600, 90, 0.9 + 0.1 * ease.outCubic(cup), 0);
      ctx.globalAlpha = cup; ctx.strokeStyle = HAIR; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-110, -60); ctx.lineTo(-94, 110); ctx.quadraticCurveTo(-90, 140, -60, 140); ctx.lineTo(60, 140); ctx.quadraticCurveTo(90, 140, 94, 110); ctx.lineTo(110, -60); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(152, 10, 44, 54, 0, -1.3, 1.3); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 170, 170, 18, 0, 0, Math.PI * 2); ctx.stroke();
      // steam, thinning as it cools
      const cool = clamp((t - this.s('coffee')) / Math.max(0.6, this.e('cools') - this.s('coffee')));
      ctx.strokeStyle = `rgba(214,222,235,${0.5 * (1 - cool * 0.85)})`;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let j = 0; j <= 24; j++) { const u = j / 24, yy = -80 - u * 170 * (1 - cool * 0.5), xx = -50 + i * 50 + 16 * Math.sin(u * 7 + t * 3 + i * 2) * u; if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      const temp = Math.round(72 - 30 * ease.inOutQuad(clamp((t - this.s('write')) / Math.max(1, this.e('cools') - this.s('write')))));
      mono(ctx, c, 'COFFEE', 600, 330, { a: cup, align: 'center', size: 16, track: 3 });
      mono(ctx, c, `${temp}°C`, 600, 372, { a: cup, align: 'center', size: 34, bold: true, col: temp < 50 ? MUTED : CORAL });
    }
    const n = Math.max(0, (t - this.s('write') + 0.2) * 22) * 9.7;
    mono(ctx, c, 'LINES WRITTEN', -760, -390, { a: clamp((t - this.s('write')) / 0.2), size: 16, track: 3 });
    mono(ctx, c, fmt(Math.round(n)), -760, -350, { a: clamp((t - this.s('write')) / 0.2), size: 30, bold: true, col: TEXT });
    void MONOB;
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    header(ctx, c, 330, -330, 'FIG. 01 · SPEED', 'An app, in minutes', t, this.ctx.start + 0.3, { size: 52 });
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('cools'), 0.012) }; }
}
