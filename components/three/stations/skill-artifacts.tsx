"use client"

import { Billboard, Text } from "@react-three/drei"
import { type ThreeEvent, useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import {
  BufferGeometry,
  Color,
  Euler,
  Float32BufferAttribute,
  type Group,
  type IUniform,
  LineBasicMaterial,
  LineLoop,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three"

import { SKILL_MODELS, type Skill, type SkillGroup, type SkillModel } from "@/content/lab/types"
import { look, wasDrag } from "@/lib/three/look"
import { rig } from "@/lib/three/rig"
import { stationDistance } from "@/lib/three/stations.config"
import { useLab } from "@/lib/three/store"

import { audio } from "../audio/audio-manager"
import { Parts } from "../instanced-parts"
import { bakeParts, neonMaterial, type Palette, type Part, useModel } from "../models"
import { createRimMaterial } from "../shaders/rim"
import { DISPLAY_FONT } from "./browser-city"

type Ring = { radius: number; tilt: Euler; speed: number; y: number; color: string }

/** One orbit per skill group, outside the engine's own rings (largest is ~3.8 units). */
const RINGS: Record<SkillGroup, Ring> = {
  backend: { radius: 4.9, tilt: new Euler(-0.32, 0, 0.42), speed: -0.14, y: 0.5, color: "#FF2D20" },
  data: { radius: 5.9, tilt: new Euler(0.42, 0, -0.28), speed: 0.11, y: -0.3, color: "#5B9BE0" },
  frontend: { radius: 6.9, tilt: new Euler(0.14, 0, 0.06), speed: 0.08, y: 0.2, color: "#61DAFB" },
  devops: { radius: 7.9, tilt: new Euler(-0.18, 0, -0.22), speed: -0.06, y: 0.9, color: "#2496ED" },
}

/** Where an inspected artifact floats, in camera space. */
const INSPECT_WIDE = new Vector3(1.9, 0, -6)
const INSPECT_NARROW = new Vector3(0, 1.1, -6.5)

type ArtifactParts = { body: Part[]; a: Part[]; b: Part[] }

function useSkillParts(): Record<SkillModel, ArtifactParts | null> {
  const { nodes } = useModel("skills")
  return useMemo(() => {
    const bake = (name: string) => (nodes[name] ? bakeParts(nodes[name]) : [])
    const out = {} as Record<SkillModel, ArtifactParts | null>
    for (const slug of SKILL_MODELS) {
      out[slug] = nodes[`Skill_${slug}`]
        ? { body: bake(`Skill_${slug}`), a: bake(`Skill_${slug}_A`), b: bake(`Skill_${slug}_B`) }
        : null
    }
    return out
  }, [nodes])
}

type RimMaterial = Material & { uniforms: Record<string, IUniform> }

function useArtifactPalette(color: string) {
  return useMemo(() => {
    const rim = createRimMaterial(color) as unknown as RimMaterial
    const trim = new MeshStandardMaterial({ color: "#1A2238", metalness: 0.9, roughness: 0.22, envMapIntensity: 1 })
    const palette: Palette = {
      Surface: rim,
      Trim: trim,
      Neon: neonMaterial(color, 2.2),
      Glass: new MeshStandardMaterial({ color: "#1E3A5F", metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35 }),
      // Skill models never use the character roles.
      Skin: trim,
      Hair: trim,
      Hoodie: trim,
    }
    return { palette, rim }
  }, [color])
}

type Moving = { body: Group | null; a: Group | null; b: Group | null; electrons: (Mesh | null)[] }

/** React's orbits are baked with these semi-axes, rotated 0/60/120 degrees in the logo plane. */
const ORBIT_A = 0.6
const ORBIT_B = 0.228

/** Each artifact's signature idle motion, driven by its `_A`/`_B` nodes. */
const ANIMATE: Partial<Record<SkillModel, (m: Moving, t: number) => void>> = {
  nextjs: (m, t) => m.a && (m.a.rotation.z = -t * 2.2),
  react: (m, t) => {
    m.electrons.forEach((e, k) => {
      if (!e) return
      const s = t * 2.4 + k * 2.1
      const phi = (-k * Math.PI) / 3
      const x = Math.cos(s) * ORBIT_A
      const y = Math.sin(s) * ORBIT_B
      e.position.set(x * Math.cos(phi) - y * Math.sin(phi), x * Math.sin(phi) + y * Math.cos(phi), 0)
    })
  },
  typescript: (m, t) => {
    if (!m.a) return
    m.a.scale.setScalar(1 + Math.sin(t * 1.6) * 0.14)
    m.a.rotation.z = t * 0.35
  },
  threejs: (m, t) => m.a?.rotation.set(t * 0.5, t * 0.7, 0),
  laravel: (m, t) => m.a?.rotation.set(t * 0.3, t * 0.45, 0),
  php: (m, t) => {
    if (m.body) {
      m.body.position.y = Math.abs(Math.sin(t * 2.2)) * 0.045
      m.body.rotation.z = Math.sin(t * 2.2) * 0.04
    }
    if (m.a) m.a.rotation.y = t * 1.2
  },
  postgresql: (m, t) => m.a && (m.a.position.y = Math.sin(t * 1.3) * 0.42),
  redis: (m, t) => {
    const spread = (Math.sin(t * 1.8) * 0.5 + 0.5) * 0.09
    if (m.a) m.a.position.y = spread
    if (m.b) m.b.position.y = spread * 2
  },
  docker: (m, t) => {
    if (m.a) m.a.position.y = Math.sin(t * 2) * 0.05
    if (m.body) m.body.rotation.z = Math.sin(t * 1.1) * 0.05
  },
  tailwind: (m, t) => {
    if (m.body) m.body.position.x = Math.sin(t * 1.6) * 0.07
    if (m.a) m.a.position.x = Math.sin(t * 1.6 + Math.PI) * 0.07
  },
}

export function ringPosition(ring: Ring, index: number, count: number, time: number, out: Vector3, spread = 1): Vector3 {
  // Artifacts that have not left the core yet also whirl faster, so they unwind as they travel out.
  const a = (index / count) * Math.PI * 2 + time * ring.speed + (1 - spread) * 5
  const radius = ring.radius * spread
  return out.set(Math.cos(a) * radius, 0, Math.sin(a) * radius).applyEuler(ring.tilt).setY(out.y + ring.y * spread)
}

const ease = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

/**
 * 0 while the camera is away (every artifact sits in the engine's core), 1 once it arrives and the
 * rings are fully open. `lag` (0..1) staggers artifacts so they peel off one after another.
 */
export function orbitSpread(lag = 0): number {
  const arrive = 1 - (stationDistance(rig.progress, "engine") - 0.1) / 0.8
  return ease(arrive * 1.5 - lag * 0.5)
}

const target = new Vector3()
const offset = new Vector3()
const glowOn = new Color()

type SlotProps = {
  skill: Skill
  index: number
  count: number
  /** This artifact's position among all skills, for staggering the unfold. */
  groupOffset: number
  total: number
  parts: ArtifactParts | null
  pod: Part[]
}

function SkillArtifact({ skill, index, count, groupOffset, total, parts, pod }: SlotProps) {
  const group = useRef<Group>(null)
  const label = useRef<Group>(null)
  const moving = useRef<Moving>({ body: null, a: null, b: null, electrons: [] })
  const { palette, rim } = useArtifactPalette(skill.color)
  const neon = palette.Neon as MeshBasicMaterial
  const idle = useMemo(() => new Color(skill.color).multiplyScalar(2.2), [skill.color])
  const ring = RINGS[skill.group]
  const hoverSkill = useLab((s) => s.hoverSkill)
  const inspectSkill = useLab((s) => s.inspectSkill)
  const animate = skill.model ? ANIMATE[skill.model] : undefined

  useFrame((state, delta) => {
    const g = group.current
    if (!g || !g.parent) return
    const t = state.clock.elapsedTime
    const { inspectedSkill, hoveredSkill } = useLab.getState()
    const inspected = inspectedSkill === skill.id
    const hovered = hoveredSkill === skill.id
    const spread = orbitSpread((index + groupOffset) / total)

    if (inspected) {
      offset.copy(state.size.width > state.size.height ? INSPECT_WIDE : INSPECT_NARROW).multiplyScalar(look.zoom)
      offset.applyQuaternion(state.camera.quaternion).add(state.camera.position)
      g.parent.worldToLocal(target.copy(offset))
      easing.damp3(g.position, target, 0.28, delta)
    } else {
      easing.damp3(g.position, ringPosition(ring, index, count, t, target, spread), 0.3, delta)
    }

    const grown = 0.25 + 0.75 * spread
    const scale = (inspected ? 1.4 : hovered ? 1.3 : inspectedSkill !== null ? 0.75 : 1) * (inspected ? 1 : grown)
    easing.damp(g.scale, "x", scale, 0.2, delta)
    g.scale.y = g.scale.z = g.scale.x

    // Face the camera so the logo reads, then add idle sway or the visitor's spin.
    g.lookAt(state.camera.position)
    if (inspected) {
      g.rotateY(look.spinYaw + Math.sin(t * 0.5) * 0.15)
      g.rotateX(look.spinPitch)
    } else {
      g.rotateY(Math.sin(t * 0.6 + index * 1.7) * 0.45)
    }

    const lit = inspected || hovered ? 1 : 0
    easing.damp(rim.uniforms.uGlow, "value", lit, 0.2, delta)
    easing.dampC(neon.color, lit ? glowOn.set(skill.color).multiplyScalar(inspected ? 3 : 4) : idle, 0.2, delta)
    if (label.current) label.current.visible = !inspected

    animate?.(moving.current, t)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverSkill(skill.id)
    look.hovering = true
    audio.play("tick")
  }
  const out = () => {
    if (useLab.getState().hoveredSkill === skill.id) hoverSkill(null)
    look.hovering = false
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (wasDrag()) return
    const open = useLab.getState().inspectedSkill === skill.id
    inspectSkill(open ? null : skill.id)
    audio.play(open ? "tick" : "chime")
  }

  return (
    <group ref={group} onPointerOver={over} onPointerOut={out} onClick={click}>
      {parts ? (
        <>
          <group ref={(el) => void (moving.current.body = el)}>
            <Parts parts={parts.body} palette={palette} />
          </group>
          {parts.a.length ? (
            <group ref={(el) => void (moving.current.a = el)}>
              <Parts parts={parts.a} palette={palette} />
            </group>
          ) : null}
          {parts.b.length ? (
            <group ref={(el) => void (moving.current.b = el)}>
              <Parts parts={parts.b} palette={palette} />
            </group>
          ) : null}
          {skill.model === "react"
            ? [0, 1, 2].map((k) => (
                <mesh key={k} ref={(el) => void (moving.current.electrons[k] = el)} material={neon}>
                  <sphereGeometry args={[0.05, 12, 8]} />
                </mesh>
              ))
            : null}
        </>
      ) : (
        <group scale={0.8}>
          <Parts parts={pod} palette={palette} />
        </group>
      )}
      <Billboard ref={label} position={[0, 0.98, 0]}>
        <Text font={DISPLAY_FONT} fontSize={0.26} anchorX="center" anchorY="bottom">
          {skill.name}
          <meshBasicMaterial color={[1.3, 1.3, 1.4]} toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  )
}

function setOpacity(material: LineBasicMaterial, value: number) {
  material.opacity = value
}

function OrbitPath({ ring }: { ring: Ring }) {
  const line = useMemo(() => {
    const points: number[] = []
    const p = new Vector3()
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2
      p.set(Math.cos(a) * ring.radius, 0, Math.sin(a) * ring.radius).applyEuler(ring.tilt)
      points.push(p.x, p.y + ring.y, p.z)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3))
    const material = new LineBasicMaterial({ color: ring.color, transparent: true, opacity: 0.22, toneMapped: false })
    return new LineLoop(geometry, material)
  }, [ring])
  useFrame(() => {
    const s = orbitSpread(0.3)
    line.scale.setScalar(Math.max(s, 0.001))
    setOpacity(line.material as LineBasicMaterial, 0.22 * s)
  })
  return <primitive object={line} />
}

/** Skill artifacts on one tilted orbit per group, plus faint orbit paths. */
export function SkillOrbits({ skills, pod }: { skills: Skill[]; pod: Part[] }) {
  const parts = useSkillParts()
  const groups = useMemo(() => {
    const byGroup = new Map<SkillGroup, Skill[]>()
    for (const skill of skills) byGroup.set(skill.group, [...(byGroup.get(skill.group) ?? []), skill])
    return [...byGroup.entries()]
  }, [skills])
  // Running index of each group's first artifact, so the unfold staggers across all skills.
  const offsets = useMemo(() => {
    let n = 0
    return groups.map(([, members]) => {
      const start = n
      n += members.length
      return start
    })
  }, [groups])

  return (
    <>
      {groups.map(([group, members], g) => (
        <group key={group}>
          <OrbitPath ring={RINGS[group]} />
          {members.map((skill, i) => (
            <SkillArtifact
              key={skill.id}
              skill={skill}
              index={i}
              count={members.length}
              groupOffset={offsets[g]}
              total={skills.length}
              parts={skill.model ? parts[skill.model] : null}
              pod={pod}
            />
          ))}
        </group>
      ))}
    </>
  )
}
