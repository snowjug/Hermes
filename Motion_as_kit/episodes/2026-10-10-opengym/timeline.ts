// The edit for the openGym video: which plate plays when. Every cut sits in the pause before a line,
// found by its text in data/lyrics.json.
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
    return l.start - Math.min(0.2, Math.max(0.05, gap * 0.5));
  };
  const plates: [string, string | null][] = [
    ['hook', null],
    ['yours', 'openGym runs on yours'],
    ['docker', 'One Docker command'],
    ['folder', 'Your whole training history'],
    ['library', 'Over 5,600 exercises'],
    ['session', 'In the gym'],
    ['plates', 'It even does the plate math'],
    ['musclemap', "Then there's the muscle map"],
    ['progress', 'Progress is built in'],
    ['imports', 'Coming from Strong'],
    ['passkey', 'It signs you in'],
    ['coach', "There's even an optional"],
    ['mcp', 'And a read-only MCP server'],
    ['catch', 'The catch'],
    ['outro', "That's today's tool"],
  ];
  const starts = plates.map(([, q]) => (q ? cut(q) : 0));
  return [
    ...plates.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: i + 1 < plates.length ? starts[i + 1]! : au.duration })),
    { id: 'thumb', load: scene('thumb'), start: au.duration + 1, end: au.duration + 3 },
  ];
}
