import { AdditiveBlending, Color, ShaderMaterial } from "three"

/** Infinite-looking floor grid: world-space lines, fading with distance from the camera. */
export function createGridMaterial(color = "#22D3EE") {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uTime: { value: 0 },
      uCell: { value: 2 },
      uFade: { value: 70 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uCell;
      uniform float uFade;
      varying vec3 vWorld;

      float lines(vec2 coord) {
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        return 1.0 - min(min(grid.x, grid.y), 1.0);
      }

      void main() {
        vec2 p = vWorld.xz;
        float minor = lines(p / uCell) * 0.35;
        float major = lines(p / (uCell * 5.0));
        float dist = length(cameraPosition.xz - p);
        float fade = 1.0 - smoothstep(uFade * 0.25, uFade, dist);
        // A pulse travelling down the corridor, like a request on the wire.
        float pulse = smoothstep(0.0, 1.0, 1.0 - abs(fract(-p.y * 0.02 - uTime * 0.25) - 0.5) * 2.0);
        float alpha = (minor + major) * fade * (0.45 + pulse * 0.55);
        gl_FragColor = vec4(uColor * (1.0 + major * 1.5), alpha);
      }
    `,
  })
}
