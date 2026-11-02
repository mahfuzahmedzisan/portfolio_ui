/** Client-safe content types: importing these never pulls mock data into a bundle. */

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

/** Nodes in `skills.glb`; each has a `Skill_<slug>` body and optional `_A`/`_B` moving parts. */
export const SKILL_MODELS = ["nextjs", "react", "typescript", "threejs", "laravel", "php", "postgresql", "redis", "docker", "tailwind"] as const
export type SkillModel = (typeof SKILL_MODELS)[number]

export type SkillGroup = "frontend" | "backend" | "data" | "devops"

/** Future `GET /skills` payload item. */
export type Skill = {
  id: number
  name: string
  group: SkillGroup
  level: number
  years: number
  summary: string
  /** Artifact in `skills.glb`; unknown models fall back to the generic engine pod. */
  model: SkillModel | null
  color: string
}

/** Future `GET /experiences` payload item. */
export type Experience = {
  id: number
  role: string
  company: string
  period: string
  summary: string
  /** Accent for the station object and the timeline mark. */
  color: string
}
