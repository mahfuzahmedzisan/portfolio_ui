"use client"

import { cn } from "cn"

import { useLab } from "@/lib/three/store"
import { STATIONS } from "@/lib/three/stations.config"

/** Still renders of each station for reduced motion, low-end GPUs, no WebGL, or "3D off". */
export function PosterBackdrop() {
  const station = useLab((s) => s.station)

  return (
    <div aria-hidden className="fixed inset-0 z-0 bg-[#05070D]">
      {STATIONS.map((s) => (
        // eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed stills, swapped by opacity
        <img
          key={s.id}
          src={`/3d/posters/${s.id}.webp`}
          alt=""
          decoding="async"
          loading={s.index === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none",
            s.id === station ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05070D]/85 via-[#05070D]/30 to-transparent" />
    </div>
  )
}
