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
    <section className="w-[94%] sm:w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2 py-4 sm:py-6">
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

      {/* 6 Category Tiles - 3 columns on mobile, 6 on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const Icon = CATEGORY_ICONS[cat.iconType] || LayoutGrid;

          // Category-specific colorful soft styling
          const colorStyles = {
            groceries: {
              bg: 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200/60',
              iconGrad: 'bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/25',
              text: 'text-emerald-950'
            },
            beverages: {
              bg: 'bg-sky-50/70 hover:bg-sky-100/70 border-sky-200/60',
              iconGrad: 'bg-gradient-to-br from-sky-600 to-blue-500 shadow-sky-500/25',
              text: 'text-sky-950'
            },
            snacks: {
              bg: 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200/60',
              iconGrad: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25',
              text: 'text-amber-950'
            },
            'personal-care': {
              bg: 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200/60',
              iconGrad: 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-500/25',
              text: 'text-rose-950'
            },
            'home-care': {
              bg: 'bg-purple-50/70 hover:bg-purple-100/70 border-purple-200/60',
              iconGrad: 'bg-gradient-to-br from-purple-600 to-indigo-500 shadow-purple-500/25',
              text: 'text-purple-950'
            },
            more: {
              bg: 'bg-teal-50/70 hover:bg-teal-100/70 border-teal-200/60',
              iconGrad: 'bg-gradient-to-br from-teal-600 to-emerald-500 shadow-teal-500/25',
              text: 'text-teal-950'
            }
          };

          const style = colorStyles[cat.iconType] || colorStyles.more;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.name)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`group flex flex-col items-center justify-center py-3 sm:py-5 px-2 sm:px-3 rounded-[18px] sm:rounded-[24px] border text-center focus:outline-none cursor-pointer transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-700 shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-500/20'
                  : `${style.bg} shadow-apple-card`
              }`}
            >
              {/* Vibrant Gradient Icon Badge */}
              <motion.div 
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[13px] sm:rounded-[15px] flex items-center justify-center mb-1.5 sm:mb-2.5 transition-transform duration-200 shadow-sm ${
                  isSelected 
                    ? 'bg-white text-emerald-800 shadow-md' 
                    : `${style.iconGrad} text-white`
                }`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </motion.div>

              {/* Category Name */}
              <span className={`text-[11px] sm:text-xs font-bold tracking-tight font-sans truncate w-full ${
                isSelected ? 'text-white' : style.text
              }`}>
                {cat.name}
              </span>

              {/* Badge */}
              <span className={`text-[9px] sm:text-[10px] font-medium mt-0.5 truncate w-full ${
                isSelected ? 'text-white/80' : 'text-[#86868b]'
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
