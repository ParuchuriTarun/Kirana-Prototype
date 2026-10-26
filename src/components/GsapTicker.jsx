import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const TICKER_ITEMS = [
  { icon: '⚡', text: '15-MINUTE EXPRESS DISPATCH', color: 'text-gold-300' },
  { icon: '👑', text: 'ONE-STOP GOURMET DESTINATION', color: 'text-brand-200' },
  { icon: '🌿', text: '100% FARM-DIRECT ORGANIC HARVEST', color: 'text-teal-200' },
  { icon: '❄️', text: 'TEMPERATURE-CONTROLLED COLD CHAIN', color: 'text-sky-300' },
  { icon: '💎', text: 'PRIVILEGE CLUB EXCLUSIVE SAVINGS', color: 'text-gold-300' },
  { icon: '🌾', text: 'ARTISANAL STONE-MILLED PANTRY', color: 'text-brand-300' },
  { icon: '✨', text: 'ZERO COMPROMISE QUALITY INSPECTED', color: 'text-teal-300' }
];

export default function GsapTicker() {
  const tickerRef = useRef(null);
  const tweenRef = useRef(null);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      tweenRef.current = gsap.to(el, {
        xPercent: -50,
        ease: 'none',
        duration: 35,
        repeat: -1
      });
    }, tickerRef);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0.3, duration: 0.6, ease: 'power2.out' });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.6, ease: 'power2.out' });
    }
  };

  return (
    <div 
      className="w-full bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 border-y border-brand-800/40 py-2 sm:py-2.5 my-0 overflow-hidden cursor-default select-none relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Flagship privileges ticker"
    >
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-brand-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand-950 to-transparent z-10 pointer-events-none" />

      {/* GSAP Animated Track */}
      <div 
        ref={tickerRef} 
        className="flex items-center gap-12 whitespace-nowrap w-max"
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
          <div 
            key={index} 
            className="inline-flex items-center gap-2.5 text-[11px] font-medium tracking-[0.06em] text-emerald-200/80 uppercase font-sans"
          >
            <span className="text-xs">{item.icon}</span>
            <span className="text-white tracking-wider font-semibold">{item.text}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 ml-6 inline-block" />
          </div>
        ))}
      </div>
    </div>
  );
}
