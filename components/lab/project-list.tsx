"use client"

import { AnimatePresence, m } from "motion/react"
import Link from "next/link"

import type { LabProject } from "@/content/lab/mock"
import { audio } from "@/components/three/audio/audio-manager"
import { useLab } from "@/lib/three/store"

/** Project records; "Query" dives the camera into the matching crystal. */
export function ProjectList({ projects }: { projects: LabProject[] }) {
  const focused = useLab((s) => s.focusedProject)
  const focusProject = useLab((s) => s.focusProject)
  const active = projects.find((p) => p.slug === focused)

  const query = (slug: string) => {
    const next = focused === slug ? null : slug
    focusProject(next)
    audio.play(next ? "chime" : "tick")
  }

  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {projects.map((project) => (
          <li key={project.slug}>
            <article className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm" style={{ borderLeftColor: project.accent_color, borderLeftWidth: 2 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium text-white">{project.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{project.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => query(project.slug)}
                  aria-pressed={focused === project.slug}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] text-slate-300 transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
                >
                  {focused === project.slug ? "close" : "query"}
                </button>
              </div>
              <p className="mt-3 font-mono text-[11px] text-slate-500">{project.stack.join(" · ")} · {project.year}</p>
            </article>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active ? (
          <m.div
            key={active.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="rounded-xl border border-emerald-300/30 bg-emerald-300/5 p-4 font-mono text-xs"
          >
            <p className="text-emerald-300">200 OK · 1 row</p>
            <p className="mt-1 text-slate-300">
              {"{"} id: {active.id}, slug: &quot;{active.slug}&quot;, year: {active.year} {"}"}
            </p>
            <Link href={active.path} className="mt-3 inline-block text-emerald-200 underline-offset-4 hover:underline">
              Open case study →
            </Link>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
