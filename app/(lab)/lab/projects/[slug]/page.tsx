import type { Metadata } from "next"
import { notFound } from "next/navigation"

import Link from "next/link"

import { CaseBlocks } from "@/components/lab/case-blocks"
import { SetScene } from "@/components/lab/set-scene"
import { caseStudies, getCaseStudy, neighbours, projectPath, related } from "@/content/lab/projects"

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
      <main id="lab-track" className="pointer-events-none relative px-6 pt-28 pb-32 md:px-16">
        <div className="max-w-xl">
          <header className="pointer-events-auto min-h-[70svh]">
            <p className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: study.accent_color }}>
              {study.category} · {study.year}
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">{study.title}</h1>
            <p className="mt-3 text-lg text-slate-300">{study.subtitle}</p>
            <p className="mt-4 text-slate-400">{study.summary}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs">
              {[
                ["role", study.role],
                ["duration", study.duration],
                ["client", study.client ?? "Personal project"],
                ["stack", study.stack.join(" · ")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-white/10 bg-[#05070D]/60 p-3 backdrop-blur-md">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="mt-1 text-slate-200">{v}</dd>
                </div>
              ))}
            </dl>
            {study.live_url || study.source_url ? (
              <p className="mt-5 flex flex-wrap gap-3 font-mono text-sm">
                {study.live_url ? (
                  <a href={study.live_url} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-1.5 text-white hover:bg-white/10" style={{ borderColor: study.accent_color }}>
                    Live site ↗
                  </a>
                ) : null}
                {study.source_url ? (
                  <a href={study.source_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-4 py-1.5 text-slate-200 hover:bg-white/10">
                    Source ↗
                  </a>
                ) : null}
              </p>
            ) : null}
          </header>

          <CaseBlocks study={study} />

          <nav aria-label="More projects" className="pointer-events-auto mt-16 grid gap-3 font-mono text-sm sm:grid-cols-2">
            <Link href={projectPath(previous.slug)} className="rounded-xl border border-white/10 bg-[#05070D]/65 p-4 backdrop-blur-md hover:border-white/30">
              <span className="text-xs text-slate-500">← Previous</span>
              <span className="mt-1 block text-slate-100">{previous.title}</span>
            </Link>
            <Link href={projectPath(next.slug)} className="rounded-xl border border-white/10 bg-[#05070D]/65 p-4 text-right backdrop-blur-md hover:border-white/30">
              <span className="text-xs text-slate-500">Next →</span>
              <span className="mt-1 block text-slate-100">{next.title}</span>
            </Link>
          </nav>
        </div>
      </main>
    </>
  )
}
