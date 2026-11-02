import { featuredProjects, type LabProject } from "./projects"
import type { Experience, Profile, Skill } from "./types"

export type { LabProject }
export * from "./types"

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
  { id: 1, name: "Next.js", group: "frontend", level: 92, years: 4, summary: "App Router, RSC, ISR, BFF route handlers.", model: "nextjs", color: "#E2E8F0" },
  { id: 2, name: "React", group: "frontend", level: 94, years: 5, summary: "Component systems, performance, React 19.", model: "react", color: "#61DAFB" },
  { id: 3, name: "TypeScript", group: "frontend", level: 90, years: 4, summary: "Strict types across UI and API clients.", model: "typescript", color: "#4A8FE7" },
  { id: 4, name: "Three.js", group: "frontend", level: 72, years: 2, summary: "R3F scenes, shaders, post-processing.", model: "threejs", color: "#C4B5FD" },
  { id: 5, name: "Laravel", group: "backend", level: 91, years: 5, summary: "Sanctum, Fortify, queues, policies.", model: "laravel", color: "#FF2D20" },
  { id: 6, name: "PHP", group: "backend", level: 88, years: 6, summary: "Modern PHP 8.4, Pest, clean services.", model: "php", color: "#8C92FF" },
  { id: 7, name: "PostgreSQL", group: "data", level: 82, years: 4, summary: "Schema design, indexing, query tuning.", model: "postgresql", color: "#5B9BE0" },
  { id: 8, name: "Redis", group: "data", level: 74, years: 3, summary: "Caching, queues, rate limiting.", model: "redis", color: "#FF5A4E" },
  { id: 9, name: "Docker", group: "devops", level: 78, years: 3, summary: "Multi-service images, Coolify deploys.", model: "docker", color: "#2496ED" },
  { id: 10, name: "Tailwind", group: "frontend", level: 93, years: 4, summary: "Design tokens, v4, shadcn systems.", model: "tailwind", color: "#38BDF8" },
]

export const experiences: Experience[] = [
  { id: 1, role: "Full-Stack Developer", company: "Freelance", period: "2024 - Now", summary: "Next.js + Laravel products for clients, end to end." },
  { id: 2, role: "Backend Developer", company: "Product Studio", period: "2022 - 2024", summary: "APIs, queues and admin tooling in Laravel." },
  { id: 3, role: "Frontend Developer", company: "Agency", period: "2020 - 2022", summary: "Marketing sites and dashboards in React." },
]

/** The vault holds the featured projects; the archive holds all of them. */
export const projects: LabProject[] = featuredProjects
