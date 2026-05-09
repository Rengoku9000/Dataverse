import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const VortexMaterial = shaderMaterial(
  {
    uTime: 0,
    uScroll: 0,
    uMouse: new THREE.Vector3(0, 0, 0),
    uColorBase: new THREE.Color('#00E5FF'),
    uColorAccent: new THREE.Color('#8A2BE2'),
    uPixelRatio: 1.0,
    uSizeMultiplier: 1.0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uScroll;
    uniform vec3 uMouse;
    uniform float uPixelRatio;
    uniform float uSizeMultiplier;
    
    attribute float aScale;
    attribute float aRandomness;
    attribute float aAngle;
    attribute float aRadius;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;

    // Simplex 3D Noise function for Curl Noise Turbulence
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    vec3 curlNoise(vec3 p) {
      float e = 0.1;
      vec3 dx = vec3(e, 0.0, 0.0);
      vec3 dy = vec3(0.0, e, 0.0);
      vec3 dz = vec3(0.0, 0.0, e);

      vec3 p_x0 = vec3(snoise(p - dx), snoise(p - dx + vec3(12.34)), snoise(p - dx + vec3(34.56)));
      vec3 p_x1 = vec3(snoise(p + dx), snoise(p + dx + vec3(12.34)), snoise(p + dx + vec3(34.56)));
      vec3 p_y0 = vec3(snoise(p - dy), snoise(p - dy + vec3(12.34)), snoise(p - dy + vec3(34.56)));
      vec3 p_y1 = vec3(snoise(p + dy), snoise(p + dy + vec3(12.34)), snoise(p + dy + vec3(34.56)));
      vec3 p_z0 = vec3(snoise(p - dz), snoise(p - dz + vec3(12.34)), snoise(p - dz + vec3(34.56)));
      vec3 p_z1 = vec3(snoise(p + dz), snoise(p + dz + vec3(12.34)), snoise(p + dz + vec3(34.56)));

      float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
      float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
      float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

      return normalize(vec3(x, y, z) / (2.0 * e));
    }

    void main() {
      // Base spiral position
      float currentRadius = aRadius + sin(uTime * 0.2 + aRandomness) * 0.5;
      float currentAngle = aAngle - (uTime * (1.0 + aRandomness * 0.5) / currentRadius) * 2.0; // Inner spins faster
      
      // Calculate 3D position
      vec3 newPosition = vec3(
        cos(currentAngle) * currentRadius,
        sin(currentAngle) * currentRadius,
        position.z
      );

      // Scroll Distortion: Expands the vortex and shifts it subtly
      newPosition.x += sin(uScroll * 3.14 + aRandomness) * 2.0;
      newPosition.y += cos(uScroll * 3.14 + aRandomness) * 2.0;
      newPosition.z += uScroll * 5.0 * aRandomness;

      // Curl Noise Turbulence (Organic Fluid Motion)
      vec3 noisePos = newPosition * 0.1 + uTime * 0.1;
      vec3 noise = curlNoise(noisePos) * 1.5;
      newPosition += noise;

      // Cursor Repulsion (Gentle ripple/spring-back)
      // We map the mouse (-1 to 1) to world space approx
      vec3 mouseWorld = vec3(uMouse.x * 15.0, uMouse.y * 15.0, 0.0);
      float distToMouse = distance(newPosition.xy, mouseWorld.xy);
      
      float repulsionForce = smoothstep(5.0, 0.0, distToMouse) * 2.0;
      vec3 repulsionDir = normalize(vec3(newPosition.xy - mouseWorld.xy, 0.0));
      newPosition += repulsionDir * repulsionForce;

      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size calculation with perspective
      gl_PointSize = uSizeMultiplier * aScale * uPixelRatio * (15.0 / -mvPosition.z);

      // Varyings for fragment shader
      vDistance = currentRadius;
      
      // Calculate Alpha (Dark Event Horizon at center)
      // Fade out strongly near radius 0.0 to 2.0
      vAlpha = smoothstep(2.0, 5.0, currentRadius);
      // Fade out at extreme edges too
      vAlpha *= smoothstep(25.0, 15.0, currentRadius);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorAccent;
    uniform float uScroll;

    varying float vAlpha;
    varying float vDistance;

    void main() {
      // Soft particle circle
      float distToCenter = distance(gl_PointCoord, vec2(0.5));
      if (distToCenter > 0.5) discard;
      
      // Soft edge alpha
      float particleAlpha = smoothstep(0.5, 0.1, distToCenter);

      // Color mixing based on distance from center and scroll
      float mixRatio = smoothstep(2.0, 15.0, vDistance);
      mixRatio += uScroll * 0.5; // Shifts to accent color as you scroll
      
      vec3 finalColor = mix(uColorBase, uColorAccent, clamp(mixRatio, 0.0, 1.0));

      // Boost brightness for bloom
      finalColor *= 1.5;

      gl_FragColor = vec4(finalColor, vAlpha * particleAlpha);
    }
  `
);
