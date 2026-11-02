import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { ArchiveView } from "@/components/lab/archive/archive-view"
import { SetScene } from "@/components/lab/set-scene"
import { allProjects } from "@/content/lab/projects"
import { stackIndex } from "@/lib/lab/archive"

export const metadata: Metadata = {
  title: "Archive · The Request",
  description: "Every project, as a queryable archive of crystals.",
}

const stacks = stackIndex(allProjects)

/** Shown while search params resolve, and the plain list for crawlers. */
function StaticList() {
  return (
    <div className="sticky top-0 flex h-svh flex-col px-4 pt-16 md:px-16 md:pt-20">
      <h1 className="text-3xl font-semibold text-white md:text-4xl">The Archive</h1>
      <ol className="mt-6 space-y-2">
        {allProjects.map((p) => (
          <li key={p.slug}>
            <Link href={p.path} className="text-slate-300 hover:text-white">
              {p.title} <span className="font-mono text-xs text-slate-500">· {p.year}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function ArchivePage() {
  return (
    <>
      <SetScene scene={{ kind: "archive", projects: allProjects }} />
      {/* The track height is the scroll distance of the camera sweep around the layout. */}
      <main id="lab-track" className="relative h-[260svh]">
        <Suspense fallback={<StaticList />}>
          <ArchiveView projects={allProjects} stacks={stacks} />
        </Suspense>
      </main>
    </>
  )
}
