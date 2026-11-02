"use client"

import { cn } from "cn"
import { AnimatePresence, m } from "motion/react"
import Link from "next/link"
import { type MouseEvent, useCallback, useEffect, useId, useRef, useState } from "react"

import { useScrollTo } from "@/components/animations/scroll/use-scroll-to"
import { detectCapability, SKIP_3D_KEY } from "@/lib/three/quality"
import { STATIONS } from "@/lib/three/stations.config"
import { useLab } from "@/lib/three/store"

const itemClass =
  "flex items-center justify-end gap-3 rounded-full border border-white/15 bg-black/55 py-2 pr-4 pl-3 font-mono text-[11px] tracking-wider whitespace-nowrap text-slate-200 backdrop-blur-md transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"

/**
 * Always-collapsed floating nav: one small orb on every section. Opening it fans the
 * destinations out beside the orb; picking one scrolls there and collapses it again.
 */
export function FloatingNav() {
  const [open, setOpen] = useState(false)
  const station = useLab((s) => s.station)
  const sound = useLab((s) => s.sound)
  const mode = useLab((s) => s.mode)
  const scene = useLab((s) => s.scene)
  const entered = useLab((s) => s.entered)
  const toggleSound = useLab((s) => s.toggleSound)
  const setCapability = useLab((s) => s.setCapability)
  const scrollTo = useScrollTo()
  const rootRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const journey = !scene || scene.kind === "journey"

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) orbRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true)
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer)
    }
  }, [open, close])

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!journey) return close() // Link navigates to /lab#id by itself.
    event.preventDefault()
    scrollTo(`#${id}`)
    history.replaceState(null, "", `#${id}`)
    close()
  }

  const toggle3d = async () => {
    if (mode === "webgl") {
      window.localStorage.setItem(SKIP_3D_KEY, "1")
      setCapability("fallback", "low")
      return
    }
    window.localStorage.setItem(SKIP_3D_KEY, "0")
    const next = await detectCapability()
    setCapability(next.mode, next.tier)
  }

  const items = STATIONS.map((s) => ({ ...s, current: journey && s.id === station }))

  return (
    <div
      ref={rootRef}
      // Hidden behind the intro; the orb appears with the scene.
      className={cn("fixed top-4 right-4 z-40 transition-opacity duration-500 md:top-6 md:right-6", entered ? "opacity-100" : "pointer-events-none opacity-0")}
    >
      <nav aria-label="Main" className="flex flex-col items-end gap-3">
        <button
          ref={orbRef}
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="group relative grid size-11 place-items-center rounded-full border border-cyan-300/40 bg-black/55 shadow-[0_0_24px_rgba(34,211,238,0.25)] backdrop-blur-md transition hover:border-cyan-200 hover:shadow-[0_0_32px_rgba(34,211,238,0.45)] focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        >
          <span className="relative block size-4" aria-hidden>
            <span
              className={cn(
                "absolute top-[3px] left-0 h-px w-4 bg-cyan-100 transition duration-300",
                open && "top-[7px] rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute top-[11px] left-0 h-px w-4 bg-cyan-100 transition duration-300",
                open && "top-[7px] -rotate-45",
              )}
            />
          </span>
        </button>

        <AnimatePresence>
          {open ? (
            <m.ul
              id={listId}
              key="items"
              className="flex flex-col items-end gap-2"
              initial="hidden"
              animate="shown"
              exit="hidden"
              variants={{ shown: { transition: { staggerChildren: 0.04 } }, hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } } }}
            >
              {items.map((s) => (
                <m.li
                  key={s.id}
                  variants={{ hidden: { opacity: 0, x: 14, scale: 0.92 }, shown: { opacity: 1, x: 0, scale: 1 } }}
                >
                  <Link
                    href={`/lab#${s.id}`}
                    onClick={(e) => jump(e, s.id)}
                    aria-current={s.current ? "location" : undefined}
                    className={cn(itemClass, s.current && "border-white/40 text-white")}
                  >
                    {s.label}
                    <span
                      aria-hidden
                      className="block size-2 rounded-full border"
                      style={{
                        borderColor: s.accent,
                        backgroundColor: s.current ? s.accent : "transparent",
                        boxShadow: s.current ? `0 0 10px ${s.accent}` : "none",
                      }}
                    />
                  </Link>
                </m.li>
              ))}
              <m.li variants={{ hidden: { opacity: 0, x: 14, scale: 0.92 }, shown: { opacity: 1, x: 0, scale: 1 } }}>
                <Link href="/lab/projects" onClick={() => close()} className={itemClass}>
                  All projects
                  <span aria-hidden className="block size-2 rounded-full border border-emerald-300" />
                </Link>
              </m.li>
              <m.li
                className="mt-1 flex gap-2"
                variants={{ hidden: { opacity: 0, x: 14, scale: 0.92 }, shown: { opacity: 1, x: 0, scale: 1 } }}
              >
                <button type="button" onClick={toggleSound} aria-pressed={sound} className={itemClass}>
                  Sound {sound ? "on" : "off"}
                </button>
                <button type="button" onClick={toggle3d} aria-pressed={mode === "webgl"} className={itemClass}>
                  3D {mode === "webgl" ? "on" : "off"}
                </button>
              </m.li>
            </m.ul>
          ) : null}
        </AnimatePresence>
      </nav>
    </div>
  )
}
