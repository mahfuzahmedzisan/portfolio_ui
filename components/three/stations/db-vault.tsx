"use client"

import { Billboard, Text } from "@react-three/drei"
import { type ThreeEvent, useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import {
  type BufferGeometry,
  Color,
  type Group,
  type IUniform,
  type Material,
  Matrix4,
  type Mesh,
  MeshPhysicalMaterial,
  Vector3,
} from "three"

import type { LabProject, Skill } from "@/content/lab/mock"
import { look, wasDrag } from "@/lib/three/look"
import { useLab } from "@/lib/three/store"
import { ANCHORS, crystalPosition } from "@/lib/three/stations.config"

import { audio } from "../audio/audio-manager"
import { InstancedParts, Parts } from "../instanced-parts"
import { type Part, usePalette, useParts } from "../models"
import { useSpark } from "../use-spark"
import { createHologramMaterial } from "../shaders/hologram"
import { DISPLAY_FONT } from "./browser-city"

const NODES = ["Server_Rack", "Crystal", "Vault_Ring"] as const
const SHAPE_NODES = [
  "Shape_Cube",
  "Shape_Sphere",
  "Shape_Torus",
  "Shape_Pyramid",
  "Shape_Drum",
  "Shape_Prism",
  "Shape_Spike",
  "Shape_Knot",
] as const
/** Spreads neighbouring projects across the nine silhouettes (the original crystal plus the eight shapes). */
const SHAPE_ORDER = [0, 3, 6, 1, 4, 7, 2, 5, 8]
const EMERALD = "#34D399"

const crystalVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vV = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
  }
`

const crystalFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
    float shimmer = 0.85 + 0.15 * sin(uTime * 3.0 + vV.y * 12.0);
    csm_Emissive = uColor * (fresnel * (2.2 + uGlow * 1.4) + 0.22 + uGlow * 0.5) * shimmer;
  }
`

function createCrystalMaterial(color: string) {
  return new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    vertexShader: crystalVertex,
    fragmentShader: crystalFragment,
    uniforms: { uColor: { value: new Color(color) }, uGlow: { value: 0 }, uTime: { value: 0 } },
    color: "#0b1020",
    metalness: 0.2,
    roughness: 0.08,
    clearcoat: 1,
    flatShading: true,
    toneMapped: false,
  })
}

type ShaderMesh = Mesh<BufferGeometry, Material & { uniforms: Record<string, IUniform> }>

type CrystalProps = { project: LabProject; index: number; total: number; part: Part; filter: string | null }

function Crystal({ project, index, total, part, filter }: CrystalProps) {
  const group = useRef<Group>(null)
  const gem = useRef<ShaderMesh>(null)
  const ring = useRef<ShaderMesh>(null)
  const material = useMemo(() => createCrystalMaterial(project.accent_color), [project.accent_color])
  const frame = useMemo(() => createHologramMaterial(project.accent_color), [project.accent_color])
  const focused = useLab((s) => s.focusedProject === project.slug)
  const focusProject = useLab((s) => s.focusProject)
  const hover = useRef({ value: 0 })
  const spark = useSpark(project.accent_color)
  const base = useMemo(() => crystalPosition(index, total, new Vector3()), [index, total])
  // A skill filter lights the crystals built with it and sinks the rest.
  const match = filter === null ? 0 : project.stack.includes(filter) ? 1 : -1

  useFrame((state, delta) => {
    const g = group.current
    const gemUniforms = gem.current?.material.uniforms
    const ringUniforms = ring.current?.material.uniforms
    if (!g || !gemUniforms || !ringUniforms) return
    const t = state.clock.elapsedTime
    const lift = Math.max(hover.current.value, focused ? 1 : 0, match > 0 ? 0.55 : 0)
    easing.damp(gemUniforms.uGlow, "value", match < 0 && !focused ? -0.6 : lift, 0.2, delta)
    const glow = Math.max(gemUniforms.uGlow.value as number, 0)
    gemUniforms.uTime.value = t
    ringUniforms.uTime.value = t
    ringUniforms.uActive.value = glow
    const sink = match < 0 && !focused ? -0.9 : 0
    g.position.set(base.x, base.y + Math.sin(t * 1.1 + index) * 0.15 + glow * 0.6 + sink, base.z + glow * 0.9)
    g.rotation.y += delta * (0.4 + glow * 1.6)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hover.current.value = 1
    audio.play("tick")
    look.hovering = true
  }
  const out = () => {
    hover.current.value = 0
    look.hovering = false
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (wasDrag()) return
    focusProject(focused ? null : project.slug)
    audio.play(focused ? "tick" : "chime")
  }

  return (
    <group>
      <group
        ref={group}
        onPointerOver={over}
        onPointerOut={out}
        onPointerMove={(e) => {
          e.stopPropagation()
          spark(e)
        }}
        onClick={click}
        scale={1.25}
      >
        <mesh ref={gem} geometry={part.geometry} material={material} />
      </group>
      <group position={[base.x, base.y - 1.55, base.z]}>
        <mesh ref={ring} material={frame}>
          <ringGeometry args={[0.85, 0.95, 6]} />
        </mesh>
        <Billboard position={[0, -0.45, 0]}>
          <Text font={DISPLAY_FONT} fontSize={0.22} anchorX="center" anchorY="top" maxWidth={2.4} textAlign="center">
            {project.title}
            <meshBasicMaterial color={[1.4, 1.5, 1.5]} toneMapped={false} />
          </Text>
        </Billboard>
      </group>
    </group>
  )
}

export function DatabaseVault({ projects, skills }: { projects: LabProject[]; skills: Skill[] }) {
  const parts = useParts("vault", NODES)
  const shapes = useParts("shapes", SHAPE_NODES)
  // Index 0 is the vault's own crystal; 1..8 are the shape nodes.
  const silhouettes = useMemo(() => [parts.Crystal[0], ...SHAPE_NODES.map((name) => shapes[name][0])], [parts, shapes])
  const filterId = useLab((s) => s.skillFilter)
  const filter = skills.find((s) => s.id === filterId)?.name ?? null
  const palette = usePalette(EMERALD, 2.4)
  const ring = useRef<Group>(null)

  const racks = useMemo(() => {
    const out: Matrix4[] = []
    const { x, z } = ANCHORS.vault
    for (let row = 0; row < 7; row++) {
      for (const side of [-1, 1]) {
        for (const lane of [0, 1]) {
          const m = new Matrix4()
            .makeRotationY(side > 0 ? -Math.PI / 2 : Math.PI / 2)
            .setPosition(x + side * (5.5 + lane * 2.4), 0, z + 14 - row * 2.2)
          out.push(m)
        }
      }
    }
    return out
  }, [])

  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.15
  })

  return (
    <group>
      <InstancedParts parts={parts.Server_Rack} matrices={racks} palette={palette} />
      <group ref={ring} position={[ANCHORS.vault.x, ANCHORS.vault.y + 3.2, ANCHORS.vault.z - 9]}>
        <Parts parts={parts.Vault_Ring} palette={palette} />
      </group>
      <pointLight color={EMERALD} intensity={40} distance={22} decay={1.8} position={[ANCHORS.vault.x, 7, ANCHORS.vault.z + 2]} />
      {projects.map((project, i) => (
        <Crystal key={project.slug} project={project} index={i} total={projects.length} part={silhouettes[SHAPE_ORDER[i % SHAPE_ORDER.length]]} filter={filter} />
      ))}
    </group>
  )
}
