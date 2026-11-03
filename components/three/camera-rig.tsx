"use client"

import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { MathUtils, Vector3 } from "three"

import type { LabProject } from "@/content/lab/projects"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"
import { cameraCurve, crystalPosition, progressToT, targetCurve } from "@/lib/three/stations.config"

import { applyDragLook, moveCamera, orbitAround } from "./camera-moves"

const PACKET_DROP = new Vector3(0, -0.9, 0)
const PACKET_LEAD = 0.32
const DIVE_OFFSET = new Vector3(1.2, 0.6, 7)
// Looking left of the crystal keeps it clear of the project panel.
const DIVE_LOOK = new Vector3(-2.2, -0.2, 0)

// Scratch vectors; there is only ever one rig.
const pos = new Vector3()
const lookAt = new Vector3()
const crystal = new Vector3()
const pull = new Vector3()

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Scroll-driven spline camera with pointer parallax, a limited drag-to-look offset,
 * and an orbitable dive into a focused crystal.
 */
export function CameraRig({ projects }: { projects: LabProject[] }) {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const { progress, focusedProject, entered } = useLab.getState()

    const previousT = rig.t
    easing.damp(rig, "t", progressToT(progress), 0.45, dt)
    easing.damp(rig, "progress", progress, 0.45, dt)
    rig.velocity = Math.min((Math.abs(rig.t - previousT) / Math.max(dt, 1e-4)) * 4, 1)

    cameraCurve.getPoint(rig.t, pos)
    targetCurve.getPoint(rig.t, lookAt)
    // A third of the way back towards the camera keeps the packet clear of station geometry.
    rig.packet.copy(lookAt).lerp(pos, PACKET_LEAD).add(PACKET_DROP)

    // Before entering, the camera sits a little higher, framing the skyline.
    if (!entered) pos.y += 1.5

    const focusIndex = focusedProject ? projects.findIndex((p) => p.slug === focusedProject) : -1
    if (focusIndex >= 0) {
      crystalPosition(focusIndex, projects.length, crystal)
      orbitAround(crystal, DIVE_OFFSET, DIVE_LOOK, pos, lookAt)
    } else {
      applyDragLook(pos, lookAt, state.pointer, dt)
    }

    // Portrait screens see far less width, so back the camera off along its line of sight.
    if (focusIndex < 0 && state.viewport.aspect < 1) {
      pull.copy(pos).sub(lookAt).multiplyScalar(MathUtils.clamp(1 / state.viewport.aspect - 1, 0, 0.8) * 0.5)
      pos.add(pull)
    }

    moveCamera(state.camera, pos, lookAt, focusIndex >= 0, dt)

    // The footer rise rumbles the camera; the damped move above pulls it back every frame.
    if (rig.shake > 0 && !reducedMotion()) {
      const amount = rig.shake * 0.09
      state.camera.position.x += (Math.random() - 0.5) * amount
      state.camera.position.y += (Math.random() - 0.5) * amount
    }
  })

  return null
}
