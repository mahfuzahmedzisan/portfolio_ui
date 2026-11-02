"use client"

import { cn } from "cn"

import type { Skill } from "@/content/lab/mock"
import { useLab } from "@/lib/three/store"

/**
 * The same skills as the orbiting pods. Hovering or focusing either one
 * highlights both, so the list is the keyboard and screen-reader path.
 */
export function SkillList({ skills }: { skills: Skill[] }) {
  const hovered = useLab((s) => s.hoveredSkill)
  const hoverSkill = useLab((s) => s.hoverSkill)
  const active = skills.find((s) => s.id === hovered)

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <li key={skill.id}>
            <button
              type="button"
              onMouseEnter={() => hoverSkill(skill.id)}
              onMouseLeave={() => hoverSkill(null)}
              onFocus={() => hoverSkill(skill.id)}
              onBlur={() => hoverSkill(null)}
              aria-describedby="skill-inspector"
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-xs transition focus-visible:outline-none",
                skill.id === hovered
                  ? "border-[#FF2D20] bg-[#FF2D20]/15 text-white shadow-[0_0_14px_#FF2D2066]"
                  : "border-white/15 text-slate-300 hover:border-white/30",
              )}
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
                <div className="h-full bg-[#FF2D20]" style={{ width: `${active.level}%` }} />
              </div>
              <span className="text-slate-400">{active.years}y</span>
            </div>
          </>
        ) : (
          <p className="text-slate-500">Hover a service pod or a skill to inspect it.</p>
        )}
      </div>
    </div>
  )
}
