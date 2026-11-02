"use client"

import { cn } from "cn"
import Link from "next/link"

import { STATIONS } from "@/lib/three/stations.config"
import { useLab } from "@/lib/three/store"

const chip =
  "rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-slate-300 backdrop-blur transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"

/** Status caption and back links. Section navigation lives in the floating nav. */
export function StationRail() {
  const station = useLab((s) => s.station)
  const scene = useLab((s) => s.scene)
  const journey = !scene || scene.kind === "journey"
  const active = STATIONS.find((s) => s.id === station) ?? STATIONS[0]

  return (
    <>
      <p
        aria-hidden
        className={cn(
          "pointer-events-none fixed top-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 font-mono text-[11px] tracking-wider text-slate-300 backdrop-blur",
        )}
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
    </>
  )
}
