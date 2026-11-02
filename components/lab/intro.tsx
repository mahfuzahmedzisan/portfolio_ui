"use client"

import { useLenis } from "lenis/react"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useState } from "react"

import { profile } from "@/content/lab/mock"
import { SKIP_3D_KEY } from "@/lib/three/quality"
import { useLab } from "@/lib/three/store"

/** The intro never lingers: it leaves as soon as the assets are ready and this minimum has passed. */
const MIN_MS = 1400
const REDUCED_MIN_MS = 0

/**
 * Fast 2D intro. It only covers the time the GLBs need to load, then dismisses itself;
 * sound is opt-in later from the floating nav, so no click is required to enter.
 */
export function Intro() {
  const entered = useLab((s) => s.entered)
  const loaded = useLab((s) => s.loaded)
  const progress = useLab((s) => s.loadProgress)
  const enter = useLab((s) => s.enter)
  const setCapability = useLab((s) => s.setCapability)
  const lenis = useLenis()
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = window.setTimeout(() => setMinElapsed(true), reduced ? REDUCED_MIN_MS : MIN_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (loaded && minElapsed && !entered) enter(false)
  }, [loaded, minElapsed, entered, enter])

  useEffect(() => {
    if (!lenis) return
    if (entered) {
      lenis.start()
      return
    }
    lenis.stop()
    // Deep links (/lab#engine) land on their station behind the intro.
    const hash = window.location.hash
    if (hash.length > 1 && document.getElementById(hash.slice(1))) {
      lenis.scrollTo(hash, { immediate: true, force: true })
    }
  }, [lenis, entered])

  const skip3d = () => {
    window.localStorage.setItem(SKIP_3D_KEY, "1")
    setCapability("fallback", "low")
    enter(false)
  }

  const letters = Array.from(profile.name.toUpperCase())

  return (
    <AnimatePresence>
      {!entered ? (
        <m.div
          key="intro"
          role="dialog"
          aria-modal="true"
          aria-label="Loading"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070D] px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        >
          <h1 className="flex flex-wrap justify-center gap-x-[0.08em] text-[clamp(2rem,9vw,5.5rem)] leading-none font-semibold tracking-tight text-slate-100">
            {letters.map((char, i) => (
              <m.span
                key={`${char}-${i}`}
                aria-hidden={i > 0}
                className="inline-block whitespace-pre"
                initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.05 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {char}
              </m.span>
            ))}
          </h1>
          <m.p
            className="mt-4 font-mono text-xs tracking-[0.4em] text-cyan-300/80 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {profile.role}
          </m.p>

          <div
            role="progressbar"
            aria-label="Loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="mt-10 h-px w-48 overflow-hidden bg-white/10"
          >
            <div
              className="h-full bg-cyan-300 shadow-[0_0_12px_#22D3EE] transition-[width] duration-300"
              style={{ width: `${Math.max(6, Math.round(progress))}%` }}
            />
          </div>

          <div className="absolute bottom-6 flex gap-4 font-mono text-xs">
            <button
              type="button"
              onClick={() => enter(false)}
              className="rounded-full px-3 py-2 text-slate-400 underline-offset-4 transition hover:text-slate-100 hover:underline focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
            >
              Skip intro
            </button>
            <button
              type="button"
              onClick={skip3d}
              className="rounded-full px-3 py-2 text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            >
              Skip 3D
            </button>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}
