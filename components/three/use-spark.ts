"use client"

import type { ThreeEvent } from "@react-three/fiber"
import { useCallback, useRef } from "react"

import { sparks } from "@/lib/three/sparks"

import { audio } from "./audio/audio-manager"

/** Pointer-move handler that throws electric sparks from wherever the pointer touches the object. */
export function useSpark(color: string, interval = 70) {
  const last = useRef(0)
  return useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const now = performance.now()
      if (now - last.current < interval) return
      last.current = now
      sparks.emit(event.point.x, event.point.y, event.point.z, color)
      audio.play("zap")
    },
    [color, interval],
  )
}
