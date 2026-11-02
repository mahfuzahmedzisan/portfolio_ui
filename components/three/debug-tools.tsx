"use client"

import { Leva, useControls } from "leva"
import { useEffect } from "react"

import { TIERS, type QualityTier } from "@/lib/three/quality"
import { useLab } from "@/lib/three/store"
import { DEFAULT_TUNING, useTuning } from "@/lib/three/tuning"

/** Loaded only with `?debug`, so Leva never ships in the normal bundle path. */
export default function DebugTools() {
  const set = useTuning((s) => s.set)
  const tier = useLab((s) => s.tier)
  const setTier = useLab((s) => s.setTier)

  const look = useControls("Look", {
    bloomIntensity: { value: DEFAULT_TUNING.bloomIntensity, min: 0, max: 4, step: 0.05 },
    bloomThreshold: { value: DEFAULT_TUNING.bloomThreshold, min: 0, max: 3, step: 0.05 },
    bloomRadius: { value: DEFAULT_TUNING.bloomRadius, min: 0, max: 1, step: 0.01 },
    fogScale: { value: DEFAULT_TUNING.fogScale, min: 0, max: 3, step: 0.05 },
    vignette: { value: DEFAULT_TUNING.vignette, min: 0, max: 1.5, step: 0.01 },
    noise: { value: DEFAULT_TUNING.noise, min: 0, max: 1, step: 0.01 },
    chromatic: { value: DEFAULT_TUNING.chromatic, min: 0, max: 0.02, step: 0.0005 },
  })

  // Only panel edits write the tier; detection and PerformanceMonitor changes flow back in below.
  const [, setQuality] = useControls("Renderer", () => ({
    quality: {
      value: tier,
      options: TIERS,
      onChange: (value: QualityTier, _path: string, context: { initial: boolean; fromPanel: boolean }) => {
        if (!context.initial && context.fromPanel) setTier(value)
      },
    },
  }))

  useEffect(() => set(look), [look, set])
  useEffect(() => setQuality({ quality: tier }), [tier, setQuality])

  return <Leva collapsed={false} titleBar={{ title: "The Request / debug" }} />
}
