import React, { useState } from 'react';
import { Plus, Minus, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductCard({ product, quantity = 0, onAdd, onRemove, onProductClick }) {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = (e) => {
    // Prevent triggering product page if user clicked an action button (e.g. Add, Stepper)
    if (e.target.closest('button')) return;
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <motion.article 
      onClick={handleCardClick}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className="group flex flex-col justify-between w-full bg-white rounded-[20px] sm:rounded-[24px] border border-black/[0.06] p-3 sm:p-4 shadow-apple-card hover:shadow-apple-hover transition-all duration-300 relative overflow-hidden cursor-pointer"
    >
      {/* Subtle hover rim highlight */}
      <div className="absolute inset-0 rounded-[20px] sm:rounded-[24px] pointer-events-none border border-black/0 group-hover:border-black/[0.04] transition-colors duration-300" />
      
      {/* Product Image Area */}
      <div className="w-full aspect-[1/1] sm:aspect-[4/3] bg-[#f5f5f7] rounded-[15px] sm:rounded-[18px] overflow-hidden mb-2.5 sm:mb-3 relative border border-black/[0.04] shadow-xs">
        
        {/* Discount Tag */}
        {product.discount && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[9px] sm:text-[10px] tracking-wide shadow-xs">
            {product.discount}
          </span>
        )}

        {/* Rating Badge */}
        {product.rating && (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[#1d1d1f] text-[9px] sm:text-[10px] font-semibold shadow-xs border border-black/[0.04]">
            <span className="text-amber-500">★</span> {product.rating}
          </span>
        )}

        {!imageError && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] block"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100/60">
            <ImageIcon className="w-7 h-7 stroke-[1.2] text-[#86868b]" />
            <span className="text-[10px] font-medium text-[#86868b] mt-1">{product.name}</span>
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-[#1d1d1f] text-xs sm:text-sm leading-tight font-sans line-clamp-2 min-h-[30px] sm:min-h-[34px] group-hover:text-emerald-700 transition-colors duration-200">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {product.size && (
              <span className="text-[10px] sm:text-[11px] text-[#86868b] font-medium truncate">
                {product.size}
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/50">
              {product.badgeText || 'Prime'}
            </span>
          </div>
        </div>

        {/* Price & Add Action Row */}
        <div className="mt-3 pt-2.5 flex items-center justify-between gap-1.5 border-t border-black/[0.04]">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold text-[#1d1d1f] font-sans tracking-tight">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-[#86868b] font-normal line-through font-sans">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 block truncate">
                Only {product.stock} left
              </span>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {(product.stock === 0 || product.stockStatus === 'out_of_stock') ? (
              <span className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-rose-600 bg-rose-50 rounded-full border border-rose-200 select-none">
                Out of Stock
              </span>
            ) : quantity === 0 ? (
              <motion.button
                key="add-btn"
                type="button"
                onClick={() => onAdd(product)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-full shadow-xs focus:outline-none transition-colors duration-200 cursor-pointer"
                aria-label={`Add ${product.name} to cart`}
              >
                + Add
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-flex items-center rounded-full bg-emerald-800 text-white font-medium text-xs shadow-xs overflow-hidden"
              >
                <motion.button
                  type="button"
                  onClick={() => onRemove(product)}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.1 }}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                  aria-label={`Decrease ${product.name} quantity`}
                >
                  <Minus className="w-3 h-3" />
                </motion.button>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span 
                    key={quantity}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="px-1 min-w-[14px] text-center text-[10px] sm:text-[11px] inline-block font-bold"
                  >
                    {quantity}
                  </motion.span>
                </AnimatePresence>

                <motion.button
                  type="button"
                  onClick={() => onAdd(product)}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.1 }}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                  aria-label={`Increase ${product.name} quantity`}
                >
                  <Plus className="w-3 h-3" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </motion.article>
  );
}
