// The ArtCraft video's set, shared by its scenes: the stage view, the virtual camera's point of view, and the two
// mannequins (A points, B thinks) with their places in the room.
import { mixPose, POSES, type View } from '@kit/_cad3d';
import type { Figure } from '@ep/cinema';

/** The wide view of the stage, slowly orbiting from t0. */
export const STAGE = (t: number, t0: number, yaw0 = 0.38, speed = 0.04, s = 1.35): View =>
  ({ yaw: yaw0 + (t - t0) * speed, pitch: 0.36, dist: 1500, s, target: [0, 20, 100] });
/** What the virtual camera on the tripod sees. */
export const POV: View = { yaw: 0.16, pitch: 0.05, dist: 430, s: 2.15, target: [5, 40, 112] };
/** The rig's place: in front of the room, facing in (its lens points along +Y after the turn). */
export const RIG_XF = { at: [-30, -250, 0] as [number, number, number], rz: Math.PI };

/** The cast, posed by k (0 = standing, 1 = posed). */
export function cast(k: number): Figure[] {
  return [
    { pose: mixPose(POSES.stand, POSES.point, k), xf: { at: [-75, 40, 0], rz: -0.35 } },
    { pose: mixPose(POSES.stand, POSES.think, k), xf: { at: [85, 70, 0], rz: 0.55 } },
  ];
}
