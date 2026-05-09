import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const BlackHoleMaterial = shaderMaterial(
  {
    uTime: 0,
    uScroll: 0,
    uMouse: new THREE.Vector3(0, 0, 0),
    uColorInner:  new THREE.Color('#FFF8F0'),
    uColorMid:    new THREE.Color('#FF7722'),
    uColorOuter:  new THREE.Color('#441100'),
    uColorAccent: new THREE.Color('#99CCFF'),
    uPixelRatio: 1.0,
    uSizeMultiplier: 1.0,
    uEventHorizonRadius: 3.0,
  },
  /* ── VERTEX SHADER ─────────────────────────────────────────────────── */
  `
    uniform float uTime;
    uniform float uScroll;
    uniform vec3  uMouse;
    uniform float uPixelRatio;
    uniform float uSizeMultiplier;
    uniform float uEventHorizonRadius;

    attribute float aScale;
    attribute float aRandomness;
    attribute float aAngle;
    attribute float aRadius;
    attribute float aSpeedOffset;

    varying float vAlpha;
    varying float vDistance;
    varying float vAngle;
    varying float vDoppler;

    /* ── compact hash + 2D value noise (no texture needed) ── */
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise2(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      f = f*f*(3.0 - 2.0*f);
      float a = hash(i.x + i.y*57.0);
      float b = hash(i.x+1.0 + i.y*57.0);
      float c = hash(i.x + (i.y+1.0)*57.0);
      float d = hash(i.x+1.0 + (i.y+1.0)*57.0);
      return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
    }

    void main() {

      /* ── 1. TIME-DILATED ORBITAL SPEED (scroll-reactive) ── */
      float normR    = (aRadius - uEventHorizonRadius) / 10.0;
      float timeW    = smoothstep(0.0, 1.0, normR);
      float baseSpeed = mix(0.012, 0.22, timeW) + aSpeedOffset * 0.025;

      /* Scroll accelerates orbits: inner disk accelerates MORE than outer.
         At full scroll, inner particles run ~2.5× faster, outer ~1.5×.
         This creates the feeling of increasing gravitational pressure. */
      float scrollAccel = 1.0 + uScroll * mix(1.5, 0.5, timeW);
      float speed = baseSpeed * scrollAccel;

      float currAngle = aAngle - uTime * speed;

      /* ── 2. BASE DISK WITH ORBITAL INCLINATION + GRAVITATIONAL BREATHING ── */
      float seed = aRandomness * 6.2831;

      /* Per-particle orbital inclination: tilts each orbit's plane slightly.
         This is the KEY fix for the "flat horizontal line" appearance.
         Each particle orbits in a slightly different plane → curved arcs when viewed
         from any angle. Amplitude: ±8° max, concentrated toward inner disk. */
      float inclinationAmp = exp(-aRadius * 0.18) * 0.14;   // stronger near BH
      float inclination    = (aRandomness * 2.0 - 1.0) * inclinationAmp;

      /* Y-breathing: each particle gently oscillates on its inclined orbit */
      float breathAmp = exp(-aRadius * 0.5) * 0.10;
      float breathY   = sin(uTime * 0.16 + seed) * breathAmp;

      /* Tiny radial pulse (spacetime contracting/expanding feel) */
      float radialPulse = sin(uTime * 0.055 + seed * 2.3) * 0.055;

      /* Gravitational compression: scroll tightens orbits toward the event horizon.
         At full scroll, orbits compress ~15% inward. Outer particles compress
         more than inner (they have more room to fall). */
      float scrollCompress = mix(1.0, 0.85, uScroll * smoothstep(0.0, 0.6, normR));
      float r = (aRadius + radialPulse) * scrollCompress;

      /* Inclined orbit: Y component from inclination + Z slightly foreshortened */
      float sinI = sin(inclination);
      float cosI = cos(inclination);
      vec3 pos = vec3(
        cos(currAngle) * r,
        sin(currAngle) * r * sinI + breathY,   // Y from inclination + breath
        sin(currAngle) * r * cosI               // Z slightly compressed by inclination
      );

      /* ── 3. GRAVITATIONAL LENSING ── */
      /* Physics: deflection angle α = 4GM/bc² ∝ 1/b               */
      /* We use a Gaussian peak at b ≈ photon-sphere (1.5 × R_s)   */
      /* to reproduce the bright upper arc.                          */
      /* Critically: per-particle noise breaks the mirror symmetry.  */
      if (pos.z < 0.0) {
        float b      = length(pos.xz);                    // impact parameter
        float bN     = b / (uEventHorizonRadius * 4.5);   // normalised

        /* Gaussian peak centred on photon orbit ≈ 0.5 normalised */
        float deflect = exp(-pow(bN - 0.52, 2.0) * 7.0);
        deflect      *= (1.0 - smoothstep(0.0, 1.0, bN)); // zero far out

        /* Two independent noise octaves for organic asymmetry */
        float n1  = noise2(vec2(aAngle * 1.7 + 4.3,  aRadius * 0.22)) * 0.3 + 0.72;
        float n2  = noise2(vec2(aAngle * 0.9 + 11.1, aRadius * 0.57)) * 0.2 + 0.88;
        deflect  *= n1 * n2;

        /* Lensing intensifies with scroll — spacetime bends harder.
           At full scroll, lensing is 60% stronger. */
        float lensingPower = 1.0 + uScroll * 0.6;
        pos.y += deflect * uEventHorizonRadius * 3.8 * lensingPower;
        pos.z += deflect * uEventHorizonRadius * 0.7 * lensingPower;
      }

      /* ── 4. CURSOR RIPPLE (heavy inertia, space-time elasticity) ── */
      vec3 mouseW = vec3(uMouse.x * 22.0, uMouse.y * 10.0, 0.0);
      float dm    = length(pos.xy - mouseW.xy);
      float rip   = smoothstep(9.0, 0.0, dm) * 0.65;
      pos        += normalize(vec3(pos.xy - mouseW.xy, 0.0)) * rip;

      /* ── 5. SCROLL DRIFT ── */
      pos.y -= uScroll * 9.0;

      /* ── 6. DOPPLER ── */
      vDoppler = sin(currAngle);

      /* ── 7. PROJECTION & SIZE ── */
      vec4 mvPos  = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;

      float sz = uSizeMultiplier * aScale * uPixelRatio * (12.0 / -mvPos.z);

      /* Doppler brightness variation (approaching side larger/brighter) */
      sz *= mix(0.5, 1.55, smoothstep(-1.0, 1.0, vDoppler));

      /* Relativistic time-dilation compression:
         Particles closest to the event horizon appear smaller — gravitationally
         compressed. This is almost imperceptible but creates subconscious weight. */
      float dilationFactor = mix(0.52, 1.0, smoothstep(0.0, 0.5, normR));
      sz *= dilationFactor;

      /* ── Angular orbital asymmetry (break left-right mirror symmetry) ──
         A single-harmonic density wave co-rotating with the disk.
         Period of the wave itself ≈ 140 seconds → imperceptibly slow rotation.
         sin(angle * 1.0) has ONE peak in 360°, so the disk is NOT mirrored:
         one side is persistently brighter/denser than the other at any instant.  */
      float densityWave = 1.0 + sin(currAngle - uTime * 0.045) * 0.20;
      sz *= max(densityWave, 0.3); // floor at 0.3 to avoid total disappearance

      /* Per-sector static brightness variance: 8 permanent angular sectors
         with individually hashed brightness offsets [0.82, 1.07].
         These never change, giving the disk a structural "clumpiness" that
         feels like real density variation in an accretion flow.               */
      float sector     = floor(aAngle / 6.2832 * 8.0); // integer 0-7
      float sectorBias = hash(sector + 31.7) * 0.25 + 0.82;
      sz *= sectorBias;

      gl_PointSize = sz;

      /* ── 8. ALPHA ── */
      vDistance = aRadius;
      vAngle    = currAngle;
      vAlpha    = smoothstep(uEventHorizonRadius, uEventHorizonRadius + 0.3, aRadius);
      vAlpha   *= smoothstep(30.0, 12.0, aRadius);

      /* Cull fully occluded particles */
      float cylR = length(pos.xz);
      if (pos.z < -0.2 && cylR < uEventHorizonRadius * 0.88 && pos.y < uEventHorizonRadius * 0.9) {
        vAlpha = 0.0;
      }
    }
  `,
  /* ── FRAGMENT SHADER ──────────────────────────────────────────────── */
  `
    uniform vec3  uColorInner;
    uniform vec3  uColorMid;
    uniform vec3  uColorOuter;
    uniform vec3  uColorAccent;
    uniform float uEventHorizonRadius;
    uniform float uScroll;

    varying float vAlpha;
    varying float vDistance;
    varying float vAngle;
    varying float vDoppler;

    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.07, d);

      /* Color bands: white rim → warm orange → dark amber */
      float t  = smoothstep(uEventHorizonRadius, uEventHorizonRadius + 11.0, vDistance);
      vec3 col = mix(uColorInner, uColorMid,  smoothstep(0.0, 0.35, t));
           col = mix(col,         uColorOuter, smoothstep(0.35, 1.0, t));

      /* Doppler: approaching side whiter/cooler, receding dimmer/redder */
      vec3 dop = mix(uColorOuter * 0.6, uColorInner, smoothstep(-1.0, 1.0, vDoppler));
      col      = mix(col, dop, 0.40);

      /* Cool plasma-jet accent (very rare) */
      float acc = sin(vAngle * 6.5 + 1.7) * cos(vDistance * 0.65);
      if (acc > 0.97) col = mix(col, uColorAccent, smoothstep(0.97, 1.0, acc) * 0.55);

      /* Tight rim bloom — intensifies with scroll (event horizon energy buildup) */
      float rim = 1.0 - smoothstep(uEventHorizonRadius, uEventHorizonRadius + 0.6, vDistance);
      float rimIntensity = 2.2 + uScroll * 1.8;  // up to 4.0 at full scroll
      col += col * rim * rimIntensity;

      /* Scroll shifts inner particles HOTTER (whiter), not cooler.
         Creates the feeling of increasing accretion energy. */
      vec3 hotShift = mix(uColorMid, uColorInner, 0.6);
      col = mix(col, hotShift, uScroll * 0.15 * (1.0 - smoothstep(0.0, 0.5, vDistance / uEventHorizonRadius)));

      gl_FragColor = vec4(col, vAlpha * alpha);
    }
  `
);
