"use client"

import { useEffect } from "react"

import { type LabScene, useLab } from "@/lib/three/store"

/** Tells the persistent lab canvas which scene this page wants. Renders nothing. */
export function SetScene({ scene }: { scene: LabScene }) {
  const setScene = useLab((s) => s.setScene)
  useEffect(() => setScene(scene), [scene, setScene])
  return null
}
