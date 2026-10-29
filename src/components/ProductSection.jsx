import React from 'react';
import ProductCard from './ProductCard';
import { Search, X } from 'lucide-react';

export default function ProductSection({ 
  products = [], 
  cartItems = {}, 
  onAdd, 
  onRemove,
  searchQuery = '',
  onClearSearch,
  onProductClick
}) {
  return (
    <section className="w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2 py-4 sm:py-6">
      {/* Section Heading */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
            {searchQuery ? `Results for "${searchQuery}"` : 'Most Bought Products'}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/[0.05] text-[11px] font-medium text-[#86868b] tracking-normal">
            {searchQuery ? `${products.length} found` : 'Bestsellers'}
          </span>
        </div>

        {searchQuery && onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/60 transition-colors duration-150 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear search</span>
          </button>
        )}
      </div>

      {/* Product Grid / Empty State */}
      {products.length > 0 ? (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4.5"
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="w-full flex"
            >
              <ProductCard
                product={product}
                quantity={cartItems[product.id]?.quantity || 0}
                onAdd={onAdd}
                onRemove={onRemove}
                onProductClick={onProductClick}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 px-4 rounded-[28px] bg-white border border-black/[0.06] text-center max-w-md mx-auto shadow-apple-card">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-semibold text-[#1d1d1f]">
            No items match "{searchQuery}"
          </h3>
          <p className="text-xs text-[#86868b] mt-1 max-w-xs mx-auto">
            Try searching for something else like "atta", "milk", "oil", or "salt".
          </p>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors duration-150 cursor-pointer"
            >
              View all products
            </button>
          )}
        </div>
      )}
    </section>
  );
}
