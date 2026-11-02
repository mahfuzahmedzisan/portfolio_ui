"use client"

import { useLenis } from "lenis/react"
import dynamic from "next/dynamic"
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react"

import { audio } from "@/components/three/audio/audio-manager"
import type { ExperienceProps } from "@/components/three/experience"
import { detectCapability } from "@/lib/three/quality"
import { useLab } from "@/lib/three/store"

import { BootScreen } from "./boot-screen"
import { PosterBackdrop } from "./poster-backdrop"
import { StationRail } from "./station-rail"

const Experience = dynamic(() => import("@/components/three/experience"), { ssr: false })
const DebugTools = dynamic(() => import("@/components/three/debug-tools"), { ssr: false })

/** Maps scroll over #lab-track to store progress; ScrollTrigger follows Lenis' virtual scroll. */
function useScrollProgress() {
  const setProgress = useLab((s) => s.setProgress)
  const [trigger, setTrigger] = useState<{ update: () => void } | null>(null)

  useEffect(() => {
    let killed = false
    let cleanup = () => {}
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (killed) return
      gsap.registerPlugin(ScrollTrigger)
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
  }, [setProgress])

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

export function LabShell({ children, ...data }: ExperienceProps & { children: ReactNode }) {
  const mode = useLab((s) => s.mode)
  const debug = useSyncExternalStore(noSubscribe, readDebug, () => false)

  useCapability()
  useScrollProgress()
  useAudioSync()

  return (
    <div className="relative isolate min-h-svh bg-[#05070D] text-slate-100" data-render-mode={mode}>
      {mode === "webgl" ? <Experience {...data} debug={debug} /> : null}
      {mode === "fallback" ? <PosterBackdrop /> : null}
      {mode === "webgl" ? <BootScreen /> : null}
      <StationRail />
      {debug ? <DebugTools /> : null}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
