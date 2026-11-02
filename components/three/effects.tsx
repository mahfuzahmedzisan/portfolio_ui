"use client"

import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing"
import { useFrame } from "@react-three/fiber"
import { BlendFunction, type ChromaticAberrationEffect, type DepthOfFieldEffect, ToneMappingMode } from "postprocessing"
import { type ReactElement, useRef } from "react"
import { Vector2 } from "three"
import { easing } from "maath"

import { QUALITY } from "@/lib/three/quality"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"
import { useTuning } from "@/lib/three/tuning"

const offset = new Vector2(0, 0)

/** Bloom carries the neon look; the other passes switch off on lower tiers. */
export function Effects() {
  const tier = useLab((s) => s.tier)
  const quality = QUALITY[tier]
  const tuning = useTuning()
  const chromatic = useRef<ChromaticAberrationEffect>(null)
  const dof = useRef<DepthOfFieldEffect>(null)
  const bokeh = useRef({ value: 0 })

  useFrame((_, delta) => {
    // Chromatic aberration only shows while the packet is in transit.
    const amount = rig.velocity * useTuning.getState().chromatic
    easing.damp(offset, "x", amount, 0.15, delta)
    offset.y = offset.x * 0.6
    if (chromatic.current) chromatic.current.offset.copy(offset)

    const focused = useLab.getState().focusedProject !== null
    easing.damp(bokeh.current, "value", focused ? 4 : 0, 0.4, delta)
    if (dof.current) {
      dof.current.bokehScale = bokeh.current.value
      dof.current.target = rig.focus
    }
  })

  const passes: ReactElement[] = [
    <Bloom
      key="bloom"
      mipmapBlur
      intensity={tuning.bloomIntensity}
      luminanceThreshold={tuning.bloomThreshold}
      luminanceSmoothing={0.2}
      radius={tuning.bloomRadius}
    />,
  ]
  if (quality.depthOfField) passes.push(<DepthOfField key="dof" ref={dof} focalLength={0.03} bokehScale={0} />)
  if (quality.chromaticAberration) {
    passes.push(
      <ChromaticAberration key="ca" ref={chromatic} offset={offset} radialModulation modulationOffset={0.25} />,
    )
  }
  if (quality.noise) passes.push(<Noise key="noise" premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={tuning.noise} />)
  passes.push(
    <Vignette key="vignette" offset={0.28} darkness={tuning.vignette} />,
    <ToneMapping key="tone" mode={ToneMappingMode.NEUTRAL} />,
    <SMAA key="smaa" />,
  )

  return (
    <EffectComposer key={tier} multisampling={0} enableNormalPass={false}>
      {passes}
    </EffectComposer>
  )
}
