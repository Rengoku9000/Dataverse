import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ─── Photon Ring Shader ──────────────────────────────────────────────────────
// Three independent noise layers — "feels organic" vs "mathematically generated"
export const PhotonRingMaterial = shaderMaterial(
  { uTime: 0 },
  /* vertex */
  `
    varying float vAngle;
    void main() {
      // Angle position along the ring circumference
      vAngle = atan(position.y, position.x);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */
  `
    uniform float uTime;
    varying float vAngle;

    // Two independent hash functions to prevent pattern repetition
    float hash(float n)  { return fract(sin(n) * 43758.5453); }
    float hash2(float n) { return fract(cos(n) * 17341.9127); }

    void main() {

      // ── Layer 1: slow orbital drift (plasma currents) ──
      // Two offset sine waves at different frequencies give a gentle non-repeating wave
      float L1 = sin(vAngle * 2.0 + uTime * 0.13) * 0.09
               + sin(vAngle * 3.7 - uTime * 0.19) * 0.06;

      // ── Layer 2: mid-frequency structural variation ──
      // Creates the sense of density bands in the photon sphere
      float L2 = sin(vAngle * 6.0 + uTime * 0.06) * 0.04
               + sin(vAngle * 9.3 - uTime * 0.04) * 0.025;

      // ── Layer 3: microscopic turbulence (subconscious flicker) ──
      // Discretised time: produces tiny discontinuous jumps that feel physically unstable
      float tBin = floor(uTime * 2.5);
      float angBin = floor(vAngle * 52.0 / 6.2831); // 52 sectors around the ring
      float micro = (hash(angBin + tBin * 97.3) - 0.5) * 0.06
                  + (hash2(angBin * 1.3 + tBin * 43.7) - 0.5) * 0.03;

      float brightness = 0.82 + L1 + L2 + micro;
      brightness = clamp(brightness, 0.55, 1.18); // prevent clipping either way

      // ── Relativistic Doppler + Interstellar bottom-brightening ──
      // In Interstellar, the bottom of the disk is brighter due to relativistic beaming.
      // cos(vAngle) selects left/right, sin(vAngle) selects top/bottom.
      // Bottom is sin(vAngle) < 0 → use -sin for "bottom approaching" brightening.
      float dopplerLR     = smoothstep(-1.0, 1.0,  cos(vAngle)) * 0.12; // left = brighter
      float interstellarB = smoothstep(-1.0, 0.0, -sin(vAngle)) * 0.10; // bottom = brighter

      vec3 col = vec3(1.0, 0.95, 0.84); // warm near-white base

      // Shift brighter areas cooler (bluer-white), dimmer areas warmer (amber)
      col = mix(col, vec3(0.92, 0.97, 1.0),  dopplerLR);
      col = mix(col, vec3(1.0,  0.82, 0.5),  smoothstep(0.0, 1.0, -cos(vAngle)) * 0.18);
      col = mix(col, vec3(1.0,  0.98, 0.88), interstellarB);

      float totalBrightness = brightness + dopplerLR * 0.1 + interstellarB * 0.08;

      // Global luminosity breathe — two superimposed sines create non-repeating variation.
      // Periods ≈ 8s and 20s. Amplitude 4%+2% = barely perceptible, feels alive not animated.
      float globalBreathe = 1.0 + sin(uTime * 0.785) * 0.04
                                + sin(uTime * 0.314) * 0.02;
      totalBrightness *= globalBreathe;

      gl_FragColor = vec4(col * totalBrightness, clamp(totalBrightness * 0.92, 0.0, 1.0));
    }
  `
);

// ─── Gravitational Haze Shader ───────────────────────────────────────────────
// Warm volumetric atmospheric glow behind the singularity.
// Deliberately off-center and angularly asymmetric — NOT a spotlight.
export const HazeMaterial = shaderMaterial(
  { uTime: 0, uScroll: 0 },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uScroll;
    varying vec2 vUv;

    float hash(float n) { return fract(sin(n) * 43758.5453); }

    // Low-quality but cheap 2D noise for cloud-like density variation
    float noise2(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      f = f*f*(3.0 - 2.0*f);
      float a = hash(i.x + i.y * 57.0);
      float b = hash(i.x + 1.0 + i.y * 57.0);
      float c = hash(i.x + (i.y + 1.0) * 57.0);
      float d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      // ── Deliberately off-center gravity source ──
      // Real astrophysical halos are not perfectly centered relative to the observer.
      // We shift the glow center slightly to break the bullseye symmetry.
      vec2 center = vUv - vec2(0.47, 0.52); // subtle off-center
      float r = length(center);

      // ── Radial falloff: concentrated glow, hard-faded edges ──
      float glow = pow(1.0 - smoothstep(0.0, 0.45, r), 3.5);

      // ── Angular density variation (not a circle) ──
      float angle = atan(center.y, center.x);

      // Three angular harmonics at prime-number frequencies = non-repeating look
      float angVar  = 0.75
                    + 0.14 * sin(angle * 2.0 + uTime * 0.09)
                    + 0.08 * sin(angle * 5.0 - uTime * 0.07)
                    + 0.05 * sin(angle * 11.0 + uTime * 0.04);

      // ── Slow turbulent density drift (cloud-like, NOT spinning) ──
      float cloudNoise = noise2(center * 3.5 + uTime * 0.04) * 0.25 + 0.75;

      // ── Directional light imbalance: brighter on lower-left (Doppler analog) ──
      // Matches the Interstellar lower-left brightening without being obvious
      float directional = 1.0 - smoothstep(0.0, 0.7, center.x) * 0.2
                               + smoothstep(0.0, 0.5, -center.y) * 0.12;

      vec3 col = mix(
        vec3(1.0, 0.55, 0.15),    // hot inner: bright orange
        vec3(0.25, 0.06, 0.0),    // dim outer: deep dark amber
        smoothstep(0.0, 0.38, r)
      );

      float alpha = glow * angVar * cloudNoise * directional * 0.16 * (1.0 - uScroll * 0.5);
      alpha = clamp(alpha, 0.0, 0.18);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

// ─── Star Field Material ───────────────────────────────────────────────────────────────────────
// Applies Schwarzschild-approximated gravitational lensing to the background
// starfield, bending stars near the black hole’s sight-line outward.
// Also adds an imperceptibly slow cosmic drift so the field never feels frozen.
export const StarFieldMaterial = shaderMaterial(
  { uTime: 0 },
  /* vertex — lensing computed in view space so it’s always current per-frame */
  `
    uniform float uTime;

    void main() {

      // Very slow cosmic drift: period ≈ 200 seconds, barely perceptible
      // Rotates the entire star sphere so it never feels like a static texture
      float drift = uTime * 0.0314; // 2π / 200 rad/s
      float cosD  = cos(drift);
      float sinD  = sin(drift);
      vec3 dPos   = vec3(
        position.x * cosD - position.z * sinD,
        position.y,
        position.x * sinD + position.z * cosD
      );

      // Transform star into camera (view) space
      vec4 starView = modelViewMatrix * vec4(dPos, 1.0);

      // Black hole world position = (0, 2.0, 0) transformed into view space
      vec4 bhView = viewMatrix * vec4(0.0, 2.0, 0.0, 1.0);

      // 2D angular offset between star and BH in camera-plane (XY)
      vec2 offset = starView.xy - bhView.xy;
      float dist  = length(offset);

      // Schwarzschild-inspired lensing: deflect stars near the BH sight-line outward.
      // Reduced deflection to match the 40% smaller visual BH size.
      if (dist > 0.3 && dist < 8.0) {
        float deflect = 1.1 / dist;          // ~Schwarzschild 1/b, scaled down
        deflect       = min(deflect, 1.8);   // cap
        starView.xy  += normalize(offset) * deflect;
      }

      gl_Position  = projectionMatrix * starView;
      gl_PointSize = 1.5; // small, consistent
    }
  `,
  /* fragment — dim cool-white spark */
  `
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if (d > 0.5) discard;
      // Soft-edged spark: max opacity 0.32, falls off cleanly
      float a = smoothstep(0.5, 0.15, d) * 0.32;
      // Slightly cool white (bluish) to feel distant
      gl_FragColor = vec4(0.84, 0.91, 1.0, a);
    }
  `
);
