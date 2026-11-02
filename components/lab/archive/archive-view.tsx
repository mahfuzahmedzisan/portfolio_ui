"use client"

import { cn } from "cn"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"

import type { LabProject } from "@/content/lab/projects"
import { CATEGORIES } from "@/content/lab/projects/constants"
import {
  type ArchiveLayout,
  fromSearchParams,
  LAYOUTS,
  matches,
  parseSql,
  sortProjects,
  toSearchParams,
  toSql,
} from "@/lib/lab/archive"
import { useLab } from "@/lib/three/store"

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-2.5 py-1 transition focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none",
    active ? "border-emerald-300/70 bg-emerald-300/15 text-emerald-100" : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200",
  )

const LAYOUT_LABEL: Record<ArchiveLayout, string> = { helix: "Helix", timeline: "Timeline", constellation: "Constellation", grid: "Grid" }

/** Keeps the store's query and layout in step with `?stack=&category=&q=&sort=&layout=`. */
function useUrlSync(stacks: string[]) {
  const params = useSearchParams()
  const pathname = usePathname()
  const query = useLab((s) => s.archiveQuery)
  const layout = useLab((s) => s.archiveLayout)
  const search = params.toString()
  /** The search string both sides last agreed on; null until the URL has been read once. */
  const synced = useRef<string | null>(null)

  useEffect(() => {
    const next = fromSearchParams(new URLSearchParams(search), stacks)
    synced.current = toSearchParams(next.query, next.layout)
    const { archiveQuery, archiveLayout, setArchiveQuery, setArchiveLayout } = useLab.getState()
    if (synced.current === toSearchParams(archiveQuery, archiveLayout)) return
    setArchiveQuery(next.query)
    setArchiveLayout(next.layout)
  }, [search, stacks])

  useEffect(() => {
    // Live state, not this render's values: on mount the effect above has just replaced them.
    const { archiveQuery, archiveLayout } = useLab.getState()
    const target = toSearchParams(archiveQuery, archiveLayout)
    if (synced.current === null || target === synced.current) return
    synced.current = target
    window.history.replaceState(null, "", `${pathname}${target}${window.location.hash}`)
  }, [query, layout, pathname])
}

function QueryBar({ stacks }: { stacks: string[] }) {
  const query = useLab((s) => s.archiveQuery)
  const setArchiveQuery = useLab((s) => s.setArchiveQuery)
  const sql = toSql(query)
  const [draft, setDraft] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const run = (event: FormEvent) => {
    event.preventDefault()
    if (draft === null) return
    const parsed = parseSql(draft, stacks)
    setErrors(parsed.errors)
    setArchiveQuery(parsed.query)
    setDraft(null)
  }

  return (
    <form onSubmit={run} className="w-full">
      <label htmlFor="archive-query" className="sr-only">
        Project query
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-[#05070D]/75 px-3 py-2 font-mono text-xs backdrop-blur-md focus-within:border-emerald-300/70">
        <span aria-hidden className="text-emerald-300">
          ❯
        </span>
        <input
          id="archive-query"
          value={draft ?? sql}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDraft(null)
          }}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-emerald-50 outline-none"
        />
        <button type="submit" className="rounded-md border border-emerald-300/40 px-2 py-0.5 text-emerald-200 hover:bg-emerald-300/10" onMouseDown={(e) => e.preventDefault()}>
          run
        </button>
      </div>
      {errors.length ? (
        <p role="status" className="mt-1.5 font-mono text-[11px] text-amber-300">
          ignored: {errors.join(", ")}
        </p>
      ) : null}
    </form>
  )
}

function Filters({ stacks }: { stacks: string[] }) {
  const query = useLab((s) => s.archiveQuery)
  const layout = useLab((s) => s.archiveLayout)
  const setArchiveQuery = useLab((s) => s.setArchiveQuery)
  const setArchiveLayout = useLab((s) => s.setArchiveLayout)

  return (
    <div className="mt-3 space-y-2 font-mono text-[11px]">
      <div role="group" aria-label="Technology" className="flex flex-wrap gap-1.5">
        {stacks.map((s) => (
          <button key={s} type="button" aria-pressed={query.stack === s} onClick={() => setArchiveQuery({ stack: query.stack === s ? null : s })} className={chip(query.stack === s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={query.category === c} onClick={() => setArchiveQuery({ category: query.category === c ? null : c })} className={chip(query.category === c)}>
              {c}
            </button>
          ))}
        </div>
        <span aria-hidden className="mx-1 h-4 w-px bg-white/10" />
        <div role="group" aria-label="Layout" className="flex flex-wrap gap-1.5">
          {LAYOUTS.map((l) => (
            <button key={l} type="button" aria-pressed={layout === l} onClick={() => setArchiveLayout(l)} className={chip(layout === l)}>
              {LAYOUT_LABEL[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Results({ projects }: { projects: LabProject[] }) {
  const query = useLab((s) => s.archiveQuery)
  const mode = useLab((s) => s.mode)
  const hovered = useLab((s) => s.hoveredProject)
  const setHoveredProject = useLab((s) => s.setHoveredProject)
  const focusProject = useLab((s) => s.focusProject)
  const setArchiveQuery = useLab((s) => s.setArchiveQuery)
  const rows = useMemo(() => sortProjects(projects, query.sort).filter((p) => matches(p, query)), [projects, query])

  return (
    <section aria-labelledby="archive-results" className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#05070D]/70 p-4 backdrop-blur-md">
      <h2 id="archive-results" className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">
        <span className="text-emerald-300">{rows.length}</span> row{rows.length === 1 ? "" : "s"} · {projects.length} total
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">
          No project matches.{" "}
          <button type="button" className="text-emerald-300 underline-offset-2 hover:underline" onClick={() => setArchiveQuery({ stack: null, category: null, search: "" })}>
            Clear filters
          </button>
        </p>
      ) : (
        <ol className="mt-2 max-h-[30svh] space-y-1 overflow-y-auto pr-1" data-lenis-prevent>
          {rows.map((p) => (
            <li key={p.slug} onMouseEnter={() => setHoveredProject(p.slug)} onMouseLeave={() => setHoveredProject(null)} className="group flex items-center gap-2">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p.accent_color, boxShadow: hovered === p.slug ? `0 0 10px ${p.accent_color}` : "none" }} />
              <Link href={p.path} className="min-w-0 flex-1 rounded px-1 py-1 text-sm text-slate-200 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none">
                <span className="block truncate">{p.title}</span>
                <span className="block truncate font-mono text-[10px] text-slate-500">
                  {p.year} · {p.category} · {p.stack.slice(0, 3).join(" · ")}
                </span>
              </Link>
              {mode === "webgl" ? (
                <button
                  type="button"
                  onClick={() => focusProject(p.slug)}
                  className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 opacity-60 transition group-hover:opacity-100 hover:border-emerald-300/50 hover:text-emerald-200 focus-visible:opacity-100"
                  aria-label={`Inspect ${p.title} in 3D`}
                >
                  inspect
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function ResultsUnlessInspecting({ projects }: { projects: LabProject[] }) {
  const inspecting = useLab((s) => s.focusedProject !== null)
  // The panel would sit over the crystal the camera has just framed.
  return inspecting ? <span /> : <Results projects={projects} />
}

function InspectPanel({ projects }: { projects: LabProject[] }) {
  const focused = useLab((s) => s.focusedProject)
  const release = useLab((s) => s.release)
  const project = projects.find((p) => p.slug === focused)
  if (!project) return null
  return (
    <aside aria-live="polite" className="pointer-events-auto w-full max-w-sm rounded-2xl border bg-[#05070D]/75 p-5 backdrop-blur-md" style={{ borderColor: `${project.accent_color}55` }}>
      <p className="font-mono text-[11px] tracking-widest uppercase" style={{ color: project.accent_color }}>
        {project.category} · {project.year}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{project.title}</h2>
      <p className="mt-2 text-sm text-slate-300">{project.summary}</p>
      <p className="mt-3 font-mono text-[11px] text-slate-500">{project.stack.join(" · ")}</p>
      <div className="mt-4 flex gap-2 font-mono text-xs">
        <Link
          href={project.path}
          className="rounded-full border px-4 py-2 text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
          style={{ borderColor: project.accent_color }}
        >
          Enter case study →
        </Link>
        <button type="button" onClick={release} className="rounded-full border border-white/15 px-4 py-2 text-slate-300 hover:border-white/30">
          Close
        </button>
      </div>
    </aside>
  )
}

/** Everything on /lab/projects that is not the canvas. Also the complete fallback without WebGL. */
export function ArchiveView({ projects, stacks }: { projects: LabProject[]; stacks: string[] }) {
  useUrlSync(stacks)
  return (
    <div className="pointer-events-none sticky top-0 flex h-svh flex-col px-4 pt-16 pb-6 md:px-16 md:pt-16">
      <div className="pointer-events-auto max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.3em] text-emerald-300 uppercase">Archive · every project, queryable</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">The Archive</h1>
        <div className="mt-4">
          <QueryBar stacks={stacks} />
          <Filters stacks={stacks} />
        </div>
      </div>
      <div className="mt-auto flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <ResultsUnlessInspecting projects={projects} />
        <InspectPanel projects={projects} />
      </div>
    </div>
  )
}
