import type { Metadata } from "next"
import { JetBrains_Mono, Space_Grotesk } from "next/font/google"
import type { ReactNode } from "react"

const display = Space_Grotesk({ variable: "--font-sans", subsets: ["latin"] })
const mono = JetBrains_Mono({ variable: "--font-lab-mono", subsets: ["latin"] })

/** Prototype space: kept out of search results and the sitemap until it replaces `/`. */
export const metadata: Metadata = {
  title: "Lab · The Request",
  robots: { index: false, follow: false },
}

export default function LabLayout({ children }: { children: ReactNode }) {
  // `font-mono` is inlined by the global theme, so the lab font is applied by descendant selector.
  return (
    <div className={`${display.variable} ${mono.variable} dark flex-1 font-sans [&_.font-mono]:[font-family:var(--font-lab-mono)]`}>
      {children}
    </div>
  )
}
