#!/usr/bin/env node
// Offline renderer for Node (the Bun one, scripts/render.ts, cannot drive Chrome on Windows: Playwright's
// pipe and WebSocket transports both hang under Bun there). Same modes and flags as render.ts:
//   stills: node scripts/render-node.mjs stills --t 1.5,23 [--only id1,id2] [--out dir] [--samples 4]
//   sheet:  node scripts/render-node.mjs sheet --times a,b,c [--cols 4] [--out file.png]
//   video:  node scripts/render-node.mjs video [--from 0] [--to 90] [--fps 60] [--samples 4] [--shutter 0.5] [--crf 17] [--out ../out/video.mp4] [--noaudio]
// Frames reach ffmpeg over HTTP: the page POSTs each raw frame, the reply comes once ffmpeg took it.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, existsSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(APP, '..');
const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(`--${k}`);
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4'), max: +opt('max-samples', '36'), tol: +opt('tol', '3') }
  : +opt('samples', '1');
const SHUTTER = +opt('shutter', '0.5');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ensureDir = (d) => { if (!existsSync(d)) mkdirSync(d, { recursive: true }); };

async function reachable(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

async function startVite() {
  const port = 5300 + Math.floor(Math.random() * 500);
  const proc = spawn(process.execPath, [path.join(APP, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort'], { cwd: APP, stdio: 'ignore', env: { ...process.env, PDOOM_NO_HMR: '1' } });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 300 && !(await reachable(url)); i++) await sleep(100);
  return { url, stop: () => proc.kill() };
}

async function openPage(url) {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? 'chrome', headless: !flag('headed'),
    args: ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const only = opt('only');
  await page.goto(`${url}/?export=1${only ? `&only=${only}` : ''}`);
  await page.waitForFunction(() => window.__pdoom?.ready || window.__pdoom?.error, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__pdoom.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  const sceneErrors = await page.evaluate(() => window.__pdoom.errors);
  if (sceneErrors.length) console.error('SCENE ERRORS:\n' + sceneErrors.join('\n'));
  return { browser, page, logs };
}

async function stills(page, times, outDir) {
  ensureDir(outDir);
  const files = [];
  for (const t of times) {
    await page.evaluate(([t, s, sh]) => window.__pdoom.still(t, s, sh), [t, SAMPLES, SHUTTER]);
    const f = path.join(outDir, `f_${t.toFixed(2).padStart(7, '0')}.png`);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    files.push(f);
  }
  return files;
}

async function sheet(page, times, cols, out) {
  const dataUrl = await page.evaluate(async ({ times, cols }) => {
    const P = window.__pdoom;
    const cw = 640, ch = 360, pad = 4, lab = 18;
    const rows = Math.ceil(times.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d');
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    const src = document.getElementById('c');
    times.forEach((t, i) => {
      P.still(t);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(`${t.toFixed(2)}s`, x + 2, y + 13);
    });
    return cv.toDataURL('image/png');
  }, { times, cols });
  ensureDir(path.dirname(out));
  writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

async function video(page, from, to, fps, out) {
  ensureDir(path.dirname(out));
  const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1920x1080', '-r', String(fps), '-i', 'pipe:0'];
  const audio = path.join(ROOT, 'audio/voiceover.mp3');
  if (!flag('noaudio')) args.push('-ss', String(from), '-t', String(to - from), '-i', audio);
  args.push('-vf', 'vflip,scale=out_color_matrix=bt709,setparams=color_primaries=bt709:color_trc=bt709', '-c:v', 'libx264', '-preset', opt('preset', 'medium'), '-crf', opt('crf', '17'), '-pix_fmt', 'yuv420p', '-tune', 'grain', '-x264-params', opt('x264', 'aq-mode=3'));
  if (!flag('noaudio')) args.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(to * fps) - Math.round(from * fps);
  let frames = 0;
  const t0 = performance.now();
  // frames arrive on several connections: hold them until they can go to ffmpeg in order
  const pending = new Map();
  let next = Math.round(from * fps);
  let writing = Promise.resolve();
  const flush = () => {
    writing = writing.then(async () => {
      while (pending.has(next)) {
        const buf = pending.get(next);
        pending.delete(next);
        next++;
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        frames++;
        if (frames % 30 === 0 || frames === total) {
          const el = (performance.now() - t0) / 1000;
          process.stdout.write(`\r${frames}/${total} frames  ${(frames / el).toFixed(2)} fps  eta ${((total - frames) / (frames / el)).toFixed(0)}s   `);
        }
      }
    });
    return writing;
  };
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.end(); return; }
    const n = +new URL(req.url, 'http://x').searchParams.get('n');
    const chunks = [];
    req.on('data', (d) => chunks.push(d));
    req.on('end', () => {
      pending.set(n, Buffer.concat(chunks));
      flush().then(() => res.end('ok'));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const used = await page.evaluate((o) => window.__pdoom.streamHttp(o), { from, to, fps, url: `http://127.0.0.1:${port}/frame`, samples: SAMPLES, shutter: SHUTTER });
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  server.close();
  console.log(`\nwrote ${out} (${frames} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s)`);
  console.log(`sub-frames per frame: ${JSON.stringify(used)}`);
}

const { url, stop } = await startVite();
const { browser, page, logs } = await openPage(url);
try {
  if (mode === 'stills') {
    const files = await stills(page, (opt('t') ?? '0').split(',').map(Number), path.resolve(opt('out', path.join(ROOT, 'out/stills'))));
    console.log(files.join('\n'));
  } else if (mode === 'sheet') {
    const out = path.resolve(opt('out', path.join(ROOT, 'out/sheets/sheet.png')));
    await sheet(page, opt('times').split(',').map(Number), +opt('cols', '4'), out);
    console.log(out);
  } else if (mode === 'video') {
    const dur = await page.evaluate(() => window.__pdoom.duration);
    await video(page, +opt('from', '0'), +opt('to', String(dur)), +opt('fps', '60'), path.resolve(opt('out', path.join(ROOT, 'out/video.mp4'))));
  } else if (mode === 'parts') {
    // Resumable: the video in parts of --part-sec seconds, each a finished file (parts already on disk
    // are skipped), then joined without re-encoding. A run that gets cut off loses one part at most.
    const dur = await page.evaluate(() => window.__pdoom.duration);
    const fps = +opt('fps', '30'), per = Math.round(+opt('part-sec', '10') * fps);
    const total = Math.round(dur * fps);
    const out = path.resolve(opt('out', path.join(ROOT, 'out/video.mp4')));
    const dir = out.replace(/\.mp4$/, '_parts');
    ensureDir(dir);
    const files = [];
    for (let n0 = 0, k = 0; n0 < total; n0 += per, k++) {
      const n1 = Math.min(total, n0 + per);
      const f = path.join(dir, `part_${String(k).padStart(2, '0')}.mp4`);
      files.push(f);
      if (existsSync(f)) { console.log(`part ${k} done already`); continue; }
      const tmp = f.replace(/\.mp4$/, '.tmp.mp4');
      console.log(`part ${k}: frames ${n0}-${n1 - 1}`);
      await video(page, n0 / fps, n1 / fps, fps, tmp);
      renameSync(tmp, f);
    }
    writeFileSync(path.join(dir, 'list.txt'), files.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
    await new Promise((res, rej) => {
      const p = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' });
      p.on('close', (code) => (code === 0 ? res() : rej(new Error(`concat failed (${code})`))));
    });
    console.log(`joined ${files.length} parts into ${out}`);
  } else if (mode === 'perf') {
    const from = +opt('from', '0'), to = +opt('to', '3');
    const r = await page.evaluate(async ({ from, to, samples, shutter }) => {
      const P = window.__pdoom;
      const buf = new Uint8Array(P.width * P.height * 4);
      P.still(from);
      const ms = [];
      for (let t = from; t < to; t += 1 / 30) {
        const a = performance.now();
        P.engine.render(t, 1 / 30, false, samples, shutter);
        await P.engine.readPixelsAsync(buf);
        ms.push(performance.now() - a);
      }
      ms.sort((a, b) => a - b);
      return { n: ms.length, avg: ms.reduce((a, b) => a + b, 0) / ms.length, p95: ms[Math.floor(ms.length * 0.95)] };
    }, { from, to, samples: SAMPLES, shutter: SHUTTER });
    console.log(`frames ${r.n}  avg ${r.avg.toFixed(1)}ms  p95 ${r.p95.toFixed(1)}ms`);
  }
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  await browser.close();
  stop();
}
