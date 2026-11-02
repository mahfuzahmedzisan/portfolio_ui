"use client"

import { Billboard, Text } from "@react-three/drei"
import { type ThreeEvent, useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import { Color, type Group, type Mesh, type MeshBasicMaterial, type PointLight, type ShaderMaterial } from "three"

import type { Experience, Skill } from "@/content/lab/mock"
import { useLab } from "@/lib/three/store"
import { ANCHORS } from "@/lib/three/stations.config"

import { audio } from "../audio/audio-manager"
import { Parts } from "../instanced-parts"
import { neonMaterial, type Part, usePalette, useParts } from "../models"
import { createHologramMaterial } from "../shaders/hologram"
import { DISPLAY_FONT } from "./browser-city"

const NODES = ["Core", "Ring_1", "Ring_2", "Ring_3", "Skill_Pod", "Conveyor", "Crate"] as const
const LARAVEL = "#FF2D20"
const ORBIT_RADIUS = 6.2
const BELT_LENGTH = 14

type EngineParts = Record<(typeof NODES)[number], Part[]>

function SkillPod({ skill, index, total, parts }: { skill: Skill; index: number; total: number; parts: EngineParts }) {
  const group = useRef<Group>(null)
  const palette = usePalette("#FCA5A5", 2.2)
  const hovered = useLab((s) => s.hoveredSkill === skill.id)
  const hoverSkill = useLab((s) => s.hoverSkill)
  const neon = palette.Neon as MeshBasicMaterial
  const idle = useMemo(() => new Color("#FCA5A5").multiplyScalar(2.2), [])
  const active = useMemo(() => new Color(LARAVEL).multiplyScalar(6), [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const a = (index / total) * Math.PI * 2 + state.clock.elapsedTime * 0.12
    g.position.set(Math.cos(a) * ORBIT_RADIUS, Math.sin(a * 2) * 0.8 + Math.sin(a) * 1.2, Math.sin(a) * ORBIT_RADIUS)
    g.rotation.y += delta * 0.6
    easing.damp(g.scale, "x", hovered ? 1.35 : 1, 0.15, delta)
    g.scale.y = g.scale.z = g.scale.x
    easing.dampC(neon.color, hovered ? active : idle, 0.15, delta)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverSkill(skill.id)
    audio.play("tick")
    document.body.style.cursor = "pointer"
  }
  const out = () => {
    if (useLab.getState().hoveredSkill === skill.id) hoverSkill(null)
    document.body.style.cursor = ""
  }

  return (
    <group ref={group} onPointerOver={over} onPointerOut={out}>
      <Parts parts={parts.Skill_Pod} palette={palette} />
      <Billboard position={[0, 1.05, 0]}>
        <Text font={DISPLAY_FONT} fontSize={0.32} anchorX="center" anchorY="bottom">
          {skill.name}
          <meshBasicMaterial color={hovered ? [3, 1, 0.8] : [1.3, 1.3, 1.4]} toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  )
}

function Conveyor({ experiences, parts }: { experiences: Experience[]; parts: EngineParts }) {
  const palette = usePalette(LARAVEL, 2.4)
  const crates = useRef<(Group | null)[]>([])
  const labels = useRef<(Group | null)[]>([])
  const items = useMemo(() => [...experiences, ...experiences], [experiences])

  useFrame((state) => {
    const offset = (state.clock.elapsedTime * 0.8) % BELT_LENGTH
    crates.current.forEach((crate, i) => {
      if (!crate) return
      const x = ((i * BELT_LENGTH) / items.length + offset) % BELT_LENGTH - BELT_LENGTH / 2
      crate.position.x = x
      const edge = 1 - Math.min(Math.abs(x) / (BELT_LENGTH / 2), 1)
      crate.scale.setScalar(Math.min(edge * 5, 1))
      labels.current[i]?.scale.setScalar(Math.max(0, 1 - Math.abs(x) / 2.4))
    })
  })

  return (
    <group position={[-1, -4.6, -8]} rotation={[0, 0.5, 0]}>
      <Parts parts={parts.Conveyor} palette={palette} />
      {items.map((xp, i) => (
        <group key={`${xp.id}-${i}`} ref={(el) => void (crates.current[i] = el)} position={[0, 0.1, 0]}>
          <Parts parts={parts.Crate} palette={palette} />
          <Billboard ref={(el) => void (labels.current[i] = el)} position={[0, 1.35, 0]}>
            <Text font={DISPLAY_FONT} fontSize={0.42} anchorX="center" anchorY="bottom" maxWidth={3}>
              {`${xp.role}\n${xp.period}`}
              <meshBasicMaterial color={[1.6, 1.5, 1.5]} toneMapped={false} />
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}

export function EngineCore({ skills, experiences }: { skills: Skill[]; experiences: Experience[] }) {
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
      {skills.map((skill, i) => (
        <SkillPod key={skill.id} skill={skill} index={i} total={skills.length} parts={parts} />
      ))}
      <Conveyor experiences={experiences} parts={parts} />
    </group>
  )
}
