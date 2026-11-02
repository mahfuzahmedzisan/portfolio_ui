import { create } from "zustand"

import type { QualityTier, RenderMode } from "./quality"
import { stationAt, type StationId } from "./stations.config"

type LabState = {
  /** Raw scroll progress 0..1. Read with getState() inside useFrame, never as a render dependency. */
  progress: number
  station: StationId
  mode: RenderMode
  tier: QualityTier
  /** Asset loading percentage (0..100), reported from inside the canvas chunk. */
  loadProgress: number
  /** True once every GLB has loaded. */
  loaded: boolean
  /** True once the visitor has left the boot screen. */
  entered: boolean
  sound: boolean
  hoveredSkill: number | null
  focusedProject: string | null
  setProgress: (progress: number) => void
  setCapability: (mode: RenderMode, tier: QualityTier) => void
  setTier: (tier: QualityTier) => void
  setLoadProgress: (loadProgress: number) => void
  setLoaded: () => void
  enter: (sound: boolean) => void
  toggleSound: () => void
  hoverSkill: (id: number | null) => void
  focusProject: (slug: string | null) => void
}

export const useLab = create<LabState>((set, get) => ({
  progress: 0,
  station: "client",
  mode: "pending",
  tier: "medium",
  loadProgress: 0,
  loaded: false,
  entered: false,
  sound: false,
  hoveredSkill: null,
  focusedProject: null,
  setProgress: (progress) => {
    const station = stationAt(progress).id
    if (station === get().station) return set({ progress })
    // A focused crystal only makes sense while the vault is on screen.
    set({ progress, station, ...(station !== "vault" && { focusedProject: null }) })
  },
  setCapability: (mode, tier) => set({ mode, tier }),
  setTier: (tier) => set({ tier }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setLoaded: () => set({ loaded: true, loadProgress: 100 }),
  enter: (sound) => set({ entered: true, sound }),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  hoverSkill: (hoveredSkill) => set({ hoveredSkill }),
  focusProject: (focusedProject) => set({ focusedProject }),
}))
