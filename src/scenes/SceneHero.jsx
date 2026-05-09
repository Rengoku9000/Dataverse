import { motion, useTransform } from 'framer-motion';
import { ScrollTimeline, DepthRules } from '../lib/MotionTokens';

export default function SceneHero({ scrollProgress, isMobile }) {
  const [start, end] = ScrollTimeline.scenes.hero;

  const opacity = useTransform(scrollProgress, [start, end], [1, 0]);
  const scale = useTransform(scrollProgress, [start, end], [1, DepthRules.foregroundScaleMin]);
  // Use a slight translateZ for GPU acceleration
  const z = useTransform(scrollProgress, [start, end], [0, -50]);
  const filter = useTransform(scrollProgress, [start, end], ['blur(0px)', `blur(${DepthRules.backgroundBlurMax}px)`]);

  // Typography letter spacing (tracking) expands slightly as you scroll down
  const letterSpacing = useTransform(scrollProgress, [start, end], ['-0.02em', '0.08em']);

  const pointerEvents = useTransform(scrollProgress, (v) => v > end ? 'none' : 'auto');
  
  // Extremely restrained glow — let the singularity dominate
  const textShadow = useTransform(
    scrollProgress,
    [start, end],
    [
      '0px 0px 14px rgba(255, 240, 220, 0.06)',
      '0px 0px 28px rgba(255, 220, 180, 0.14), 0px 0px 60px rgba(200, 100, 30, 0.08)'
    ]
  );

  return (
    <motion.div
      style={{
        opacity,
        scale,
        z,
        filter: isMobile ? 'none' : filter, // Save GPU on mobile
        pointerEvents,
        willChange: 'transform, opacity, filter'
      }}
      className="absolute inset-0 flex flex-col items-center justify-end pb-[15vh] pointer-events-auto"
    >
      <div className="z-10 text-center flex flex-col items-center justify-center px-4 w-full">
        {/* Subtle gravitational distortion layer behind the text */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.4)_0%,_transparent_70%)] pointer-events-none mix-blend-multiply" />
        
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          style={{ letterSpacing, textShadow }}
          className="text-5xl md:text-6xl lg:text-[6rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/90 via-[#FFEDD5]/85 to-[#CC4400]/55 mb-8 will-change-transform font-display tracking-[0.25em]"
        >
          DATAVERSE
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 1.2 }}
          className="text-xs md:text-sm text-[#FFEDD5]/38 max-w-2xl font-light tracking-[0.35em] uppercase text-center"
        >
          Exploring the future through <br/> data, AI & innovation.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#FFEDD5]/40 font-medium">
          Descend
        </span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#FFEDD5]/20 to-transparent mt-2 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-1/2 bg-[#FFEDD5]/80 blur-[1px]"
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
