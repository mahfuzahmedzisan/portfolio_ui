"use client"

import { cn } from "cn"
import { useLenis } from "lenis/react"

import type { LabProject, Skill } from "@/content/lab/mock"
import { audio } from "@/components/three/audio/audio-manager"
import { useLab } from "@/lib/three/store"

/**
 * The same skills as the orbiting artifacts. Hovering either one previews it;
 * clicking pins it in front of the camera. The list is the keyboard and screen-reader path.
 */
export function SkillList({ skills, projects }: { skills: Skill[]; projects: LabProject[] }) {
  const hovered = useLab((s) => s.hoveredSkill)
  const inspected = useLab((s) => s.inspectedSkill)
  const hoverSkill = useLab((s) => s.hoverSkill)
  const inspectSkill = useLab((s) => s.inspectSkill)
  const focusProject = useLab((s) => s.focusProject)
  const lenis = useLenis()
  const active = skills.find((s) => s.id === (inspected ?? hovered))
  const usedIn = active ? projects.filter((p) => p.stack.includes(active.name)) : []

  const toggle = (id: number) => {
    const next = inspected === id ? null : id
    inspectSkill(next)
    audio.play(next ? "chime" : "tick")
  }

  const openInVault = (slug: string) => {
    inspectSkill(null)
    const focus = () => focusProject(slug)
    if (lenis) lenis.scrollTo("#vault", { onComplete: focus })
    else {
      document.getElementById("vault")?.scrollIntoView()
      focus()
    }
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <li key={skill.id}>
            <button
              type="button"
              onClick={() => toggle(skill.id)}
              onMouseEnter={() => hoverSkill(skill.id)}
              onMouseLeave={() => hoverSkill(null)}
              onFocus={() => hoverSkill(skill.id)}
              onBlur={() => hoverSkill(null)}
              aria-pressed={inspected === skill.id}
              aria-describedby="skill-inspector"
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-xs transition focus-visible:outline-none",
                skill.id === inspected || skill.id === hovered
                  ? "text-white"
                  : "border-white/15 text-slate-300 hover:border-white/30",
              )}
              style={
                skill.id === inspected || skill.id === hovered
                  ? { borderColor: skill.color, backgroundColor: `${skill.color}26`, boxShadow: `0 0 14px ${skill.color}66` }
                  : undefined
              }
            >
              {skill.name}
            </button>
          </li>
        ))}
      </ul>
      <div id="skill-inspector" aria-live="polite" className="mt-5 min-h-24 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs">
        {active ? (
          <>
            <p className="text-sm text-white">
              {active.name} <span className="text-slate-500">· {active.group}</span>
            </p>
            <p className="mt-1 text-slate-400">{active.summary}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded bg-white/10">
                <div className="h-full" style={{ width: `${active.level}%`, backgroundColor: active.color }} />
              </div>
              <span className="text-slate-400">{active.years}y</span>
            </div>
            {inspected === active.id ? (
              <div className="mt-4">
                <p className="text-slate-500">
                  SELECT * FROM projects WHERE stack @&gt; &apos;{active.name}&apos; · {usedIn.length} {usedIn.length === 1 ? "row" : "rows"}
                </p>
                {usedIn.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {usedIn.map((p) => (
                      <li key={p.slug}>
                        <button
                          type="button"
                          onClick={() => openInVault(p.slug)}
                          className="rounded border border-white/15 px-2 py-1 text-slate-200 transition hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                          style={{ borderLeftColor: p.accent_color, borderLeftWidth: 2 }}
                        >
                          {p.title} →
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-slate-500">Hover an artifact to preview it, click to pull it closer.</p>
        )}
      </div>
    </div>
  )
}
