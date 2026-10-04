import { defineConfig, normalizePath, type Plugin } from 'vite';
import { cpSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');

// One episode at a time: EPISODE=<folder in episodes/> (default: the newest). Its episode.json sets the
// format and theme; its timeline.ts and scenes/ are the plates; its data/ and audio/ are served as
// /data and /audio. The sound-effect library stays shared in audio/sfx.
const episodesDir = path.join(repoRoot, 'episodes');
const pickEpisode = () => {
  if (process.env.EPISODE) return process.env.EPISODE;
  const all = existsSync(episodesDir) ? readdirSync(episodesDir).filter((d: string) => existsSync(path.join(episodesDir, d, 'episode.json'))).sort() : [];
  return all[all.length - 1];
};
const episode = pickEpisode();
const epDir = path.join(episodesDir, episode);
const epConfig = { id: episode, fmt: 'main', theme: 'signal', ...JSON.parse(readFileSync(path.join(epDir, 'episode.json'), 'utf-8')) };

// Git can check out directory symlinks as plain files on Windows. Serve the
// episode's assets through Vite and copy them into builds without using symlinks.
function repoAssets(): Plugin {
  const map = (url: string) => {
    if (url.startsWith('/audio/sfx/')) return path.join(repoRoot, url);
    if (url.startsWith('/data/') || url.startsWith('/audio/')) return path.join(epDir, url);
    return null;
  };
  return {
    name: 'repo-assets',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const f = req.url ? map(req.url.split('?')[0]!) : null;
        if (f) req.url = `/@fs/${encodeURI(normalizePath(f))}`;
        next();
      });
    },
    writeBundle(options) {
      if (!options.dir) return;
      for (const dir of ['audio', 'data']) cpSync(path.join(epDir, dir), path.join(options.dir, dir), { recursive: true });
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [repoAssets()],
  define: { __EPISODE__: JSON.stringify(epConfig) },
  // PDOOM_NO_HMR=1: no live reload (export renders must not reload mid-run when a file changes)
  server: { port: 5173, strictPort: false, hmr: process.env.PDOOM_NO_HMR ? false : undefined, fs: { allow: [repoRoot] } },
  resolve: {
    alias: {
      '@root': repoRoot,
      '@ep': epDir,
      '@engine': path.resolve(import.meta.dirname, 'src/engine'),
      '@kit': path.resolve(import.meta.dirname, 'src/scenes'),
    },
  },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});
