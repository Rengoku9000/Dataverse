import { motion, useTransform } from 'framer-motion';
import { ScrollTimeline, DepthRules } from '../lib/MotionTokens';

const panels = [
  { title: 'Mission', desc: 'To pioneer the integration of AI methodologies into everyday problem-solving paradigms.' },
  { title: 'Vision', desc: 'A future where data intelligence is democratized and seamlessly woven into our ecosystem.' },
  { title: 'Objectives', desc: 'Foster cross-disciplinary research, build scalable intelligence models, and cultivate talent.' },
  { title: 'Outcomes', desc: 'Deployable AI agents, robust data pipelines, and a community of visionary creators.' }
];

export default function SceneAbout({ scrollProgress, isMobile }) {
  const [start, end] = ScrollTimeline.scenes.about;
  const peak = start + (end - start) / 2;

  // Scene fades in from darkness and fades out
  const opacity = useTransform(scrollProgress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
  
  // Scene starts slightly scaled up (as if you're approaching it) and scales down to 1, then recedes
  const scale = useTransform(scrollProgress, [start, peak, end], [1.05, 1, DepthRules.foregroundScaleMin]);
  
  // Parallax the text up smoothly
  const y = useTransform(scrollProgress, [start, end], [100, -100]);

  return (
    <motion.div
      style={{
        opacity,
        scale,
        willChange: 'transform, opacity',
        pointerEvents: opacity.get() > 0.1 ? 'auto' : 'none', // Only clickable when visible
      }}
      className="absolute inset-0 flex items-center justify-center px-6 md:px-24 pointer-events-auto"
    >
      <div className="max-w-7xl w-full">
        <motion.div style={{ y }} className="mb-24 will-change-transform">
          <h2 className="text-4xl md:text-7xl font-bold leading-tight tracking-tighter mb-8 max-w-4xl text-white">
            We are not just <span className="text-gradient-glow italic">analyzing</span> the future. We are building it.
          </h2>
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl font-light leading-relaxed">
            DataVerse is an immersive innovation collective operating at the intersection of artificial intelligence, data science, and human potential.
          </p>
        </motion.div>

        {/* Staggered floating panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {panels.map((panel, idx) => {
            // Each panel has a slightly different parallax multiplier to simulate depth
            const panelY = useTransform(scrollProgress, [start, end], [150 + (idx * 30), -50 - (idx * 20)]);
            
            return (
              <motion.div
                key={panel.title}
                style={{ y: panelY, willChange: 'transform' }}
                className="glass-panel p-8 rounded-2xl group border border-white/5 bg-navy/40"
              >
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-electric transition-colors duration-300">
                  {panel.title}
                </h3>
                <p className="text-text-secondary leading-relaxed font-light">
                  {panel.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Overlapping ambient lighting specific to this scene */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" style={{ willChange: 'transform' }} />
    </motion.div>
  );
}
