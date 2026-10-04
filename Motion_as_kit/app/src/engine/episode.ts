// The episode being previewed or rendered: Vite reads episodes/<EPISODE>/episode.json when it starts
// (EPISODE=... in the environment) and injects it here. `fmt` sets the canvas (main 1920x1080, short
// 1080x1920), `theme` the palette (palette.ts).
export interface EpisodeConfig { id: string; fmt: 'main' | 'short'; theme: string; title?: string }

declare const __EPISODE__: EpisodeConfig | undefined;

export const EPISODE: EpisodeConfig = typeof __EPISODE__ !== 'undefined' ? __EPISODE__ : { id: 'default', fmt: 'main', theme: 'signal' };
