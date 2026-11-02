"use client"

import { cn } from "cn"
import Link from "next/link"
import type { MouseEvent } from "react"

import { useScrollTo } from "@/components/animations/scroll/use-scroll-to"
import { detectCapability, SKIP_3D_KEY } from "@/lib/three/quality"
import { useLab } from "@/lib/three/store"
import { STATIONS } from "@/lib/three/stations.config"

const chip =
  "rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-slate-300 backdrop-blur transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"

export function StationRail() {
  const station = useLab((s) => s.station)
  const sound = useLab((s) => s.sound)
  const mode = useLab((s) => s.mode)
  const toggleSound = useLab((s) => s.toggleSound)
  const setCapability = useLab((s) => s.setCapability)
  const scene = useLab((s) => s.scene)
  const journey = !scene || scene.kind === "journey"
  const scrollTo = useScrollTo()
  const active = STATIONS.find((s) => s.id === station) ?? STATIONS[0]

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollTo(`#${id}`)
    history.replaceState(null, "", `#${id}`)
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

  return (
    <>
      <p
        aria-hidden
        className="pointer-events-none fixed top-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 font-mono text-[11px] tracking-wider text-slate-300 backdrop-blur"
      >
        {scene?.kind === "case" ? (
          <>
            <span style={{ color: scene.study.accent_color }}>●</span> GET /projects/{scene.study.slug}
          </>
        ) : scene?.kind === "archive" ? (
          <>
            <span className="text-emerald-300">●</span> SELECT * FROM projects
          </>
        ) : (
          <>
            <span style={{ color: active.accent }}>●</span> {active.code}
          </>
        )}
      </p>

      {journey ? null : (
        <nav aria-label="Lab" className="fixed top-4 left-4 z-30 flex gap-2 font-mono text-[11px] md:left-6">
          <Link href="/lab" className={chip}>
            ← journey
          </Link>
          {scene.kind === "case" ? (
            <Link href="/lab/projects" className={chip}>
              archive
            </Link>
          ) : null}
        </nav>
      )}

      <nav aria-label="Stations" hidden={!journey} className="fixed top-1/2 right-4 z-30 -translate-y-1/2 md:right-6">
        <ol className="flex flex-col gap-4">
          {STATIONS.map((s) => {
            const current = s.id === station
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => jump(e, s.id)}
                  aria-current={current ? "step" : undefined}
                  className="group flex items-center justify-end gap-3 rounded-full focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "sr-only font-mono text-[11px] tracking-wider transition md:not-sr-only",
                      current ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300",
                    )}
                  >
                    {String(s.index + 1).padStart(2, "0")} {s.label}
                  </span>
                  <span
                    className="block size-2.5 rounded-full border transition"
                    style={{
                      borderColor: s.accent,
                      backgroundColor: current ? s.accent : "transparent",
                      boxShadow: current ? `0 0 12px ${s.accent}` : "none",
                    }}
                  />
                </a>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="fixed right-4 bottom-4 z-30 flex gap-2 font-mono text-[11px] md:right-6">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-slate-300 backdrop-blur transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        >
          Sound {sound ? "on" : "off"}
        </button>
        <button
          type="button"
          onClick={toggle3d}
          aria-pressed={mode === "webgl"}
          className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-slate-300 backdrop-blur transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        >
          3D {mode === "webgl" ? "on" : "off"}
        </button>
      </div>
    </>
  )
}
