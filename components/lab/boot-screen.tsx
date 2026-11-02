"use client"

import { useLenis } from "lenis/react"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useRef } from "react"

import { SKIP_3D_KEY } from "@/lib/three/quality"
import { useLab } from "@/lib/three/store"

const LINES = [
  "> resolve mahfuz.dev ........ 76.76.21.21",
  "> SYN →",
  "> ← SYN-ACK",
  "> ACK →  connection established",
  "> TLS 1.3 handshake ......... ok",
  "> GET /mahfuz-ahmed HTTP/2",
]

/** "Establishing connection": the TCP handshake doubles as the asset loading bar. */
export function BootScreen() {
  const entered = useLab((s) => s.entered)
  const loaded = useLab((s) => s.loaded)
  const progress = useLab((s) => s.loadProgress)
  const enter = useLab((s) => s.enter)
  const setCapability = useLab((s) => s.setCapability)
  const lenis = useLenis()

  const skip3d = () => {
    window.localStorage.setItem(SKIP_3D_KEY, "1")
    setCapability("fallback", "low")
    enter(false)
  }
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!lenis) return
    if (entered) {
      lenis.start()
      return
    }
    lenis.stop()
    // Deep links (/lab#engine) land on their station behind the boot screen.
    const hash = window.location.hash
    if (hash.length > 1 && document.getElementById(hash.slice(1))) {
      lenis.scrollTo(hash, { immediate: true, force: true })
    }
  }, [lenis, entered])

  useEffect(() => {
    if (loaded) primary.current?.focus()
  }, [loaded])

  const shown = Math.max(1, Math.ceil((progress / 100) * LINES.length))

  return (
    <AnimatePresence>
      {!entered ? (
        <m.div
          key="boot"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boot-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070D]/92 px-6 backdrop-blur-sm"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
        >
          <div className="w-full max-w-xl font-mono text-sm">
            <p id="boot-title" className="mb-6 text-xs tracking-[0.4em] text-cyan-300/80 uppercase">
              Establishing connection
            </p>
            <ol className="space-y-1.5 text-slate-300" aria-live="polite">
              {LINES.slice(0, shown).map((line) => (
                <m.li key={line} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                  {line}
                </m.li>
              ))}
            </ol>
            <div className="mt-8 h-px w-full overflow-hidden bg-white/10" aria-hidden>
              <div
                className="h-full bg-cyan-300 shadow-[0_0_12px_#22D3EE] transition-[width] duration-300"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500" aria-hidden>
              {loaded ? "200 OK · payload ready" : `loading payload ${Math.round(progress)}%`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                ref={primary}
                type="button"
                disabled={!loaded}
                onClick={() => enter(true)}
                className="rounded-full border border-cyan-300/60 bg-cyan-300/10 px-5 py-2.5 text-cyan-100 transition hover:bg-cyan-300/20 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none disabled:opacity-40"
              >
                Send request · sound on
              </button>
              <button
                type="button"
                disabled={!loaded}
                onClick={() => enter(false)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-slate-300 transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none disabled:opacity-40"
              >
                Enter silently
              </button>
              <button
                type="button"
                onClick={skip3d}
                className="rounded-full px-3 py-2.5 text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                Skip 3D
              </button>
            </div>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}
