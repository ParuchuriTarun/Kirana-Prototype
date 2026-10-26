import gsap from 'gsap';

export { gsap };

// ═══════════════════════════════════════════════════════
//  APPLE-STYLE ANIMATION SYSTEM
//  Inspired by apple.com and Apple Design Resources
//  Core philosophy: Smooth, effortless, precise, never bouncy
// ═══════════════════════════════════════════════════════

// Apple's signature ease curves
// These cubic-bezier values mimic Apple's system-level motion
export const appleEase = {
  // Primary ease — Apple's default for most transitions
  // Smooth deceleration, no overshoot
  default: [0.25, 0.1, 0.25, 1.0],

  // Ease-in-out — for subtle bidirectional motion
  inOut: [0.42, 0, 0.58, 1.0],

  // Ease-out — for entrances (elements arriving on screen)
  out: [0.16, 1, 0.3, 1.0],

  // Ease-in — for exits (elements leaving screen)
  in: [0.55, 0.085, 0.68, 0.53],

  // Smooth — ultra-smooth for large layout shifts
  smooth: [0.22, 1, 0.36, 1],

  // Gentle — very subtle, almost linear feel
  gentle: [0.33, 1, 0.68, 1],

  // Snap — quick but still refined, no bounce
  snap: [0.12, 0.8, 0.32, 1.0],
};

// Apple-style duration scale (in seconds)
// Short: micro-interactions (hover, tap)
// Medium: component transitions (modals, drawers)
// Long: page-level transitions (scroll reveals)
export const appleDuration = {
  micro: 0.18,
  short: 0.25,
  medium: 0.4,
  long: 0.6,
  page: 0.8,
};

// ═══════════════════════════════════════════════════════
//  FRAMER MOTION PRESETS
//  Clean, Apple-precise transitions
// ═══════════════════════════════════════════════════════

// Default transition — Apple's signature feel
export const springSmooth = {
  duration: appleDuration.medium,
  ease: appleEase.smooth,
};

// Bouncy — renamed to "elevated" for Apple feel (very subtle lift)
export const springBouncy = {
  duration: appleDuration.short,
  ease: appleEase.out,
};

// Snappy — quick snap, no overshoot
export const springSnappy = {
  duration: appleDuration.micro,
  ease: appleEase.snap,
};

// ═══════════════════════════════════════════════════════
//  MICRO-INTERACTION VARIANTS
//  Apple's philosophy: Subtle, responsive, never distracting
// ═══════════════════════════════════════════════════════

// Card hover — gentle lift like Apple product cards
export const cardHoverMotion = {
  rest: {
    y: 0,
    scale: 1,
    transition: {
      duration: appleDuration.short,
      ease: appleEase.out,
    },
  },
  hover: {
    y: -4,           // Subtle lift, not dramatic
    scale: 1.008,    // Almost imperceptible scale
    transition: {
      duration: appleDuration.short,
      ease: appleEase.out,
    },
  },
  tap: {
    scale: 0.992,    // Gentle press, like iOS tap feedback
    transition: {
      duration: appleDuration.micro,
      ease: appleEase.in,
    },
  },
};

// Button press — Apple's precise tactile feedback
export const buttonPressMotion = {
  hover: {
    scale: 1.02,     // Very subtle enlarge
    transition: {
      duration: appleDuration.micro,
      ease: appleEase.out,
    },
  },
  tap: {
    scale: 0.98,     // Gentle inward press
    transition: {
      duration: appleDuration.micro,
      ease: appleEase.in,
    },
  },
};

// Fade up — Apple's scroll reveal animation
export const fadeUpVariant = {
  hidden: {
    opacity: 0,
    y: 16,           // Small distance, feels effortless
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: appleDuration.long,
      ease: appleEase.smooth,
    },
  },
};

// Scale in — for modals and overlays (Apple popup feel)
export const scaleInVariant = {
  hidden: {
    opacity: 0,
    scale: 0.96,     // Almost full size, minimal scale
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: appleDuration.medium,
      ease: appleEase.smooth,
    },
  },
};

// Slide in — for drawers (Apple sidebar/panel feel)
export const slideInVariant = {
  hidden: {
    x: '100%',
  },
  visible: {
    x: 0,
    transition: {
      duration: appleDuration.medium,
      ease: appleEase.smooth,
    },
  },
};

// ═══════════════════════════════════════════════════════
//  GSAP MICRO-INTERACTION HELPERS
//  Precise, Apple-level quality animations
// ═══════════════════════════════════════════════════════

// Subtle bounce — like a gentle card tap
export const gsapBounce = (target) => {
  if (!target) return;
  gsap.fromTo(
    target,
    { scale: 0.97 },
    { scale: 1, duration: 0.3, ease: 'power2.out' }
  );
};

// Wiggle — gentle rotation feedback (like macOS dock)
export const gsapWiggle = (target) => {
  if (!target) return;
  gsap.fromTo(
    target,
    { rotation: -2 },
    { rotation: 0, duration: 0.35, ease: 'power2.out' }
  );
};

// Pulse glow — subtle emphasis (like Apple notification)
export const gsapPulseGlow = (target) => {
  if (!target) return;
  gsap.fromTo(
    target,
    { boxShadow: '0 0 0px rgba(5, 150, 105, 0)' },
    {
      boxShadow: '0 0 12px rgba(5, 150, 105, 0.25)',
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    }
  );
};

// Stagger in — Apple's list reveal pattern
export const gsapStaggerIn = (targets, stagger = 0.06) => {
  if (!targets) return;
  gsap.from(targets, {
    opacity: 0,
    y: 12,
    duration: 0.45,
    stagger,
    ease: 'power2.out',
  });
};

// ═══════════════════════════════════════════════════════
//  APPLE SCROLL REVEAL
//  Intersection Observer for performant scroll animations
// ═══════════════════════════════════════════════════════

export const scrollRevealConfig = {
  threshold: 0.15,
  rootMargin: '0px 0px -60px 0px',
};
