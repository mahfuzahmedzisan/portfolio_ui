"use client"

import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type IUniform,
  type Group,
  type InstancedMesh,
  type Material,
  Matrix4,
  type Mesh,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
} from "three"

import { look } from "@/lib/three/look"
import { rig } from "@/lib/three/rig"
import { ANCHORS } from "@/lib/three/stations.config"
import { seededRandom } from "@/lib/three/random"
import { sparks } from "@/lib/three/sparks"

import { audio } from "../audio/audio-manager"
import { type Part, useParts } from "../models"
import { StationCull } from "../station-cull"
import { useSpark } from "../use-spark"

const NODES = Array.from({ length: 11 }, (_, i) => `Footer_Letter_${String(i).padStart(2, "0")}`) as readonly string[]
const SCALE = 3.3
const CYAN = "#22D3EE"
const SHARDS = 44
/** Scroll progress at which the name starts to rise, and how long (in progress) it takes. */
const RISE_START = 0.9
const RISE_SPAN = 0.1

const smooth = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

const letterVertex = /* glsl */ `
  varying float vH;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vH = position.y;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
  }
`

/** Dissolves in from the baseline upwards; a bright seam rides the cut as the letter appears. */
const letterFragment = /* glsl */ `
  uniform float uReveal;
  uniform vec3 uColor;
  varying float vH;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float cut = uReveal * 1.1 - 0.05;
    if (vH > cut) discard;
    float seam = smoothstep(0.14, 0.0, cut - vH) * step(uReveal, 0.999);
    float fresnel = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    csm_Emissive = uColor * (seam * 4.0 + fresnel * 2.2 + 0.22);
  }
`

function createLetterMaterial() {
  return new CustomShaderMaterial({
    baseMaterial: MeshStandardMaterial,
    vertexShader: letterVertex,
    fragmentShader: letterFragment,
    uniforms: { uReveal: { value: 0 }, uColor: { value: new Color(CYAN) } },
    color: "#1a2a4a",
    metalness: 0.6,
    roughness: 0.3,
    side: DoubleSide,
    toneMapped: false,
  })
}

type LetterMaterial = Material & { uniforms: Record<string, IUniform> }

const crackVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** Glowing cracks that run outwards across the floor under the name. */
const crackFragment = /* glsl */ `
  uniform float uReveal;
  uniform vec3 uColor;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(30.0, 14.0);
    float r = length(p);
    float a = (atan(p.y, p.x) + 3.14159265) / 6.2831853 * 34.0;
    float id = floor(a);
    float reach = (3.0 + hash(id) * 11.0) * uReveal;
    float width = abs(fract(a) - 0.5);
    float line = smoothstep(0.07, 0.0, width * (0.5 + r * 0.04)) * step(r, reach) * (1.0 - smoothstep(0.0, 1.0, r / max(reach, 0.01)) * 0.7);
    float alpha = line * step(0.35, hash(id + 7.0)) * uReveal;
    gl_FragColor = vec4(uColor * 3.0, alpha);
  }
`

function createCrackMaterial() {
  return new ShaderMaterial({
    vertexShader: crackVertex,
    fragmentShader: crackFragment,
    uniforms: { uReveal: { value: 0 }, uColor: { value: new Color(CYAN) } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  })
}

/** Shader uniforms live outside React's reach; this keeps the per-frame writes out of render analysis. */
function setReveal(material: { uniforms: Record<string, IUniform> }, value: number) {
  material.uniforms.uReveal.value = value
}

const dummy = new Object3D()
const m4 = new Matrix4()

/**
 * The closing 3D name. As the last stop comes into view the letters rise out of the floor one
 * after another, the floor cracks, shards kick up, and the camera rumbles before it settles.
 */
export function FooterName() {
  const parts = useParts("footer", NODES)
  const materials = useMemo(() => NODES.map(() => createLetterMaterial()), [])
  const crack = useMemo(() => createCrackMaterial(), [])
  const spark = useSpark(CYAN, 110)

  const letters = useRef<(Mesh | null)[]>([])
  const shards = useRef<InstancedMesh>(null)
  const crackMesh = useRef<Mesh>(null)
  const fit = useRef<Group>(null)
  const state = useRef({ reveal: 0, since: -1, nextSpark: 0, played: false })
  const shardData = useMemo(() => {
    const random = seededRandom(404)
    return Array.from({ length: SHARDS }, () => ({
      x: (random() - 0.5) * 16,
      z: (random() - 0.5) * 3,
      vx: (random() - 0.5) * 2.4,
      vy: 3 + random() * 5,
      vz: (random() - 0.3) * 2.2,
      spin: (random() - 0.5) * 9,
      size: 0.05 + random() * 0.14,
    }))
  }, [])

  useFrame((frame, delta) => {
    const s = state.current
    // The name is about 21 units wide; narrow screens shrink it to fit.
    fit.current?.scale.setScalar(Math.min(1, frame.viewport.aspect / 1.4))
    const reveal = smooth((rig.progress - RISE_START) / RISE_SPAN)
    const rising = reveal > s.reveal + 1e-4
    s.reveal = reveal

    if (reveal > 0.04 && !s.played) {
      s.played = true
      s.since = 0
      audio.play("rise")
    }
    if (reveal < 0.01) {
      s.played = false
      s.since = -1
    }
    if (s.since >= 0) s.since += delta

    // Rumble while the letters climb, easing off once they have all landed.
    rig.shake = reveal > 0.03 && reveal < 0.98 ? Math.sin(Math.PI * reveal) : 0

    letters.current.forEach((mesh, i) => {
      if (!mesh) return
      const local = smooth(reveal * 1.7 - i * 0.065)
      setReveal(materials[i] as LetterMaterial, local)
      mesh.position.y = (1 - local) * -1.4 + Math.sin(frame.clock.elapsedTime * 2 + i) * 0.012 * local
      mesh.visible = local > 0.001
    })
    setReveal(crack, smooth(reveal * 1.4))

    if (rising && frame.clock.elapsedTime > s.nextSpark) {
      s.nextSpark = frame.clock.elapsedTime + 0.07
      const x = ANCHORS.footer.x + (Math.random() - 0.5) * 17
      sparks.emit(x, 0.15, ANCHORS.footer.z + 0.3, CYAN)
    }

    const mesh = shards.current
    if (mesh) {
      const t = s.since
      for (let i = 0; i < SHARDS; i++) {
        const d = shardData[i]
        if (t < 0) {
          dummy.position.set(0, -50, 0)
          dummy.scale.setScalar(0.0001)
        } else {
          const fall = Math.max(t - 0.15, 0)
          const y = 0.1 + d.vy * fall - 0.5 * 9 * fall * fall
          dummy.position.set(ANCHORS.footer.x + d.x + d.vx * fall, Math.max(y, 0.04), ANCHORS.footer.z + d.z + d.vz * fall)
          dummy.rotation.set(fall * d.spin, fall * d.spin * 0.7, 0)
          dummy.scale.setScalar(t < 0.15 ? 0.0001 : d.size)
        }
        dummy.updateMatrix()
        mesh.setMatrixAt(i, m4.copy(dummy.matrix))
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <StationCull id="footer" range={1.6}>
      <group position={[ANCHORS.footer.x, 0, ANCHORS.footer.z]}>
        <group ref={fit}>
        <group
          scale={SCALE}
          onPointerMove={(e) => {
            e.stopPropagation()
            look.hovering = true
            spark(e)
          }}
          onPointerOut={() => (look.hovering = false)}
        >
          {NODES.map((name, i) => (
            <mesh
              key={name}
              ref={(el) => void (letters.current[i] = el)}
              geometry={(parts[name] as Part[])[0].geometry}
              material={materials[i]}
              visible={false}
            />
          ))}
        </group>
        </group>
        <mesh ref={crackMesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 1]} material={crack}>
          <planeGeometry args={[30, 14]} />
        </mesh>
        <instancedMesh ref={shards} args={[undefined, undefined, SHARDS]} frustumCulled={false}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#0a0f1c" metalness={0.8} roughness={0.3} emissive={CYAN} emissiveIntensity={0.6} />
        </instancedMesh>
      </group>
    </StationCull>
  )
}
