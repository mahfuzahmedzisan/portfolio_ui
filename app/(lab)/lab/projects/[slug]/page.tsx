import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SetScene } from "@/components/lab/set-scene"
import { caseStudies, getCaseStudy, neighbours, related } from "@/content/lab/projects"

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return caseStudies.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug)
  return study ? { title: `${study.title} · The Request`, description: study.summary } : {}
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()
  const { next, previous } = neighbours(slug)

  return (
    <>
      <SetScene scene={{ kind: "case", study, next, previous, related: related(slug) }} />
      <main id="lab-track" className="relative h-[400svh] px-6 pt-28 md:px-16">
        <h1 className="text-4xl font-semibold text-white">{study.title}</h1>
        <p className="mt-3 text-slate-400">{study.subtitle}</p>
      </main>
    </>
  )
}
