import { hexToLinear } from './util';
import { EPISODE } from './episode';

// The whole video lives in a restrained palette: a ground, a raised ground, two greys, the type colour,
// and one signal colour (with a hotter core and a deeper shadow), plus one rare accent. Each episode
// picks a theme (episode.json → "theme"); the slot names stay the same, so plates never change.
// `halation` is the film-halation tint around highlights (post.ts).
const THEMES = {
  // pdoom-video's own: ink, bone and hazard orange (the 2026-10-03 magpie video)
  signal: {
    ink: '#0A0A0B', ink2: '#151517', graphite: '#5E5B57', ash: '#9C978F', bone: '#EEE9DF',
    signal: '#FF4D12', ember: '#FF8A3D', blood: '#C21D0B', acid: '#D8FF3C', halation: [1.0, 0.18, 0.04],
  },
  // blueprint: deep navy drafting sheet, pale-blue type, electric cyan pen, amber for what can be had back
  blueprint: {
    ink: '#07131F', ink2: '#0D2032', graphite: '#47627C', ash: '#8FA8C0', bone: '#E7F0F8',
    signal: '#2FD3FF', ember: '#B6F2FF', blood: '#1679A8', acid: '#FFB23F', halation: [0.1, 0.55, 1.0],
  },
  // pop: warning-yellow paper, black ink, hot pink (plates set `paper` so the ground is the bone colour)
  pop: {
    ink: '#111111', ink2: '#1C1C1C', graphite: '#3B3B3B', ash: '#5E5A4E', bone: '#FFD83D',
    signal: '#FF2E63', ember: '#FF8FB0', blood: '#D1124A', acid: '#00B3FF', halation: [1.0, 0.1, 0.35],
  },
} as const;

export type ThemeName = keyof typeof THEMES;
export const THEME_NAME: ThemeName = (EPISODE.theme in THEMES ? EPISODE.theme : 'signal') as ThemeName;
const T = THEMES[THEME_NAME];
export const HALATION: [number, number, number] = [...T.halation] as [number, number, number];

export const HEX = {
  ink: T.ink, // background
  ink2: T.ink2, // raised background (panels, paper-in-the-dark)
  graphite: T.graphite, // dim lines, secondary text
  ash: T.ash, // mid grey
  bone: T.bone, // paper / primary text
  signal: T.signal, // the spark, the fuse, the accent
  ember: T.ember, // hotter, lighter signal for cores/highlights
  blood: T.blood, // deep signal for shadows
  acid: T.acid, // the one rare accent
};

export type PaletteKey = keyof typeof HEX;

/** Linear RGB triplets for GL uniforms. */
export const LIN: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

/** CSS rgba() for Canvas2D. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const hex = (HEX as Record<string, string>)[key] ?? key;
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
