import { CatmullRomCurve3, Color, Vector3 } from "three"

export type StationId = "client" | "tunnel" | "engine" | "log" | "vault"

export type Station = {
  id: StationId
  index: number
  label: string
  /** The HTTP-flavoured caption shown in the station rail. */
  code: string
  accent: string
  fog: number
  /** Control point index on the camera/target splines where this station's camera rests. */
  stop: number
}

export const STATIONS: Station[] = [
  { id: "client", index: 0, label: "Browser City", code: "GET /mahfuz-ahmed", accent: "#22D3EE", fog: 0.018, stop: 0 },
  { id: "tunnel", index: 1, label: "Fiber Tunnel", code: "DNS / TLS / 38ms", accent: "#A5F3FC", fog: 0.03, stop: 3 },
  { id: "engine", index: 2, label: "Laravel Engine", code: "POST /api/v1/skills", accent: "#FF2D20", fog: 0.022, stop: 5 },
  { id: "log", index: 3, label: "Service Log", code: "GET /experience", accent: "#F59E0B", fog: 0.024, stop: 8 },
  { id: "vault", index: 4, label: "Database Vault", code: "SELECT * FROM projects", accent: "#34D399", fog: 0.026, stop: 11 },
]

/** World anchors used by the station components (three.js units, -Z is forward). */
export const ANCHORS = {
  client: new Vector3(0, 0, 0),
  tunnel: { start: -22, end: -74, radius: 4 },
  engine: new Vector3(0, 5, -100),
  log: new Vector3(0, 0, -176),
  vault: new Vector3(0, 0, -236),
} as const

const CAMERA_POINTS: [number, number, number][] = [
  [0, 6.5, 28],
  [0, 5, 12],
  [0, 4.2, -8],
  [0, 4, -40],
  [0, 4.4, -72],
  [10, 8, -86],
  [8, 7.2, -104],
  [0, 5.5, -136],
  [-7.5, 5.4, -156],
  [-2, 4.2, -200],
  [2, 4.5, -214],
  [1, 4.6, -220],
]

const TARGET_POINTS: [number, number, number][] = [
  [0, 4.5, 4],
  [0, 4, -6],
  [0, 4, -26],
  [0, 4, -56],
  [0, 4.6, -88],
  [-4, 5, -97],
  [-3, 5, -100],
  [1, 3.5, -160],
  [6, 5.2, -176],
  [0, 3, -220],
  [-2, 3.3, -222],
  [-4.5, 3.4, -236],
]

const toCurve = (points: [number, number, number][]) =>
  new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    false,
    "centripetal",
  )

export const cameraCurve = toCurve(CAMERA_POINTS)
export const targetCurve = toCurve(TARGET_POINTS)

const SEGMENTS = CAMERA_POINTS.length - 1
const stopT = STATIONS.map((s) => s.stop / SEGMENTS)

const smoothstep = (x: number) => x * x * (3 - 2 * x)

/**
 * Scroll progress (0..1, one equal slice per station gap) to spline parameter.
 * Smoothstep inside each slice makes the camera settle at every station.
 */
export function progressToT(progress: number): number {
  const p = Math.min(Math.max(progress, 0), 1) * (STATIONS.length - 1)
  const i = Math.min(Math.floor(p), STATIONS.length - 2)
  const frac = smoothstep(p - i)
  return stopT[i] + (stopT[i + 1] - stopT[i]) * frac
}

/** Continuous station position (0 = first station) for blending accents and fog. */
export function progressToStationFloat(progress: number): number {
  return Math.min(Math.max(progress, 0), 1) * (STATIONS.length - 1)
}

export function stationAt(progress: number): Station {
  return STATIONS[Math.round(progressToStationFloat(progress))]
}

const accentColors = STATIONS.map((s) => new Color(s.accent))

/** Writes the blended station accent for `progress` into `target`. */
export function accentAt(progress: number, target: Color): Color {
  const f = progressToStationFloat(progress)
  const i = Math.min(Math.floor(f), STATIONS.length - 2)
  return target.copy(accentColors[i]).lerp(accentColors[i + 1], f - i)
}

export function fogAt(progress: number): number {
  const f = progressToStationFloat(progress)
  const i = Math.min(Math.floor(f), STATIONS.length - 2)
  return STATIONS[i].fog + (STATIONS[i + 1].fog - STATIONS[i].fog) * (f - i)
}

/** Where project crystal `index` of `count` floats inside the vault. */
export function crystalPosition(index: number, count: number, target = new Vector3()): Vector3 {
  // A shallow arc whose wings come forward, so outer crystals don't hide behind the panel.
  const offset = index - (count - 1) / 2
  return target.set(ANCHORS.vault.x + offset * 2.5, ANCHORS.vault.y + 3, ANCHORS.vault.z + Math.abs(offset) * 0.9)
}

/** Scroll progress at which a station is centred. */
export function stationProgress(index: number): number {
  return index / (STATIONS.length - 1)
}
