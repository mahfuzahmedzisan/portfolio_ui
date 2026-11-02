"use client"

import { Environment, Lightformer, PerformanceMonitor, Preload, StatsGl, useProgress } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Suspense, useEffect, useMemo, useRef } from "react"
import { BufferAttribute, BufferGeometry, Color, type FogExp2, type Mesh, type Points, type ShaderMaterial } from "three"

import type { Experience as ExperienceItem, LabProject, Skill } from "@/content/lab/mock"
import { QUALITY, TIERS } from "@/lib/three/quality"
import { seededRandom } from "@/lib/three/random"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"
import { accentAt, fogAt } from "@/lib/three/stations.config"
import { useTuning } from "@/lib/three/tuning"

import { CameraRig } from "./camera-rig"
import { Effects } from "./effects"
import { preloadModels } from "./models"
import { Packet, PacketFormation } from "./packet"
import { createGridMaterial } from "./shaders/grid"
import { createParticleMaterial } from "./shaders/particles"
import { BrowserCity } from "./stations/browser-city"
import { DatabaseVault } from "./stations/db-vault"
import { EngineCore } from "./stations/engine-core"
import { FiberTunnel } from "./stations/fiber-tunnel"

preloadModels()

export type ExperienceProps = {
  skills: Skill[]
  experiences: ExperienceItem[]
  projects: LabProject[]
  debug?: boolean
}

const BACKGROUND = "#05070D"

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

/** Rendered inside Suspense, so it only mounts once every model and font has resolved. */
function Ready() {
  const setLoaded = useLab((s) => s.setLoaded)
  useEffect(() => setLoaded(), [setLoaded])
  return null
}

function LoadingReporter() {
  const { progress } = useProgress()
  const setLoadProgress = useLab((s) => s.setLoadProgress)
  useEffect(() => {
    if (!useLab.getState().loaded) setLoadProgress(progress)
  }, [progress, setLoadProgress])
  return null
}

function Adaptive() {
  const tier = useLab((s) => s.tier)
  const setTier = useLab((s) => s.setTier)
  const step = (direction: -1 | 1) => {
    const next = TIERS[TIERS.indexOf(useLab.getState().tier) + direction]
    if (next) setTier(next)
  }
  return (
    <PerformanceMonitor
      key={tier}
      bounds={(refresh) => (refresh > 90 ? [50, 90] : [45, 58])}
      flipflops={3}
      onDecline={() => step(-1)}
      onFallback={() => setTier("low")}
    />
  )
}

export default function Experience({ skills, experiences, projects, debug = false }: ExperienceProps) {
  const tier = useLab((s) => s.tier)
  const quality = QUALITY[tier]

  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <LoadingReporter />
      <Canvas
        dpr={quality.dpr}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 48, near: 0.1, far: 240, position: [0, 8, 30] }}
      >
        <color attach="background" args={[BACKGROUND]} />
        <fogExp2 attach="fog" args={[BACKGROUND, 0.02]} />

        <hemisphereLight args={["#1e3a8a", "#020308", 0.45]} />
        <directionalLight position={[-12, 22, 18]} intensity={0.8} color="#bae6fd" />

        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={3} color="#22D3EE" position={[0, 6, -8]} scale={[12, 1, 1]} />
          <Lightformer form="rect" intensity={2} color="#FF2D20" position={[-10, 3, 0]} rotation-y={Math.PI / 2} scale={[8, 1, 1]} />
          <Lightformer form="ring" intensity={1.5} color="#34D399" position={[10, 4, 0]} rotation-y={-Math.PI / 2} scale={4} />
        </Environment>

        <Suspense fallback={null}>
          <GridFloor />
          <AmbientDust count={quality.particles} />
          <BrowserCity />
          <FiberTunnel />
          <EngineCore skills={skills} experiences={experiences} />
          <DatabaseVault projects={projects} />
          <Packet />
          <PacketFormation />
          <CameraRig projects={projects} />
          <Preload all />
          <Ready />
        </Suspense>

        <Effects />
        <Adaptive />
        {debug ? <StatsGl className="!left-auto !right-2 !top-2" /> : null}
      </Canvas>
    </div>
  )
}
