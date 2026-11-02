"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Color, type Group, type Mesh, type PointLight, type ShaderMaterial } from "three"

import type { Skill } from "@/content/lab/mock"
import { ANCHORS } from "@/lib/three/stations.config"

import { Parts } from "../instanced-parts"
import { neonMaterial, usePalette, useParts } from "../models"
import { createHologramMaterial } from "../shaders/hologram"
import { SkillOrbits } from "./skill-artifacts"

const NODES = ["Core", "Ring_1", "Ring_2", "Ring_3", "Skill_Pod"] as const
const LARAVEL = "#FF2D20"

export function EngineCore({ skills }: { skills: Skill[] }) {
  const parts = useParts("engine", NODES)
  const ringPalette = usePalette(LARAVEL, 1.8)
  const coreMaterial = useMemo(() => neonMaterial(LARAVEL, 1.6), [])
  const coreColor = useMemo(() => new Color(LARAVEL), [])
  const shellMaterial = useMemo(() => createHologramMaterial(LARAVEL), [])
  const shells = useRef<(Mesh | null)[]>([])
  const rings = useRef<(Mesh | Group | null)[]>([])
  const light = useRef<PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2)
    coreMaterial.color.copy(coreColor).multiplyScalar(1.2 + pulse * 1.4)
    for (const mesh of shells.current) {
      if (!mesh) continue
      const uniforms = (mesh.material as ShaderMaterial).uniforms
      uniforms.uTime.value = t
      uniforms.uActive.value = pulse * 0.6
    }
    if (light.current) light.current.intensity = 40 + pulse * 50
    const [a, b, c] = rings.current
    if (a) a.rotation.set(t * 0.5, t * 0.2, 0)
    if (b) b.rotation.set(-t * 0.3, 0, t * 0.4)
    if (c) c.rotation.set(Math.PI / 2 + Math.sin(t * 0.3) * 0.3, t * 0.15, 0)
  })

  return (
    <group position={ANCHORS.engine}>
      {parts.Core.map((p, i) => (
        <group key={i}>
          <mesh geometry={p.geometry} material={coreMaterial} scale={0.42} />
          <mesh ref={(el) => void (shells.current[i] = el)} geometry={p.geometry} material={shellMaterial} />
        </group>
      ))}
      {(["Ring_1", "Ring_2", "Ring_3"] as const).map((name, i) => (
        <group key={name} ref={(el) => void (rings.current[i] = el)}>
          <Parts parts={parts[name]} palette={ringPalette} />
        </group>
      ))}
      <pointLight ref={light} color={LARAVEL} distance={34} decay={1.6} />
      <SkillOrbits skills={skills} pod={parts.Skill_Pod} />
    </group>
  )
}
