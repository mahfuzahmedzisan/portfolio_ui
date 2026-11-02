import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import { Color, MeshPhysicalMaterial } from "three"

const vertexShader = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vV = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    csm_Emissive = uColor * (fresnel * (1.3 + uGlow * 1.8) + 0.06 + uGlow * 0.18);
  }
`

/** Dark glossy body with an accent fresnel rim; `uGlow` (0..1) brightens it on hover/inspect. */
export function createRimMaterial(color: string) {
  return new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    vertexShader,
    fragmentShader,
    uniforms: { uColor: { value: new Color(color) }, uGlow: { value: 0 } },
    color: "#0a0f1c",
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 0.4,
    envMapIntensity: 0.45,
    toneMapped: false,
  })
}
