// The edit for the Diagram Design video: which plate plays when. Every cut sits in the pause before a line, found by
// its text in data/lyrics.json; each plate whips in and out with its own camera (Dgm.frame), so the cuts read as
// whip pans across one drafting canvas.
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
    ['coffee', null],
    ['mess', 'But ask it'],
    ['name', 'This is Diagram Design'],
    ['trick', 'And its trick'],
    ['install', 'Install it once'],
    ['types', 'Your agent picks'],
    ['file', 'No build step'],
    ['strip', 'Now, the trick'],
    ['quote', 'As its own rulebook'],
    ['montage', 'And it draws far more'],
    ['redraw', 'Got an old diagram'],
    ['brand', 'Want your company'],
    ['hosts', 'It works in Claude Code'],
    ['catch', 'The catch'],
    ['mermaid', 'If your diagrams live'],
    ['convince', 'But for the one diagram'],
    ['command', 'One command'],
    ['outro', "That's today's tool"],
  ];
  const starts = plates.map(([, q]) => (q ? cut(q) : 0));
  return [
    ...plates.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: i + 1 < plates.length ? starts[i + 1]! : au.duration })),
    { id: 'thumb', load: scene('thumb'), start: au.duration + 1, end: au.duration + 3 },
  ];
}
