"use client"

import { Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { type Group, type Mesh, type MeshBasicMaterial, Vector3 } from "three"

import type { Experience } from "@/content/lab/types"
import { ANCHORS } from "@/lib/three/stations.config"

import { DISPLAY_FONT } from "./browser-city"

const AMBER = "#F59E0B"
/** Distance at which a log entry is fully dimmed. */
const FALLOFF = 6
const STEP = 2.7

const world = new Vector3()

/**
 * Experience as a log you fly through: glass cards along a rail, the nearest one
 * brightening as the camera passes. Kept off to the side of the skill orbits.
 */
export function ServiceLog({ experiences }: { experiences: Experience[] }) {
  const entries = useRef<(Group | null)[]>([])
  const frames = useRef<(Mesh | null)[]>([])
  const span = Math.max(experiences.length - 1, 1) * STEP

  useFrame((state) => {
    entries.current.forEach((entry, i) => {
      const frame = frames.current[i]
      if (!entry || !frame) return
      entry.getWorldPosition(world)
      const near = Math.max(0, 1 - Math.abs(state.camera.position.y - world.y) / FALLOFF)
      entry.scale.setScalar(0.98 + near * 0.05)
      const material = frame.material as MeshBasicMaterial
      material.opacity = 0.22 + near * 0.3
    })
  })

  return (
    <group position={ANCHORS.log}>
      <mesh position={[-1.7, 5.8, 0]}>
        <boxGeometry args={[0.03, span + 1.2, 0.03]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      {experiences.map((xp, i) => {
        const y = 5.8 + ((experiences.length - 1) / 2 - i) * STEP
        return (
          <group key={xp.id} ref={(el) => void (entries.current[i] = el)} position={[0, y, 0]}>
            <mesh position={[-1.7, 0, 0]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color="#F59E0B" />
            </mesh>
            <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 2, 6]} />
              <meshBasicMaterial color="#F59E0B" />
            </mesh>
            <group position={[1.6, 0, 0]} rotation={[0, -0.44, 0]}>
              <mesh>
                <planeGeometry args={[6.4, 2.35]} />
                <meshBasicMaterial color="#100c08" transparent opacity={0.9} depthWrite={false} />
              </mesh>
              <mesh ref={(el) => void (frames.current[i] = el)} position={[0, 0, -0.02]}>
                <planeGeometry args={[6.55, 2.5]} />
                <meshBasicMaterial color={AMBER} transparent opacity={0.22} toneMapped={false} depthWrite={false} />
              </mesh>
              <Text font={DISPLAY_FONT} fontSize={0.22} position={[-2.8, 0.72, 0.05]} anchorX="left" color={AMBER}>
                {xp.period}
              </Text>
              <Text font={DISPLAY_FONT} fontSize={0.4} position={[-2.8, 0.26, 0.05]} anchorX="left" maxWidth={5.6} color="#f8fafc">
                {xp.role}
              </Text>
              <Text font={DISPLAY_FONT} fontSize={0.22} position={[-2.8, -0.2, 0.05]} anchorX="left" color="#cbd5e1">
                {xp.company}
              </Text>
              <Text font={DISPLAY_FONT} fontSize={0.2} position={[-2.8, -0.68, 0.05]} anchorX="left" maxWidth={5.6} color="#94a3b8">
                {xp.summary}
              </Text>
            </group>
          </group>
        )
      })}
    </group>
  )
}
