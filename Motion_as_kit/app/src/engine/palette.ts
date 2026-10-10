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
  // scope: an oscilloscope in a dark studio: green-black glass, phosphor-mint trace, VU amber for warnings
  scope: {
    ink: '#050907', ink2: '#0C1611', graphite: '#33503F', ash: '#87A596', bone: '#E9F3EC',
    signal: '#38F59A', ember: '#C4FFE2', blood: '#0B8A55', acid: '#FFB43C', halation: [0.2, 1.0, 0.55],
  },
  // riso: risograph print: cream stock, soft black, fluorescent pink and riso blue (plates set `paper`)
  riso: {
    ink: '#16130F', ink2: '#24201B', graphite: '#4A433B', ash: '#7D746A', bone: '#F4ECDC',
    signal: '#FF3EA5', ember: '#FF9ED0', blood: '#D2177C', acid: '#2A4BFF', halation: [1.0, 0.3, 0.7],
  },
  // collage: a documentary desk: warm paper, black type, red marker, blue ballpoint (plates set `paper`)
  collage: {
    ink: '#1C1915', ink2: '#2C2721', graphite: '#665C52', ash: '#9C9183', bone: '#EAE0CC',
    signal: '#D2302A', ember: '#F07A5C', blood: '#9A1C15', acid: '#2E5EA6', halation: [1.0, 0.45, 0.25],
  },
  // glitch: a dark screen with RGB-split type: off-white, hot red and cyan
  glitch: {
    ink: '#07070A', ink2: '#121218', graphite: '#3A3A48', ash: '#8A8A9A', bone: '#F4F3EE',
    signal: '#FF2D55', ember: '#FF8FA6', blood: '#B3123A', acid: '#00E1FF', halation: [1.0, 0.2, 0.4],
  },
  // kraft: a garage-gym desk: kraft-paper brown, black type, red marker, chalk white, lime highlighter
  kraft: {
    ink: '#1A1714', ink2: '#2B2520', graphite: '#5E5246', ash: '#8F7E69', bone: '#C9A97F',
    signal: '#D2302A', ember: '#F07A5C', blood: '#9A1C15', acid: '#2E5EA6', halation: [1.0, 0.5, 0.25],
  },
  // court: electric-blue sports paper, chalk-white type, lime and hot pink (plates set `paper`)
  court: {
    ink: '#0B1230', ink2: '#16204A', graphite: '#3A4A8C', ash: '#AFC0FF', bone: '#2448F0',
    signal: '#C6F432', ember: '#E4FF8A', blood: '#FF3D7F', acid: '#FFFFFF', halation: [0.6, 0.8, 1.0],
  },
  // comic: a motion comic on newsprint: black ink, comic red, yellow, blue, green (plates set `paper`)
  comic: {
    ink: '#121212', ink2: '#1E1E1E', graphite: '#4A4A4A', ash: '#8C8C8C', bone: '#F6EEDC',
    signal: '#E5322B', ember: '#FFD21F', blood: '#1F5FD1', acid: '#18A558', halation: [1.0, 0.6, 0.3],
  },
  // chat: a messaging screen: pale grey-blue, blue bubbles, white bubbles, a pink reaction (plates set `paper`)
  chat: {
    ink: '#0E1116', ink2: '#1B2028', graphite: '#5B6472', ash: '#9AA3B2', bone: '#E9EDF4',
    signal: '#2F7CF6', ember: '#8FB8FF', blood: '#FF4D6D', acid: '#21C063', halation: [0.6, 0.8, 1.0],
  },
  // keynote: a dark keynote stage: deep navy, white type, presentation orange, violet and teal (plates set `paper` for the stage shader)
  keynote: {
    ink: '#070914', ink2: '#12162B', graphite: '#3B4372', ash: '#A3ABD1', bone: '#0B0F24',
    signal: '#FF5B3A', ember: '#FFB37A', blood: '#7B5CFF', acid: '#2ED3C0', halation: [1.0, 0.55, 0.4],
  },
  // retro: a 90s desktop: teal wallpaper, grey bevelled windows, navy title bars (plates set `paper`)
  retro: {
    ink: '#000000', ink2: '#1A1A1A', graphite: '#808080', ash: '#C0C0C0', bone: '#008080',
    signal: '#000080', ember: '#FFFF00', blood: '#FF0000', acid: '#00C000', halation: [0.5, 0.9, 0.9],
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
