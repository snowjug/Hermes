// The edit for the Jev Short: one continuous plate, the quiz show, whose rounds turn on each line.
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  return [{ id: 'show', load: scene('show'), start: 0, end: au.duration }];
}
