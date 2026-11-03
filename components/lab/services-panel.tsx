"use client"

import { cn } from "cn"

import { audio } from "@/components/three/audio/audio-manager"
import { type LabService } from "@/content/lab/services"
import { useLab } from "@/lib/three/store"

/**
 * Details for the service card the visitor is on. Picking a card in 3D or a button here is the same
 * state; every service stays in the DOM so the content reads without JavaScript or WebGL.
 */
export function ServicesPanel({ services }: { services: LabService[] }) {
  const active = useLab((s) => s.activeService)
  const setActive = useLab((s) => s.setActiveService)

  return (
    <div>
      <ul className="flex flex-wrap gap-2" aria-label="Services">
        {services.map((service, i) => (
          <li key={service.id}>
            <button
              type="button"
              aria-pressed={i === active}
              onClick={() => {
                setActive(i)
                audio.play("card")
              }}
              onMouseEnter={() => audio.play("tick")}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wide transition focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:outline-none",
                i === active ? "text-white" : "border-white/15 text-slate-400 hover:border-white/35 hover:text-slate-200",
              )}
              style={i === active ? { borderColor: service.accent, background: `${service.accent}22` } : undefined}
            >
              {service.short}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5" aria-live="polite">
        {services.map((service, i) => (
          <article key={service.id} hidden={i !== active} aria-labelledby={`svc-${service.id}`}>
            <h3 id={`svc-${service.id}`} className="text-xl font-semibold text-white">
              {service.title}
            </h3>
            <p className="mt-2 text-sm text-slate-300">{service.summary}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
              {service.deliverables.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: service.accent }} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex flex-wrap gap-1.5">
              {service.stack.map((tech) => (
                <span key={tech} className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                  {tech}
                </span>
              ))}
            </p>
            <p className="mt-4 font-mono text-[11px] text-slate-500">
              Typical timeline <span className="text-slate-300">{service.timeline}</span>
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
