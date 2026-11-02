import type { Howl } from "howler"

import type { StationId } from "@/lib/three/stations.config"

export type Sfx = "whoosh" | "tick" | "chime"

// Offsets in ms, from 3d-src/tools/gen-audio.mjs (also written to public/3d/audio/sfx.json).
const SPRITE: Record<Sfx, [number, number]> = {
  whoosh: [0, 1100],
  tick: [1350, 60],
  chime: [1660, 1600],
}

const AMBIENT_MIX: Record<StationId, { volume: number; rate: number }> = {
  client: { volume: 0.18, rate: 0.82 },
  tunnel: { volume: 0.24, rate: 1.12 },
  engine: { volume: 0.4, rate: 1 },
  vault: { volume: 0.22, rate: 0.9 },
}

const SFX_VOLUME: Record<Sfx, number> = { whoosh: 0.35, tick: 0.12, chime: 0.4 }

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
  private lastTick = 0

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
    // Hover ticks can fire every frame while the pointer sweeps across pods.
    if (name === "tick") {
      const now = performance.now()
      if (now - this.lastTick < 90) return
      this.lastTick = now
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
