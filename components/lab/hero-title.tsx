"use client"

import { useCallback, useEffect, useRef } from "react"

import { SplitText, type SplitTextResult } from "@/components/animations/text/split-text"
import { useLab } from "@/lib/three/store"

/** The name types itself in, character by character, once the visitor leaves the boot screen. */
export function HeroTitle({ children }: { children: string }) {
  const entered = useLab((s) => s.entered)
  const chars = useRef<HTMLElement[] | null>(null)

  const onSplit = useCallback((result: SplitTextResult) => {
    chars.current = result.chars
  }, [])

  useEffect(() => {
    const targets = chars.current
    if (!targets?.length) return
    let tween: { kill: () => void } | undefined
    void import("gsap").then(({ gsap }) => {
      if (!entered) {
        gsap.set(targets, { opacity: 0, yPercent: 60 })
        return
      }
      tween = gsap.fromTo(
        targets,
        { opacity: 0, yPercent: 60, filter: "blur(6px)" },
        { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", stagger: 0.035, delay: 0.5 },
      )
    })
    return () => tween?.kill()
  }, [entered])

  return (
    <SplitText as="h1" types={["chars"]} onSplit={onSplit} className="text-5xl font-semibold tracking-tight text-balance text-white md:text-7xl">
      {children}
    </SplitText>
  )
}
