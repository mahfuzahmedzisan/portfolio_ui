import { Vector3 } from "three"

/**
 * Per-frame motion shared between the camera rig, effects, shaders and audio.
 * Mutated in useFrame; kept outside React and Zustand so it never re-renders.
 */
export const rig = {
  /** Damped spline parameter, 0..1. */
  t: 0,
  /** Damped scroll progress, 0..1 (what the accents/fog blend on). */
  progress: 0,
  /** Absolute spline speed per second, roughly 0..1. */
  velocity: 0,
  /** World position of the packet. */
  packet: new Vector3(),
  /** World position the camera is focusing on (packet, or a project crystal). */
  focus: new Vector3(),
}
