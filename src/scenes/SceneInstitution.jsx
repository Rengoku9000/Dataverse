import { motion, useTransform } from 'framer-motion';
import { ScrollTimeline, DepthRules } from '../lib/MotionTokens';

export default function SceneInstitution({ scrollProgress, isMobile }) {
  const [start, end] = ScrollTimeline.scenes.institution;
  const peak = start + (end - start) / 2;

  // Fade in from darkness, overlapping slightly with the end of About
  const opacity = useTransform(scrollProgress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
  const scale = useTransform(scrollProgress, [start, peak, end], [1.05, 1, DepthRules.foregroundScaleMin]);
  
  // Parallax the two columns in opposite directions for depth
  const yLeft = useTransform(scrollProgress, [start, end], [150, -150]);
  const yRight = useTransform(scrollProgress, [start, end], [-150, 150]);

  return (
    <motion.div
      style={{
        opacity,
        scale,
        willChange: 'transform, opacity',
      }}
      className="absolute inset-0 flex items-center justify-center px-6 md:px-24 pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center z-10">
        <motion.div style={{ y: yLeft, willChange: 'transform' }} className="space-y-12 relative">
          <div className="absolute -left-12 top-0 w-1 h-full bg-gradient-to-b from-transparent via-electric/50 to-transparent" />
          
          <div>
            <p className="text-electric text-sm uppercase tracking-[0.2em] mb-4">The Foundation</p>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6">
              BMSIT
            </h2>
            <p className="text-text-secondary text-lg font-light leading-relaxed">
              Rooted in academic excellence, the institution provides the structural architecture for our innovation ecosystem. A place where theoretical boundaries are pushed and paradigm-shifting ideas are nurtured.
            </p>
          </div>
          
          <div className="glass-panel p-6 border-l-2 border-l-electric bg-navy/40">
            <h3 className="text-2xl font-semibold text-white mb-2">CSE Department</h3>
            <p className="text-text-secondary font-light">
              The core processing unit of our collective. Driving research, algorithmic efficiency, and foundational data science principles that empower the DataVerse initiatives.
            </p>
          </div>
        </motion.div>
        
        <motion.div style={{ y: yRight, willChange: 'transform' }} className="relative aspect-square md:aspect-[3/4] w-full max-w-md mx-auto">
          <div className="absolute inset-0 glass-panel rounded-3xl overflow-hidden flex items-center justify-center border border-white/5 bg-navy/60">
            {/* Animated Grid Overlay - Reduced complexity for performance */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ 
                   backgroundImage: `linear-gradient(rgba(0, 229, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.2) 1px, transparent 1px)`,
                   backgroundSize: '40px 40px',
                   backgroundPosition: 'center center'
                 }} 
            />
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 rounded-full border border-electric/30 flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full border border-electric/10 animate-[spin_10s_linear_infinite]" style={{ willChange: 'transform' }} />
                <div className="absolute inset-2 rounded-full border border-purple/20 animate-[spin_15s_linear_infinite_reverse]" style={{ willChange: 'transform' }} />
                <span className="text-3xl text-white font-display font-bold">DV</span>
              </div>
              <div className="text-electric font-mono text-sm tracking-widest uppercase flex items-center justify-center gap-2">
                System Active
                <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
