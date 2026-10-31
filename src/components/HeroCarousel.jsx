import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HERO_SLIDES as DEFAULT_HERO_SLIDES } from '../data/products';
import { getHeroSlides } from '../data/adminStore';

const appleTransition = {
  type: "spring",
  stiffness: 240,
  damping: 26,
  mass: 0.8,
};

const getCardAnimation = (slideIndex, activeIndex, totalSlides, direction) => {
  let offset = (slideIndex - activeIndex) % totalSlides;
  if (offset > totalSlides / 2) offset -= totalSlides;
  if (offset < -totalSlides / 2) offset += totalSlides;

  if (Math.abs(offset) === totalSlides / 2) {
    offset = direction > 0 ? -2 : 2;
  }

  const isCenter = offset === 0;
  const isLeft = offset === -1;
  const isRight = offset === 1;

  return {
    isCenter,
    isLeft,
    isRight,
    x: `${offset * 22}%`,
    y: '0%',
    scale: isCenter ? 1.08 : 0.88,
    opacity: isCenter ? 1 : (isLeft || isRight ? 0.72 : 0),
    zIndex: isCenter ? 30 : (isLeft || isRight ? 15 : 0),
    pointerEvents: (isCenter || isLeft || isRight) ? 'auto' : 'none',
    boxShadow: isCenter 
      ? '0 0 0 1px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04), 0 28px 64px -16px rgba(0, 0, 0, 0.16)' 
      : '0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.03), 0 10px 24px -8px rgba(0, 0, 0, 0.08)',
    filter: isCenter ? 'brightness(1)' : 'brightness(0.94)',
  };
};

export default function HeroCarousel({ slides: propSlides, onShopClick }) {
  const [internalSlides, setInternalSlides] = useState(() => getHeroSlides());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Synchronize dynamic updates from admin store
  useEffect(() => {
    const handleUpdate = () => {
      setInternalSlides(getHeroSlides());
    };
    window.addEventListener('kirana_store_updated', handleUpdate);
    window.addEventListener('kirana_store_reset', handleUpdate);
    return () => {
      window.removeEventListener('kirana_store_updated', handleUpdate);
      window.removeEventListener('kirana_store_reset', handleUpdate);
    };
  }, []);

  const rawSlides = propSlides || internalSlides;
  const activeSlides = (rawSlides || []).filter((s) => s.active !== false);
  const displaySlides = activeSlides.length > 0 ? activeSlides : (DEFAULT_HERO_SLIDES || []);
  const totalSlides = displaySlides.length;

  useEffect(() => {
    if (totalSlides === 0) return;
    if (currentIndex >= totalSlides) {
      setCurrentIndex(0);
    }
  }, [totalSlides, currentIndex]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, currentIndex, totalSlides]);

  const goToNext = () => {
    if (totalSlides <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    if (totalSlides <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 50) goToNext();
    else if (delta < -50) goToPrev();
  };

  if (totalSlides === 0) return null;

  return (
    <section 
      className="w-full px-2 sm:px-4 md:px-6 pt-0 pb-0 select-none overflow-x-clip -mt-1 sm:-mt-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-[240px] sm:h-[320px] md:h-[370px] lg:h-[440px] xl:h-[490px] 2xl:h-[540px] flex items-center justify-center">
        
        {displaySlides.map((slide, index) => {
          const anim = getCardAnimation(index, currentIndex, totalSlides, direction);

          return (
            <motion.div
              key={slide.id || index}
              animate={{
                x: anim.x,
                y: anim.y,
                scale: anim.scale,
                opacity: anim.opacity,
                zIndex: anim.zIndex,
                boxShadow: anim.boxShadow,
                filter: anim.filter,
              }}
              whileHover={!anim.isCenter ? { opacity: 0.95 } : {}}
              transition={appleTransition}
              onClick={() => {
                if (anim.isRight) goToNext();
                else if (anim.isLeft) goToPrev();
              }}
              className={`absolute inset-0 m-auto aspect-[16/10] sm:aspect-[16/9] w-[90%] sm:w-[80%] md:w-[76%] lg:w-[72%] xl:w-[70%] max-w-[1320px] rounded-[22px] sm:rounded-[32px] lg:rounded-[36px] overflow-hidden bg-white ${
                anim.isCenter 
                  ? 'cursor-default border border-black/[0.04]' 
                  : 'cursor-pointer transition-opacity duration-300 border border-black/[0.04]'
              }`}
              style={{ pointerEvents: anim.pointerEvents }}
            >
              {/* Slide Canvas */}
              <div 
                className="w-full h-full relative bg-neutral-900 rounded-[22px] sm:rounded-[32px] lg:rounded-[36px] overflow-hidden"
              >
                {slide.image ? (
                  <img 
                    src={slide.image} 
                    alt={slide.alt || slide.title || `Slide ${index + 1}`} 
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-teal-900" />
                )}

                {/* Rich Overlay Content if Slide has Title or Description */}
                {(slide.title || slide.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end p-4 sm:p-7 lg:p-11 text-white">
                    {slide.badge && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider mb-1 sm:mb-2 w-max shadow-xs">
                        {slide.badge}
                      </span>
                    )}

                    {slide.title && (
                      <h2 className="text-base sm:text-2xl lg:text-4xl font-extrabold tracking-tight max-w-2xl leading-tight drop-shadow-sm">
                        {slide.title}
                      </h2>
                    )}

                    {slide.subtitle && (
                      <p className="text-[11px] sm:text-xs lg:text-sm text-white/90 max-w-xl mt-1 line-clamp-2 drop-shadow-xs">
                        {slide.subtitle}
                      </p>
                    )}

                    {slide.ctaText && (
                      <div className="mt-2.5 sm:mt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onShopClick) {
                              onShopClick();
                            } else if (slide.ctaLink) {
                              window.location.hash = slide.ctaLink;
                            }
                          }}
                          className="px-4 sm:px-5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          {slide.ctaText} &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Apple Pagination Dots */}
        {totalSlides > 1 && (
          <div 
            className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40"
            aria-label="Carousel pagination"
          >
            {displaySlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className="relative p-1 focus:outline-none cursor-pointer"
                aria-label={`Go to slide ${idx + 1}`}
              >
                {idx === currentIndex ? (
                  <motion.div
                    layoutId="activeSlideIndicator"
                    className="w-7 sm:w-8 h-[4px] bg-emerald-500 rounded-full shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : (
                  <div className="w-[4px] h-[4px] bg-white/40 hover:bg-white/70 rounded-full transition-colors duration-200" />
                )}
              </button>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
