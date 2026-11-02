/**
 * Pointer-driven view state shared by the look controls, the camera rig and
 * inspected objects. Mutated outside React, like `rig`.
 */
export const look = {
  /** Drag-to-look offset from the spline view, in radians. Damped towards the targets. */
  yaw: 0,
  pitch: 0,
  targetYaw: 0,
  targetPitch: 0,
  /** Orbit/spin around whatever is being inspected. */
  spinYaw: 0,
  spinPitch: 0,
  /** Inspect zoom multiplier on the orbit distance. */
  zoom: 1,
  dragging: false,
  /** Pixels moved since the last pointerdown; clicks after a real drag are ignored. */
  dragDistance: 0,
  /** Set by hoverable meshes so the canvas cursor can show `pointer` over them. */
  hovering: false,
}

export const LOOK_LIMITS = {
  yaw: (35 * Math.PI) / 180,
  pitch: (15 * Math.PI) / 180,
  spinPitch: (70 * Math.PI) / 180,
  zoom: [0.55, 1.8] as const,
}

/** Pointer-up after a drag also fires `click`; this tells the two apart. */
export const wasDrag = () => look.dragDistance > 6

export function resetSpin() {
  look.spinYaw = 0
  look.spinPitch = 0
  look.zoom = 1
}
