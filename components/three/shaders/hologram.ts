import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from "three"

/** Fresnel rim + moving scanlines + flicker. `uActive` brightens hovered objects. */
export function createHologramMaterial(color = "#22D3EE") {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uTime: { value: 0 },
      uActive: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        #ifdef USE_INSTANCING
          world = modelMatrix * instanceMatrix * vec4(position, 1.0);
        #endif
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uActive;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vView)), 2.0);
        float scan = smoothstep(0.4, 0.5, sin(vWorld.y * 18.0 - uTime * 4.0) * 0.5 + 0.5) * 0.35;
        float flicker = 0.92 + 0.08 * sin(uTime * 37.0 + vWorld.x * 3.0);
        float strength = (fresnel * 1.6 + scan + 0.08) * flicker * (1.0 + uActive * 1.8);
        gl_FragColor = vec4(uColor * strength * 1.6, clamp(strength, 0.0, 1.0) * uOpacity);
      }
    `,
  })
}
