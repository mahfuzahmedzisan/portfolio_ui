"use client"

import { Billboard, Html, Text } from "@react-three/drei"
import { type ThreeEvent, useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useEffect, useMemo, useRef } from "react"
import {
  BufferAttribute,
  BufferGeometry,
  type FogExp2,
  type Group,
  InstancedBufferAttribute,
  type InstancedMesh,
  LatheGeometry,
  Matrix4,
  type Mesh,
  Quaternion,
  type ShaderMaterial,
  Vector2,
  Vector3,
} from "three"

import type { LabProject } from "@/content/lab/projects"
import { ARCHIVE_FLOOR, type LayoutResult, layoutPositions, matches, sortProjects } from "@/lib/lab/archive"
import { look, wasDrag } from "@/lib/three/look"
import { hashString, seededRandom } from "@/lib/three/random"
import { rig } from "@/lib/three/rig"
import { useLab } from "@/lib/three/store"

import { audio } from "../audio/audio-manager"
import { applyDragLook, moveCamera, orbitAround, trackProgress } from "../camera-moves"
import { createInstancedCrystalMaterial } from "../shaders/crystal-instanced"
import { createGridMaterial } from "../shaders/grid"
import { DISPLAY_FONT } from "../stations/browser-city"

const EMERALD = "#34D399"
const INSPECT_DISTANCE = 9.5

/** Live crystal state shared by the instances, labels, links, hologram and camera. */
export const archive = {
  positions: new Map<string, Vector3>(),
  layout: null as LayoutResult | null,
}

function crystalGeometry() {
  const profile = [new Vector2(0, -1.15), new Vector2(0.5, -0.5), new Vector2(0.58, 0.35), new Vector2(0.42, 0.75), new Vector2(0, 1.25)]
  const g = new LatheGeometry(profile, 6).toNonIndexed()
  g.computeVertexNormals()
  return g
}

/** Stretch, twist, taper and noise seed derived from the slug and stack: same project, same crystal. */
function shapeOf(project: LabProject) {
  const random = seededRandom(hashString(`${project.slug}:${project.stack.join(",")}`))
  return [0.75 + random() * 0.45 + project.stack.length * 0.05, (random() - 0.5) * 1.6, 0.55 + random() * 0.5, random() * 100] as const
}

function useArchiveTargets(projects: LabProject[]) {
  const query = useLab((s) => s.archiveQuery)
  const layout = useLab((s) => s.archiveLayout)
  return useMemo(() => {
    const order = sortProjects(projects, query.sort)
    const result = layoutPositions(order, layout)
    const targets = new Map(order.map((p, i) => [p.slug, result.positions[i]]))
    const matching = new Set(projects.filter((p) => matches(p, query)).map((p) => p.slug))
    const links = result.links
      .map(([a, b]) => [order[a].slug, order[b].slug] as const)
      .filter(([a, b]) => matching.has(a) && matching.has(b))
    return { targets, links, matching, result }
  }, [projects, query, layout])
}

function ArchiveFloor() {
  const material = useMemo(() => createGridMaterial(EMERALD), [])
  const grid = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null)
  useFrame((state) => {
    const fog = state.scene.fog as FogExp2 | null
    if (fog) fog.density = 0.022
    const uniforms = grid.current?.material.uniforms
    if (uniforms) uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <>
      <mesh ref={grid} rotation={[-Math.PI / 2, 0, 0]} position={[0, ARCHIVE_FLOOR + 0.01, 0]} material={material}>
        <planeGeometry args={[120, 120]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ARCHIVE_FLOOR - 0.02, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#03050a" metalness={0.4} roughness={0.7} />
      </mesh>
    </>
  )
}

type Live = { glow: number; scale: number; spin: number }

const matrix = new Matrix4()
const quaternion = new Quaternion()
const scaleVec = new Vector3()
const bob = new Vector3()
const sunk = new Vector3()
const UP = new Vector3(0, 1, 0)

function Crystals({ projects }: { projects: LabProject[] }) {
  const mesh = useRef<InstancedMesh>(null)
  const { targets, links, matching, result } = useArchiveTargets(projects)
  const geometry = useMemo(() => {
    const g = crystalGeometry()
    const shape = new Float32Array(projects.length * 4)
    const color = new Float32Array(projects.length * 3)
    projects.forEach((p, i) => {
      shape.set(shapeOf(p), i * 4)
      const hex = Number.parseInt(p.accent_color.slice(1), 16)
      color.set([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255], i * 3)
    })
    g.setAttribute("aShape", new InstancedBufferAttribute(shape, 4))
    g.setAttribute("aColor", new InstancedBufferAttribute(color, 3))
    g.setAttribute("aGlow", new InstancedBufferAttribute(new Float32Array(projects.length), 1))
    return g
  }, [projects])
  const material = useMemo(() => createInstancedCrystalMaterial(), [])
  const live = useMemo(() => projects.map((p): Live => ({ glow: 0, scale: 1, spin: seededRandom(hashString(p.slug))() * 6 })), [projects])
  const focusProject = useLab((s) => s.focusProject)
  const setHoveredProject = useLab((s) => s.setHoveredProject)

  useEffect(() => {
    archive.layout = result
  }, [result])

  useEffect(
    () => () => {
      archive.positions.clear()
      archive.layout = null
    },
    [],
  )

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 1 / 20)
    const t = state.clock.elapsedTime
    const { focusedProject, hoveredProject } = useLab.getState()
    const glowAttr = geometry.getAttribute("aGlow") as InstancedBufferAttribute
    ;(m.material as ShaderMaterial).uniforms.uTime.value = t

    projects.forEach((p, i) => {
      const s = live[i]
      const target = targets.get(p.slug)
      if (!target) return
      let pos = archive.positions.get(p.slug)
      if (!pos) {
        pos = target.clone().setY(ARCHIVE_FLOOR - 2)
        archive.positions.set(p.slug, pos)
      }
      const match = matching.has(p.slug)
      const focused = focusedProject === p.slug
      const hovered = hoveredProject === p.slug
      // Non-matches sink to rest just above the floor; the morph itself is a damped lerp per instance.
      const goal = match || focused ? target : sunk.copy(target).setY(ARCHIVE_FLOOR + 0.5)
      easing.damp3(pos, goal, 0.5 + (i % 5) * 0.06, dt)
      easing.damp(s, "glow", focused ? 1 : hovered ? 0.8 : match ? (focusedProject ? -0.45 : 0.15) : -1, 0.2, dt)
      easing.damp(s, "scale", focused ? 1.35 : hovered ? 1.2 : match ? 1 : 0.7, 0.2, dt)
      s.spin += dt * (0.35 + Math.max(s.glow, 0) * 1.4)

      quaternion.setFromAxisAngle(UP, s.spin)
      bob.copy(pos).y += Math.sin(t * 1.1 + i) * 0.12 * (match ? 1 : 0.2)
      matrix.compose(bob, quaternion, scaleVec.setScalar(s.scale))
      m.setMatrixAt(i, matrix)
      glowAttr.setX(i, s.glow)
    })
    m.instanceMatrix.needsUpdate = true
    glowAttr.needsUpdate = true
    // Instances move every frame, so the cached bounds used for raycasting go stale.
    m.boundingSphere = null
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const project = e.instanceId === undefined ? undefined : projects[e.instanceId]
    if (!project || useLab.getState().hoveredProject === project.slug) return
    setHoveredProject(project.slug)
    look.hovering = true
    audio.play("tick")
  }
  const out = () => {
    setHoveredProject(null)
    look.hovering = false
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (wasDrag() || e.instanceId === undefined) return
    const project = projects[e.instanceId]
    const focused = useLab.getState().focusedProject === project.slug
    focusProject(focused ? null : project.slug)
    audio.play(focused ? "tick" : "chime")
  }

  return (
    <>
      <instancedMesh
        ref={mesh}
        args={[geometry, material, projects.length]}
        frustumCulled={false}
        onPointerMove={over}
        onPointerOut={out}
        onClick={click}
      />
      <Links links={links} />
      {projects.map((p) => (
        <Label key={p.slug} project={p} match={matching.has(p.slug)} />
      ))}
      <Hologram projects={projects} />
    </>
  )
}

/** Constellation edges between projects sharing most of their stack; empty in other layouts. */
function Links({ links }: { links: (readonly [string, string])[] }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(new Float32Array(Math.max(links.length, 1) * 6), 3))
    return g
  }, [links])

  useFrame(() => {
    const attr = geometry.getAttribute("position") as BufferAttribute
    links.forEach(([a, b], i) => {
      const pa = archive.positions.get(a)
      const pb = archive.positions.get(b)
      if (!pa || !pb) return
      attr.setXYZ(i * 2, pa.x, pa.y, pa.z)
      attr.setXYZ(i * 2 + 1, pb.x, pb.y, pb.z)
    })
    attr.needsUpdate = true
    geometry.setDrawRange(0, links.length * 2)
  })

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color={[0.6, 2.2, 1.6]} transparent opacity={0.35} toneMapped={false} />
    </lineSegments>
  )
}

function Label({ project, match }: { project: LabProject; match: boolean }) {
  const group = useRef<Group>(null)
  const opacity = useRef({ value: 1 })
  const material = useRef<{ opacity: number } | null>(null)
  useFrame((_, delta) => {
    const pos = archive.positions.get(project.slug)
    if (!pos || !group.current) return
    group.current.position.set(pos.x, pos.y - 1.75, pos.z)
    easing.damp(opacity.current, "value", match ? 1 : 0, 0.25, delta)
    if (material.current) material.current.opacity = opacity.current.value
    group.current.visible = opacity.current.value > 0.02
  })
  return (
    <group ref={group}>
      <Billboard>
        <Text font={DISPLAY_FONT} fontSize={0.26} anchorX="center" anchorY="top" maxWidth={3} textAlign="center">
          {project.title}
          <meshBasicMaterial ref={material} color={[1.4, 1.5, 1.5]} transparent toneMapped={false} />
        </Text>
        <Text font={DISPLAY_FONT} fontSize={0.16} anchorX="center" anchorY="top" position={[0, -0.36, 0]}>
          {`${project.year ?? ""} · ${project.stack[0]}`}
          <meshBasicMaterial color={project.accent_color} transparent opacity={0.8} toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  )
}

/** DOM card floating beside the hovered (or inspected) crystal, with the project's muted loop. */
function Hologram({ projects }: { projects: LabProject[] }) {
  const group = useRef<Group>(null)
  const hovered = useLab((s) => s.hoveredProject)
  const focused = useLab((s) => s.focusedProject)
  const slug = hovered ?? focused
  const project = projects.find((p) => p.slug === slug)

  useFrame(() => {
    const pos = slug ? archive.positions.get(slug) : undefined
    if (pos && group.current) group.current.position.set(pos.x, pos.y + 0.4, pos.z)
  })

  if (!project || focused === project.slug) return null
  return (
    <group ref={group}>
      <Html center={false} style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
        <div
          className="ml-10 w-60 -translate-y-1/2 overflow-hidden rounded-xl border bg-[#05070D]/80 font-mono text-[11px] text-slate-300 shadow-2xl backdrop-blur-md"
          style={{ borderColor: `${project.accent_color}66`, boxShadow: `0 0 32px ${project.accent_color}33` }}
        >
          <div className="relative aspect-video bg-black">
            {project.preview_url ? (
              <video key={project.preview_url} src={project.preview_url} poster={project.cover_url ?? undefined} className="size-full object-cover" autoPlay muted loop playsInline />
            ) : project.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- inside a WebGL overlay; next/image adds nothing here
              <img src={project.cover_url} alt="" className="size-full object-cover" />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_2px,rgba(255,255,255,0.04)_2px_3px)]" />
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold text-white [font-family:var(--font-sans)]">{project.title}</p>
            <p className="mt-1 line-clamp-2 text-slate-400">{project.summary}</p>
            <p className="mt-2" style={{ color: project.accent_color }}>
              {project.stack.slice(0, 3).join(" · ")} · click to inspect
            </p>
          </div>
        </div>
      </Html>
    </group>
  )
}

const pos = new Vector3()
const lookAt = new Vector3()
const right = new Vector3()
const outward = new Vector3()
const offset = new Vector3()
const lookOffset = new Vector3()

/** Scroll sweeps the camera around (helix, constellation) or along (timeline, grid) the layout. */
function ArchiveCamera() {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const { progress, focusedProject, archiveLayout } = useLab.getState()
    trackProgress(progress, dt)
    const layout = archive.layout
    const p = rig.progress
    if (!layout) return
    const { center, extent } = layout

    const focus = focusedProject ? archive.positions.get(focusedProject) : undefined
    if (focus) {
      // Orbit from outside the layout so no other crystal sits between the camera and this one.
      outward.subVectors(focus, center).setY(0)
      if (outward.lengthSq() < 0.01) outward.set(0, 0, 1)
      outward.normalize()
      offset.copy(outward).multiplyScalar(INSPECT_DISTANCE).setY(2)
      // Looking right of the crystal keeps it clear of the inspect panel.
      lookOffset.crossVectors(UP, outward).multiplyScalar(2.2)
      orbitAround(focus, offset, lookOffset, pos, lookAt)
    } else {
      if (archiveLayout === "timeline" || archiveLayout === "grid") {
        const sweep = archiveLayout === "timeline" ? extent * 0.8 : extent * 0.35
        pos.set(center.x - sweep + p * sweep * 2, center.y + 2.5 - p * 1.5, center.z + extent * 1.5 + 8)
        lookAt.set(center.x - sweep * 0.7 + p * sweep * 1.4, center.y, center.z)
      } else {
        const angle = -0.7 + p * 1.9
        const radius = extent * 1.6 + 7
        pos.set(center.x + Math.sin(angle) * radius, center.y + 5.5 - p * 4.5, center.z + Math.cos(angle) * radius)
        lookAt.copy(center).setY(center.y + 0.6 - p * 1.4)
        right.set(Math.cos(angle), 0, -Math.sin(angle)).multiplyScalar(-3.5)
        lookAt.add(right)
      }
      applyDragLook(pos, lookAt, state.pointer, dt, 0.6)
    }
    moveCamera(state.camera, pos, lookAt, !!focus, dt)
  })
  return null
}

/** /lab/projects: every project as a procedural crystal, filtered and re-laid-out by the query bar. */
export function ArchiveScene({ projects }: { projects: LabProject[] }) {
  return (
    <>
      <ArchiveFloor />
      <Crystals projects={projects} />
      <pointLight color={EMERALD} intensity={30} distance={30} decay={1.6} position={[0, 10, 4]} />
      <ArchiveCamera />
    </>
  )
}
