/** Zod-free so client components can import them without bundling the schema. */
export const SCENE_PRESETS = ["nebula", "grid", "ocean", "forge"] as const
export const CATEGORIES = ["product", "platform", "client", "open-source", "experiment"] as const