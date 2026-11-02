"use client"

import { Billboard, Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Color, type Group, MeshStandardMaterial } from "three"

import type { Experience } from "@/content/lab/types"
import { ANCHORS } from "@/lib/three/stations.config"

import { Parts } from "../instanced-parts"
import { type Palette, useParts } from "../models"
import { DISPLAY_FONT } from "./browser-city"

const NODES = ["Xp_attachment", "Xp_junior", "Xp_developer"] as const

const MODEL_SCALE = 1

/** Oldest on the left: a monitor desk, an open laptop, then a two-screen desk. */
const ROLES = [
  { node: "Xp_attachment", position: [-3.35, 0, 0.35] as const, label: 1.72, yaw: 0.18 },
  { node: "Xp_junior", position: [-1.45, 0, 0.15] as const, label: 1.12, yaw: 0.04 },
  { node: "Xp_developer", position: [0.55, 0, 0.2] as const, label: 1.6, yaw: -0.16 },
] as const

/**
 * Bodies stay readable in the dark station: a lit pewter shell, a pale trim,
 * and a coloured glow that tone-maps instead of blowing out to white.
 */
function useRoleMaterials(accent: string): Palette {
  return useMemo(() => {
    const glow = new Color(accent)
    return {
      Surface: new MeshStandardMaterial({
        color: "#3A4A62",
        emissive: "#182232",
        emissiveIntensity: 0.55,
        metalness: 0.22,
        roughness: 0.48,
        envMapIntensity: 0.4,
      }),
      Trim: new MeshStandardMaterial({
        color: "#F2F6FB",
        metalness: 0.35,
        roughness: 0.28,
        envMapIntensity: 0.65,
      }),
      Neon: new MeshStandardMaterial({
        color: glow,
        emissive: glow,
        emissiveIntensity: 0.62,
        roughness: 0.4,
        metalness: 0,
      }),
      Glass: new MeshStandardMaterial({
        color: glow,
        emissive: glow,
        emissiveIntensity: 0.18,
        metalness: 0,
        roughness: 0.14,
        transparent: true,
        opacity: 0.32,
      }),
    }
  }, [accent])
}

/**
 * Experience is three different desks. Oldest is a monitor with a visitor badge,
 * then an open laptop, then a landscape-and-portrait developer desk.
 */
export function ExperienceRow({ experiences }: { experiences: Experience[] }) {
  const parts = useParts("experience", NODES)
  const oldestFirst = [...experiences].reverse()
  const screenMat = useRoleMaterials(oldestFirst[0]?.color ?? "#7EE0FF")
  const towerMat = useRoleMaterials(oldestFirst[1]?.color ?? "#FFC14D")
  const bridgeMat = useRoleMaterials(oldestFirst[2]?.color ?? "#FF8B7A")
  const palettes = [screenMat, towerMat, bridgeMat]
  const groups = useRef<(Group | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const [screen, tower, bridge] = groups.current
    if (screen) screen.rotation.y = ROLES[0].yaw + Math.sin(t * 0.4) * 0.04
    if (tower) tower.rotation.y = ROLES[1].yaw + Math.sin(t * 0.35) * 0.03
    if (bridge) bridge.rotation.y = ROLES[2].yaw
  })

  return (
    <group position={ANCHORS.experience}>
      <pointLight position={[0.2, 4.4, 3.2]} color="#FFF6EA" intensity={11} distance={9} decay={2} />
      <pointLight position={[-2.3, 2.5, 2.1]} color="#9EEAFF" intensity={2.4} distance={3.6} decay={2} />
      <pointLight position={[-0.7, 3.3, 1.5]} color="#FFD58A" intensity={2.8} distance={3.8} decay={2} />
      <pointLight position={[1.0, 2.4, 1.7]} color="#FFB6AA" intensity={2.4} distance={3.6} decay={2} />
      {ROLES.map((item, i) => (
        <group key={item.node} position={item.position}>
          <group ref={(el) => void (groups.current[i] = el)} scale={MODEL_SCALE}>
            <Parts parts={parts[item.node]} palette={palettes[i]} />
          </group>
          <Billboard position={[0, item.label, 0]}>
            <Text
              font={DISPLAY_FONT}
              fontSize={0.15}
              maxWidth={2.3}
              textAlign="center"
              anchorX="center"
              anchorY="bottom"
              color="#f8fafc"
            >
              {oldestFirst[i]?.role ?? ""}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
