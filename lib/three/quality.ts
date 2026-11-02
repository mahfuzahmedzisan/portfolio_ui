export type QualityTier = "low" | "medium" | "high"

export type QualitySettings = {
  dpr: [number, number]
  particles: number
  towers: number
  bloom: boolean
  depthOfField: boolean
  chromaticAberration: boolean
  noise: boolean
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: { dpr: [1, 1], particles: 400, towers: 60, bloom: true, depthOfField: false, chromaticAberration: false, noise: false },
  medium: { dpr: [1, 1.5], particles: 1200, towers: 110, bloom: true, depthOfField: false, chromaticAberration: true, noise: true },
  high: { dpr: [1, 1.75], particles: 2400, towers: 160, bloom: true, depthOfField: true, chromaticAberration: true, noise: true },
}

export const TIERS: QualityTier[] = ["low", "medium", "high"]

export const SKIP_3D_KEY = "the-request:skip-3d"

export type RenderMode = "pending" | "webgl" | "fallback"

export type Capability = { mode: RenderMode; tier: QualityTier; reason?: string }

function hasWebGL2(): boolean {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"))
  } catch {
    return false
  }
}

/**
 * Picks WebGL vs poster fallback and a starting tier. Benchmarks are
 * self-hosted under /3d/gpu-benchmarks so the CSP can stay on 'self'.
 */
export async function detectCapability(): Promise<Capability> {
  // "1" = the visitor turned 3D off, "0" = they turned it on despite reduced motion.
  const choice = window.localStorage.getItem(SKIP_3D_KEY)
  if (choice === "1") return { mode: "fallback", tier: "low", reason: "skip" }
  if (choice !== "0" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { mode: "fallback", tier: "low", reason: "reduced-motion" }
  }
  if (!hasWebGL2()) return { mode: "fallback", tier: "low", reason: "no-webgl" }

  try {
    const { getGPUTier } = await import("detect-gpu")
    const gpu = await getGPUTier({ benchmarksURL: "/3d/gpu-benchmarks" })
    if (gpu.tier === 0) return { mode: "fallback", tier: "low", reason: "gpu" }
    // Benchmarks overrate integrated Intel parts once depth of field and full-res bloom are on.
    const integrated = /intel/i.test(gpu.gpu ?? "")
    const tier: QualityTier = gpu.tier >= 3 && !gpu.isMobile && !integrated ? "high" : gpu.tier >= 2 ? "medium" : "low"
    return { mode: "webgl", tier }
  } catch {
    return { mode: "webgl", tier: "medium" }
  }
}
