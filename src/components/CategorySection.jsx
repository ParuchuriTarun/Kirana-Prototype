import React from 'react';
import { Apple, Coffee, Cookie, Sparkles, Home, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS = {
  groceries: Apple,
  beverages: Coffee,
  snacks: Cookie,
  'personal-care': Sparkles,
  'home-care': Home,
  more: LayoutGrid
};

export default function CategorySection({
  categories,
  selectedCategory,
  onSelectCategory
}) {
  return (
    <section className="w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2 py-4 sm:py-6">
      {/* Heading */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
            Aisles &amp; Collections
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.05] text-[11px] font-medium text-[#86868b] tracking-normal">
            Handpicked
          </span>
        </div>
        <AnimatePresence>
          {selectedCategory && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onSelectCategory(null)}
              className="text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] px-3.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer border border-black/[0.05]"
            >
              Clear selection &times;
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 6 Category Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const Icon = CATEGORY_ICONS[cat.iconType] || LayoutGrid;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.name)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`group flex flex-col items-center justify-center py-5 sm:py-6 px-3 rounded-[24px] border text-center focus:outline-none cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-700 shadow-lg shadow-emerald-900/20'
                  : 'bg-white border-black/[0.06] shadow-apple-card hover:shadow-apple-hover'
              }`}
            >
              {/* Icon container */}
              <motion.div 
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-[16px] flex items-center justify-center mb-3 transition-colors duration-300 ${
                  isSelected 
                    ? 'bg-white text-emerald-800 shadow-sm' 
                    : 'bg-[#f5f5f7] text-[#1d1d1f] group-hover:bg-emerald-700 group-hover:text-white'
                }`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </motion.div>

              {/* Category Name */}
              <span className={`text-xs sm:text-sm font-semibold tracking-tight font-sans ${
                isSelected ? 'text-white' : 'text-[#1d1d1f]'
              }`}>
                {cat.name}
              </span>

              {/* Badge */}
              <span className={`text-[11px] font-normal mt-1 ${
                isSelected ? 'text-white/70' : 'text-[#86868b]'
              }`}>
                {cat.badge || 'Explore'}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
