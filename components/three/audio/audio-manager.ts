import type { Howl } from "howler"

import type { StationId } from "@/lib/three/stations.config"

export type Sfx =
  | "whoosh"
  | "tick"
  | "chime"
  | "click"
  | "navOpen"
  | "navClose"
  | "zap"
  | "card"
  | "success"
  | "rise"
  | "intro"

// Offsets in ms, from 3d-src/tools/gen-audio.mjs (also written to public/3d/audio/sfx.json).
const SPRITE: Record<Sfx, [number, number]> = {
  whoosh: [0, 1100],
  tick: [1350, 60],
  chime: [1660, 1600],
  click: [3510, 90],
  navOpen: [3800, 220],
  navClose: [4220, 200],
  zap: [4620, 320],
  card: [5140, 160],
  success: [5500, 1500],
  rise: [7200, 2400],
  intro: [9800, 1000],
}

const AMBIENT_MIX: Record<StationId, { volume: number; rate: number }> = {
  client: { volume: 0.18, rate: 0.82 },
  tunnel: { volume: 0.24, rate: 1.12 },
  engine: { volume: 0.4, rate: 1 },
  experience: { volume: 0.2, rate: 0.94 },
  vault: { volume: 0.22, rate: 0.9 },
  services: { volume: 0.2, rate: 1.04 },
  contact: { volume: 0.2, rate: 1.08 },
  footer: { volume: 0.14, rate: 0.72 },
}

const SFX_VOLUME: Record<Sfx, number> = {
  whoosh: 0.35,
  tick: 0.12,
  chime: 0.4,
  click: 0.3,
  navOpen: 0.22,
  navClose: 0.2,
  zap: 0.16,
  card: 0.3,
  success: 0.45,
  rise: 0.6,
  intro: 0.3,
}

/** Sounds that can fire every few frames while the pointer sweeps over objects. */
const THROTTLE_MS: Partial<Record<Sfx, number>> = { tick: 90, zap: 140 }

/**
 * Lazy Howler wrapper. Nothing is downloaded until the visitor turns sound on;
 * while muted every call is a no-op.
 */
class AudioManager {
  private enabled = false
  private loading: Promise<void> | null = null
  private ambient: Howl | null = null
  private sfx: Howl | null = null
  private station: StationId = "client"
  private lastPlayed: Partial<Record<Sfx, number>> = {}

  private load() {
    this.loading ??= import("howler").then(({ Howl }) => {
      this.ambient = new Howl({
        src: ["/3d/audio/ambient-engine.webm", "/3d/audio/ambient-engine.mp3"],
        loop: true,
        volume: 0,
      })
      this.sfx = new Howl({ src: ["/3d/audio/sfx.webm", "/3d/audio/sfx.mp3"], sprite: SPRITE })
    })
    return this.loading
  }

  async enable() {
    this.enabled = true
    await this.load()
    if (!this.enabled || !this.ambient) return
    if (!this.ambient.playing()) this.ambient.play()
    this.applyMix(1200)
  }

  disable() {
    this.enabled = false
    const ambient = this.ambient
    if (!ambient) return
    ambient.fade(ambient.volume(), 0, 400)
    window.setTimeout(() => {
      if (!this.enabled) ambient.pause()
    }, 420)
  }

  setStation(station: StationId) {
    if (station === this.station) return
    this.station = station
    if (!this.enabled) return
    this.play("whoosh")
    this.applyMix(900)
  }

  play(name: Sfx) {
    if (!this.enabled || !this.sfx) return
    const gap = THROTTLE_MS[name]
    if (gap) {
      const now = performance.now()
      if (now - (this.lastPlayed[name] ?? 0) < gap) return
      this.lastPlayed[name] = now
    }
    const id = this.sfx.play(name)
    this.sfx.volume(SFX_VOLUME[name], id)
  }

  private applyMix(ms: number) {
    const ambient = this.ambient
    if (!ambient) return
    const mix = AMBIENT_MIX[this.station]
    ambient.fade(ambient.volume(), mix.volume, ms)
    ambient.rate(mix.rate)
  }
}

export const audio = new AudioManager()
