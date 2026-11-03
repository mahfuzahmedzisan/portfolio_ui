"use client"

import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import { Color, type Group, type Mesh, type ShaderMaterial } from "three"

import { look } from "@/lib/three/look"

import { Parts } from "../instanced-parts"
import { neonMaterial, usePalette, useParts } from "../models"
import { createHologramMaterial } from "../shaders/hologram"
import { createRimMaterial } from "../shaders/rim"
import { StationCull } from "../station-cull"
import { useSpark } from "../use-spark"

const NODES = ["Hero_Core", "Hero_Inner", "Hero_Shell", "Hero_Ring_A", "Hero_Ring_B", "Hero_Sat"] as const
const CYAN = "#22D3EE"
const SATELLITES = 3

/**
 * The hero's single 3D object: a faceted core inside a holographic shell, two gyroscope rings
 * and three satellites. It leans towards the pointer and throws sparks where it is touched.
 */
export function HeroObject() {
  const parts = useParts("hero", NODES)
  const palette = usePalette(CYAN, 2.6)
  const coreMaterial = useMemo(() => createRimMaterial(CYAN), [])
  const innerMaterial = useMemo(() => neonMaterial(CYAN, 1.6), [])
  const innerColor = useMemo(() => new Color(CYAN), [])
  const shellMaterial = useMemo(() => createHologramMaterial(CYAN), [])
  const spark = useSpark(CYAN)

  const root = useRef<Group>(null)
  const tilt = useRef<Group>(null)
  const core = useRef<Group>(null)
  const ringA = useRef<Group>(null)
  const ringB = useRef<Group>(null)
  const shell = useRef<Mesh>(null)
  const sats = useRef<(Mesh | null)[]>([])
  const hover = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const aspect = state.viewport.aspect
    const wide = aspect > 1

    if (root.current) {
      // Right of the headline on desktop, above it on a portrait phone.
      easing.damp3(root.current.position, wide ? [5.6, 6.0, 8] : [0, 8.7, 6], 0.4, delta)
      root.current.scale.setScalar(wide ? 1.55 : 1.15)
      root.current.position.y += Math.sin(t * 0.9) * 0.004
    }
    if (tilt.current) {
      easing.damp(tilt.current.rotation, "y", state.pointer.x * 0.55, 0.35, delta)
      easing.damp(tilt.current.rotation, "x", -state.pointer.y * 0.3, 0.35, delta)
    }
    easing.damp(hover, "current", 0, 0.4, delta)
    const lift = hover.current

    if (core.current) {
      core.current.rotation.y += delta * (0.25 + lift * 1.4)
      core.current.rotation.x = Math.sin(t * 0.4) * 0.18
    }
    innerMaterial.color.copy(innerColor).multiplyScalar(1.4 + Math.sin(t * 2.4) * 0.6 + lift * 2)
    if (shell.current) {
      const uniforms = (shell.current.material as ShaderMaterial).uniforms
      uniforms.uTime.value = t
      uniforms.uActive.value = 0.35 + lift * 0.6
      shell.current.rotation.y -= delta * 0.12
    }
    if (ringA.current) ringA.current.rotation.set(t * 0.45, 0.3, t * 0.2)
    if (ringB.current) ringB.current.rotation.set(0.5, t * -0.3, t * 0.15)
    sats.current.forEach((mesh, k) => {
      if (!mesh) return
      const a = t * 0.9 + (k * Math.PI * 2) / SATELLITES
      mesh.position.set(Math.cos(a) * 3.0, Math.sin(a * 1.3 + k) * 0.8, Math.sin(a) * 3.0)
      mesh.rotation.set(t * 1.3 + k, t * 0.9, 0)
    })
  })

  return (
    <StationCull id="client" range={1.5}>
      <group
        ref={root}
        position={[5.4, 6.3, 8]}
        onPointerMove={(e) => {
          e.stopPropagation()
          hover.current = 1
          look.hovering = true
          spark(e)
        }}
        onPointerOut={() => (look.hovering = false)}
      >
        <group ref={tilt}>
          <group ref={core}>
            <Parts parts={parts.Hero_Core} palette={{ ...palette, Surface: coreMaterial }} />
            <Parts parts={parts.Hero_Inner} palette={{ ...palette, Neon: innerMaterial }} />
          </group>
          {parts.Hero_Shell.map((p, i) => (
            <mesh key={i} ref={shell} geometry={p.geometry} material={shellMaterial} />
          ))}
          <group ref={ringA}>
            <Parts parts={parts.Hero_Ring_A} palette={palette} />
          </group>
          <group ref={ringB}>
            <Parts parts={parts.Hero_Ring_B} palette={palette} />
          </group>
          {Array.from({ length: SATELLITES }, (_, k) => (
            <mesh
              key={k}
              ref={(el) => void (sats.current[k] = el)}
              geometry={parts.Hero_Sat[0].geometry}
              material={palette.Neon}
              scale={1.4}
            />
          ))}
        </group>
      </group>
    </StationCull>
  )
}
