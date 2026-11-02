import { Vector3 } from "three"

import type { LabProject, ProjectCategory } from "@/content/lab/projects"
import { CATEGORIES } from "@/content/lab/projects/constants"

export const LAYOUTS = ["helix", "timeline", "constellation", "grid"] as const
export type ArchiveLayout = (typeof LAYOUTS)[number]

export const SORTS = ["year", "title"] as const
export type ArchiveSort = (typeof SORTS)[number]

export type ArchiveQuery = {
  stack: string | null
  category: ProjectCategory | null
  search: string
  sort: ArchiveSort
}

export const EMPTY_QUERY: ArchiveQuery = { stack: null, category: null, search: "", sort: "year" }

export function matches(project: LabProject, query: ArchiveQuery): boolean {
  if (query.stack && !project.stack.includes(query.stack)) return false
  if (query.category && project.category !== query.category) return false
  const needle = query.search.trim().toLowerCase()
  if (needle && !`${project.title} ${project.summary} ${project.tags.join(" ")}`.toLowerCase().includes(needle)) return false
  return true
}

export function sortProjects(projects: LabProject[], sort: ArchiveSort): LabProject[] {
  const sorted = [...projects]
  if (sort === "title") return sorted.sort((a, b) => a.title.localeCompare(b.title))
  return sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title))
}

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`

/** The query bar's text, in the site's "every visit is a request" language. */
export function toSql(query: ArchiveQuery): string {
  const where: string[] = []
  if (query.stack) where.push(`stack @> ${quote(query.stack)}`)
  if (query.category) where.push(`category = ${quote(query.category)}`)
  if (query.search.trim()) where.push(`title ILIKE ${quote(`%${query.search.trim()}%`)}`)
  const order = query.sort === "year" ? "year DESC" : "title ASC"
  return `SELECT * FROM projects${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}`
}

const literal = String.raw`'((?:[^']|'')*)'`
const unquote = (value: string) => value.replaceAll("''", "'")

/**
 * Reads a hand-edited query back. Only the clauses `toSql` writes are understood;
 * anything else is reported so the bar can explain what it ignored.
 */
export function parseSql(text: string, stacks: string[]): { query: ArchiveQuery; errors: string[] } {
  const query: ArchiveQuery = { ...EMPTY_QUERY }
  const errors: string[] = []
  const source = text.trim().replace(/;$/, "")

  const stack = source.match(new RegExp(String.raw`stack\s*@>\s*${literal}`, "i"))
  if (stack) {
    const name = unquote(stack[1])
    const known = stacks.find((s) => s.toLowerCase() === name.toLowerCase())
    if (known) query.stack = known
    else errors.push(`unknown stack '${name}'`)
  }

  const category = source.match(new RegExp(String.raw`category\s*=\s*${literal}`, "i"))
  if (category) {
    const name = unquote(category[1]).toLowerCase()
    const known = CATEGORIES.find((c) => c === name)
    if (known) query.category = known
    else errors.push(`unknown category '${name}'`)
  }

  const search = source.match(new RegExp(String.raw`title\s+I?LIKE\s*${literal}`, "i"))
  if (search) query.search = unquote(search[1]).replace(/^%|%$/g, "")

  const order = source.match(/ORDER\s+BY\s+(\w+)/i)
  if (order) {
    const key = order[1].toLowerCase()
    if (key === "year" || key === "title") query.sort = key
    else errors.push(`cannot order by '${order[1]}'`)
  }

  if (!/^SELECT\s+\*\s+FROM\s+projects\b/i.test(source)) errors.push("expected SELECT * FROM projects")
  return { query, errors }
}

export function fromSearchParams(params: URLSearchParams, stacks: string[]): { query: ArchiveQuery; layout: ArchiveLayout } {
  const stack = params.get("stack")
  const category = params.get("category")
  const sort = params.get("sort")
  const layout = params.get("layout")
  return {
    query: {
      stack: stacks.find((s) => s === stack) ?? null,
      category: CATEGORIES.find((c) => c === category) ?? null,
      search: params.get("q") ?? "",
      sort: SORTS.find((s) => s === sort) ?? "year",
    },
    layout: LAYOUTS.find((l) => l === layout) ?? "helix",
  }
}

export function toSearchParams(query: ArchiveQuery, layout: ArchiveLayout): string {
  const params = new URLSearchParams()
  if (query.stack) params.set("stack", query.stack)
  if (query.category) params.set("category", query.category)
  if (query.search.trim()) params.set("q", query.search.trim())
  if (query.sort !== "year") params.set("sort", query.sort)
  if (layout !== "helix") params.set("layout", layout)
  const text = params.toString()
  return text ? `?${text}` : ""
}

export type LayoutResult = {
  positions: Vector3[]
  /** Pairs of indices drawn as links (constellation only). */
  links: [number, number][]
  /** Centre and extent the archive camera frames. */
  center: Vector3
  extent: number
}

/** Height of the archive floor; sunk non-matches rest just above it. */
export const ARCHIVE_FLOOR = 0

/**
 * Target positions for every project in `order` (already sorted). Indices follow `order`,
 * so morphing between layouts is a per-instance lerp between two of these results.
 */
export function layoutPositions(order: LabProject[], layout: ArchiveLayout): LayoutResult {
  const n = order.length
  const positions = order.map(() => new Vector3())
  const links: [number, number][] = []
  const center = new Vector3(0, 4, 0)
  let extent = 8

  if (layout === "helix") {
    const turns = Math.max(1.25, n / 8)
    order.forEach((_, i) => {
      const a = (i / Math.max(n, 1)) * turns * Math.PI * 2
      positions[i].set(Math.cos(a) * 6, 9 - (i / Math.max(n - 1, 1)) * 7, Math.sin(a) * 6)
    })
    center.set(0, 5.5, 0)
    extent = 10
  } else if (layout === "timeline") {
    const years = [...new Set(order.map((p) => p.year ?? 0))].sort((a, b) => a - b)
    const stacked = new Map<number, number>()
    order.forEach((p, i) => {
      const year = p.year ?? 0
      const slot = stacked.get(year) ?? 0
      stacked.set(year, slot + 1)
      const x = (years.indexOf(year) - (years.length - 1) / 2) * 6
      positions[i].set(x + (slot % 2 ? 1.1 : -1.1), 2.4 + Math.floor(slot / 2) * 2.4, slot % 2 ? -1.2 : 1.2)
    })
    center.set(0, 4, 0)
    extent = Math.max(8, years.length * 3.4)
  } else if (layout === "grid") {
    const cols = Math.ceil(Math.sqrt(n * 1.6))
    const rows = Math.ceil(n / cols)
    order.forEach((_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      positions[i].set((col - (cols - 1) / 2) * 3.2, 7 - row * 3, -row * 0.6)
    })
    center.set(0, 7 - ((rows - 1) * 3) / 2, 0)
    extent = Math.max(cols * 1.9, rows * 2.4)
  } else {
    // Cluster around each project's lead technology; links join projects sharing two or more.
    const leads = [...new Set(order.map((p) => p.stack[0]))]
    const members = new Map<string, number>()
    order.forEach((p, i) => {
      const cluster = leads.indexOf(p.stack[0])
      const a = (cluster / leads.length) * Math.PI * 2
      const k = members.get(p.stack[0]) ?? 0
      members.set(p.stack[0], k + 1)
      const spin = k * 2.4
      const r = Math.min(k, 1) * 2.1
      positions[i].set(Math.cos(a) * 7.5 + Math.cos(spin) * r, 5 + Math.sin(a * 2 + k) * 2, Math.sin(a) * 7.5 + Math.sin(spin) * r)
    })
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (order[i].stack.filter((s) => order[j].stack.includes(s)).length >= 3) links.push([i, j])
      }
    }
    center.set(0, 5, 0)
    extent = 10
  }

  return { positions, links, center, extent }
}

/** Every technology used across `projects`, most common first. */
export function stackIndex(projects: LabProject[]): string[] {
  const counts = new Map<string, number>()
  for (const p of projects) for (const s of p.stack) counts.set(s, (counts.get(s) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([s]) => s)
}
