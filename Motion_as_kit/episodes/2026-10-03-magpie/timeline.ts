// The edit: which plate plays when. A voiceover has no beat grid, so every cut sits in the pause
// before a line: just before its first word (never after it), anchored to the aligned script
// (data/lyrics.json, from analysis/vo_script.json).
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  /** Cut in the pause before the line containing q: 0.18 s before its first word (less if the pause is short). */
  const cut = (q: string, nth = 0) => {
    const l = ly.get(q, nth);
    const prev = ly.lines[l.i - 1];
    const gap = prev ? l.start - prev.end : 1;
    return l.start - Math.min(0.18, Math.max(0.04, gap * 0.45));
  };
  // plate id, then the line it starts on (the first plate starts at 0)
  const plates: [string, string | null][] = [
    ['married', null],
    ['config', 'Want a different model'],
    ['question', 'So how does an app'],
    ['title', "It's called magpie"],
    ['menubar', 'Click its menu bar'],
    ['formats', 'The clever part'],
    ['gateway', 'So magpie runs'],
    ['adapter', 'Think of it as'],
    ['plans', 'Even the plans'],
    ['keys', 'Add several keys'],
    ['surgical', 'And when it edits'],
    ['catch', 'The catch?'],
    ['switchboard', 'But if you juggle'],
  ];
  const starts = plates.map(([, q]) => (q ? cut(q) : 0));
  return [
    ...plates.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: i + 1 < plates.length ? starts[i + 1]! : au.duration })),
    // the thumbnail: after the end, so the video never shows it (render a still at duration + 2)
    { id: 'thumb', load: scene('thumb'), start: au.duration + 1, end: au.duration + 3 },
  ];
}
