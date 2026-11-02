import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import { MeshPhysicalMaterial } from "three"

const vertexShader = /* glsl */ `
  attribute vec4 aShape;
  attribute vec3 aColor;
  attribute float aGlow;
  varying float vGlow;
  varying vec3 vTint;
  varying vec3 vViewPos;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }

  void main() {
    vec3 p = position;
    float h = p.y;
    p.y *= aShape.x;
    p.xz *= mix(1.0, aShape.z, clamp(abs(h), 0.0, 1.0));
    float a = aShape.y * h;
    p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
    // Hashing the undeformed position keeps coincident vertices of a flat-shaded mesh together.
    p += normalize(position + 1e-4) * (hash(floor(position * 5.0) + aShape.w) - 0.5) * 0.22;
    csm_Position = p;
    vGlow = aGlow;
    vTint = aColor;
    vViewPos = (modelViewMatrix * instanceMatrix * vec4(p, 1.0)).xyz;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vGlow;
  varying vec3 vTint;
  varying vec3 vViewPos;
  void main() {
    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    float fresnel = pow(1.0 - abs(dot(n, normalize(-vViewPos))), 2.5);
    float lit = max(vGlow, 0.0);
    float dim = clamp(-vGlow, 0.0, 1.0);
    float shimmer = 0.85 + 0.15 * sin(uTime * 3.0 + vViewPos.y * 6.0);
    csm_Emissive = vTint * (fresnel * (2.4 + lit * 1.6) + 0.1 + lit * 0.55) * shimmer * (1.0 - dim * 0.85);
  }
`

/**
 * One material for every archive crystal. Per-instance `aShape` (stretch, twist, taper, seed)
 * deforms a shared base so each project gets its own silhouette in a single draw call.
 */
export function createInstancedCrystalMaterial() {
  return new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 } },
    color: "#0b1020",
    metalness: 0.2,
    roughness: 0.08,
    clearcoat: 1,
    flatShading: true,
    toneMapped: false,
  })
}
