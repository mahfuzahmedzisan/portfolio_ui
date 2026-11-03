"use client"

import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useRef } from "react"
import { MathUtils, type Group } from "three"

import { look } from "@/lib/three/look"

import { Parts } from "../instanced-parts"
import { useLitPalette, useParts } from "../models"
import { StationCull } from "../station-cull"
import { useSpark } from "../use-spark"

/**
 * Swap-in contract for the real character: a `about.glb` whose `Character_Body` and
 * `Character_Head` nodes are modelled 1.8 units tall with the feet at the origin, facing +Z.
 * `Character_Head` pivots at the neck (NECK_Y). Any model that follows it drops in unchanged.
 */
const NODES = ["Character_Body", "Character_Head", "About_Plinth", "About_Halo"] as const
const NECK_Y = 1.38
const SCALE = 2.4
/** Inside the fibre tunnel, right of the camera line so the about panel keeps the left. */
const POSITION: [number, number, number] = [2.4, 0, -47]

const CYAN = "#22D3EE"

export function AboutCharacter() {
  const parts = useParts("about", NODES)
  const palette = useLitPalette(CYAN, 2.6)
  const spark = useSpark(CYAN)

  const body = useRef<Group>(null)
  const head = useRef<Group>(null)
  const halo = useRef<Group>(null)
  const root = useRef<Group>(null)
  const attention = useRef(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    // The head tracks the pointer; the whole figure turns a little further when it is touched.
    if (head.current) {
      const targetYaw = MathUtils.clamp(state.pointer.x * 0.9, -0.8, 0.8)
      const targetPitch = MathUtils.clamp(-state.pointer.y * 0.4, -0.35, 0.35)
      easing.damp(head.current.rotation, "y", targetYaw - 0.2, 0.25, delta)
      easing.damp(head.current.rotation, "x", targetPitch, 0.25, delta)
      head.current.rotation.z = Math.sin(t * 1.1) * 0.02
    }
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.6) * 0.006
    if (halo.current) {
      halo.current.rotation.z = t * 0.5
      halo.current.position.y = 0.9 + Math.sin(t * 0.8) * 0.8
    }
    easing.damp(attention, "current", 0, 0.5, delta)
    if (root.current) root.current.rotation.y = -0.28 - attention.current * 0.25 + Math.sin(t * 0.5) * 0.04
  })

  return (
    <StationCull id="tunnel" range={1.5}>
      <group
        ref={root}
        position={POSITION}
        scale={SCALE}
        onPointerMove={(e) => {
          e.stopPropagation()
          attention.current = 1
          look.hovering = true
          spark(e)
        }}
        onPointerOut={() => (look.hovering = false)}
      >
        <Parts parts={parts.About_Plinth} palette={palette} />
        <group ref={halo}>
          <Parts parts={parts.About_Halo} palette={palette} />
        </group>
        <group ref={body}>
          <Parts parts={parts.Character_Body} palette={palette} />
        </group>
        <group ref={head} position={[0, NECK_Y, 0]}>
          <group position={[0, -NECK_Y, 0]}>
            <Parts parts={parts.Character_Head} palette={palette} />
          </group>
        </group>
      </group>
    </StationCull>
  )
}
