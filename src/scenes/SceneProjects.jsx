import { motion, useTransform } from 'framer-motion';
import { ScrollTimeline, DepthRules } from '../lib/MotionTokens';
import { ArrowUpRight } from 'lucide-react';

const projects = [
  { id: 'proj-1', title: 'Neural Matrix', category: 'Deep Learning', desc: 'Optimizing high-dimensional parameter spaces for predictive modeling.', range: [0.58, 0.64] },
  { id: 'proj-2', title: 'Synapse', category: 'Data Pipeline', desc: 'Real-time asynchronous data ingestion and processing framework.', range: [0.63, 0.69] },
  { id: 'proj-3', title: 'Aura Node', category: 'Computer Vision', desc: 'Edge-deployed visual recognition system with sub-millisecond latency.', range: [0.68, 0.74] },
];

function ProjectCard({ project, scrollProgress }) {
  const [start, end] = project.range;
  const peak = start + (end - start) / 2;

  // Controlled depth lane: Card flies in from depth, peaks, then flies forward past the camera
  const scale = useTransform(scrollProgress, [start, peak, end], [0.5, 1, 1.5]);
  const opacity = useTransform(scrollProgress, [start, peak, end], [0, 1, 0]);
  const filterBlur = useTransform(scrollProgress, [start, peak, end], ['blur(10px)', 'blur(0px)', 'blur(10px)']);
  const y = useTransform(scrollProgress, [start, peak, end], [100, 0, -100]);

  return (
    <motion.div
      style={{
        opacity,
        scale,
        y,
        filter: filterBlur,
        willChange: 'transform, opacity, filter',
        pointerEvents: opacity.get() > 0.8 ? 'auto' : 'none',
      }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-panel p-12 rounded-3xl border border-white/10 bg-black/60"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-electric/10 to-purple/10 rounded-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
        <span className="text-sm font-mono tracking-widest text-electric uppercase px-4 py-2 rounded-full border border-electric/20 bg-electric/5 mb-8">
          {project.category}
        </span>
        
        <h3 className="text-4xl md:text-6xl font-bold text-white mb-6">
          {project.title}
        </h3>
        <p className="text-xl text-text-secondary font-light max-w-lg mx-auto mb-10">
          {project.desc}
        </p>

        <button className="flex items-center gap-2 text-white hover:text-electric transition-colors uppercase tracking-widest text-sm font-bold group">
          Initialize <ArrowUpRight className="group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

export default function SceneProjects({ scrollProgress, isMobile }) {
  const [start, end] = ScrollTimeline.scenes.projects;
  
  // Scene container fade
  const containerOpacity = useTransform(scrollProgress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ opacity: containerOpacity }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
    >
      {/* Title that stays fixed while cards fly through */}
      <motion.div 
        style={{
          opacity: useTransform(scrollProgress, [start + 0.05, start + 0.1, end - 0.1, end - 0.05], [0, 1, 1, 0]),
          y: useTransform(scrollProgress, [start, end], [50, -50])
        }}
        className="absolute top-24 left-0 w-full text-center z-0"
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white/30 uppercase">
          Research & Initiatives
        </h2>
      </motion.div>

      {/* Controlled Depth Lanes for Projects */}
      <div className="relative w-full h-full perspective-1000">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} scrollProgress={scrollProgress} />
        ))}
      </div>
    </motion.div>
  );
}
