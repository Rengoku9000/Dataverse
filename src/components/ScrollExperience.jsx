import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { motion, useScroll, useSpring, useVelocity } from 'framer-motion';
import { ScrollTimeline } from '../lib/MotionTokens';

// Import Scenes
import SceneHero from '../scenes/SceneHero';
import SceneAbout from '../scenes/SceneAbout';
import SceneInstitution from '../scenes/SceneInstitution';
import SceneProjects from '../scenes/SceneProjects';
import SceneCTA from '../scenes/SceneCTA';
import BackgroundParticles from './BackgroundParticles';

export default function ScrollExperience() {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Lenis for smooth inertial scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5, // slightly longer duration for cinematic feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like ease
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 0.8, // Slightly heavier mouse feel
      smoothTouch: false, // Touch devices use native momentum
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });

  // VERY selective use of spring for global background / lighting
  // We DO NOT use this on every UI element, just on the large background shifts
  const globalProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const timelineHeight = isMobile ? ScrollTimeline.mobileHeight : ScrollTimeline.totalHeight;

  return (
    <div ref={containerRef} style={{ height: timelineHeight }} className="relative w-full bg-background">
      {/* Background stays completely fixed */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundParticles scrollProgress={globalProgress} scrollVelocity={smoothVelocity} isMobile={isMobile} />
      </div>

      {/* The sticky viewport that renders scenes in place */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-10 pointer-events-none">
        <div className="absolute inset-0 w-full h-full pointer-events-auto">
          {/* Scenes receive raw scrollYProgress to manage their own optimal transforms */}
          <SceneHero scrollProgress={scrollYProgress} isMobile={isMobile} />
          <SceneAbout scrollProgress={scrollYProgress} isMobile={isMobile} />
          <SceneInstitution scrollProgress={scrollYProgress} isMobile={isMobile} />
          <SceneProjects scrollProgress={scrollYProgress} isMobile={isMobile} />
          <SceneCTA scrollProgress={scrollYProgress} isMobile={isMobile} />
        </div>
        
        {/* Global Lighting Overlay based on scroll progress */}
        <GlobalLighting scrollProgress={globalProgress} />
      </div>
    </div>
  );
}

// Cinematic Lighting Evolution
function GlobalLighting({ scrollProgress }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-screen"
      style={{
        background: 'radial-gradient(circle at 50% 50%, var(--glow-color, rgba(0, 229, 255, 0.05)), transparent 70%)',
        opacity: scrollProgress // Very basic mapping, actual mapping should interpolate colors
      }}
    />
  );
}
