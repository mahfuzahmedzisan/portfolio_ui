"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { BufferAttribute, BufferGeometry, Color, type FogExp2, type Mesh, type Points, type ShaderMaterial } from "three"

import type { LabProject } from "@/content/lab/projects"
import type { Experience, Skill } from "@/content/lab/types"
import { QUALITY } from "@/lib/three/quality"
import { seededRandom } from "@/lib/three/random"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"
import { accentAt, fogAt } from "@/lib/three/stations.config"
import { useTuning } from "@/lib/three/tuning"

import { CameraRig } from "../camera-rig"
import { Packet, PacketFormation } from "../packet"
import { createGridMaterial } from "../shaders/grid"
import { createParticleMaterial } from "../shaders/particles"
import { BrowserCity } from "../stations/browser-city"
import { DatabaseVault } from "../stations/db-vault"
import { EngineCore } from "../stations/engine-core"
import { FiberTunnel } from "../stations/fiber-tunnel"

export type JourneyData = { skills: Skill[]; experiences: Experience[]; projects: LabProject[] }

const accent = new Color()

/** Floor grid whose tint, like the fog density, follows the station the packet is passing through. */
function GridFloor() {
  const grid = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null)
  const material = useMemo(() => createGridMaterial("#22D3EE"), [])

  useFrame((state) => {
    const fog = state.scene.fog as FogExp2 | null
    if (fog) fog.density = fogAt(rig.progress) * useTuning.getState().fogScale
    const uniforms = grid.current?.material.uniforms
    if (!uniforms) return
    uniforms.uColor.value.copy(accentAt(rig.progress, accent))
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <>
      <mesh ref={grid} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -70]} material={material}>
        <planeGeometry args={[160, 280]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -70]}>
        <planeGeometry args={[160, 280]} />
        <meshStandardMaterial color="#03050a" metalness={0.9} roughness={0.32} />
      </mesh>
    </>
  )
}

function AmbientDust({ count }: { count: number }) {
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const material = useMemo(() => createParticleMaterial("#7dd3fc", 1.4), [])
  const geometry = useMemo(() => {
    const random = seededRandom(11)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 44
      positions[i * 3 + 1] = random() * 16
      positions[i * 3 + 2] = 30 - random() * 200
      seeds[i] = random()
    }
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(positions, 3))
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1))
    return g
  }, [count])

  useFrame((state) => {
    const uniforms = points.current?.material.uniforms
    if (!uniforms) return
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uPixelRatio.value = state.viewport.dpr
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}

/** The scroll journey: browser, tunnel, engine and vault along one spline. */
export function JourneyScene({ skills, experiences, projects }: JourneyData) {
  const tier = useLab((s) => s.tier)
  return (
    <>
      <GridFloor />
      <AmbientDust count={QUALITY[tier].particles} />
      <BrowserCity />
      <FiberTunnel />
      <EngineCore skills={skills} experiences={experiences} />
      <DatabaseVault projects={projects} skills={skills} />
      <Packet />
      <PacketFormation />
      <CameraRig projects={projects} />
    </>
  )
}
