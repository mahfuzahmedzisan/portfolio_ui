import { create } from "zustand"

/** Live-tunable look values. Defaults are the shipped look; `?debug` exposes them in Leva. */
export type Tuning = {
  bloomIntensity: number
  bloomThreshold: number
  bloomRadius: number
  fogScale: number
  vignette: number
  noise: number
  chromatic: number
}

export const DEFAULT_TUNING: Tuning = {
  bloomIntensity: 1.15,
  bloomThreshold: 0.9,
  bloomRadius: 0.72,
  fogScale: 1,
  vignette: 0.78,
  noise: 0.16,
  chromatic: 0.0035,
}

export const useTuning = create<Tuning & { set: (patch: Partial<Tuning>) => void }>((set) => ({
  ...DEFAULT_TUNING,
  set: (patch) => set(patch),
}))
