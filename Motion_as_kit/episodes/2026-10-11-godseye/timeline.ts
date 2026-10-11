// The edit for the God's Eye View video: which plate plays when. Every cut sits in the pause before a line, found by
// its text in data/lyrics.json; each cut is a burst of sensor static (Feed.staticAt).
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
    ['planes', null],
    ['everything', 'Every satellite overhead'],
    ['name', "It's called God"],
    ['layers', "Here's what you're"],
    ['seas', 'Ships stream in'],
    ['hazards', 'Earthquakes from'],
    ['cameras', 'And then it gets'],
    ['sensors', 'Now flip the sensor'],
    ['tech', 'Zoom in, and cities'],
    ['keys', '17 of its 20'],
    ['catch', 'The catch'],
    ['public', 'All of this data'],
    ['outro', "That's God's Eye View"],
  ];
  const starts = plates.map(([, q]) => (q ? cut(q) : 0));
  return [
    ...plates.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: i + 1 < plates.length ? starts[i + 1]! : au.duration })),
    { id: 'thumb', load: scene('thumb'), start: au.duration + 1, end: au.duration + 3 },
  ];
}
