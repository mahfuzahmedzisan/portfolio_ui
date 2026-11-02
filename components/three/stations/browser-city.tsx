"use client"

import { Billboard, Float, Text } from "@react-three/drei"
import { useMemo } from "react"
import { Euler, Matrix4, Quaternion, Vector3 } from "three"

import { QUALITY } from "@/lib/three/quality"
import { seededRandom } from "@/lib/three/random"
import { useLab } from "@/lib/three/store"

import { InstancedParts, Parts } from "../instanced-parts"
import { usePalette, useParts } from "../models"

const TOWERS = ["Tower_A", "Tower_B", "Tower_C", "Tower_D", "Tower_E", "Tower_F"] as const
const NODES = [...TOWERS, "Billboard", "Cursor"] as const

export const DISPLAY_FONT = "/3d/fonts/space-grotesk.ttf"

function skyline(count: number): Matrix4[][] {
  const random = seededRandom(7)
  const byVariant: Matrix4[][] = TOWERS.map(() => [])
  const q = new Quaternion()
  const e = new Euler()
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1
    // Keep a clear avenue for the packet; the further out, the taller.
    const x = side * (6.5 + random() * 34)
    const z = 24 - random() * 46
    const distance = Math.abs(x) / 40
    const height = 0.6 + random() * 0.6 + distance * 1.1
    const width = 0.8 + random() * 0.5
    e.set(0, Math.floor(random() * 4) * (Math.PI / 2), 0)
    q.setFromEuler(e)
    const m = new Matrix4().compose(new Vector3(x, 0, z), q, new Vector3(width, height, width))
    byVariant[Math.floor(random() * TOWERS.length)].push(m)
  }
  return byVariant
}

export function BrowserCity() {
  const parts = useParts("city", NODES)
  const tier = useLab((s) => s.tier)
  const palette = usePalette("#22D3EE", 3.2)
  const signPalette = usePalette("#F0ABFC", 3)
  const matrices = useMemo(() => skyline(QUALITY[tier].towers), [tier])

  return (
    <group>
      {TOWERS.map((name, i) => (
        <InstancedParts key={name} parts={parts[name]} matrices={matrices[i]} palette={palette} />
      ))}

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.6}>
        <group position={[6.8, 1.6, 6]} rotation={[0, -0.35, 0.12]} scale={0.9}>
          <Parts parts={parts.Cursor} palette={palette} />
        </group>
      </Float>

      <group position={[9, 9.5, -6]} rotation={[0, -0.45, 0]}>
        <Parts parts={parts.Billboard} palette={palette} />
        <Text font={DISPLAY_FONT} fontSize={0.34} position={[0.25, 0, 0.16]} anchorX="center" anchorY="middle" color="#9ca3af">
          https://mahfuz.dev
        </Text>
      </group>

      <group position={[-11, 13, -12]} rotation={[0, 0.35, 0]}>
        <Parts parts={parts.Billboard} palette={signPalette} />
      </group>

      <Billboard position={[0, 10.5, -10]} follow lockX lockZ>
        <Text font={DISPLAY_FONT} fontSize={3.1} letterSpacing={-0.03} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#22D3EE">
          MAHFUZ
          <meshBasicMaterial color={[0.4, 2.6, 3.2]} toneMapped={false} />
        </Text>
        <Text font={DISPLAY_FONT} fontSize={0.5} letterSpacing={0.35} position={[0, -2.2, 0]} anchorX="center" anchorY="middle">
          FULL-STACK DEVELOPER
          <meshBasicMaterial color={[1.4, 1.4, 1.6]} toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  )
}
