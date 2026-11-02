import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from "three"

/** A laser band sweeping up and down a plane: the gateway's auth check on the packet. */
export function createScannerMaterial(color = "#E5E7EB") {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uTime: { value: 0 },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float sweep = 0.5 + 0.5 * sin(uTime * 1.6);
        float band = exp(-pow((vUv.y - sweep) * 28.0, 2.0));
        float edge = smoothstep(0.48, 0.5, abs(vUv.x - 0.5)) + smoothstep(0.48, 0.5, abs(vUv.y - 0.5));
        float grid = step(0.94, fract(vUv.x * 24.0)) * 0.08 + step(0.94, fract(vUv.y * 24.0)) * 0.08;
        float strength = (band * 2.5 + edge * 0.8 + grid) * uIntensity;
        gl_FragColor = vec4(uColor * strength, clamp(strength, 0.0, 1.0) * 0.9);
      }
    `,
  })
}
