"use client"

import { AnimatePresence, m } from "motion/react"
import { useEffect, useState } from "react"

/** Cycles through short phrases; the first one is what server-rendered HTML and reduced motion see. */
export function RotatingText({ items, className }: { items: string[]; className?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), 2600)
    return () => window.clearInterval(id)
  }, [items.length])

  return (
    <span className={className}>
      <span className="sr-only">{items.join(", ")}</span>
      <span aria-hidden className="relative inline-block min-w-[14ch]">
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={items[index]}
            className="inline-block"
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35 }}
          >
            {items[index]}
          </m.span>
        </AnimatePresence>
      </span>
    </span>
  )
}
