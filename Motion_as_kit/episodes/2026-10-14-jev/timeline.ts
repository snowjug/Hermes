// The edit for the Jev video: which plate plays when. Every cut sits in the pause before a line, found by its
// text in data/lyrics.json. The slabs that wipe between plates are set in each plate (wipeIn / wipeOut).
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const cut = (q: string, nth = 0) => {
    const l = ly.get(q, nth);
    const prev = ly.lines[l.i - 1];
    const gap = prev ? l.start - prev.end : 1;
    return l.start - Math.min(0.24, Math.max(0.05, gap * 0.5));
  };
  const plates: [string, string | null][] = [
    ['talks', null],
    ['cant', 'This one'],
    ['name', "It's called Jev"],
    ['decide', 'Jev only makes'],
    ['kinds', 'Pick an option'],
    ['email', 'An email comes in'],
    ['threshold', "If it's sure"],
    ['system', 'TypeSafe calls it'],
    ['race', "By TypeSafe's own test"],
    ['price', 'Input costs'],
    ['uses', 'Developers use it'],
    ['catch', 'The catch'],
    ['closed', "And it's closed"],
    ['idea', 'Still, the idea'],
    ['outro', "That's today's tool"],
  ];
  const starts = plates.map(([, q]) => (q ? cut(q) : 0));
  return [
    ...plates.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: i + 1 < plates.length ? starts[i + 1]! : au.duration })),
    { id: 'thumb', load: scene('thumb'), start: au.duration + 1, end: au.duration + 3 },
  ];
}
