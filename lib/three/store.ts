import { create } from "zustand"

import type { QualityTier, RenderMode } from "./quality"
import { stationAt, type StationId } from "./stations.config"

import type { LabCaseStudy, LabProject } from "@/content/lab/projects"
import { type ArchiveLayout, type ArchiveQuery, EMPTY_QUERY } from "@/lib/lab/archive"

/** What the persistent canvas is showing; set by each /lab page. */
export type LabScene =
  | { kind: "journey" }
  | { kind: "archive"; projects: LabProject[] }
  | { kind: "case"; study: LabCaseStudy; next: LabProject; previous: LabProject; related: LabProject[] }

export const sceneKey = (scene: LabScene | null) =>
  scene === null ? null : scene.kind === "case" ? `case:${scene.study.slug}` : scene.kind

/** Scrolling this far away from where an inspect started hands the camera back to the spline. */
const INSPECT_SCROLL_RELEASE = 0.025

type LabState = {
  scene: LabScene | null
  /** Key of the scene whose assets have finished loading (see `sceneKey`). */
  readyScene: string | null
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
  /** Skill artifact pulled in front of the camera. */
  inspectedSkill: number | null
  /** Last inspected skill; vault crystals built with it stay lit until cleared. */
  skillFilter: number | null
  focusedProject: string | null
  /** Scroll progress at the moment an inspect began. */
  inspectProgress: number
  archiveQuery: ArchiveQuery
  archiveLayout: ArchiveLayout
  /** Slug under the pointer in the archive (drives the hologram card). */
  hoveredProject: string | null
  setArchiveQuery: (query: Partial<ArchiveQuery>) => void
  setArchiveLayout: (layout: ArchiveLayout) => void
  setHoveredProject: (slug: string | null) => void
  setScene: (scene: LabScene) => void
  setReadyScene: (key: string) => void
  setProgress: (progress: number) => void
  setCapability: (mode: RenderMode, tier: QualityTier) => void
  setTier: (tier: QualityTier) => void
  setLoadProgress: (loadProgress: number) => void
  setLoaded: () => void
  enter: (sound: boolean) => void
  toggleSound: () => void
  hoverSkill: (id: number | null) => void
  inspectSkill: (id: number | null) => void
  setSkillFilter: (id: number | null) => void
  focusProject: (slug: string | null) => void
  /** Leaves any inspect mode (skill or project). */
  release: () => void
}

export const isInspecting = (s: Pick<LabState, "inspectedSkill" | "focusedProject">) =>
  s.inspectedSkill !== null || s.focusedProject !== null

export const useLab = create<LabState>((set, get) => ({
  scene: null,
  readyScene: null,
  setScene: (scene) => {
    if (sceneKey(scene) === sceneKey(get().scene)) return set({ scene })
    set({ scene, progress: 0, inspectedSkill: null, focusedProject: null, hoveredSkill: null, hoveredProject: null })
  },
  setReadyScene: (readyScene) => set({ readyScene }),
  archiveQuery: EMPTY_QUERY,
  archiveLayout: "helix",
  hoveredProject: null,
  setArchiveQuery: (query) => set((s) => ({ archiveQuery: { ...s.archiveQuery, ...query } })),
  setArchiveLayout: (archiveLayout) => set({ archiveLayout }),
  setHoveredProject: (hoveredProject) => set({ hoveredProject }),
  progress: 0,
  station: "client",
  mode: "pending",
  tier: "medium",
  loadProgress: 0,
  loaded: false,
  entered: false,
  sound: false,
  hoveredSkill: null,
  inspectedSkill: null,
  skillFilter: null,
  focusedProject: null,
  inspectProgress: 0,
  setProgress: (progress) => {
    const state = get()
    // Stations only exist on the journey; other scenes keep the last one for audio and the rail.
    const station = state.scene?.kind === "journey" ? stationAt(progress).id : state.station
    const released = isInspecting(state) && Math.abs(progress - state.inspectProgress) > INSPECT_SCROLL_RELEASE
    if (station === state.station && !released) return set({ progress })
    set({
      progress,
      station,
      ...(released && { inspectedSkill: null, focusedProject: null }),
      // A focused crystal only makes sense while the vault is on screen.
      ...(station !== "vault" && { focusedProject: null }),
      ...(station !== "engine" && { inspectedSkill: null }),
    })
  },
  setCapability: (mode, tier) => set({ mode, tier }),
  setTier: (tier) => set({ tier }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setLoaded: () => set({ loaded: true, loadProgress: 100 }),
  enter: (sound) => set({ entered: true, sound }),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  hoverSkill: (hoveredSkill) => set({ hoveredSkill }),
  inspectSkill: (inspectedSkill) =>
    set({
      inspectedSkill,
      focusedProject: null,
      inspectProgress: get().progress,
      ...(inspectedSkill !== null && { skillFilter: inspectedSkill }),
    }),
  setSkillFilter: (skillFilter) => set({ skillFilter }),
  focusProject: (focusedProject) => set({ focusedProject, inspectedSkill: null, inspectProgress: get().progress }),
  release: () => set({ inspectedSkill: null, focusedProject: null }),
}))

// Dev-only handle for e2e tests and debugging from the console.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") Object.assign(window, { __lab: useLab })
