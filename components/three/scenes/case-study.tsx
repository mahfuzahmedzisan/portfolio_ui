"use client"

import type { LabCaseStudy, LabProject } from "@/content/lab/projects"
import type { Skill } from "@/content/lab/types"

export function CaseStudyScene({ study }: { study: LabCaseStudy; next: LabProject; skills: Skill[] }) {
  return (
    <mesh position={[0, 4, -10]}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshStandardMaterial color={study.accent_color} wireframe />
    </mesh>
  )
}
