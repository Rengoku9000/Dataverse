import { motion, useTransform } from 'framer-motion';
import { ScrollTimeline } from '../lib/MotionTokens';

export default function SceneCTA({ scrollProgress, isMobile }) {
  const [start, end] = ScrollTimeline.scenes.cta;

  // Scene rises from the bottom and fades in
  const opacity = useTransform(scrollProgress, [start, start + 0.1], [0, 1]);
  const y = useTransform(scrollProgress, [start, end], [200, 0]);
  const scale = useTransform(scrollProgress, [start, end], [0.9, 1]);

  return (
    <motion.div
      style={{
        opacity,
        y,
        scale,
        willChange: 'transform, opacity',
        pointerEvents: opacity.get() > 0.5 ? 'auto' : 'none',
      }}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-navy/50 to-transparent pointer-events-none" />
      
      <div className="z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center">
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-8">
          Join the <br /> <span className="text-gradient-glow">Future of Data</span>
        </h2>
        
        <p className="text-xl text-text-secondary max-w-2xl font-light mb-16">
          Initialize your connection to the DataVerse collective. Access research, collaborate on models, and shape the intelligence layer of tomorrow.
        </p>

        <div className="w-full max-w-md glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-2 border border-white/10 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-electric to-purple opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-500 rounded-2xl" />
          
          <input 
            type="email" 
            placeholder="Enter terminal access node" 
            className="w-full bg-transparent border-none outline-none text-white px-6 py-4 font-mono text-sm placeholder:text-text-secondary/50 z-10"
          />
          <button className="z-10 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-electric hover:text-black transition-colors duration-300 whitespace-nowrap">
            Initialize
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-12 text-center z-10">
        <p className="text-xs font-mono text-text-secondary/50 tracking-widest uppercase">
          DataVerse Collective © {new Date().getFullYear()}
        </p>
      </div>
    </motion.div>
  );
}
