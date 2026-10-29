import React from 'react';
import { Truck, Shield, Headphones, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ICON_COMPONENTS = {
  delivery: Truck,
  security: Shield,
  support: Headphones,
  quality: Star
};

const BENEFIT_THEMES = {
  delivery: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-500/10',
    hover: 'group-hover:bg-emerald-600 group-hover:text-white',
    pill: 'bg-emerald-100/60 text-emerald-800'
  },
  security: {
    badge: 'bg-sky-50 text-sky-700 border border-sky-200/60 shadow-sm shadow-sky-500/10',
    hover: 'group-hover:bg-sky-600 group-hover:text-white',
    pill: 'bg-sky-100/60 text-sky-800'
  },
  support: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm shadow-amber-500/10',
    hover: 'group-hover:bg-amber-600 group-hover:text-white',
    pill: 'bg-amber-100/60 text-amber-800'
  },
  quality: {
    badge: 'bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm shadow-purple-500/10',
    hover: 'group-hover:bg-purple-600 group-hover:text-white',
    pill: 'bg-purple-100/60 text-purple-800'
  }
};

export default function BenefitsSection({ benefits }) {
  return (
    <section className="w-[94%] sm:w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2 py-4 sm:py-6">
      {/* Heading */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
            The Kirana Promise
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.05] text-[11px] font-medium text-[#86868b] tracking-normal">
            Standards
          </span>
        </div>
      </div>

      {/* 4 Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-center">
        {benefits.map((item) => {
          const Icon = ICON_COMPONENTS[item.iconType] || Star;
          const theme = BENEFIT_THEMES[item.iconType] || BENEFIT_THEMES.quality;

          return (
            <motion.div 
              key={item.id} 
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-5 md:p-6 rounded-[20px] sm:rounded-[24px] bg-white border border-black/[0.06] shadow-apple-card hover:shadow-apple-hover transition-all duration-300 cursor-default"
            >
              {/* Icon badge */}
              <motion.div 
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] ${theme.badge} ${theme.hover} transition-all duration-300 flex items-center justify-center mb-2.5 sm:mb-3.5`}
                aria-hidden="true"
              >
                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.8]" />
              </motion.div>

              {/* Title */}
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-[#1d1d1f] font-sans leading-tight">
                {item.title}
              </h3>

              {/* Supporting Text */}
              <p className="text-[11px] sm:text-xs text-[#86868b] font-normal mt-1 max-w-[160px] leading-snug sm:leading-relaxed">
                {item.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
