import { z } from "zod"

import { CATEGORIES, SCENE_PRESETS } from "./constants"

export { CATEGORIES, SCENE_PRESETS }

/**
 * Case-study content model for the /lab prototype. Shaped like the planned
 * `GET /projects/{slug}` payload so the later API switch is a data-source swap.
 */

const id = z.string().regex(/^[a-z0-9-]+$/)
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/)
const path = z.string().startsWith("/")

export const imageSchema = z.object({
  src: path,
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
})

const base = { id }

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("chapter"), kicker: z.string(), title: z.string() }),
  z.object({ ...base, type: z.literal("richText"), heading: z.string().optional(), paragraphs: z.array(z.string()).min(1), bullets: z.array(z.string()).optional() }),
  z.object({ ...base, type: z.literal("gallery"), title: z.string(), layout: z.enum(["orbit", "wall", "stack"]), images: z.array(imageSchema).min(1) }),
  z.object({ ...base, type: z.literal("video"), title: z.string(), src: path, poster: path, caption: z.string().optional(), loop: z.boolean() }),
  z.object({
    ...base,
    type: z.literal("model"),
    title: z.string(),
    src: path,
    caption: z.string().optional(),
    scale: z.number().positive().default(1),
    hotspots: z.array(z.object({ position: z.tuple([z.number(), z.number(), z.number()]), label: z.string(), text: z.string() })),
  }),
  z.object({
    ...base,
    type: z.literal("metrics"),
    title: z.string(),
    items: z.array(z.object({ label: z.string(), value: z.number(), unit: z.string().optional(), prefix: z.string().optional() })).min(1),
  }),
  z.object({ ...base, type: z.literal("techStack"), title: z.string(), items: z.array(z.string()).min(1) }),
  z.object({ ...base, type: z.literal("timeline"), title: z.string(), items: z.array(z.object({ date: z.string(), title: z.string(), text: z.string() })).min(1) }),
  z.object({
    ...base,
    type: z.literal("architecture"),
    title: z.string(),
    caption: z.string().optional(),
    nodes: z
      .array(z.object({ id, label: z.string(), kind: z.enum(["client", "edge", "service", "queue", "data"]), x: z.number(), y: z.number() }))
      .min(2),
    edges: z.array(z.object({ from: id, to: id, label: z.string().optional() })),
  }),
  z.object({ ...base, type: z.literal("beforeAfter"), title: z.string(), before: imageSchema, after: imageSchema, caption: z.string().optional() }),
  z.object({ ...base, type: z.literal("quote"), text: z.string(), author: z.string(), role: z.string() }),
  z.object({ ...base, type: z.literal("code"), title: z.string(), language: z.string(), code: z.string(), caption: z.string().optional() }),
  z.object({ ...base, type: z.literal("cta"), title: z.string(), text: z.string(), links: z.array(z.object({ label: z.string(), href: z.string() })) }),
])


export const projectSchema = z
  .object({
    id: z.number().int().positive(),
    slug: id,
    title: z.string(),
    subtitle: z.string(),
    summary: z.string(),
    category: z.enum(CATEGORIES),
    year: z.number().int(),
    role: z.string(),
    duration: z.string(),
    client: z.string().nullable(),
    stack: z.array(z.string()).min(1),
    tags: z.array(z.string()),
    accent_color: color,
    scene: z.enum(SCENE_PRESETS),
    featured: z.boolean(),
    cover: imageSchema,
    live_url: z.string().url().nullable(),
    source_url: z.string().url().nullable(),
    blocks: z.array(blockSchema).min(1),
  })
  .superRefine((project, ctx) => {
    const ids = new Set<string>()
    for (const block of project.blocks) {
      if (ids.has(block.id)) ctx.addIssue({ code: "custom", message: `duplicate block id "${block.id}" in ${project.slug}` })
      ids.add(block.id)
      if (block.type !== "architecture") continue
      const nodes = new Set(block.nodes.map((n) => n.id))
      for (const edge of block.edges) {
        if (!nodes.has(edge.from) || !nodes.has(edge.to)) {
          ctx.addIssue({ code: "custom", message: `edge ${edge.from}->${edge.to} references a missing node in ${project.slug}` })
        }
      }
    }
  })

export type ProjectImage = z.infer<typeof imageSchema>
export type Block = z.infer<typeof blockSchema>
export type BlockType = Block["type"]
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>
export type ScenePreset = (typeof SCENE_PRESETS)[number]
export type ProjectCategory = (typeof CATEGORIES)[number]
export type ProjectSource = z.input<typeof projectSchema>
export type LabCaseStudy = z.infer<typeof projectSchema>
