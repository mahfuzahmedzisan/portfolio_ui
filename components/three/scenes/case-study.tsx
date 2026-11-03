"use client"

import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useMemo, useRef } from "react"
import { type BufferGeometry, DoubleSide, type FogExp2, type IUniform, type Group, type Mesh, MeshBasicMaterial, SRGBColorSpace, Vector3 } from "three"

import type { LabCaseStudy, LabProject } from "@/content/lab/projects"
import type { Skill } from "@/content/lab/types"
import { useLab } from "@/lib/three/store"

import { Parts } from "../instanced-parts"
import { bakeParts, useLitPalette, useModel } from "../models"
import { createGridMaterial } from "../shaders/grid"
import { useSpark } from "../use-spark"

/** Shader uniforms are written outside React's render analysis. */
function setTime(material: { uniforms: Record<string, IUniform> }, value: number) {
  material.uniforms.uTime.value = value
}

const lookAt = new Vector3()
const target = new Vector3()
const CENTER = new Vector3(0, 1.9, 0)

/** Bakes a node into one world-space geometry that keeps its UVs (for the texture-mapped screens). */
function screenGeometry(node: Mesh | undefined): BufferGeometry | null {
  if (!node) return null
  const part = bakeParts(node)[0]
  return part?.geometry ?? null
}

function Screen({ geometry, src }: { geometry: BufferGeometry | null; src: string }) {
  const map = useTexture(src, (t) => {
    t.colorSpace = SRGBColorSpace
    // glTF stores UVs top-down, so the image must not be flipped again.
    t.flipY = false
    t.anisotropy = 4
  })
  const material = useMemo(() => new MeshBasicMaterial({ map, toneMapped: false, side: DoubleSide }), [map])
  if (!geometry) return null
  return <mesh geometry={geometry} material={material} />
}

/**
 * A laptop and a phone showing the project, on a glowing pad under the accent colour. Scrolling the
 * case study walks the camera around them.
 */
export function CaseStudyScene({ study }: { study: LabCaseStudy; next: LabProject; skills: Skill[] }) {
  const { nodes } = useModel("devices")
  const palette = useLitPalette(study.accent_color, 2.6)
  const spark = useSpark(study.accent_color)
  const grid = useMemo(() => createGridMaterial(study.accent_color), [study.accent_color])
  const laptop = useMemo(() => bakeParts(nodes.Device_Laptop), [nodes])
  const phone = useMemo(() => bakeParts(nodes.Device_Phone), [nodes])
  const laptopScreen = useMemo(() => screenGeometry(nodes.Device_Screen as Mesh), [nodes])
  const phoneScreen = useMemo(() => screenGeometry(nodes.Phone_Screen as Mesh), [nodes])
  // The phone shows the first gallery image when there is one, so the two devices differ.
  const second = useMemo(() => {
    const gallery = study.blocks.find((b) => b.type === "gallery")
    return gallery?.type === "gallery" ? gallery.images[0].src : study.cover.src
  }, [study])

  const root = useRef<Group>(null)
  const floor = useRef<Mesh>(null)

  useFrame((state, delta) => {
    const { progress } = useLab.getState()
    const angle = -0.55 + progress * 1.5
    const radius = state.viewport.aspect > 1 ? 9 : 14
    easing.damp3(state.camera.position, target.set(Math.sin(angle) * radius, 3.2 + progress * 1.2, Math.cos(angle) * radius), 0.5, delta)
    // Looking left of the devices keeps them clear of the text column.
    easing.damp3(lookAt, [state.viewport.aspect > 1 ? -2.4 : 0, 1.7, 0], 0.4, delta)
    state.camera.lookAt(lookAt)
    const fog = state.scene.fog as FogExp2 | null
    if (fog) fog.density = 0.018
    if (root.current) root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.12
    setTime(grid, state.clock.elapsedTime)
  })

  return (
    <>
      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={grid}>
        <planeGeometry args={[120, 120]} />
      </mesh>
      <group
        ref={root}
        position={CENTER.clone().setY(0)}
        onPointerMove={(e) => {
          e.stopPropagation()
          spark(e)
        }}
      >
        <mesh position={[0.6, -0.06, 0.4]}>
          <cylinderGeometry args={[4.2, 4.2, 0.12, 40]} />
          <meshStandardMaterial color="#0b1220" metalness={0.8} roughness={0.35} />
        </mesh>
        <group position={[-0.6, 0, 0]} scale={2.3}>
          <Parts parts={laptop} palette={palette} />
          <Screen geometry={laptopScreen} src={study.cover.src} />
        </group>
        <group position={[2.9, 0, 1.1]} rotation={[0, -0.35, 0]} scale={2.1}>
          <Parts parts={phone} palette={palette} />
          <Screen geometry={phoneScreen} src={second} />
        </group>
      </group>
    </>
  )
}
