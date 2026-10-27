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

  // 1. Responsive coordinate & size fitting for Mobile, Tablet & Desktop
  useEffect(() => {
    function fit() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      const CROP_RATIO = WELCOME_CROP_DIMS.w / WELCOME_CROP_DIMS.h; // 582 / 286 = 2.034965
      
      // Determine if viewport is portrait mobile/tablet or landscape desktop
      const isPortrait = vw / vh < 1.15 || vw < 768;

      let w, h, left, top;

      if (isPortrait) {
        // MOBILE & TABLET PORTRAIT:
        // Size proportional to mobile viewport with luxury padding (78% of screen width, max 420px, min 250px)
        w = Math.max(250, Math.min(vw * 0.78, 420));
        h = w / CROP_RATIO;
        left = (vw - w) / 2;
        // Optically balanced vertical centering (47% from top feels perfectly centered on mobile screens)
        top = (vh - h) * 0.47;
      } else {
        // DESKTOP & LANDSCAPE:
        const s = Math.max(vw / WELCOME_IMG_DIMS.w, vh / WELCOME_IMG_DIMS.h);
        const ox = (vw - WELCOME_IMG_DIMS.w * s) / 2;
        const oy = (vh - WELCOME_IMG_DIMS.h * s) / 2;

        let calcW = WELCOME_CROP_DIMS.w * s;
        let calcH = WELCOME_CROP_DIMS.h * s;
        let calcLeft = ox + WELCOME_CROP_DIMS.x * s;
        let calcTop = oy + WELCOME_CROP_DIMS.y * s;

        // If calculated dimensions would push it outside margins, fallback to centered layout
        if (calcW > vw * 0.85 || calcLeft < 20 || (calcLeft + calcW) > vw - 20) {
          w = Math.min(vw * 0.80, 680);
          h = w / CROP_RATIO;
          left = (vw - w) / 2;
          top = (vh - h) * 0.48;
        } else {
          w = calcW;
          h = calcH;
          left = calcLeft;
          top = calcTop;
        }
      }

      if (wordRef.current) {
        wordRef.current.style.left = `${Math.round(left)}px`;
        wordRef.current.style.top = `${Math.round(top)}px`;
        wordRef.current.style.width = `${Math.round(w)}px`;
        wordRef.current.style.height = `${Math.round(h)}px`;
        wordRef.current.style.transformOrigin = '50% 50%';
      }
    }

    fit();
    window.addEventListener('resize', fit, { passive: true });
    window.addEventListener('orientationchange', fit, { passive: true });
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
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
      className="fixed inset-0 z-[100] w-full h-full h-[100dvh] overflow-hidden select-none cursor-default touch-none overscroll-none"
      style={{
        backgroundColor: '#133023',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
      onClick={handleProceed}
      onTouchEnd={handleProceed}
      onMouseMove={handleMouseMove}
    >
      {/* Living Background Stage: Calm, soothing deep forest green with Apple-style living motion */}
      <div className="absolute -inset-[8%] w-[116%] h-[116%] overflow-hidden pointer-events-none transform-gpu">
        {/* 1. Base Apple Wallpaper with gentle floating motion - calibrated to the calm, deep matte forest green */}
        <img
          id="bg"
          alt=""
          src={iosWelcomeBg}
          loading="eager"
          decoding="async"
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center animate-ios-bg-float pointer-events-none select-none will-change-transform brightness-[0.92] contrast-[0.96] saturate-[0.72] hue-rotate-[24deg]"
        />

        {/* 2. Soft Green Harmonizer: soothing matte forest overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: 'rgba(27, 67, 50, 0.25)' }}
        />

        {/* 3. Living Fluid Aurora Canvas: Gentle natural liquid wave motion (hardware alpha composited) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform-gpu"
        />

        {/* 4. Subtle Living Ambient Drift: Soft, non-vibrant depth (GPU hardware animated) */}
        <div
          className="absolute -inset-[10%] w-[120%] h-[120%] rounded-full opacity-35 animate-aurora-sweep pointer-events-none transform-gpu"
          style={{
            background: 'radial-gradient(ellipse at 40% 40%, rgba(45, 95, 70, 0.35) 0%, rgba(32, 75, 55, 0.18) 50%, transparent 75%)'
          }}
        />

        {/* 5. Second Ambient Depth Orb: Organic breathing layer in calming pine green */}
        <div
          className="absolute -inset-[8%] w-[116%] h-[116%] rounded-full opacity-25 animate-aurora-pulse pointer-events-none transform-gpu"
          style={{
            background: 'radial-gradient(ellipse at 65% 65%, rgba(38, 92, 66, 0.30) 0%, rgba(24, 62, 44, 0.15) 50%, transparent 80%)'
          }}
        />

        {/* 6. Gentle Edge Softening: Clean, subtle framing */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 70%, rgba(18, 46, 32, 0.25) 100%)'
          }}
        />
      </div>

      {/* Word container scaled & positioned to exact crop with gentle organic float on mobile */}
      <div
        ref={wordRef}
        id="word"
        className="absolute pointer-events-none z-10 transition-transform duration-300 ease-out will-change-transform animate-ios-word-float"
      >
        {/* Pure, Normal Solid White Handwriting - ZERO glow, ZERO blur, crisp and natural */}
        <svg
          id="ink"
          viewBox="0 0 582 286"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          className="w-full h-full block"
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
