"use client"

import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three"

export const MODEL_URLS = {
  shared: "/3d/models/shared.glb",
  city: "/3d/models/city.glb",
  tunnel: "/3d/models/tunnel.glb",
  engine: "/3d/models/engine.glb",
  vault: "/3d/models/vault.glb",
} as const

export type ModelName = keyof typeof MODEL_URLS

/** Blender material slots: the frontend swaps each one for an accent-aware material. */
export type MaterialRole = "Surface" | "Trim" | "Neon" | "Glass"

export type Part = { geometry: BufferGeometry; role: MaterialRole }

export function useModel(name: ModelName) {
  // Meshopt only; the blockout GLBs carry no Draco data.
  return useGLTF(MODEL_URLS[name], false, true)
}

export function preloadModels() {
  for (const url of Object.values(MODEL_URLS)) useGLTF.preload(url, false, true)
}

function toFloat(attribute: BufferAttribute): Float32BufferAttribute {
  const out = new Float32Array(attribute.count * attribute.itemSize)
  for (let i = 0; i < attribute.count; i++) {
    for (let c = 0; c < attribute.itemSize; c++) out[i * attribute.itemSize + c] = attribute.getComponent(i, c)
  }
  return new Float32BufferAttribute(out, attribute.itemSize)
}

/**
 * Meshopt export quantizes positions and moves the dequantization scale onto the
 * node, so instanced or re-parented geometry needs that transform baked back in.
 */
function bakeParts(root: Object3D): Part[] {
  root.updateWorldMatrix(true, true)
  const parts: Part[] = []
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return
    const source = child.geometry as BufferGeometry
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", toFloat(source.getAttribute("position") as BufferAttribute))
    const normal = source.getAttribute("normal") as BufferAttribute | undefined
    if (normal) geometry.setAttribute("normal", toFloat(normal))
    if (source.index) geometry.setIndex(source.index.clone())
    geometry.applyMatrix4(child.matrixWorld)
    geometry.computeBoundingSphere()
    geometry.computeBoundingBox()
    parts.push({ geometry, role: ((child.material as Material).name || "Surface") as MaterialRole })
  })
  return parts
}

/** Baked, world-space parts for each named node of a model. Pass a module-level `names` array. */
export function useParts<const N extends string>(model: ModelName, names: readonly N[]): Record<N, Part[]> {
  const { nodes } = useModel(model)
  return useMemo(() => {
    const out = {} as Record<N, Part[]>
    for (const name of names) {
      const node = nodes[name]
      if (!node) throw new Error(`Missing node ${name} in ${model}.glb`)
      out[name] = bakeParts(node)
    }
    return out
  }, [nodes, model, names])
}

export type Palette = Record<MaterialRole, Material>

/** Emissive strength above 1 is what the bloom threshold picks up. */
export function neonMaterial(color: string | Color, intensity = 3): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), toneMapped: false })
  return material
}

export function usePalette(accent: string, intensity = 3): Palette {
  return useMemo(
    () => ({
      Surface: new MeshStandardMaterial({ color: "#0B1020", metalness: 0.75, roughness: 0.38, envMapIntensity: 0.7 }),
      Trim: new MeshStandardMaterial({ color: "#1A2238", metalness: 0.9, roughness: 0.22, envMapIntensity: 1 }),
      Neon: neonMaterial(accent, intensity),
      Glass: new MeshStandardMaterial({ color: "#1E3A5F", metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35 }),
    }),
    [accent, intensity],
  )
}
