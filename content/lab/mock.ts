import type { ProjectCard } from "@/lib/content/api"

/** Future `GET /profile` payload. */
export type Profile = {
  name: string
  role: string
  location: string
  headline: string
  bio: string
  email: string
  socials: { label: string; url: string }[]
}

/** Future `GET /skills` payload item. */
export type Skill = {
  id: number
  name: string
  group: "frontend" | "backend" | "data" | "devops"
  level: number
  years: number
  summary: string
}

/** Future `GET /experiences` payload item. */
export type Experience = {
  id: number
  role: string
  company: string
  period: string
  summary: string
}

/** Lab projects carry the planned `accent_color` field on top of `ProjectCard`. */
export type LabProject = ProjectCard & { accent_color: string }

export const profile: Profile = {
  name: "Mahfuz Ahmed",
  role: "Full-Stack Developer",
  location: "Dhaka, Bangladesh",
  headline: "I build the whole request: from the pixel you click to the row it lands in.",
  bio: "Full-stack developer working across Next.js, React, Laravel and PostgreSQL. I care about fast interfaces, secure APIs, and systems that stay readable after the launch.",
  email: "hello@mahfuz.dev",
  socials: [
    { label: "GitHub", url: "https://github.com/" },
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
  ],
}

export const skills: Skill[] = [
  { id: 1, name: "Next.js", group: "frontend", level: 92, years: 4, summary: "App Router, RSC, ISR, BFF route handlers." },
  { id: 2, name: "React", group: "frontend", level: 94, years: 5, summary: "Component systems, performance, React 19." },
  { id: 3, name: "TypeScript", group: "frontend", level: 90, years: 4, summary: "Strict types across UI and API clients." },
  { id: 4, name: "Three.js", group: "frontend", level: 72, years: 2, summary: "R3F scenes, shaders, post-processing." },
  { id: 5, name: "Laravel", group: "backend", level: 91, years: 5, summary: "Sanctum, Fortify, queues, policies." },
  { id: 6, name: "PHP", group: "backend", level: 88, years: 6, summary: "Modern PHP 8.4, Pest, clean services." },
  { id: 7, name: "PostgreSQL", group: "data", level: 82, years: 4, summary: "Schema design, indexing, query tuning." },
  { id: 8, name: "Redis", group: "data", level: 74, years: 3, summary: "Caching, queues, rate limiting." },
  { id: 9, name: "Docker", group: "devops", level: 78, years: 3, summary: "Multi-service images, Coolify deploys." },
  { id: 10, name: "Tailwind", group: "frontend", level: 93, years: 4, summary: "Design tokens, v4, shadcn systems." },
]

export const experiences: Experience[] = [
  { id: 1, role: "Full-Stack Developer", company: "Freelance", period: "2024 - Now", summary: "Next.js + Laravel products for clients, end to end." },
  { id: 2, role: "Backend Developer", company: "Product Studio", period: "2022 - 2024", summary: "APIs, queues and admin tooling in Laravel." },
  { id: 3, role: "Frontend Developer", company: "Agency", period: "2020 - 2022", summary: "Marketing sites and dashboards in React." },
]

const project = (
  id: number,
  title: string,
  slug: string,
  summary: string,
  stack: string[],
  year: number,
  accent_color: string,
): LabProject => ({
  id,
  title,
  slug,
  path: `/projects/${slug}`,
  summary,
  cover_url: null,
  tags: stack.slice(0, 2),
  stack,
  client: null,
  year,
  live_url: null,
  source_url: null,
  featured: true,
  published_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  accent_color,
})

export const projects: LabProject[] = [
  project(1, "Commerce Engine", "commerce-engine", "Headless storefront with a Laravel order pipeline and Next.js edge cache.", ["Next.js", "Laravel", "PostgreSQL"], 2026, "#34D399"),
  project(2, "Realtime Ops Board", "realtime-ops-board", "Live operations dashboard over Reverb websockets with role-based views.", ["React", "Laravel Reverb", "Redis"], 2025, "#22D3EE"),
  project(3, "Media Pipeline", "media-pipeline", "Resumable uploads, HLS transcoding and a custom video player.", ["tus", "ffmpeg", "Video.js"], 2025, "#F59E0B"),
]
