"use client"

import { Environment, Lightformer, PerformanceMonitor, Preload, StatsGl, useProgress } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { type ReactNode, Suspense, useEffect } from "react"

import { QUALITY, TIERS } from "@/lib/three/quality"
import { sceneKey, useLab } from "@/lib/three/store"

import { CursorSparks } from "./effects/cursor-sparks"
import { Effects } from "./effects"
import { LookControls } from "./look-controls"
import { preloadModels } from "./models"
import { ArchiveScene } from "./scenes/archive"
import { CaseStudyScene } from "./scenes/case-study"
import { type JourneyData, JourneyScene } from "./scenes/journey"

preloadModels()

export type ExperienceProps = JourneyData & { debug?: boolean }

const BACKGROUND = "#05070D"

/** Rendered inside each scene's Suspense, so it only mounts once that scene's assets resolved. */
function Ready({ id }: { id: string }) {
  useEffect(() => {
    const { loaded, setLoaded, setReadyScene } = useLab.getState()
    if (!loaded) setLoaded()
    setReadyScene(id)
  }, [id])
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

function SceneSlot({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Suspense key={id} fallback={null}>
      {children}
      <Preload all />
      <Ready id={id} />
    </Suspense>
  )
}

/**
 * One canvas for every /lab route. Pages announce their scene through the store,
 * so moving between the journey, the archive and a case study never drops the GL context.
 */
export default function Experience({ skills, experiences, projects, debug = false }: ExperienceProps) {
  const tier = useLab((s) => s.tier)
  const scene = useLab((s) => s.scene)
  const key = sceneKey(scene)
  const quality = QUALITY[tier]

  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <LoadingReporter />
      <Canvas
        dpr={quality.dpr}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 48, near: 0.1, far: 360, position: [0, 8, 30] }}
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

        {scene?.kind === "journey" && key ? (
          <SceneSlot id={key}>
            <JourneyScene skills={skills} experiences={experiences} projects={projects} />
          </SceneSlot>
        ) : null}
        {scene?.kind === "archive" && key ? (
          <SceneSlot id={key}>
            <ArchiveScene projects={scene.projects} />
          </SceneSlot>
        ) : null}
        {scene?.kind === "case" && key ? (
          <SceneSlot id={key}>
            <CaseStudyScene study={scene.study} next={scene.next} skills={skills} />
          </SceneSlot>
        ) : null}

        <CursorSparks />
        <LookControls />
        <Effects />
        <Adaptive />
        {debug ? <StatsGl className="!left-auto !right-2 !top-2" /> : null}
      </Canvas>
    </div>
  )
}
