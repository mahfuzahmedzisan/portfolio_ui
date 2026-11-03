"use client"

import { useLayoutEffect, useRef } from "react"
import type { InstancedMesh, Matrix4 } from "three"

import type { Palette, Part } from "./models"

function InstancedPart({ part, matrices, palette }: { part: Part; matrices: Matrix4[]; palette: Palette }) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, palette[part.role] ?? palette.Surface, matrices.length]}
      frustumCulled
    />
  )
}

/** One instanced draw call per material slot of a multi-material Blender node. */
export function InstancedParts({ parts, matrices, palette }: { parts: Part[]; matrices: Matrix4[]; palette: Palette }) {
  if (matrices.length === 0) return null
  return (
    <>
      {parts.map((part, i) => (
        <InstancedPart key={i} part={part} matrices={matrices} palette={palette} />
      ))}
    </>
  )
}

/** Plain meshes for a node used once. */
export function Parts({ parts, palette }: { parts: Part[]; palette: Palette }) {
  return (
    <>
      {parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={palette[part.role] ?? palette.Surface} />
      ))}
    </>
  )
}
