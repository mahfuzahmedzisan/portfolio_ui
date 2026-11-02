import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from "three"

/**
 * Pulses travelling along a tube's U coordinate. Strands are merged into one
 * geometry, so each carries its own phase in the per-vertex `aPhase` attribute.
 */
export function createDataFlowMaterial(color = "#A5F3FC") {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uTime: { value: 0 },
      uSpeed: { value: 0.6 },
      uDensity: { value: 6 },
      uBoost: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      varying vec2 vUv;
      varying float vPhase;
      void main() {
        vUv = uv;
        vPhase = aPhase;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uDensity;
      uniform float uBoost;
      varying vec2 vUv;
      varying float vPhase;
      void main() {
        float x = fract(vUv.x * uDensity - uTime * (uSpeed + uBoost) - vPhase);
        float head = smoothstep(0.9, 1.0, x);
        float tail = pow(x, 6.0) * 0.35;
        float base = 0.025;
        float intensity = (head * 1.8 + tail + base) * (1.0 + uBoost * 0.6);
        gl_FragColor = vec4(uColor * intensity, clamp(intensity, 0.0, 1.0));
      }
    `,
  })
}
