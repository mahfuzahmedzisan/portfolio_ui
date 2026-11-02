import type { ProjectCard } from "@/lib/content/api"

import { PROJECT_SOURCES } from "./data"
import { type LabCaseStudy, projectSchema } from "./schema"

export * from "./schema"

/** Lab projects carry the planned `accent_color` field on top of `ProjectCard`. */
export type LabProject = ProjectCard & {
  accent_color: string
  category: LabCaseStudy["category"]
  /** Muted loop for hover previews: the first video block, if any. */
  preview_url: string | null
}

// Parsed at module load, so a malformed block fails the build instead of a page.
export const caseStudies: LabCaseStudy[] = PROJECT_SOURCES.map((source) => projectSchema.parse(source))

export const projectPath = (slug: string) => `/lab/projects/${slug}`

export function toCard(study: LabCaseStudy): LabProject {
  return {
    id: study.id,
    title: study.title,
    slug: study.slug,
    path: projectPath(study.slug),
    summary: study.summary,
    cover_url: study.cover.src,
    tags: study.tags,
    stack: study.stack,
    client: study.client,
    year: study.year,
    live_url: study.live_url,
    source_url: study.source_url,
    featured: study.featured,
    published_at: `${study.year}-01-01T00:00:00Z`,
    updated_at: "2026-11-01T00:00:00Z",
    accent_color: study.accent_color,
    category: study.category,
    preview_url: study.blocks.find((b) => b.type === "video")?.src ?? null,
  }
}

/** Newest first, featured first within a year. */
export const allProjects: LabProject[] = caseStudies
  .map(toCard)
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || Number(b.featured) - Number(a.featured) || a.id - b.id)

export const featuredProjects = allProjects.filter((p) => p.featured)

export function getCaseStudy(slug: string): LabCaseStudy | undefined {
  return caseStudies.find((s) => s.slug === slug)
}

/** Previous/next in archive order, wrapping around so a case study never dead-ends. */
export function neighbours(slug: string): { previous: LabProject; next: LabProject } {
  const i = allProjects.findIndex((p) => p.slug === slug)
  const n = allProjects.length
  return { previous: allProjects[(i - 1 + n) % n], next: allProjects[(i + 1) % n] }
}

/** Projects sharing the most stack entries with `slug`. */
export function related(slug: string, limit = 3): LabProject[] {
  const self = allProjects.find((p) => p.slug === slug)
  if (!self) return []
  return allProjects
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: p.stack.filter((s) => self.stack.includes(s)).length }))
    .sort((a, b) => b.score - a.score || (b.p.year ?? 0) - (a.p.year ?? 0))
    .slice(0, limit)
    .map(({ p }) => p)
}
