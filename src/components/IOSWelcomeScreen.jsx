import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  WELCOME_IMG_DIMS,
  WELCOME_CROP_DIMS,
  WELCOME_ANIM_CONFIG,
  WELCOME_STROKE_SEGMENTS
} from '../constants/welcomeStrokes';
import { initAuroraCanvas } from '../utils/auroraCanvas';
import iosWelcomeBg from '../assets/ios-welcome-bg2.jpg';

export default function IOSWelcomeScreen({ onEnter }) {
  const wordRef = useRef(null);
  const canvasRef = useRef(null);
  const pathRefs = useRef([]);
  const [isComplete, setIsComplete] = useState(false);
  const isCompleteRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Initialize living fluid background canvas
  useEffect(() => {
    if (canvasRef.current) {
      const cleanup = initAuroraCanvas(canvasRef.current);
      return cleanup;
    }
  }, []);

  // Keep a mutable ref to onEnter so re-renders of the parent never restart the stroke animation
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  // Ultra-performant direct DOM parallax: ZERO React re-renders on mouse movement
  const handleMouseMove = useCallback((e) => {
    if (!wordRef.current) return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 8;
    const y = (e.clientY / innerHeight - 0.5) * 8;
    wordRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  // 1. Responsive coordinate & size fitting
  useEffect(() => {
    function fit() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.max(vw / WELCOME_IMG_DIMS.w, vh / WELCOME_IMG_DIMS.h);
      const ox = (vw - WELCOME_IMG_DIMS.w * s) / 2;
      const oy = (vh - WELCOME_IMG_DIMS.h * s) / 2;
      if (wordRef.current) {
        wordRef.current.style.left = `${ox + WELCOME_CROP_DIMS.x * s}px`;
        wordRef.current.style.top = `${oy + WELCOME_CROP_DIMS.y * s}px`;
        wordRef.current.style.width = `${WELCOME_CROP_DIMS.w * s}px`;
        wordRef.current.style.height = `${WELCOME_CROP_DIMS.h * s}px`;
        wordRef.current.style.transformOrigin = '50% 55%';
      }
    }

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // 2. Early gatekeeper: Disallow early exit while handwriting is drawing
  const handleProceed = useCallback(() => {
    if (!isCompleteRef.current) {
      return;
    }
    onEnterRef.current?.();
  }, []);

  // 3. Keyboard support: Space or Enter continues once text is complete
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (isCompleteRef.current) {
          if (onEnterRef.current) onEnterRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4. Apple handwriting stroke animation - runs strictly once per mount
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const paths = pathRefs.current;

    // Calculate stroke durations and staggered start times
    const starts = [];
    const durs = [];
    let t = WELCOME_ANIM_CONFIG.INITIAL_PAUSE || 0.16;
    WELCOME_STROKE_SEGMENTS.forEach((s) => {
      const dur = Math.max(WELCOME_ANIM_CONFIG.MIN_DUR, s.len / WELCOME_ANIM_CONFIG.SPEED);
      durs.push(dur);
      starts.push(t);
      t += dur * WELCOME_ANIM_CONFIG.OVERLAP;
    });
    const DRAW_END = starts[starts.length - 1] + durs[durs.length - 1];

    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      paths.forEach((p) => {
        if (!p) return;
        p.style.strokeDasharray = 'none';
        p.style.strokeDashoffset = '0';
      });
      setIsComplete(true);
      isCompleteRef.current = true;
      const timerReduced = setTimeout(() => {
        onEnterRef.current?.();
      }, 400);
      return () => {
        if (timerReduced) clearTimeout(timerReduced);
      };
    }

    let timerComplete = null;
    let timerAutoProceed = null;
    let animId = null;

    // Direct rAF transition kickoff on frame 1 - zero layout reflow
    animId = requestAnimationFrame(() => {
      paths.forEach((p, i) => {
        if (!p) return;
        p.style.transition = `stroke-dashoffset ${durs[i]}s ${WELCOME_ANIM_CONFIG.EASING} ${starts[i]}s`;
        p.style.strokeDashoffset = '0';
      });

      // Mark the handwriting as completely appeared once all segments finish drawing
      timerComplete = setTimeout(() => {
        setIsComplete(true);
        isCompleteRef.current = true;
      }, DRAW_END * 1000);

      // Automatically open the website right after the whole text appears
      timerAutoProceed = setTimeout(() => {
        onEnterRef.current?.();
      }, (DRAW_END + 0.35) * 1000);
    });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (timerComplete) clearTimeout(timerComplete);
      if (timerAutoProceed) clearTimeout(timerAutoProceed);
      hasStartedRef.current = false;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden select-none bg-[#021d12] cursor-default"
      onClick={handleProceed}
      onMouseMove={handleMouseMove}
    >
      {/* Living Background Stage: Apple Style Silk Motion Wallpaper */}
      <div className="absolute -inset-[10%] w-[120%] h-[120%] overflow-hidden pointer-events-none transform-gpu">
        {/* 1. Base Apple Wallpaper with gentle breathing motion */}
        <img
          id="bg"
          alt=""
          src={iosWelcomeBg}
          loading="eager"
          decoding="async"
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center animate-ios-bg-float pointer-events-none select-none will-change-transform brightness-[1.02] contrast-[1.04]"
        />

        {/* 2. Living Fluid Aurora Canvas: Organic silk liquid ribbons */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover opacity-65 mix-blend-screen pointer-events-none transform-gpu"
        />

        {/* 3. Luminous Living Ambient Drift: Glowing Apple Aurora orbs */}
        <div
          className="absolute -inset-[15%] w-[130%] h-[130%] rounded-full opacity-45 animate-aurora-sweep pointer-events-none transform-gpu mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse at 35% 35%, rgba(52, 211, 153, 0.40) 0%, rgba(16, 185, 129, 0.20) 45%, transparent 75%)'
          }}
        />

        {/* 4. Second Living Ambient Orb for organic depth */}
        <div
          className="absolute -inset-[10%] w-[120%] h-[120%] rounded-full opacity-35 animate-aurora-pulse pointer-events-none transform-gpu mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse at 65% 70%, rgba(110, 231, 183, 0.35) 0%, rgba(5, 150, 105, 0.20) 50%, transparent 80%)'
          }}
        />

        {/* 5. Apple Vignette: subtle edge depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 65%, rgba(2, 29, 18, 0.45) 100%)'
          }}
        />
      </div>

      {/* Word container scaled & positioned to exact crop */}
      <div
        ref={wordRef}
        id="word"
        className="absolute pointer-events-none z-10 transition-transform duration-300 ease-out will-change-transform"
      >
        {/* Pure, Normal Solid White Handwriting - ZERO glow, ZERO blur, crisp and natural */}
        <svg
          id="ink"
          viewBox="0 0 582 286"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{
            transition: 'opacity .5s ease'
          }}
        >
          {WELCOME_STROKE_SEGMENTS.map((seg, idx) => (
            <path
              key={idx}
              ref={(el) => (pathRefs.current[idx] = el)}
              d={seg.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth={WELCOME_ANIM_CONFIG.STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: `${seg.len} ${seg.len + 2 * WELCOME_ANIM_CONFIG.DASHPAD}`,
                strokeDashoffset: `${seg.len + WELCOME_ANIM_CONFIG.DASHPAD}`
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
