// Motion Design System and Cinematic Constraints

export const Easing = {
  smooth: [0.22, 1, 0.36, 1], // Apple-style smooth ease-out
  cinematic: [0.4, 0, 0.2, 1], // Slow, dramatic ease
  drift: [0.1, 0.9, 0.2, 1], // Long tail drift
  snap: [0.8, 0, 0.2, 1], // Fast entrance, slow finish
};

export const Duration = {
  fast: 0.3,
  medium: 0.6,
  slow: 1.2,
  cinematic: 2.0,
};

export const DepthRules = {
  foregroundScaleMax: 1.15,
  foregroundScaleMin: 0.95,
  backgroundBlurMax: 8, // px
  // TranslateZ values for will-change optimization
  zLanes: {
    back: 'translateZ(-100px)',
    mid: 'translateZ(0px)',
    front: 'translateZ(100px)'
  }
};

// Global scroll timeline config
export const ScrollTimeline = {
  totalHeight: "800vh", // Massive timeline for smooth experience
  mobileHeight: "500vh", // Shorter for mobile
  scenes: {
    hero: [0, 0.15],
    decompression1: [0.15, 0.2], // Breathing room
    about: [0.2, 0.35],
    institution: [0.35, 0.5],
    decompression2: [0.5, 0.55], // Breathing room
    projects: [0.55, 0.8],
    cta: [0.8, 1.0],
  }
};
