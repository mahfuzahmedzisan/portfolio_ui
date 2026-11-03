"use client"

import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import { Color, type Group, type Mesh } from "three"

import { look } from "@/lib/three/look"
import { ANCHORS } from "@/lib/three/stations.config"
import { sparks } from "@/lib/three/sparks"
import { useLab } from "@/lib/three/store"

import { audio } from "../audio/audio-manager"
import { Parts } from "../instanced-parts"
import { neonMaterial, useLitPalette, useParts } from "../models"
import { StationCull } from "../station-cull"
import { useSpark } from "../use-spark"

const NODES = ["Contact_Pad", "Contact_Rocket"] as const
const PINK = "#F472B6"
const FLAME = "#FF9A3C"
const POSITION: [number, number, number] = [ANCHORS.contact.x + 4.2, 0, ANCHORS.contact.z]
const LAUNCH_ACCEL = 16
const RETURN_AFTER = 6

/**
 * The message goes out on a rocket. The launch pad idles while the form is open,
 * shakes while it sends, and the rocket leaves once the server confirms.
 */
export function ContactPad() {
  const parts = useParts("contact", NODES)
  const palette = useLitPalette(PINK, 2.6)
  const flameMaterial = useMemo(() => neonMaterial(FLAME, 3), [])
  const flameColor = useMemo(() => new Color(FLAME), [])
  const spark = useSpark(PINK)

  const rocket = useRef<Group>(null)
  const flame = useRef<Mesh>(null)
  const launch = useRef({ t: -1, wasSent: false, scale: 1 })

  useFrame((state, delta) => {
    const g = rocket.current
    if (!g) return
    const t = state.clock.elapsedTime
    const status = useLab.getState().contactStatus
    const l = launch.current

    if (status === "sent" && !l.wasSent) {
      l.wasSent = true
      l.t = 0
      audio.play("success")
    }
    if (status !== "sent") l.wasSent = false

    let y = 0.16 + Math.sin(t * 1.6) * 0.04
    let shake = status === "sending" ? 0.03 : 0
    let boost = 0.4 + (status === "sending" ? 0.9 : 0)

    if (l.t >= 0) {
      l.t += delta
      y = 0.5 * LAUNCH_ACCEL * l.t * l.t
      shake = Math.min(l.t * 0.05, 0.04)
      boost = 2.2
      if (Math.floor(state.clock.elapsedTime * 30) % 2 === 0) {
        sparks.emit(POSITION[0] + (Math.random() - 0.5) * 0.3, y + 0.1, POSITION[2], FLAME)
      }
      if (l.t > RETURN_AFTER) {
        // Back on the pad, growing out of nothing.
        l.t = -1
        l.scale = 0
      }
    } else if (l.scale < 1) {
      easing.damp(l, "scale", 1, 0.5, delta)
    }

    g.position.set((Math.random() - 0.5) * shake, y, (Math.random() - 0.5) * shake)
    g.scale.setScalar(l.scale)
    if (flame.current) {
      flame.current.scale.set(1, 0.6 + boost * (0.7 + Math.sin(t * 40) * 0.3), 1)
      flameMaterial.color.copy(flameColor).multiplyScalar(2 + boost)
    }
  })

  return (
    <StationCull id="contact" range={1.5}>
      <group
        position={POSITION}
        scale={1.9}
        onPointerMove={(e) => {
          e.stopPropagation()
          look.hovering = true
          spark(e)
        }}
        onPointerOut={() => (look.hovering = false)}
      >
        <Parts parts={parts.Contact_Pad} palette={palette} />
        <group ref={rocket}>
          <Parts parts={parts.Contact_Rocket} palette={palette} />
          <mesh ref={flame} position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]} material={flameMaterial}>
            <coneGeometry args={[0.13, 0.7, 8]} />
          </mesh>
        </group>
      </group>
    </StationCull>
  )
}
