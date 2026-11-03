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
  skills: "/3d/models/skills.glb",
  experience: "/3d/models/experience.glb",
  hero: "/3d/models/hero.glb",
  about: "/3d/models/about.glb",
  services: "/3d/models/services.glb",
  shapes: "/3d/models/shapes.glb",
  contact: "/3d/models/contact.glb",
  devices: "/3d/models/devices.glb",
  footer: "/3d/models/footer.glb",
} as const

export type ModelName = keyof typeof MODEL_URLS

/** Blender material slots: the frontend swaps each one for an accent-aware material. */
export type MaterialRole = "Surface" | "Trim" | "Neon" | "Glass" | "Skin" | "Hair" | "Hoodie"

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
export function bakeParts(root: Object3D): Part[] {
  root.updateWorldMatrix(true, true)
  const parts: Part[] = []
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return
    const source = child.geometry as BufferGeometry
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", toFloat(source.getAttribute("position") as BufferAttribute))
    const normal = source.getAttribute("normal") as BufferAttribute | undefined
    if (normal) geometry.setAttribute("normal", toFloat(normal))
    // Texture-mapped parts (device screens) keep their UVs.
    const uv = source.getAttribute("uv") as BufferAttribute | undefined
    if (uv) geometry.setAttribute("uv", toFloat(uv))
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

/** The four slots every Blender model uses; Skin/Hair/Hoodie exist only on the about character. */
/**
 * Readable on the dark floor: a lit slate body, pale trim and an accent glow. Used for the objects the
 * visitor is meant to study up close (services, character, launch pad), unlike the moody station sets.
 */
export function useLitPalette(accent: string, intensity = 2.6): Palette {
  return useMemo(() => {
    const glow = new Color(accent)
    return {
      Surface: new MeshStandardMaterial({ color: "#33415F", emissive: glow, emissiveIntensity: 0.07, metalness: 0.35, roughness: 0.42, envMapIntensity: 0.8 }),
      Trim: new MeshStandardMaterial({ color: "#7C8DB0", metalness: 0.55, roughness: 0.3, envMapIntensity: 1 }),
      Neon: neonMaterial(accent, intensity),
      Glass: new MeshStandardMaterial({ color: "#5B8FD0", metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.4 }),
      Skin: new MeshStandardMaterial({ color: "#D39A78", metalness: 0, roughness: 0.65 }),
      Hair: new MeshStandardMaterial({ color: "#1B1512", metalness: 0.1, roughness: 0.5 }),
      Hoodie: new MeshStandardMaterial({ color: "#1F4E80", metalness: 0.1, roughness: 0.55, emissive: glow, emissiveIntensity: 0.05 }),
    }
  }, [accent, intensity])
}

export type Palette = Record<"Surface" | "Trim" | "Neon" | "Glass", Material> & Partial<Record<"Skin" | "Hair" | "Hoodie", Material>>

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
      // Only the character uses these; the rest of the scene never asks for them.
      Skin: new MeshStandardMaterial({ color: "#C98B68", metalness: 0, roughness: 0.7 }),
      Hair: new MeshStandardMaterial({ color: "#14100E", metalness: 0.1, roughness: 0.55 }),
      Hoodie: new MeshStandardMaterial({ color: "#0F2A47", metalness: 0.15, roughness: 0.6 }),
    }),
    [accent, intensity],
  )
}
