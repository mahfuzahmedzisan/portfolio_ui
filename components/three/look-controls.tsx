"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useEffect } from "react"

import { look, LOOK_LIMITS, resetSpin } from "@/lib/three/look"
import { isInspecting, useLab } from "@/lib/three/store"

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const SPIN_PER_PX = 0.008
const LOOK_PER_PX = 0.0035
const KEY_STEP = 0.18

const typingInto = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/**
 * Mouse drag looks around the spline view (limited, springs back on release);
 * while something is inspected, drag/arrow keys orbit it and ctrl+wheel/pinch zooms.
 * Touch only orbits inside inspect mode so plain swipes keep scrolling the page.
 */
export function LookControls() {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const el = gl.domElement
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let lastX = 0
    let lastY = 0
    let pointerId: number | null = null

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      const inspecting = isInspecting(useLab.getState())
      if (e.pointerType === "touch" && !inspecting) return
      if (!inspecting && reduced) return
      pointerId = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      look.dragDistance = 0
      look.dragging = true
    }
    const move = (e: PointerEvent) => {
      if (!look.dragging || e.pointerId !== pointerId) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      look.dragDistance += Math.abs(dx) + Math.abs(dy)
      if (isInspecting(useLab.getState())) {
        look.spinYaw += dx * SPIN_PER_PX
        look.spinPitch = clamp(look.spinPitch + dy * SPIN_PER_PX, -LOOK_LIMITS.spinPitch, LOOK_LIMITS.spinPitch)
      } else {
        look.targetYaw = clamp(look.targetYaw - dx * LOOK_PER_PX, -LOOK_LIMITS.yaw, LOOK_LIMITS.yaw)
        look.targetPitch = clamp(look.targetPitch + dy * LOOK_PER_PX, -LOOK_LIMITS.pitch, LOOK_LIMITS.pitch)
      }
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      pointerId = null
      look.dragging = false
      look.targetYaw = 0
      look.targetPitch = 0
    }
    const wheel = (e: WheelEvent) => {
      // Trackpad pinch arrives as ctrl+wheel. Plain wheel keeps scrolling, which ends the inspect.
      if (!e.ctrlKey || !isInspecting(useLab.getState())) return
      e.preventDefault()
      e.stopPropagation()
      look.zoom = clamp(look.zoom * Math.exp(e.deltaY * 0.01), ...LOOK_LIMITS.zoom)
    }
    const key = (e: KeyboardEvent) => {
      if (typingInto(e.target)) return
      const state = useLab.getState()
      if (!isInspecting(state)) return
      if (e.key === "Escape") return state.release()
      const spin: Record<string, () => void> = {
        ArrowLeft: () => (look.spinYaw -= KEY_STEP),
        ArrowRight: () => (look.spinYaw += KEY_STEP),
        ArrowUp: () => (look.spinPitch = clamp(look.spinPitch - KEY_STEP, -LOOK_LIMITS.spinPitch, LOOK_LIMITS.spinPitch)),
        ArrowDown: () => (look.spinPitch = clamp(look.spinPitch + KEY_STEP, -LOOK_LIMITS.spinPitch, LOOK_LIMITS.spinPitch)),
        "+": () => (look.zoom = clamp(look.zoom * 0.9, ...LOOK_LIMITS.zoom)),
        "=": () => (look.zoom = clamp(look.zoom * 0.9, ...LOOK_LIMITS.zoom)),
        "-": () => (look.zoom = clamp(look.zoom * 1.1, ...LOOK_LIMITS.zoom)),
      }
      const action = spin[e.key]
      if (!action) return
      e.preventDefault()
      action()
    }

    el.addEventListener("pointerdown", down)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    el.addEventListener("wheel", wheel, { passive: false })
    window.addEventListener("keydown", key)
    const unsubscribe = useLab.subscribe((s, prev) => {
      if (s.inspectedSkill !== prev.inspectedSkill || s.focusedProject !== prev.focusedProject) resetSpin()
    })
    return () => {
      el.removeEventListener("pointerdown", down)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      el.removeEventListener("wheel", wheel)
      window.removeEventListener("keydown", key)
      unsubscribe()
    }
  }, [gl])

  useFrame((state) => {
    const el = state.gl.domElement
    const inspecting = isInspecting(useLab.getState())
    const cursor = look.dragging ? "grabbing" : look.hovering ? "pointer" : "grab"
    if (el.style.cursor !== cursor) el.style.cursor = cursor
    const touch = inspecting ? "none" : "pan-y"
    if (el.style.touchAction !== touch) el.style.touchAction = touch
  })

  return null
}
