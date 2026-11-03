import { CatmullRomCurve3, Color, Vector3 } from "three"

export type StationId = "client" | "tunnel" | "services" | "vault" | "engine" | "experience" | "contact" | "footer"

export type Station = {
  id: StationId
  index: number
  /** Name shown in the floating nav. */
  label: string
  /** The HTTP-flavoured caption shown in the status pill. */
  code: string
  accent: string
  fog: number
  /** Control point index on the camera/target splines where this station's camera rests. */
  stop: number
  /** Still used by the poster fallback (reduced motion, no WebGL, "3D off"). */
  poster: string
}

type PathPoint = { camera: [number, number, number]; target: [number, number, number]; station?: StationId }

/**
 * One camera/target control point per entry, in scroll order. Entries tagged with a station are
 * where the camera rests for that section; the rest only shape the flight between them.
 */
const PATH: PathPoint[] = [
  { camera: [0, 6.5, 28], target: [0, 4.5, 4], station: "client" },
  { camera: [0, 5, 12], target: [0, 4, -6] },
  { camera: [0, 4.2, -8], target: [0, 4, -26] },
  { camera: [0, 3.4, -37], target: [0.9, 2.3, -52], station: "tunnel" },
  { camera: [0, 4.4, -72], target: [0, 4.6, -88] },
  { camera: [1, 4.0, -97], target: [3.6, 2.2, -112], station: "services" },
  { camera: [-2, 4.2, -134], target: [0, 3, -150] },
  { camera: [2, 4.5, -148], target: [-2, 3.3, -152] },
  { camera: [1, 4.6, -154], target: [-4.5, 3.4, -170], station: "vault" },
  { camera: [0, 5, -190], target: [0, 4.5, -208] },
  { camera: [10, 8, -226], target: [-4, 5, -237], station: "engine" },
  { camera: [8, 7.2, -244], target: [-3, 5, -240] },
  { camera: [0, 5.5, -260], target: [1, 3.5, -284] },
  { camera: [1.5, 2.6, -288], target: [2, 0.95, -300], station: "experience" },
  { camera: [-1, 4.4, -322], target: [0, 3, -340] },
  { camera: [0.5, 3.4, -345], target: [3.2, 1.8, -360], station: "contact" },
  { camera: [0, 2.5, -384], target: [0, 1.6, -405], station: "footer" },
]

const stopOf = (id: StationId) => PATH.findIndex((p) => p.station === id)

export const STATIONS: Station[] = [
  { id: "client", index: 0, label: "Home", code: "GET /mahfuz-ahmed", accent: "#22D3EE", fog: 0.018, stop: stopOf("client"), poster: "client" },
  { id: "tunnel", index: 1, label: "About", code: "DNS / TLS / handshake", accent: "#A5F3FC", fog: 0.03, stop: stopOf("tunnel"), poster: "tunnel" },
  { id: "services", index: 2, label: "Services", code: "GET /services", accent: "#C084FC", fog: 0.024, stop: stopOf("services"), poster: "vault" },
  { id: "vault", index: 3, label: "Projects", code: "SELECT * FROM projects", accent: "#34D399", fog: 0.026, stop: stopOf("vault"), poster: "vault" },
  { id: "engine", index: 4, label: "Skills", code: "POST /api/v1/skills", accent: "#FF2D20", fog: 0.022, stop: stopOf("engine"), poster: "engine" },
  { id: "experience", index: 5, label: "Experience", code: "GET /experience", accent: "#FBBF24", fog: 0.024, stop: stopOf("experience"), poster: "experience" },
  { id: "contact", index: 6, label: "Contact", code: "POST /contact", accent: "#F472B6", fog: 0.022, stop: stopOf("contact"), poster: "client" },
  { id: "footer", index: 7, label: "Footer", code: "200 OK · connection closed", accent: "#22D3EE", fog: 0.02, stop: stopOf("footer"), poster: "client" },
]

/** World anchors used by the station components (three.js units, -Z is forward). */
export const ANCHORS = {
  client: new Vector3(0, 0, 0),
  tunnel: { start: -22, end: -74, radius: 4 },
  services: new Vector3(0, 0, -112),
  vault: new Vector3(0, 0, -170),
  engine: new Vector3(0, 5, -240),
  experience: new Vector3(0, 0, -300),
  contact: new Vector3(0, 0, -360),
  footer: new Vector3(0, 0, -405),
} as const

/** Length of the whole journey, for floors and dust. */
export const JOURNEY = { near: 36, far: -430 }

const toCurve = (points: [number, number, number][]) =>
  new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    false,
    "centripetal",
  )

export const cameraCurve = toCurve(PATH.map((p) => p.camera))
export const targetCurve = toCurve(PATH.map((p) => p.target))

const SEGMENTS = PATH.length - 1
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

/** Distance, in stations, between `progress` and a station. Drives culling and per-station effects. */
export function stationDistance(progress: number, id: StationId): number {
  return Math.abs(progressToStationFloat(progress) - STATIONS.findIndex((s) => s.id === id))
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

/** Where service card `index` of `count` stands on the services platform. */
export function servicePosition(index: number, count: number, target = new Vector3()): Vector3 {
  const offset = index - (count - 1) / 2
  return target.set(ANCHORS.services.x + 7 + offset * 2.0, 2.6, ANCHORS.services.z + offset * offset * 0.3)
}

/** Scroll progress at which a station is centred. */
export function stationProgress(index: number): number {
  return index / (STATIONS.length - 1)
}
