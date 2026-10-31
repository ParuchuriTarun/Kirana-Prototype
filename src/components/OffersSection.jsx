import React, { useState } from 'react';
import { Image as ImageIcon, ArrowRight, Tag, Crown, Leaf, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const renderTagIcon = (tagIcon) => {
  switch (tagIcon) {
    case 'leaf':
      return <Leaf className="w-3 h-3 text-emerald-200 fill-emerald-200/30 shrink-0" />;
    case 'sparkles':
      return <Sparkles className="w-3 h-3 text-purple-200 fill-purple-200/30 shrink-0" />;
    case 'crown':
    default:
      return <Crown className="w-3 h-3 text-amber-200 fill-amber-200/40 shrink-0" />;
  }
};

const getTagBadgeStyle = (tagIcon) => {
  switch (tagIcon) {
    case 'leaf':
      return 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white border-emerald-400/40 shadow-emerald-700/20';
    case 'sparkles':
      return 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white border-purple-400/40 shadow-purple-700/20';
    case 'crown':
    default:
      return 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white border-amber-300/40 shadow-amber-700/20';
  }
};

export default function OffersSection({ offers = [], onOfferClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextOffer = () => {
    if (!offers.length) return;
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    if (!offers.length) return;
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const activeOffer = offers[currentIndex] || offers[0];

  return (
    <section className="w-[94%] sm:w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2 py-4 sm:py-6 scroll-mt-24">
      {/* Heading */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
            Curated Offers
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.05] text-[11px] font-medium text-[#86868b] tracking-normal">
            Limited Time
          </span>
        </div>

        {/* Mobile slide nav micro-controls */}
        {offers.length > 1 && (
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={prevOffer}
              aria-label="Previous offer"
              className="w-7 h-7 rounded-full bg-white border border-black/[0.08] shadow-2xs flex items-center justify-center text-neutral-600 active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            <span className="text-[11px] font-semibold text-neutral-500 font-mono px-1">
              {currentIndex + 1}/{offers.length}
            </span>
            <button
              type="button"
              onClick={nextOffer}
              aria-label="Next offer"
              className="w-7 h-7 rounded-full bg-white border border-black/[0.08] shadow-2xs flex items-center justify-center text-neutral-600 active:scale-95 transition-transform"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* MOBILE: Clean single contained card with dots (Never bleeds or touches phone edge) */}
      <div className="md:hidden">
        {activeOffer && (
          <AnimatePresence mode="wait">
            <motion.article
              key={activeOffer.id || currentIndex}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onOfferClick(activeOffer)}
              className={`group flex items-center justify-between p-4 rounded-[22px] border ${activeOffer.borderColor || 'border-black/[0.06]'} bg-gradient-to-br ${activeOffer.cardBg || 'from-white to-neutral-50'} cursor-pointer shadow-apple-card active:scale-[0.99] transition-all relative overflow-hidden w-full`}
            >
              {/* Minimalist Apple Corner Badge */}
              {activeOffer.ribbon && (
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                  <div className="bg-emerald-800 text-white font-bold text-[9px] tracking-wide px-2.5 py-0.5 rounded-full shadow-xs border border-emerald-600/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{activeOffer.ribbon}</span>
                  </div>
                </div>
              )}

              {/* Left: Text Content */}
              <div className="flex-1 pr-3">
                {activeOffer.tag && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold text-emerald-900 bg-white/80 border border-emerald-200/60 mb-1.5 shadow-2xs">
                    <span>{activeOffer.tag}</span>
                  </span>
                )}
                <h3 className="text-sm font-bold text-[#1d1d1f] font-sans leading-tight">
                  {activeOffer.title}
                </h3>
                <p className="text-[11px] font-normal text-[#86868b] mt-1 max-w-[200px] leading-relaxed line-clamp-2">
                  {activeOffer.subtitle}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-2">
                  Claim Offer <ArrowRight className="w-3 h-3 stroke-[2.2]" />
                </span>
              </div>

              {/* Right: Image */}
              <div 
                className="w-20 h-20 rounded-[16px] bg-white border border-black/[0.06] shrink-0 overflow-hidden relative shadow-xs aspect-square"
                style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', maxWidth: '80px', maxHeight: '80px' }}
                aria-hidden="true"
              >
                {activeOffer.image ? (
                  <img
                    src={activeOffer.image}
                    alt={activeOffer.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-[#86868b] stroke-[1.2]" />
                  </div>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        )}

        {/* Carousel Pagination Dots */}
        {offers.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {offers.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to offer ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-5 bg-emerald-700' : 'w-1.5 bg-neutral-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP & TABLET: 3-column side-by-side grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 items-stretch">
        {offers.map((offer) => (
          <motion.article
            key={offer.id}
            onClick={() => onOfferClick(offer)}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className={`group flex items-center justify-between p-4 sm:p-5 rounded-[24px] border ${offer.borderColor || 'border-black/[0.06]'} bg-gradient-to-br ${offer.cardBg || 'from-white to-neutral-50'} cursor-pointer shadow-apple-card hover:shadow-apple-hover transition-all duration-300 relative overflow-hidden min-h-[130px] max-h-[155px]`}
          >
            {/* Minimalist Apple Corner Badge */}
            {offer.ribbon && (
              <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
                <div className="bg-emerald-800 text-white font-bold text-[10px] tracking-wide px-2.5 py-0.5 rounded-full shadow-xs border border-emerald-600/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{offer.ribbon}</span>
                </div>
              </div>
            )}

            {/* Left: Text Content */}
            <div className="flex-1 pr-3 min-w-0">
              {offer.tag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-900 bg-white/80 border border-emerald-200/60 mb-1.5 shadow-2xs">
                  <span>{offer.tag}</span>
                </span>
              )}
              <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] font-sans leading-tight group-hover:text-emerald-700 transition-colors duration-200 truncate">
                {offer.title}
              </h3>
              <p className="text-xs font-normal text-[#86868b] mt-1 max-w-[200px] leading-relaxed line-clamp-2">
                {offer.subtitle}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mt-2 group-hover:translate-x-0.5 transition-transform duration-200">
                Claim Offer <ArrowRight className="w-3 h-3 stroke-[2.2]" />
              </span>
            </div>

            {/* Right: Fixed Square Image Thumbnail */}
            <div 
              className="w-24 h-24 rounded-[18px] bg-white border border-black/[0.06] shrink-0 overflow-hidden relative shadow-xs aspect-square"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px', maxWidth: '96px', maxHeight: '96px' }}
              aria-hidden="true"
            >
              {offer.image ? (
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#86868b] stroke-[1.2]" />
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
