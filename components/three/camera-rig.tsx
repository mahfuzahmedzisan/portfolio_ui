"use client"

import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { Vector3 } from "three"

import type { LabProject } from "@/content/lab/mock"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"
import { cameraCurve, crystalPosition, progressToT, targetCurve } from "@/lib/three/stations.config"

const PACKET_DROP = new Vector3(0, -0.9, 0)
const PACKET_LEAD = 0.32
const DIVE_OFFSET = new Vector3(1.2, 0.6, 7)
// Looking left of the crystal keeps it clear of the project panel.
const DIVE_LOOK = new Vector3(-2.2, -0.2, 0)

// Scratch vectors; there is only ever one rig.
const pos = new Vector3()
const look = new Vector3()
const crystal = new Vector3()
const lookDamped = new Vector3(0, 4.5, 4)

/** Scroll-driven spline camera with pointer parallax and a dive-to-crystal focus mode. */
export function CameraRig({ projects }: { projects: LabProject[] }) {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const { progress, focusedProject, entered } = useLab.getState()

    const previousT = rig.t
    easing.damp(rig, "t", progressToT(progress), 0.45, dt)
    easing.damp(rig, "progress", progress, 0.45, dt)
    rig.velocity = Math.min((Math.abs(rig.t - previousT) / Math.max(dt, 1e-4)) * 4, 1)

    cameraCurve.getPoint(rig.t, pos)
    targetCurve.getPoint(rig.t, look)
    // A third of the way back towards the camera keeps the packet clear of station geometry.
    rig.packet.copy(look).lerp(pos, PACKET_LEAD).add(PACKET_DROP)

    // Before entering, the camera sits a little higher, framing the skyline.
    if (!entered) pos.y += 1.5

    const focusIndex = focusedProject ? projects.findIndex((p) => p.slug === focusedProject) : -1
    if (focusIndex >= 0) {
      crystalPosition(focusIndex, projects.length, crystal)
      pos.copy(crystal).add(DIVE_OFFSET)
      look.copy(crystal).add(DIVE_LOOK)
    } else {
      pos.x += state.pointer.x * 0.8
      pos.y += state.pointer.y * 0.45
    }

    easing.damp3(state.camera.position, pos, focusIndex >= 0 ? 0.6 : 0.25, dt)
    easing.damp3(lookDamped, look, 0.3, dt)
    rig.focus.copy(lookDamped)
    state.camera.lookAt(lookDamped)
  })

  return null
}
