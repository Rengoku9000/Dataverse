import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BlackHoleMaterial } from '../shaders/BlackHoleShader';
import { PhotonRingMaterial, HazeMaterial, StarFieldMaterial } from '../shaders/AtmosphericShaders';

extend({ BlackHoleMaterial, PhotonRingMaterial, HazeMaterial, StarFieldMaterial });

/* ── Starfield with Gravitational Lensing ──────────────────────────────────
   Background stars that appear to bend around the black hole sight-line,
   plus an imperceptibly slow cosmic drift so the field never feels frozen.   */
function StarField({ scrollProgress, scrollVelocity }) {
  const matRef = useRef();
  const COUNT  = 1800;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 40 + Math.random() * 60;
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useEffect(() => {
    if (!scrollProgress) return;
    const unsubP = scrollProgress.on('change', v => {
      if (matRef.current) matRef.current.uScroll = v;
    });
    const unsubV = scrollVelocity ? scrollVelocity.on('change', v => {
      if (matRef.current) matRef.current.uVelocity = v;
    }) : () => {};
    return () => { unsubP(); unsubV(); };
  }, [scrollProgress, scrollVelocity]);

  // Tick uTime — drives the slow drift + lensing is auto-updated via viewMatrix
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uTime = clock.elapsedTime;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <starFieldMaterial
        ref={matRef}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ── Gravitational Haze ─────────────────────────────────────────────────────
   A large plane facing the camera, behind the black hole, with a warm radial
   glow. Creates the sense of volumetric scattered light / accretion energy.  */
function GravitationalHaze({ scrollProgress, scrollVelocity }) {
  const matRef = useRef();

  useEffect(() => {
    if (!scrollProgress) return;
    const unsubP = scrollProgress.on('change', v => {
      if (matRef.current) matRef.current.uScroll = v;
    });
    const unsubV = scrollVelocity ? scrollVelocity.on('change', v => {
      if (matRef.current) matRef.current.uVelocity = v;
    }) : () => {};
    return () => { unsubP(); unsubV(); };
  }, [scrollProgress, scrollVelocity]);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uTime = clock.elapsedTime;
  });

  return (
    <mesh position={[0, 0, -0.5]}>
      {/* Large plane — will be behind the black hole sphere */}
      <planeGeometry args={[30, 30, 1, 1]} />
      <hazeMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ── Event Horizon Edge Diffusion ───────────────────────────────────────────
   A soft outer shell slightly larger than the core — creates an atmospheric
   "gravity edge" dissolving into darkness rather than a sharp vector boundary */
function EventHorizonEdge() {
  return (
    <mesh>
      {/* Slightly larger than the solid black sphere */}
      <sphereGeometry args={[3.05, 64, 64]} />
      <meshBasicMaterial
        color="#140808"
        transparent
        opacity={0.55}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ── Event Horizon Core ─────────────────────────────────────────────────────
   Perfectly black, perfectly smooth. No noise, no shader.                    */
function EventHorizon() {
  return (
    <mesh>
      <sphereGeometry args={[2.95, 128, 128]} />
      <meshBasicMaterial color="#000000" depthWrite />
    </mesh>
  );
}

/* ── Photon Sphere ──────────────────────────────────────────────────────────
   Non-uniform glowing ring using the PhotonRingMaterial shader.
   Two rings: a razor inner (bright) and a soft outer halo (dim).             */
function PhotonSphere({ scrollProgress, scrollVelocity }) {
  const innerRef = useRef();
  const outerRef = useRef();
  const hazeRef  = useRef();

  useEffect(() => {
    if (!scrollProgress) return;
    const unsubP = scrollProgress.on('change', v => {
      if (innerRef.current) innerRef.current.material.uScroll = v;
      if (outerRef.current) outerRef.current.material.uScroll = v;
    });
    const unsubV = scrollVelocity ? scrollVelocity.on('change', v => {
      if (innerRef.current) innerRef.current.material.uVelocity = v;
      if (outerRef.current) outerRef.current.material.uVelocity = v;
    }) : () => {};
    return () => { unsubP(); unsubV(); };
  }, [scrollProgress, scrollVelocity]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (innerRef.current) innerRef.current.material.uTime = t;
    if (outerRef.current) outerRef.current.material.uTime = t;
    // Very slow luminosity breath
    const lum = 0.85 + Math.sin(t * 0.3) * 0.07;
    if (hazeRef.current) hazeRef.current.material.opacity = lum * 0.28;
  });

  return (
    <group>
      {/* Razor bright inner ring */}
      <mesh ref={innerRef}>
        <ringGeometry args={[2.96, 3.03, 256]} />
        <photonRingMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft outer glow halo — wider, much dimmer */}
      <mesh ref={hazeRef}>
        <ringGeometry args={[2.88, 3.15, 128]} />
        <meshBasicMaterial
          color="#FF9944"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ── Accretion Layer ────────────────────────────────────────────────────────
   Reusable particle layer. densityExp controls particle distribution:
   higher = more concentrated near the inner edge.                            */
function AccretionLayer({ count, sizeMultiplier, radiusRange, densityExp, scrollProgress, scrollVelocity, isMobile }) {
  const matRef = useRef();
  const { mouse } = useThree();
  const spring = useMemo(() => new THREE.Vector3(), []);

  const n = isMobile ? Math.floor(count * 0.4) : count;

  const attrs = useMemo(() => {
    const pos   = new Float32Array(n * 3);
    const scale = new Float32Array(n);
    const rand  = new Float32Array(n);
    const ang   = new Float32Array(n);
    const rad   = new Float32Array(n);
    const spd   = new Float32Array(n);
    const [rMin, rMax] = radiusRange;
    const exp = densityExp ?? 3.5;

    for (let i = 0; i < n; i++) {
      const a  = Math.random() * Math.PI * 2;
      const r  = rMin + Math.pow(Math.random(), exp) * (rMax - rMin);
      const yV = Math.exp(-r * 0.45) * 0.05 * (Math.random() - 0.5);
      pos[i*3]   = Math.cos(a) * r;
      pos[i*3+1] = yV;
      pos[i*3+2] = Math.sin(a) * r;
      scale[i] = 0.3 + Math.random() * 0.7;
      rand[i]  = Math.random();
      ang[i]   = a;
      rad[i]   = r;
      spd[i]   = (Math.random() - 0.5) * 0.09;
    }
    return { pos, scale, rand, ang, rad, spd };
  }, [n, radiusRange, densityExp]);

  useEffect(() => {
    if (!scrollProgress) return;
    const unsubP = scrollProgress.on('change', v => {
      if (matRef.current) matRef.current.uScroll = v;
    });
    const unsubV = scrollVelocity ? scrollVelocity.on('change', v => {
      if (matRef.current) matRef.current.uVelocity = v;
    }) : () => {};
    return () => { unsubP(); unsubV(); };
  }, [scrollProgress, scrollVelocity]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uTime = clock.elapsedTime;
    if (!isMobile) {
      spring.lerp(new THREE.Vector3(mouse.x, mouse.y, 0), 0.018);
      matRef.current.uMouse.copy(spring);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"    count={n} array={attrs.pos}   itemSize={3} />
        <bufferAttribute attach="attributes-aScale"      count={n} array={attrs.scale} itemSize={1} />
        <bufferAttribute attach="attributes-aRandomness" count={n} array={attrs.rand}  itemSize={1} />
        <bufferAttribute attach="attributes-aAngle"      count={n} array={attrs.ang}   itemSize={1} />
        <bufferAttribute attach="attributes-aRadius"     count={n} array={attrs.rad}   itemSize={1} />
        <bufferAttribute attach="attributes-aSpeedOffset" count={n} array={attrs.spd}  itemSize={1} />
      </bufferGeometry>
      <blackHoleMaterial
        ref={matRef}
        transparent depthWrite={false}
        blending={THREE.AdditiveBlending}
        uPixelRatio={Math.min(window.devicePixelRatio, 2)}
        uSizeMultiplier={sizeMultiplier}
        uEventHorizonRadius={3.0}
      />
    </points>
  );
}

/* ── Adaptive Camera ───────────────────────────────────────────────────────
   Adjusts camera Z-distance based on viewport aspect ratio so the black hole
   composition remains fully visible with GENEROUS negative space on every
   screen — from ultrawide monitors to mobile phones.

   The black hole should feel DISTANT and massive, not close to the camera.
   Wider screens → camera pulls aggressively further back.
   Uses smooth lerp so the transition feels gravitational, not jumpy.        */
function AdaptiveCamera({ scrollProgress }) {
  const { camera, size } = useThree();
  const scrollRef = useRef(0);
  const timeRef = useRef(0);

  // Smooth out the scroll value so camera movements don't jerk
  useFrame((state, delta) => {
    // Spring physics: current + (target - current) * stiffness
    // scrollProgress is a Framer Motion MotionValue, so we must call .get()
    const currentScroll = scrollProgress ? scrollProgress.get() : 0;
    scrollRef.current += (currentScroll - scrollRef.current) * 0.05;
    const smoothScroll = scrollRef.current;

    // Accumulate time for microscopic space drift
    timeRef.current += delta;
    const t = timeRef.current;

    const aspect = size.width / size.height;

    // Base Z for the frontal view (scroll = 1.0)
    const baseZ = 58;

    // Aspect ratio scaling for the final frontal view
    let targetZ;
    if (aspect >= 2.0) {
      targetZ = baseZ + (aspect - 2.0) * 15;
    } else if (aspect >= 1.2) {
      targetZ = baseZ + (aspect - 1.78) * 8;
    } else {
      targetZ = baseZ - (1.2 - aspect) * 12;
      targetZ = Math.max(targetZ, 38);
    }

    /* ── Cinematic Orbital Descent ──
       Start (scroll=0): Camera is high up (Y=22), looking down.
       End (scroll=1): Camera is front-facing (Y=2.0), looking straight. */
    const startY = 22.0;
    const endY = 2.0;
    
    // Smooth cosine interpolation for the orbital arc (ease-in-out feel)
    // When smoothScroll=0 -> cos(0)=1 -> t=0
    // When smoothScroll=1 -> cos(PI)= -1 -> t=1
    const arcT = (1.0 - Math.cos(smoothScroll * Math.PI)) * 0.5;

    // Interpolate Y
    const currentY = startY + (endY - startY) * arcT;

    // For Z, we start slightly closer (since we are high up) and orbit outward to the baseZ
    // This creates a spherical sweep rather than a linear diagonal drop.
    const startZ = targetZ * 0.5; 
    const currentZ = startZ + (targetZ - startZ) * Math.sin(smoothScroll * Math.PI * 0.5);

    /* ── Microscopic Idle Drift (Space Inertia) ── */
    // Extremely slow, imperceptible floating motion
    const driftX = Math.sin(t * 0.2) * 0.8;
    const driftY = Math.cos(t * 0.15) * 0.6;
    const driftZ = Math.sin(t * 0.1) * 1.2;

    // Smooth gravitational lerp — no jumps on resize
    camera.position.x += ((0 + driftX) - camera.position.x) * 0.08;
    camera.position.y += ((currentY + driftY) - camera.position.y) * 0.08;
    camera.position.z += ((currentZ + driftZ) - camera.position.z) * 0.08;

    // Lock camera focus perfectly on the singularity center.
    // As the camera descends, this forces the background parallax to rotate naturally.
    camera.lookAt(0, 2.0, 0);

    camera.updateProjectionMatrix();
  });

  return null;
}

/* ── Root ───────────────────────────────────────────────────────────────── */
export default function BackgroundParticles({ scrollProgress, scrollVelocity, isMobile }) {
  return (
    <div className="absolute inset-0" style={{ transform: 'translateZ(0)' }}>
      <Canvas
        camera={{ position: [0, 22.0, 30], fov: 22, near: 0.1, far: 300 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#010104']} />

        {/* Responsive camera controller */}
        <AdaptiveCamera scrollProgress={scrollProgress} />

        {/* Cosmic starfield — vast and quiet feeling (NOT affected by group scale) */}
        <StarField scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />

        {/* All black hole geometry scaled down 40% — occupies ~25-30% of viewport.
            The scale prop reduces ALL child geometry proportionally without
            touching any shader math. Position Y=2.0 to center the scaled
            composition slightly above viewport mid-point. */}
        <group position={[0, 2.0, 0]} scale={0.6}>

          {/* Volumetric haze — sits behind the sphere */}
          <GravitationalHaze scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />

          {/* The perfectly black core — occluder for everything behind it */}
          <EventHorizon />

          {/* Soft edge diffusion sphere — atmospheric dark falloff */}
          <EventHorizonEdge />

          {/* Glowing photon ring with brightness asymmetry */}
          <PhotonSphere scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />

          {/* ── Three particle depth layers ── */}

          {/* Innermost: ultra-dense, prominent, time-dilated */}
          <AccretionLayer
            count={4000}
            sizeMultiplier={1.2}
            radiusRange={[3.02, 7.5]}
            densityExp={5.0}
            scrollProgress={scrollProgress}
            scrollVelocity={scrollVelocity}
            isMobile={isMobile}
          />

          {/* Mid disk: main visual orbital band */}
          <AccretionLayer
            count={3000}
            sizeMultiplier={1.4}
            radiusRange={[6, 14]}
            densityExp={3.0}
            scrollProgress={scrollProgress}
            scrollVelocity={scrollVelocity}
            isMobile={isMobile}
          />

          {/* Outer dust haze: sparse, faint, cinematic breathing room */}
          <AccretionLayer
            count={700}
            sizeMultiplier={0.8}
            radiusRange={[12, 26]}
            densityExp={1.5}
            scrollProgress={scrollProgress}
            scrollVelocity={scrollVelocity}
            isMobile={isMobile}
          />
        </group>

        {/* Postprocessing: photographic, NOT neon */}
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom
            luminanceThreshold={0.28}
            luminanceSmoothing={0.91}
            intensity={0.85}
            mipmapBlur
          />
          <Noise opacity={0.018} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}


