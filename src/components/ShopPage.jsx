import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, 
  Search, 
  X, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Tag, 
  Check, 
  RotateCcw,
  Layers,
  Percent,
  Coins,
  ChevronRight,
  ArrowRight,
  Filter,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft
} from 'lucide-react';
import ProductCard from './ProductCard';
import DualRangeSlider from './DualRangeSlider';
import { ALL_PRODUCTS } from '../data/products';

const SHOP_CATEGORIES = [
  'All Items',
  'Groceries',
  'Fresh Produce',
  'Dairy & Breakfast',
  'Beverages',
  'Snacks',
  'Personal Care'
];

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured / Best Match', icon: Sparkles },
  { id: 'price-asc', label: 'Price: Low to High', icon: ArrowUp },
  { id: 'price-desc', label: 'Price: High to Low', icon: ArrowDown },
  { id: 'rating', label: 'Highest Rated ★', icon: Star },
  { id: 'discount', label: 'Biggest Savings', icon: Tag }
];

const MIN_PRICE = 25;
const MAX_PRICE = 500;

export default function ShopPage({
  products = [],
  cartItems = {},
  onAdd,
  onRemove,
  onBackToHome,
  searchQuery = '',
  onSearchChange,
  onProductClick
}) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [internalSearch, setInternalSearch] = useState('');
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [minPrice, setMinPrice] = useState(MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kirana_shop_sidebar_open');
        if (saved !== null) return JSON.parse(saved);
      } catch (_) {}
    }
    return true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('kirana_shop_sidebar_open', JSON.stringify(next));
        } catch (_) {}
      }
      return next;
    });
  };

  const individualCategories = useMemo(
    () => SHOP_CATEGORIES.filter((c) => c !== 'All Items'),
    []
  );

  // When selectedCategories is empty, contains 'All Items', or includes all categories, all items are shown
  const isAllSelected = 
    selectedCategories.length === 0 || 
    selectedCategories.includes('All Items') || 
    selectedCategories.length >= individualCategories.length;

  const handleCategoryToggle = (cat) => {
    if (cat === 'All Items') {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((prev) => {
      const current = prev.filter((c) => c !== 'All Items');
      let next;
      if (current.includes(cat)) {
        next = current.filter((c) => c !== cat);
      } else {
        next = [...current, cat];
      }

      // When everything is selected, automatically switch to All Items!
      if (next.length >= individualCategories.length) {
        return [];
      }

      return next;
    });
  };

  // Effective search query (either passed from Navbar or typed in local filter)
  const activeSearch = searchQuery || internalSearch;

  // Calculate live item counts per category
  const categoryCounts = useMemo(() => {
    const counts = { 'All Items': products.length };
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Count of items on discount
  const discountedCount = useMemo(() => {
    return products.filter((item) => Boolean(item.discount)).length;
  }, [products]);

  // Active filters count for badges
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!isAllSelected && selectedCategories.length > 0) {
      count += selectedCategories.length;
    }
    if (activeSearch.trim()) count++;
    if (sortBy !== 'featured') count++;
    if (onlyDiscounts) count++;
    if (minPrice > MIN_PRICE || maxPrice < MAX_PRICE) count++;
    return count;
  }, [isAllSelected, selectedCategories, activeSearch, sortBy, onlyDiscounts, minPrice, maxPrice]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by Categories (Multi-select)
    if (!isAllSelected && selectedCategories.length > 0) {
      const selectedLower = selectedCategories.map((c) => c.toLowerCase());
      list = list.filter(
        (item) => item.category && selectedLower.includes(item.category.toLowerCase())
      );
    }

    // Filter by Search Query
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category?.toLowerCase() === q ||
          item.category?.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.badgeText && item.badgeText.toLowerCase().includes(q))
      );
    }

    // Quick filter: Discounts only
    if (onlyDiscounts) {
      list = list.filter((item) => Boolean(item.discount));
    }

    // Price range filter: Products from minPrice (x) to maxPrice (y)
    if (minPrice > MIN_PRICE || maxPrice < MAX_PRICE) {
      list = list.filter((item) => item.price >= minPrice && item.price <= maxPrice);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        list.sort((a, b) => {
          const discountA = a.originalPrice ? a.originalPrice - a.price : 0;
          const discountB = b.originalPrice ? b.originalPrice - b.price : 0;
          return discountB - discountA;
        });
        break;
      case 'featured':
      default:
        // Keep natural curated order
        break;
    }

    return list;
  }, [products, isAllSelected, selectedCategories, activeSearch, onlyDiscounts, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSortBy('featured');
    setInternalSearch('');
    setOnlyDiscounts(false);
    setMinPrice(MIN_PRICE);
    setMaxPrice(MAX_PRICE);
    if (onSearchChange) onSearchChange('');
  };

  const handlePriceRangeChange = useCallback(([newMin, newMax]) => {
    setMinPrice(newMin);
    setMaxPrice(newMax);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileFilterOpen) {
        setIsMobileFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFilterOpen]);

  // Quick focus search input with '/' or 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleQuickSearchKey = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (
        (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) &&
        activeTag !== 'INPUT' &&
        activeTag !== 'TEXTAREA'
      ) {
        e.preventDefault();
        const inputEl = document.getElementById('desktop-shop-search-input') || document.getElementById('mobile-shop-search-input');
        inputEl?.focus();
        inputEl?.select();
      }
    };
    window.addEventListener('keydown', handleQuickSearchKey);
    return () => window.removeEventListener('keydown', handleQuickSearchKey);
  }, []);

  // Keyboard shortcut: Toggle sidebar with 'b' or '[' when not typing in an input
  useEffect(() => {
    const handleToggleKey = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      if (e.key === 'b' || e.key === 'B' || e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleToggleKey);
    return () => window.removeEventListener('keydown', handleToggleKey);
  }, []);

  // Reusable side panel filters content function (plain function call prevents unmounting on state updates)
  const renderFilterContent = (isMobile = false) => (
    <div className="relative">
      {/* Sticky Modernized Search Bar on Scroll */}
      <div
        className={`sticky top-0 z-20 bg-white/95 backdrop-blur-md pt-2 pb-3.5 border-b border-black/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.02)] ${
          isMobile ? '-mx-6 px-6 -mt-2' : '-mx-5 px-5 -mt-1'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
              <Search className="w-3 h-3 stroke-[2.4]" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-[#1d1d1f] tracking-tight">
              Search Products
            </span>
          </div>

          {activeSearch ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-600 animate-ping" />
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          ) : activeFiltersCount > 0 ? (
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              {activeFiltersCount} active
            </span>
          ) : (
            <span className="text-[10px] font-medium text-[#86868b]">
              Live Catalog
            </span>
          )}
        </div>

        {/* Modern Interactive Search Input */}
        <div className="relative group">
          {/* Ambient Glow on hover and focus */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-emerald-500/25 rounded-2xl opacity-0 group-hover:opacity-40 group-focus-within:opacity-100 blur-xs transition-opacity duration-300 pointer-events-none" />

          <div className="relative flex items-center w-full bg-white hover:bg-neutral-50/50 group-focus-within:bg-white rounded-[14px] border-2 border-neutral-400 hover:border-neutral-700 group-focus-within:border-emerald-600 group-focus-within:ring-4 group-focus-within:ring-emerald-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-xs group-focus-within:shadow-[0_4px_16px_rgba(5,150,105,0.12)] transition-all duration-200">
            {/* Animated Search Icon */}
            <div className="pl-3.5 pr-2 text-neutral-600 group-hover:text-neutral-900 group-focus-within:text-emerald-700 transition-colors shrink-0">
              <Search className="w-4 h-4 transition-transform duration-200 group-focus-within:scale-110" />
            </div>

            <input
              id={isMobile ? "mobile-shop-search-input" : "desktop-shop-search-input"}
              type="text"
              value={activeSearch}
              onChange={(e) => {
                setInternalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              placeholder="Search atta, milk, biscuits, tea..."
              className="w-full py-2.5 pr-8 text-xs sm:text-[13px] font-medium text-[#1d1d1f] bg-transparent outline-none placeholder:text-neutral-400 placeholder:font-normal"
            />

            {/* Clear Button or Keyboard Shortcut Pill */}
            {activeSearch ? (
              <motion.button
                type="button"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => {
                  setInternalSearch('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="mr-2.5 w-5 h-5 rounded-full bg-neutral-200 hover:bg-neutral-300 text-[#1d1d1f] flex items-center justify-center transition-all hover:scale-105 cursor-pointer shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </motion.button>
            ) : (
              <div className="mr-2.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-neutral-100 border border-neutral-200/90 text-[10px] font-mono font-medium text-neutral-500 pointer-events-none shrink-0 shadow-2xs">
                <span>/</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Trending Keyword Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] font-bold text-[#86868b] shrink-0 tracking-wider uppercase pl-0.5">
            Try:
          </span>
          {['Atta', 'Milk', 'Ghee', 'Tea', 'Snacks'].map((tag) => {
            const isActive = activeSearch.toLowerCase().trim() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const nextVal = isActive ? '' : tag;
                  setInternalSearch(nextVal);
                  if (onSearchChange) onSearchChange(nextVal);
                }}
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-semibold'
                    : 'bg-black/[0.03] hover:bg-emerald-50 text-neutral-600 hover:text-emerald-800 border-black/[0.05] hover:border-emerald-200'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Filters Body */}
      <div className="space-y-6 pt-5">

      {/* Category Navigation */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Categories</span>
          </label>
          <div className="flex items-center gap-1.5">
            {!isAllSelected && selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                Reset
              </button>
            )}
            <span className="text-[10px] text-[#86868b] font-medium">
              {!isAllSelected && selectedCategories.length > 0
                ? `${selectedCategories.length} selected`
                : `${SHOP_CATEGORIES.length} options`}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          {SHOP_CATEGORIES.map((cat) => {
            const isAll = cat === 'All Items';
            const isSelected = isAll ? isAllSelected : (!isAllSelected && selectedCategories.includes(cat));
            const count = categoryCounts[cat] || 0;

            return (
              <motion.button
                key={cat}
                type="button"
                onClick={() => handleCategoryToggle(cat)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? isAll
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-300/80 shadow-2xs'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isAll ? (
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? 'border-white bg-white text-emerald-700'
                          : 'border-black/25 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />}
                    </span>
                  ) : (
                    <span
                      className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-700 text-white shadow-2xs'
                          : 'border-black/25 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                  )}
                  <span className="truncate">{cat}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors shrink-0 ${
                    isSelected
                      ? isAll
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#f0f0f2] text-[#86868b]'
                  }`}
                >
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
          <span>Sort By</span>
        </label>

        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = sortBy === opt.id;
            const IconComp = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSortBy(opt.id);
                  if (isMobile) setIsMobileFilterOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/80 shadow-2xs'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-[#86868b]'}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Special Filters</span>
          </label>
          {onlyDiscounts && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
              Active
            </span>
          )}
        </div>

        <div className="space-y-2">
          {/* Discounts & Deals Modernized Toggle Button */}
          <motion.button
            type="button"
            role="switch"
            aria-checked={onlyDiscounts}
            onClick={() => setOnlyDiscounts(!onlyDiscounts)}
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className={`w-full group relative flex items-center justify-between p-3 rounded-2xl transition-all duration-200 cursor-pointer border text-left ${
              onlyDiscounts
                ? 'bg-gradient-to-r from-emerald-50/95 via-teal-50/70 to-emerald-50/95 border-emerald-300 shadow-[0_4px_18px_rgba(5,150,105,0.14)] ring-1 ring-emerald-500/20'
                : 'bg-white hover:bg-[#fafafa] border-black/[0.08] hover:border-black/[0.14] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Left Content: Emblem + Title + Subtitle */}
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs ${
                  onlyDiscounts
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-emerald-600/30 shadow-md scale-105'
                    : 'bg-amber-50 text-amber-600 border border-amber-200/60 group-hover:bg-amber-100/70 group-hover:scale-105'
                }`}
              >
                <Percent className={`w-4 h-4 transition-transform duration-300 ${onlyDiscounts ? 'rotate-[-8deg] scale-105 stroke-[2.5]' : 'stroke-[2.2]'}`} />
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-bold tracking-tight block truncate transition-colors ${
                    onlyDiscounts ? 'text-emerald-950 font-extrabold' : 'text-[#1d1d1f] group-hover:text-black'
                  }`}>
                    On Sale & Offers
                  </span>
                  {discountedCount > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide border transition-colors ${
                      onlyDiscounts 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs' 
                        : 'bg-amber-100 text-amber-800 border-amber-200/80'
                    }`}>
                      {discountedCount} Deals
                    </span>
                  )}
                </div>
                <span className={`text-[10px] block truncate font-medium transition-colors mt-0.5 ${
                  onlyDiscounts ? 'text-emerald-700 font-semibold' : 'text-[#86868b] group-hover:text-neutral-600'
                }`}>
                  {onlyDiscounts ? 'Showing all promotional items' : 'View deals up to 40% OFF'}
                </span>
              </div>
            </div>

            {/* Right: Modern iOS/macOS Fluid Toggle Switch */}
            <div 
              className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors duration-300 flex items-center shadow-inner ${
                onlyDiscounts 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-700/20' 
                  : 'bg-neutral-200 group-hover:bg-neutral-300'
              }`}
            >
              <motion.div 
                animate={{ x: onlyDiscounts ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-none"
              >
                {onlyDiscounts ? (
                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 group-hover:bg-neutral-400 transition-colors" />
                )}
              </motion.div>
            </div>
          </motion.button>
        </div>

        {/* Dual Range Price Slider (x: 1st dot from, y: 2nd dot to) */}
        <div className="pt-3 border-t border-black/[0.04] mt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-700" />
              <span>Price Range</span>
            </label>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              ₹{minPrice} – ₹{maxPrice}
            </span>
          </div>

          {/* Dual Range Track & Dots with smooth pointer tracking */}
          <DualRangeSlider
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={5}
            value={[minPrice, maxPrice]}
            onChange={handlePriceRangeChange}
          />

          <div className="flex items-center justify-between text-[10px] font-semibold text-[#86868b] mt-1">
            <span>From ₹{minPrice}</span>
            <span>To ₹{maxPrice}</span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-2 gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => {
                setMinPrice(25);
                setMaxPrice(100);
              }}
              className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                minPrice === 25 && maxPrice === 100
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-[#f5f5f7] hover:bg-[#ebebee] text-[#515154] border-black/[0.04]'
              }`}
            >
              ₹25 – ₹100
            </button>
            <button
              type="button"
              onClick={() => {
                setMinPrice(100);
                setMaxPrice(250);
              }}
              className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                minPrice === 100 && maxPrice === 250
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-[#f5f5f7] hover:bg-[#ebebee] text-[#515154] border-black/[0.04]'
              }`}
            >
              ₹100 – ₹250
            </button>
            <button
              type="button"
              onClick={() => {
                setMinPrice(250);
                setMaxPrice(500);
              }}
              className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                minPrice === 250 && maxPrice === 500
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-[#f5f5f7] hover:bg-[#ebebee] text-[#515154] border-black/[0.04]'
              }`}
            >
              ₹250 – ₹500
            </button>
            <button
              type="button"
              onClick={() => {
                setMinPrice(MIN_PRICE);
                setMaxPrice(MAX_PRICE);
              }}
              className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                minPrice === MIN_PRICE && maxPrice === MAX_PRICE
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-[#f5f5f7] hover:bg-[#ebebee] text-[#515154] border-black/[0.04]'
              }`}
            >
              All (₹25 – ₹500)
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Filters Button */}
      {activeFiltersCount > 0 && (
        <div className="pt-2 border-t border-black/[0.04]">
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters ({activeFiltersCount})</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );

  return (
    <div className="w-full pt-1.5 sm:pt-2 pb-5 sm:pb-6">
      <div className="w-[96%] max-w-[1600px] mx-auto px-2 sm:px-3 lg:px-4">

        {/* Mobile Filter Toggle Header Bar (Visible on < lg) */}
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#1d1d1f] block truncate">
              {isAllSelected
                ? 'All Items'
                : selectedCategories.length === 1
                ? selectedCategories[0]
                : `${selectedCategories.length} Categories selected`}
            </span>
            <span className="text-[11px] text-[#86868b]">
              {filteredProducts.length} items found
            </span>
          </div>

          <motion.button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Main 2-Column Coordinated Layout with 3D Spatial Folio Unfold Transition */}
        <div
          className="flex flex-col lg:grid transition-[grid-template-columns,column-gap] motion-reduce:transition-none"
          style={{
            gridTemplateColumns: isSidebarOpen ? '320px minmax(0, 1fr)' : '0px minmax(0, 1fr)',
            columnGap: isSidebarOpen ? '28px' : '0px',
            transitionDuration: '420ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >

          {/* LEFT SIDE PANEL (Desktop & Tablet) - 3D Kinetic Origami Folio Stage */}
          <aside
            className="hidden lg:block min-w-0"
            style={{
              perspective: '1400px',
              perspectiveOrigin: 'left center',
              overflow: isSidebarOpen ? 'visible' : 'hidden'
            }}
            aria-hidden={!isSidebarOpen}
          >
            <div className="w-[320px] max-w-[320px]">
              {/* 3D Kinetic Folio Card: Pivots gracefully on a 3D left-edge spatial hinge */}
              <div
                className="sticky top-[78px] sm:top-[80px] w-full bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-[24px] p-5 max-h-[calc(100vh-98px)] overflow-y-auto overflow-x-hidden scrollbar-none motion-reduce:transition-none"
                style={{
                  transformOrigin: 'left center',
                  transform: isSidebarOpen
                    ? 'perspective(1400px) rotateY(0deg) rotateX(0deg) scale(1) translate3d(0, 0, 0)'
                    : 'perspective(1400px) rotateY(-24deg) rotateX(2deg) scale(0.92) translate3d(-35px, 0, -30px)',
                  opacity: isSidebarOpen ? 1 : 0,
                  boxShadow: isSidebarOpen
                    ? '0 16px 40px -8px rgba(0,0,0,0.06), 0 4px 16px -2px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.04)'
                    : '0 2px 8px -2px rgba(0,0,0,0.02), 0 0 0 0 rgba(0,0,0,0)',
                  transition: isSidebarOpen
                    ? 'transform 440ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 440ms cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out, box-shadow 360ms cubic-bezier(0.22, 1, 0.36, 1)',
                  pointerEvents: isSidebarOpen ? 'auto' : 'none',
                  willChange: 'transform, opacity'
                }}
              >
                
                {/* Side Panel Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-100/60 shadow-2xs">
                      <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                        Filters
                      </h2>
                      <span className="text-[10px] text-[#86868b]">
                        Refine Catalog
                      </span>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Filter Content */}
                {renderFilterContent(false)}
              </div>
            </div>
          </aside>

          {/* RIGHT PRODUCT CATALOG AREA */}
          <main className="flex-1 w-full min-w-0">
            
            {/* Catalog Top Controls Row: Circular Toggle Button Beside the Bar */}
            <div className="flex items-center gap-3 mb-6">
              {/* Circular Sidebar Toggle Button with Kinetic Magnetic Ripple & 3D Morph */}
              <motion.button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setIsMobileFilterOpen(true);
                  } else {
                    toggleSidebar();
                  }
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                animate={{
                  scale: isSidebarOpen ? [0.92, 1.05, 1] : [1.08, 0.94, 1],
                  rotate: isSidebarOpen ? [180, 0] : [0, 180]
                }}
                transition={{
                  duration: 0.42,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 cursor-pointer shadow-xs border relative group ${
                  isSidebarOpen
                    ? 'bg-white/95 backdrop-blur-md border-black/[0.08] hover:border-emerald-300 hover:bg-emerald-50/50 text-[#1d1d1f] hover:text-emerald-800'
                    : 'bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-4 ring-emerald-500/15'
                }`}
                title={isSidebarOpen ? "Fold filters folio (Press 'B' or '[')" : "Unfold filters folio (Press 'B' or '[')"}
                aria-label={isSidebarOpen ? "Fold filters" : "Unfold filters"}
              >
                <motion.span
                  key={isSidebarOpen ? "open" : "closed"}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center"
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <PanelLeftOpen className="w-5 h-5 stroke-[2]" />
                  )}
                </motion.span>
                {!isSidebarOpen && activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </motion.button>

              {/* All Groceries & Essentials Bar (Button completely removed from inside) */}
              <div className="flex-1 min-w-0 bg-white/90 backdrop-blur-md rounded-2xl border border-black/[0.06] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-baseline gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] font-sans">
                    {isAllSelected
                      ? 'All Groceries & Essentials'
                      : selectedCategories.length === 1
                      ? selectedCategories[0]
                      : `${selectedCategories.length} Categories (${selectedCategories.join(', ')})`}
                  </h1>
                  <span className="text-xs text-[#86868b] font-medium px-2 py-0.5 rounded-full bg-neutral-100">
                    {filteredProducts.length} items
                  </span>
                </div>

                {/* Active Filter Chips */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isAllSelected && selectedCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 shadow-2xs"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          className="hover:text-emerald-950 cursor-pointer p-0.5 rounded-full hover:bg-emerald-200/50 transition-colors"
                          aria-label={`Remove ${cat} category filter`}
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}

                    {activeSearch && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        &ldquo;{activeSearch}&rdquo;
                        <button
                          type="button"
                          onClick={() => {
                            setInternalSearch('');
                            if (onSearchChange) onSearchChange('');
                          }}
                          className="hover:text-emerald-950 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {onlyDiscounts && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-semibold border border-amber-200">
                        Discounts
                        <button
                          type="button"
                          onClick={() => setOnlyDiscounts(false)}
                          className="hover:text-amber-950 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {(minPrice > MIN_PRICE || maxPrice < MAX_PRICE) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        ₹{minPrice} – ₹{maxPrice}
                        <button
                          type="button"
                          onClick={() => {
                            setMinPrice(MIN_PRICE);
                            setMaxPrice(MAX_PRICE);
                          }}
                          className="hover:text-emerald-950 cursor-pointer"
                          aria-label="Remove price filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-[#86868b] hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Grid or Empty State - Smooth Layout Shifts */}
            {filteredProducts.length > 0 ? (
              <motion.div 
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  layout: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.25 }
                }}
                className={`grid grid-cols-2 md:grid-cols-3 ${
                  isSidebarOpen 
                    ? 'xl:grid-cols-3 2xl:grid-cols-4' 
                    : 'lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'
                } gap-3 sm:gap-5`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartItems[product.id]?.quantity || 0}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onProductClick={onProductClick}
                  />
                ))}
              </motion.div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-[28px] border border-black/[0.06] p-10 sm:p-14 text-center max-w-lg mx-auto my-10 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
                  <Package className="w-8 h-8 stroke-[1.7]" />
                </div>
                <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">
                  Store Inventory is Empty
                </h3>
                <p className="text-xs text-[#86868b] mb-6 leading-relaxed max-w-sm mx-auto">
                  All demo products were removed. Your real Supabase database is connected and ready for your own inventory!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="#/admin"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Add Products in Admin</span>
                  </a>
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#1d1d1f] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Back to Home</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] border border-black/[0.06] p-10 sm:p-14 text-center max-w-md mx-auto my-12 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-[#86868b]">
                  <Search className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-[#1d1d1f] mb-1">
                  No matching products found
                </h3>
                <p className="text-xs text-[#86868b] mb-5 leading-relaxed">
                  We couldn't find any products matching your current filters. Try resetting to browse all items.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset all filters</span>
                </button>
              </div>
            )}
          </main>

        </div>

      </div>


      {/* MOBILE / TABLET FILTER SLIDE-OVER SCREEN DRAWER */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
            {/* Frosted Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-md"
            />

            {/* Slide-over Drawer styled with authentic Apple iOS spring animation */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 240, damping: 26, mass: 0.85 }}
              className="absolute top-0 left-0 bottom-0 w-[310px] sm:w-[360px] bg-white/95 backdrop-blur-2xl z-50 p-6 overflow-y-auto overflow-x-hidden shadow-[0_24px_70px_rgba(0,0,0,0.3)] flex flex-col justify-between rounded-r-[32px] sm:rounded-r-[36px] border-r border-black/[0.08]"
            >
              <div>
                {/* Drawer Header matching desktop sidebar */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-100/60 shadow-2xs">
                      <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                        Filters
                      </h2>
                      <span className="text-[10px] text-[#86868b]">
                        Refine Catalog
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#ebebee] flex items-center justify-center text-[#1d1d1f] transition-colors cursor-pointer border border-black/[0.04]"
                      aria-label="Close filters drawer"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </motion.button>
                  </div>
                </div>

                {/* Filter Content */}
                {renderFilterContent(true)}
              </div>

              {/* Drawer Apply Button */}
              <div className="pt-5 mt-6 border-t border-black/[0.06] bg-white sticky bottom-0 -mx-6 px-6 -mb-6 pb-6">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <span>Show {filteredProducts.length} Products</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
