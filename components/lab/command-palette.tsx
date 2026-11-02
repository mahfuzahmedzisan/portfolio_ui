"use client"

import { cn } from "cn"
import { AnimatePresence, m } from "motion/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useMemo, useRef, useState } from "react"

import type { LabProject } from "@/content/lab/projects"
import { LAYOUTS, stackIndex } from "@/lib/lab/archive"
import { useLab } from "@/lib/three/store"

type Command = { id: string; group: string; label: string; hint?: string; run: () => void }

const ARCHIVE = "/lab/projects"

function useCommands(projects: LabProject[], close: () => void): Command[] {
  const router = useRouter()
  const pathname = usePathname()
  return useMemo(() => {
    const go = (href: string) => () => {
      close()
      router.push(href)
    }
    const onArchive = pathname === ARCHIVE
    const filter = (key: string, value: string) => () => {
      close()
      if (onArchive && key === "stack") useLab.getState().setArchiveQuery({ stack: value })
      else router.push(`${ARCHIVE}?${key}=${encodeURIComponent(value)}`)
    }
    return [
      { id: "nav-journey", group: "Go to", label: "The journey", hint: "/lab", run: go("/lab") },
      { id: "nav-archive", group: "Go to", label: "The archive", hint: ARCHIVE, run: go(ARCHIVE) },
      { id: "nav-contact", group: "Go to", label: "Contact (Response)", hint: "/lab#response", run: go("/lab#response") },
      ...projects.map((p) => ({ id: `p-${p.slug}`, group: "Projects", label: p.title, hint: `${p.year} · ${p.stack[0]}`, run: go(p.path) })),
      ...stackIndex(projects).map((s) => ({ id: `s-${s}`, group: "Filter by stack", label: s, hint: `stack @> '${s}'`, run: filter("stack", s) })),
      ...LAYOUTS.map((l) => ({
        id: `l-${l}`,
        group: "Archive layout",
        label: l[0].toUpperCase() + l.slice(1),
        run: onArchive
          ? () => {
              close()
              useLab.getState().setArchiveLayout(l)
            }
          : filter("layout", l),
      })),
    ]
  }, [projects, router, pathname, close])
}

/** Ctrl/Cmd+K anywhere in the lab: jump to any project, filter the archive or switch its layout. */
export function CommandPalette({ projects }: { projects: LabProject[] }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const restore = useRef<HTMLElement | null>(null)
  const listId = useId()

  const close = useMemo(
    () => () => {
      setOpen(false)
      setText("")
      setActive(0)
      restore.current?.focus()
    },
    [],
  )
  const commands = useCommands(projects, close)
  const needle = text.trim().toLowerCase()
  const shown = needle ? commands.filter((c) => `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(needle)) : commands

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => {
          if (!o) restore.current = document.activeElement as HTMLElement | null
          return !o
        })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // Keep Esc from also releasing an inspected object behind the palette.
      e.nativeEvent.stopImmediatePropagation()
      close()
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      e.nativeEvent.stopImmediatePropagation()
      const step = e.key === "ArrowDown" ? 1 : -1
      setActive((a) => (a + step + shown.length) % Math.max(shown.length, 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      shown[active]?.run()
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          key="palette"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[14svh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#070a12]/95 font-mono text-sm shadow-2xl"
            initial={{ y: -12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span aria-hidden className="text-cyan-300">
                ❯
              </span>
              <input
                ref={input}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setActive(0)
                }}
                placeholder="Jump to a project, filter, layout…"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={shown[active] ? `${listId}-${shown[active].id}` : undefined}
                className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
              />
              <kbd className="rounded border border-white/15 px-1.5 text-[10px] text-slate-500">esc</kbd>
            </div>
            <ul id={listId} role="listbox" className="max-h-[50svh] overflow-y-auto py-2" data-lenis-prevent>
              {shown.length === 0 ? <li className="px-4 py-3 text-slate-500">No match.</li> : null}
              {shown.map((c, i) => {
                const header = i === 0 || shown[i - 1].group !== c.group ? c.group : null
                return (
                  <li key={c.id} role="presentation">
                    {header ? <p className="px-4 pt-2 pb-1 text-[10px] tracking-widest text-slate-500 uppercase">{header}</p> : null}
                    <div
                      id={`${listId}-${c.id}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={c.run}
                      className={cn("mx-2 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2", i === active ? "bg-cyan-300/10 text-white" : "text-slate-300")}
                    >
                      <span>{c.label}</span>
                      {c.hint ? <span className="text-[11px] text-slate-500">{c.hint}</span> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}
