"use client"

import { Billboard, Text } from "@react-three/drei"
import { type ThreeEvent, useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import { Color, type Group, type MeshBasicMaterial, Vector3 } from "three"

import { type LabService, services } from "@/content/lab/services"
import { look, wasDrag } from "@/lib/three/look"
import { servicePosition } from "@/lib/three/stations.config"
import { useLab } from "@/lib/three/store"

import { audio } from "../audio/audio-manager"
import { Parts } from "../instanced-parts"
import { type Part, useLitPalette, useParts } from "../models"
import { StationCull } from "../station-cull"
import { useSpark } from "../use-spark"
import { DISPLAY_FONT } from "./browser-city"

const NODES = [
  "Svc_Fullstack",
  "Svc_Ecom",
  "Svc_Saas",
  "Svc_Api",
  "Svc_Admin",
  "Svc_3d",
  "Svc_Support",
  "Svc_Base",
] as const

type CardProps = { service: LabService; index: number; parts: Part[]; base: Part[] }

const home = new Vector3()

function ServiceCard({ service, index, parts, base }: CardProps) {
  const root = useRef<Group>(null)
  const shape = useRef<Group>(null)
  const palette = useLitPalette(service.accent, 2.4)
  const neon = palette.Neon as MeshBasicMaterial
  const idle = useMemo(() => new Color(service.accent).multiplyScalar(2.2), [service.accent])
  const lit = useMemo(() => new Color(service.accent).multiplyScalar(4.2), [service.accent])
  const hover = useRef({ value: 0 })
  const setActive = useLab((s) => s.setActiveService)
  const spark = useSpark(service.accent)

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime
    const active = useLab.getState().activeService === index
    const focus = Math.max(hover.current.value, active ? 0.8 : 0)
    servicePosition(index, services.length, home)
    easing.damp3(g.position, [home.x, home.y + Math.sin(t * 1.1 + index) * 0.14 + focus * 0.45, home.z + focus * 0.8], 0.3, delta)
    easing.damp(g.scale, "x", 1 + focus * 0.22, 0.25, delta)
    g.scale.y = g.scale.z = g.scale.x
    if (shape.current) shape.current.rotation.y += delta * (0.35 + focus * 1.3)
    easing.dampC(neon.color, focus > 0.05 ? lit : idle, 0.2, delta)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hover.current.value = 1
    look.hovering = true
    audio.play("tick")
  }
  const out = () => {
    hover.current.value = 0
    look.hovering = false
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (wasDrag()) return
    setActive(index)
    audio.play("card")
  }

  return (
    <group ref={root}>
      <group
        onPointerOver={over}
        onPointerOut={out}
        onPointerMove={(e) => {
          e.stopPropagation()
          spark(e)
        }}
        onClick={click}
      >
        <group ref={shape} scale={1.45}>
          <Parts parts={parts} palette={palette} />
        </group>
        <group position={[0, -1.6, 0]} scale={1.3}>
          <Parts parts={base} palette={palette} />
        </group>
      </group>
      <Billboard position={[0, -2.2, 0]}>
        <Text font={DISPLAY_FONT} fontSize={0.3} anchorX="center" anchorY="top" maxWidth={2.6} textAlign="center">
          {service.short}
          <meshBasicMaterial color={[1.4, 1.5, 1.5]} toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  )
}

/** Seven service pedestals on a shallow arc; touching one pulls its details into the HTML panel. */
export function ServicesPlatform() {
  const parts = useParts("services", NODES)
  return (
    <StationCull id="services" range={1.5}>
      {services.map((service, i) => (
        <ServiceCard key={service.id} service={service} index={i} parts={parts[service.model]} base={parts.Svc_Base} />
      ))}
    </StationCull>
  )
}
