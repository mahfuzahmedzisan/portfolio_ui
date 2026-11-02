"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import { BufferAttribute, CatmullRomCurve3, Matrix4, TubeGeometry, Vector3 } from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

import { rig } from "@/lib/three/rig"
import { ANCHORS } from "@/lib/three/stations.config"

import { InstancedParts } from "../instanced-parts"
import { usePalette, useParts } from "../models"
import { createDataFlowMaterial } from "../shaders/data-flow"
import { createScannerMaterial } from "../shaders/scanner"

const NODES = ["Tunnel_Ring", "Router_Node"] as const
const CENTER_Y = 4
const RING_GAP = 3.2
const STRANDS = 18

function strandGeometry() {
  const { start, end } = ANCHORS.tunnel
  const tubes = []
  for (let s = 0; s < STRANDS; s++) {
    const angle = (s / STRANDS) * Math.PI * 2
    const radius = 3.15 + (s % 3) * 0.18
    const twist = (s % 2 === 0 ? 1 : -1) * 0.35
    const points: Vector3[] = []
    for (let i = 0; i <= 12; i++) {
      const z = start + 6 - ((start - end + 10) * i) / 12
      const a = angle + twist * (i / 12) * Math.PI
      points.push(new Vector3(Math.cos(a) * radius, CENTER_Y + Math.sin(a) * radius, z))
    }
    const tube = new TubeGeometry(new CatmullRomCurve3(points), 120, 0.035, 5, false)
    const phase = new Float32Array(tube.attributes.position.count).fill(s * 0.137)
    tube.setAttribute("aPhase", new BufferAttribute(phase, 1))
    tubes.push(tube)
  }
  return mergeGeometries(tubes)
}

export function FiberTunnel() {
  const parts = useParts("tunnel", NODES)
  const palette = usePalette("#A5F3FC", 2.6)
  const routerPalette = usePalette("#22D3EE", 3.5)
  const flow = useMemo(() => createDataFlowMaterial("#A5F3FC"), [])
  const scanner = useMemo(() => createScannerMaterial("#E5E7EB"), [])
  const strands = useMemo(strandGeometry, [])

  const { rings, routers } = useMemo(() => {
    const { start, end } = ANCHORS.tunnel
    const rings: Matrix4[] = []
    const routers: Matrix4[] = []
    let k = 0
    for (let z = start; z >= end; z -= RING_GAP, k++) {
      const m = new Matrix4().makeRotationZ(k * 0.18).setPosition(0, CENTER_Y, z)
      rings.push(m)
      if (k % 4 === 2) {
        const side = k % 8 === 2 ? 1 : -1
        routers.push(new Matrix4().makeTranslation(side * 2.6, CENTER_Y + 2.1, z - RING_GAP / 2))
      }
    }
    return { rings, routers }
  }, [])

  useFrame((state) => {
    flow.uniforms.uTime.value = state.clock.elapsedTime
    flow.uniforms.uBoost.value = rig.velocity * 2.5
    scanner.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group>
      <InstancedParts parts={parts.Tunnel_Ring} matrices={rings} palette={palette} />
      <InstancedParts parts={parts.Router_Node} matrices={routers} palette={routerPalette} />
      <mesh geometry={strands} material={flow} frustumCulled={false} />
      {/* Gateway preview: the auth scanner the packet flies through on its way out. */}
      <mesh position={[0, CENTER_Y, ANCHORS.tunnel.end - 2]} material={scanner}>
        <planeGeometry args={[7.2, 7.2]} />
      </mesh>
    </group>
  )
}
