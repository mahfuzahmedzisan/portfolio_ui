"use client"

import { AnimatePresence, m } from "motion/react"
import { useEffect, useState } from "react"

import { isInspecting, useLab } from "@/lib/three/store"

const HINT_KEY = "the-request:look-hint"
const chip =
  "pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/50 px-4 py-1.5 font-mono text-[11px] text-slate-300 backdrop-blur"

/** Inspect-mode controls, plus a one-time "drag to look" hint for mouse users. */
export function InspectHud() {
  const inspecting = useLab(isInspecting)
  const entered = useLab((s) => s.entered)
  const mode = useLab((s) => s.mode)
  const release = useLab((s) => s.release)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    if (!entered || mode !== "webgl") return
    if (!window.matchMedia("(pointer: fine)").matches || window.localStorage.getItem(HINT_KEY)) return
    window.localStorage.setItem(HINT_KEY, "1")
    const show = window.setTimeout(() => setHint(true), 1200)
    const hide = window.setTimeout(() => setHint(false), 6500)
    const dismiss = () => setHint(false)
    window.addEventListener("pointerdown", dismiss, { once: true })
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
      window.removeEventListener("pointerdown", dismiss)
    }
  }, [entered, mode])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-30 flex justify-center md:bottom-5">
      <AnimatePresence mode="wait">
        {inspecting ? (
          <m.div key="inspect" className={chip} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <span>
              <span className="hidden md:inline">drag to orbit · ctrl+scroll to zoom · esc to close</span>
              <span className="md:hidden">drag to orbit</span>
            </span>
            <button
              type="button"
              onClick={release}
              className="rounded-full border border-white/15 px-2 py-0.5 text-slate-200 transition hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            >
              close
            </button>
          </m.div>
        ) : hint ? (
          <m.p key="hint" aria-hidden className={chip} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            drag anywhere to look around
          </m.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
