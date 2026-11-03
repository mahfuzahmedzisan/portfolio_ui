"use client"

import { useFrame } from "@react-three/fiber"
import { useState } from "react"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineBasicMaterial,
  LineSegments,
  ShaderMaterial,
  Vector3,
} from "three"

import { QUALITY, type QualityTier } from "@/lib/three/quality"
import { sparks } from "@/lib/three/sparks"
import { useLab } from "@/lib/three/store"

const BOLTS = 8
const BOLT_POINTS = 9
const BOLT_LIFE = 0.26
const SPARKS = 110

const vertex = /* glsl */ `
  attribute float aLife;
  attribute vec3 aColor;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vLife;
  varying vec3 vColor;
  void main() {
    vLife = aLife;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio * aLife * (28.0 / max(-mv.z, 1.0));
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  varying float vLife;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vLife;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * 3.2, a);
  }
`

type Bolt = {
  line: LineSegments<BufferGeometry, LineBasicMaterial>
  age: number
  since: number
  origin: Vector3
  end: Vector3
}

const point = new Vector3()
const previous = new Vector3()
const offset = new Vector3()
const white = new Color("#ffffff")

/** (Re)draws a jagged bolt from `origin` to `end` into the segment buffer. */
function strike(bolt: Bolt) {
  const attr = bolt.line.geometry.getAttribute("position") as BufferAttribute
  const jitter = 0.14 + bolt.origin.distanceTo(bolt.end) * 0.12
  previous.copy(bolt.origin)
  for (let i = 1; i < BOLT_POINTS; i++) {
    const t = i / (BOLT_POINTS - 1)
    point.lerpVectors(bolt.origin, bolt.end, t)
    const amount = Math.sin(Math.PI * t) * jitter
    offset.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2 * amount)
    point.add(offset)
    const k = (i - 1) * 2
    attr.setXYZ(k, previous.x, previous.y, previous.z)
    attr.setXYZ(k + 1, point.x, point.y, point.z)
    previous.copy(point)
  }
  attr.needsUpdate = true
}

/** The whole effect as a plain object: the component only owns it and calls `step` once a frame. */
class SparkSystem {
  readonly bolts: Bolt[] = Array.from({ length: BOLTS }, () => {
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", new BufferAttribute(new Float32Array((BOLT_POINTS - 1) * 2 * 3), 3))
    const material = new LineBasicMaterial({
      color: new Color("#9be7ff").multiplyScalar(3),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const line = new LineSegments(geometry, material)
    line.frustumCulled = false
    line.visible = false
    return { line, age: BOLT_LIFE, since: 0, origin: new Vector3(), end: new Vector3() }
  })

  private position = new Float32Array(SPARKS * 3)
  private velocity = new Float32Array(SPARKS * 3)
  private life = new Float32Array(SPARKS)
  private ttl = new Float32Array(SPARKS).fill(1)
  private color = new Float32Array(SPARKS * 3)
  private next = 0
  private nextBolt = 0
  private scratch = new Color()

  readonly geometry = new BufferGeometry()
  readonly material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uSize: { value: 5 }, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  constructor() {
    this.geometry.setAttribute("position", new BufferAttribute(this.position, 3))
    this.geometry.setAttribute("aLife", new BufferAttribute(this.life, 1))
    this.geometry.setAttribute("aColor", new BufferAttribute(this.color, 3))
  }

  step(dt: number, pixelRatio: number, tier: QualityTier) {
    const burst = QUALITY[tier].particles >= 1000 ? 7 : 4
    const maxBolts = tier === "low" ? 3 : BOLTS

    for (const event of sparks.drain()) {
      this.scratch.set(event.color)
      // One arc plus a burst of sparks per touch.
      const bolt = this.bolts[this.nextBolt++ % maxBolts]
      bolt.origin.set(event.x, event.y, event.z)
      bolt.end
        .set(Math.random() - 0.5, Math.random() * 0.9 + 0.1, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(0.5 + Math.random() * 1.1)
        .add(bolt.origin)
      bolt.age = 0
      bolt.since = 0
      bolt.line.material.color.copy(this.scratch).lerp(white, 0.45).multiplyScalar(3)
      bolt.line.visible = true
      strike(bolt)

      for (let n = 0; n < burst; n++) {
        const i = this.next++ % SPARKS
        const speed = 1.2 + Math.random() * 2.6
        this.position.set([event.x, event.y, event.z], i * 3)
        this.velocity.set(
          [(Math.random() - 0.5) * speed, Math.random() * speed * 0.9 + 0.3, (Math.random() - 0.5) * speed],
          i * 3,
        )
        this.ttl[i] = 0.35 + Math.random() * 0.5
        this.life[i] = 1
        this.color.set([this.scratch.r, this.scratch.g, this.scratch.b], i * 3)
      }
    }

    for (const bolt of this.bolts) {
      if (!bolt.line.visible) continue
      bolt.age += dt
      bolt.since += dt
      if (bolt.age >= BOLT_LIFE) {
        bolt.line.visible = false
        continue
      }
      // Re-roll the path a few times per bolt so it crackles instead of holding one shape.
      if (bolt.since > 0.05) {
        bolt.since = 0
        strike(bolt)
      }
      bolt.line.material.opacity = (1 - bolt.age / BOLT_LIFE) * (Math.random() > 0.2 ? 1 : 0.35)
    }

    for (let i = 0; i < SPARKS; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] = Math.max(0, this.life[i] - dt / this.ttl[i])
      const k = i * 3
      this.velocity[k + 1] -= 6.5 * dt
      this.position[k] += this.velocity[k] * dt
      this.position[k + 1] += this.velocity[k + 1] * dt
      this.position[k + 2] += this.velocity[k + 2] * dt
    }
    const attrs = this.geometry.attributes
    ;(attrs.position as BufferAttribute).needsUpdate = true
    ;(attrs.aLife as BufferAttribute).needsUpdate = true
    ;(attrs.aColor as BufferAttribute).needsUpdate = true
    this.material.uniforms.uPixelRatio.value = pixelRatio
  }
}

/**
 * Electric sparks and short lightning arcs wherever something calls `sparks.emit`.
 * Pure emissive geometry (no lights), so the bloom pass supplies the glow.
 */
export function CursorSparks() {
  const tier = useLab((s) => s.tier)
  const [system] = useState(() => new SparkSystem())

  useFrame((frame, delta) => system.step(Math.min(delta, 1 / 20), frame.viewport.dpr, tier))

  return (
    <>
      {system.bolts.map((bolt, i) => (
        <primitive key={i} object={bolt.line} />
      ))}
      <points geometry={system.geometry} material={system.material} frustumCulled={false} />
    </>
  )
}
