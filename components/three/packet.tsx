"use client"

import { Trail } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  type Mesh,
  MeshBasicMaterial,
  type Points,
  type ShaderMaterial,
} from "three"

import { seededRandom } from "@/lib/three/random"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"
import { accentAt } from "@/lib/three/stations.config"

import { useParts } from "./models"
import { createParticleMaterial } from "./shaders/particles"

const NODES = ["Packet_Core", "Packet_Shell"] as const
const WHITE = new Color("#ffffff")
const accent = new Color()

/** The visitor's request: an emissive core, a wireframe shell and a light trail. */
export function Packet() {
  const parts = useParts("shared", NODES)
  const group = useRef<Group>(null)
  const core = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null)
  const shell = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null)
  const materials = useMemo(
    () => ({
      core: new MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      shell: new MeshBasicMaterial({ color: "#22D3EE", toneMapped: false, transparent: true, opacity: 0.85 }),
    }),
    [],
  )
  const scale = useRef({ value: 0 })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    g.position.copy(rig.packet)
    g.position.y += Math.sin(state.clock.elapsedTime * 1.4) * 0.12

    easing.damp(scale.current, "value", useLab.getState().entered ? 1 : 0.0001, 0.6, delta)
    g.scale.setScalar(scale.current.value)

    accentAt(rig.progress, accent)
    core.current?.material.color.copy(accent).lerp(WHITE, 0.55).multiplyScalar(3.2)
    if (shell.current) {
      shell.current.material.color.copy(accent).multiplyScalar(2.2)
      shell.current.rotation.x += delta * 0.4
      shell.current.rotation.y += delta * (0.6 + rig.velocity * 4)
    }
  })

  return (
    <group ref={group}>
      <Trail width={1.1} length={7} decay={1.4} color="#67E8F9" attenuation={(w) => w * w}>
        <mesh ref={core} geometry={parts.Packet_Core[0].geometry} material={materials.core} />
      </Trail>
      <mesh ref={shell} geometry={parts.Packet_Shell[0].geometry} material={materials.shell} />
      <pointLight color="#67E8F9" intensity={12} distance={9} decay={2} />
    </group>
  )
}

/** Particles that swirl in the skyline, then gather into the packet when the visitor enters. */
export function PacketFormation({ count = 420 }: { count?: number }) {
  const points = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const material = useMemo(() => createParticleMaterial("#67E8F9", 3.2), [])
  const geometry = useMemo(() => {
    const random = seededRandom(3)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 3 + random() * 9
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      seeds[i] = random()
    }
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(positions, 3))
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1))
    return g
  }, [count])

  useFrame((state, delta) => {
    const p = points.current
    if (!p) return
    const u = p.material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPixelRatio.value = state.viewport.dpr
    easing.damp(u.uGather, "value", useLab.getState().entered ? 1 : 0, 0.5, delta)
    p.position.copy(rig.packet)
    p.visible = u.uGather.value < 0.995
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
