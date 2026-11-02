import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from "three"

/**
 * Point sprites with GPU drift. `aSeed` gives each point its own speed and phase;
 * `uGather` (0..1) pulls them towards `uCenter` for the packet-formation moment.
 */
export function createParticleMaterial(color = "#22D3EE", size = 2.2) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uGather: { value: 0 },
      uCenter: { value: new Vector3() },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uGather;
      uniform vec3 uCenter;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * (0.2 + aSeed * 0.5) + aSeed * 40.0) * 0.6;
        p.x += cos(uTime * (0.15 + aSeed * 0.3) + aSeed * 17.0) * 0.4;
        p = mix(p, uCenter + (p - uCenter) * 0.02, smoothstep(0.0, 1.0, uGather));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uPixelRatio * (0.4 + aSeed) * (30.0 / -mv.z);
        vAlpha = 0.35 + 0.65 * aSeed;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float glow = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor * 2.0 * glow, glow * vAlpha);
      }
    `,
  })
}
