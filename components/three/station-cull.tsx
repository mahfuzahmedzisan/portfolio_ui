"use client"

import { useFrame } from "@react-three/fiber"
import { type ReactNode, useRef } from "react"
import type { Group } from "three"

import { rig } from "@/lib/three/rig"
import { type StationId, stationDistance } from "@/lib/three/stations.config"

/**
 * Hides a station's meshes while the camera is further than `range` stations away.
 * Keep lights outside: changing the light count forces every material to recompile.
 */
export function StationCull({ id, range = 1.6, children }: { id: StationId; range?: number; children: ReactNode }) {
  const group = useRef<Group>(null)
  useFrame(() => {
    const g = group.current
    if (g) g.visible = stationDistance(rig.progress, id) < range
  })
  return <group ref={group}>{children}</group>
}
