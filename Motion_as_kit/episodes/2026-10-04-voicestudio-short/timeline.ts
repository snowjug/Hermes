// The edit for the VoiceStudio Short (1080x1920, ~30 s): which plate plays when, cut in the pause
// before each line found by its text in data/lyrics.json. The last plate loops into the first.
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
    return l.start - Math.min(0.12, Math.max(0.03, gap * 0.4));
  };
  const plates: [string, string | null][] = [
    ['stop', null],
    ['clip', 'This free app copies'],
    ['design', 'Describe a voice'],
    ['dub', 'It even dubs'],
    ['local', 'And it all runs'],
    ['name', "It's called VoiceStudio"],
    ['catch', 'One catch'],
    ['twist', 'Oh, and this voice'],
  ];
  const starts = plates.map(([, q]) => (q ? cut(q) : 0));
  return plates.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: i + 1 < plates.length ? starts[i + 1]! : au.duration }));
}
