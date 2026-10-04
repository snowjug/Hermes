// The example home folder the disktree plates draw (an illustration, not a real scan): 227 GiB on a
// 256 GiB disk with 15 GiB free. Kinds follow disktree's legend; `reclaim` is what it hatches
// (caches, build output, package stores, sync history).
import { layoutTree, type Kind, type TNode, type Tile } from '@kit/_treemap';

export const HOME: TNode = {
  name: '~', size: 0, kind: 'other', children: [
    { name: '.cache', size: 0, kind: 'cache', hidden: true, reclaim: true, children: [
      { name: 'huggingface', size: 34, kind: 'cache', reclaim: true },
      { name: 'pip', size: 8, kind: 'cache', reclaim: true },
      { name: 'yarn', size: 6, kind: 'cache', reclaim: true },
      { name: 'chrome', size: 5, kind: 'cache', reclaim: true },
      { name: 'go-build', size: 5, kind: 'cache', reclaim: true },
    ] },
    { name: 'src', size: 0, kind: 'code', children: [
      { name: 'rust-tools', size: 0, kind: 'code', children: [
        { name: 'target', size: 0, kind: 'build', reclaim: true, children: [
          { name: 'debug', size: 12, kind: 'build', reclaim: true },
          { name: 'release', size: 5, kind: 'build', reclaim: true },
        ] },
        { name: '.git', size: 3, kind: 'git', hidden: true },
        { name: 'src', size: 2, kind: 'code' },
      ] },
      { name: 'shop-app', size: 0, kind: 'code', children: [
        { name: 'node_modules', size: 7, kind: 'build', reclaim: true },
        { name: 'app', size: 7, kind: 'code' },
        { name: '.git', size: 2, kind: 'git', hidden: true },
      ] },
      { name: 'notes', size: 6, kind: 'code' },
    ] },
    { name: 'Videos', size: 0, kind: 'media', children: [
      { name: '2026 trip', size: 21, kind: 'media' },
      { name: 'recordings', size: 16, kind: 'media' },
    ] },
    { name: 'Photos', size: 0, kind: 'media', children: [
      { name: '2025', size: 14, kind: 'media' },
      { name: '2026', size: 10, kind: 'media' },
    ] },
    { name: 'Dropbox', size: 0, kind: 'synced', children: [
      { name: 'work', size: 14, kind: 'synced' },
      { name: '.dropbox.cache', size: 4, kind: 'cache', hidden: true, reclaim: true },
    ] },
    { name: 'Downloads', size: 0, kind: 'documents', children: [
      { name: 'installers', size: 9, kind: 'documents' },
      { name: 'papers', size: 6, kind: 'documents' },
    ] },
    { name: 'Documents', size: 11, kind: 'documents' },
    { name: '.rustup', size: 9, kind: 'toolchain', hidden: true },
    { name: 'Android', size: 8, kind: 'toolchain' },
    { name: '.agents', size: 5, kind: 'agent', hidden: true },
  ],
};
export const DISK = { total: 256, free: 15 };

/** Fill and header-strip colours by kind (muted on the blueprint ground), and the neutral before colour. */
export const FILL: Record<Kind, string> = {
  code: '#28456A', agent: '#5E3F2C', toolchain: '#2A5640', synced: '#21565C', git: '#5E2C3D',
  media: '#40335F', documents: '#323C4A', cache: '#5A4E25', build: '#4E432A', other: '#14273A',
};
export const STRIP: Record<Kind, string> = {
  code: '#5B8FD6', agent: '#D68A55', toolchain: '#5CC488', synced: '#4CC3CC', git: '#D65F80',
  media: '#9673D9', documents: '#8A94A3', cache: '#D9BF4C', build: '#C9A35B', other: '#2A4560',
};
export const NEUTRAL = { fill: '#10243A', strip: '#2A4560' };
export const DANGER = '#FF4E4E';
export const AMBER = '#FFB23F';

/** The treemap's place on the sheet (world px). */
export const RECT = { x: -880, y: -420, w: 1760, h: 820 };
export const layoutHome = (tree: TNode = HOME) => layoutTree(tree, RECT.x, RECT.y, RECT.w, RECT.h, { pad: 4, header: (d) => (d <= 1 ? 34 : 24), maxDepth: 4 });
export const byPath = (tiles: Tile[]) => new Map(tiles.map((t) => [t.path, t]));

/** The tree without the given paths (what is left after removing them). */
export function without(tree: TNode, gone: string[], path = tree.name): TNode {
  return { ...tree, children: tree.children?.filter((c) => !gone.includes(`${path}/${c.name}`)).map((c) => without(c, gone, `${path}/${c.name}`)) };
}
