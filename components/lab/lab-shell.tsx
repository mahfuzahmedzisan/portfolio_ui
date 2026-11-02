"use client"

import { useLenis } from "lenis/react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react"

import { audio } from "@/components/three/audio/audio-manager"
import type { ExperienceProps } from "@/components/three/experience"
import type { LabProject } from "@/content/lab/projects"
import { detectCapability } from "@/lib/three/quality"
import { useLab } from "@/lib/three/store"

import { CommandPalette } from "./command-palette"
import { FloatingNav } from "./floating-nav"
import { InspectHud } from "./inspect-hud"
import { Intro } from "./intro"
import { PosterBackdrop } from "./poster-backdrop"
import { StationRail } from "./station-rail"

const Experience = dynamic(() => import("@/components/three/experience"), { ssr: false })
const DebugTools = dynamic(() => import("@/components/three/debug-tools"), { ssr: false })

/**
 * Maps scroll over the current page's #lab-track to store progress; ScrollTrigger follows
 * Lenis' virtual scroll. Rebuilt per route because every page brings its own track.
 */
function useScrollProgress() {
  const setProgress = useLab((s) => s.setProgress)
  const pathname = usePathname()
  const lenis = useLenis()
  const [trigger, setTrigger] = useState<{ update: () => void } | null>(null)

  useEffect(() => {
    let killed = false
    let cleanup = () => {}
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true, force: true })
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (killed || !document.querySelector("#lab-track")) return
      gsap.registerPlugin(ScrollTrigger)
      ScrollTrigger.refresh()
      const st = ScrollTrigger.create({
        trigger: "#lab-track",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setProgress(self.progress),
      })
      setProgress(st.progress)
      setTrigger({ update: () => ScrollTrigger.update() })
      cleanup = () => st.kill()
    })
    return () => {
      killed = true
      cleanup()
    }
  }, [setProgress, pathname, lenis])

  useLenis(() => trigger?.update(), [trigger])
}

function useAudioSync() {
  useEffect(
    () =>
      useLab.subscribe((state, previous) => {
        if (state.sound !== previous.sound) {
          if (state.sound) void audio.enable()
          else audio.disable()
        }
        if (state.station !== previous.station) audio.setStation(state.station)
      }),
    [],
  )
}

function useCapability() {
  const setCapability = useLab((s) => s.setCapability)
  const enter = useLab((s) => s.enter)
  useEffect(() => {
    void detectCapability().then(({ mode, tier }) => {
      setCapability(mode, tier)
      // The poster fallback has nothing to load, so there is no boot screen to pass.
      if (mode === "fallback") enter(false)
    })
  }, [setCapability, enter])
}

const noSubscribe = () => () => {}
const readDebug = () => new URLSearchParams(window.location.search).has("debug")

/** Mounted once by the (lab) layout, so the canvas survives navigation between lab routes. */
export function LabShell({ children, archive, ...data }: ExperienceProps & { archive: LabProject[]; children: ReactNode }) {
  const mode = useLab((s) => s.mode)
  const debug = useSyncExternalStore(noSubscribe, readDebug, () => false)

  useCapability()
  useScrollProgress()
  useAudioSync()

  return (
    <div className="relative isolate min-h-svh bg-[#05070D] text-slate-100" data-render-mode={mode}>
      {mode === "webgl" ? <Experience {...data} debug={debug} /> : null}
      {mode === "fallback" ? <PosterBackdrop /> : null}
      {mode === "webgl" ? <Intro /> : null}
      <StationRail />
      <FloatingNav />
      {mode === "webgl" ? <InspectHud /> : null}
      <CommandPalette projects={archive} />
      {debug ? <DebugTools /> : null}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
