import { easing } from "maath"
import { type Camera, Vector2, Vector3 } from "three"

import { look } from "@/lib/three/look"
import { rig } from "@/lib/three/rig"

const UP = new Vector3(0, 1, 0)
/** Scroll speed above which a drag-look offset is dropped so the path reads straight ahead. */
const SCROLL_RELEASE = 0.04

const dir = new Vector3()
const right = new Vector3()
const orbit = new Vector3()
const lookDamped = new Vector3(0, 4.5, 4)

/** Pointer parallax plus the limited drag-to-look, applied as a turn of the view around `pos`. */
export function applyDragLook(pos: Vector3, lookAt: Vector3, pointer: Vector2, dt: number, parallax = 1) {
  if (!look.dragging && rig.velocity > SCROLL_RELEASE) look.targetYaw = look.targetPitch = 0
  easing.damp(look, "yaw", look.targetYaw, 0.25, dt)
  easing.damp(look, "pitch", look.targetPitch, 0.25, dt)
  pos.x += pointer.x * 0.8 * parallax
  pos.y += pointer.y * 0.45 * parallax
  dir.subVectors(lookAt, pos).applyAxisAngle(UP, look.yaw)
  right.crossVectors(dir, UP).normalize()
  dir.applyAxisAngle(right, -look.pitch)
  lookAt.copy(pos).add(dir)
}

/** Places the camera on an orbit around `target` that the visitor spins and zooms while inspecting. */
export function orbitAround(target: Vector3, offset: Vector3, lookOffset: Vector3, pos: Vector3, lookAt: Vector3) {
  orbit.copy(offset).multiplyScalar(look.zoom).applyAxisAngle(UP, -look.spinYaw)
  right.crossVectors(orbit, UP).normalize()
  orbit.applyAxisAngle(right, look.spinPitch * 0.8)
  pos.copy(target).add(orbit)
  lookAt.copy(target).add(dir.copy(lookOffset).applyAxisAngle(UP, -look.spinYaw))
}

/** Damps the camera towards `pos`/`lookAt`; inspecting is slow and cinematic, orbit-dragging direct. */
export function moveCamera(camera: Camera, pos: Vector3, lookAt: Vector3, inspecting: boolean, dt: number) {
  easing.damp3(camera.position, pos, !inspecting ? 0.25 : look.dragging ? 0.12 : 0.45, dt)
  easing.damp3(lookDamped, lookAt, 0.3, dt)
  rig.focus.copy(lookDamped)
  camera.lookAt(lookDamped)
}

/** Tracks scroll progress into the rig the same way the journey does, for effects and audio. */
export function trackProgress(progress: number, dt: number) {
  const previous = rig.progress
  easing.damp(rig, "progress", progress, 0.45, dt)
  rig.velocity = Math.min((Math.abs(rig.progress - previous) / Math.max(dt, 1e-4)) * 4, 1)
}
