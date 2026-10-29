import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  Star, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  Heart, 
  Share2, 
  Package, 
  Sparkles, 
  Clock, 
  Truck, 
  Award, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Layers,
  Leaf,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ProductCard from './ProductCard';
import ProductPriceHistory from './ProductPriceHistory';
import ProductReviewsSection from './ProductReviewsSection';

export default function ProductDetailPage({ 
  product, 
  allProducts = [], 
  cartItems = {}, 
  onAdd, 
  onRemove, 
  onBack, 
  onProductClick,
  onOpenCart,
  showNotice
}) {
  const [selectedImage, setSelectedImage] = useState(product?.image || '');
  const [activeTab, setActiveTab] = useState('highlights'); // 'highlights' | 'specs' | 'delivery'
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (product?.image) {
      setSelectedImage(product.image);
      setImageError(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product?.id]);

  if (!product) {
    return (
      <div className="w-[96%] max-w-[1400px] mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-[#1d1d1f]">Product Not Found</h2>
        <p className="text-sm text-[#86868b] mt-2 mb-6">The product you are looking for is unavailable or has been removed.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold shadow-xs cursor-pointer"
        >
          Back to Store
        </button>
      </div>
    );
  }

  const quantity = cartItems[product.id]?.quantity || 0;
  const originalPrice = product.originalPrice || (product.price ? Math.round(product.price * 1.25) : 0);
  const hasDiscount = originalPrice > product.price;
  const savingsAmount = hasDiscount ? originalPrice - product.price : 0;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // Filter similar products from the same category
  const similarProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.id !== product.id && p.category?.toLowerCase() === product.category?.toLowerCase())
      .slice(0, 4);
  }, [allProducts, product]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      try {
        navigator.clipboard.writeText(window.location.href);
        if (showNotice) showNotice('Link copied to clipboard!');
      } catch (_) {}
    }
  };

  const handleBuyNow = () => {
    if (quantity === 0) {
      onAdd(product);
    }
    if (onOpenCart) {
      onOpenCart();
    }
  };

  return (
    <div className="w-[94%] sm:w-[96%] max-w-[1400px] mx-auto px-1 sm:px-4 py-3 sm:py-8 pb-24 sm:pb-8 font-sans antialiased text-[#1d1d1f]">
      
      {/* ==================== BREADCRUMBS & TOP BAR ==================== */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#86868b]">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200/60"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Back to Products</span>
          </button>
          
          <span className="text-neutral-300">/</span>
          <span className="hover:text-[#1d1d1f] cursor-pointer" onClick={onBack}>
            {product.category || 'Shop'}
          </span>
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-[#1d1d1f] truncate max-w-[180px] sm:max-w-xs">
            {product.name}
          </span>
        </div>

        {/* Quick Action Icons: Share & Favorite */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white hover:bg-neutral-100 border border-black/[0.08] flex items-center justify-center text-[#1d1d1f] shadow-2xs transition-colors cursor-pointer"
            title="Share Product"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLiked(!isLiked);
              if (showNotice) showNotice(!isLiked ? 'Added to your favorites' : 'Removed from favorites');
            }}
            className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-2xs transition-colors cursor-pointer ${
              isLiked 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-white hover:bg-neutral-100 border-black/[0.08] text-[#1d1d1f]'
            }`}
            title="Favorite"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </nav>

      {/* ==================== MAIN PRODUCT HERO SECTION ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] p-3.5 sm:p-8 lg:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        
        {/* LEFT COLUMN: PRODUCT VISUALS (5 of 12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Main Visual Frame */}
          <div className="relative w-full aspect-square bg-[#fbfbfd] rounded-[26px] overflow-hidden border border-black/[0.06] flex items-center justify-center shadow-inner group">
            
            {/* Top Badges */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
              {hasDiscount && (
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] shadow-sm tracking-wide">
                  {discountPercent}% OFF
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[#1d1d1f] font-semibold text-[10px] shadow-xs border border-black/[0.05]">
                {product.badgeText || 'Prime Selection'}
              </span>
            </div>

            {/* Clickable Rating Pill */}
            <button
              type="button"
              onClick={() => setShowRatingModal(true)}
              className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#1d1d1f] text-[11px] font-bold shadow-xs border border-black/[0.05] flex items-center gap-1 cursor-pointer hover:bg-amber-50 hover:scale-105 active:scale-95 transition-all group"
              title="Click to view rating breakdown"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:rotate-12 transition-transform" />
              <span>{product.rating || '4.8'}</span>
              <span className="text-[#86868b] font-normal text-[10px]">(248)</span>
            </button>

            {/* Product Image */}
            {!imageError && selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                <Package className="w-16 h-16 stroke-[1.2] text-neutral-300 mb-2" />
                <span className="text-xs font-semibold text-[#86868b]">{product.name}</span>
                <span className="text-[10px] text-neutral-400 mt-0.5">High resolution photo</span>
              </div>
            )}
          </div>

          {/* Value Proposition Micro-Banners */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#f5fbf8] border border-emerald-100/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-950 block truncate">15-Min Delivery</span>
                <span className="text-[10px] text-emerald-800/80 block truncate">Express dispatch</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#faf9f6] border border-amber-100/80">
              <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-amber-950 block truncate">100% Authentic</span>
                <span className="text-[10px] text-amber-800/80 block truncate">Certified fresh</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DETAILS, PRICING & ACTIONS (7 of 12 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Category & Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                {product.category || 'Grocery'}
              </span>
              <span className="text-xs text-[#86868b] font-medium">
                SKU: {product.sku || `KIR-${product.id}`}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1d1d1f] tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Clickable Rating & Review Summary Line */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-700 hover:text-emerald-800 transition-colors cursor-pointer group"
                title="Click to view rating breakdown"
              >
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-extrabold text-[#1d1d1f] text-sm ml-1">{product.rating || '4.8'}</span>
                </div>
                <span className="text-neutral-300">•</span>
                <span className="text-emerald-800 font-bold underline decoration-dotted group-hover:text-emerald-950">
                  248 Ratings &amp; 86 Reviews
                </span>
              </button>
              <span className="text-neutral-300">•</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                96% Recommend
              </span>
            </div>

            {/* Weight / Size Info */}
            <div className="flex items-center gap-3 mt-3 text-sm text-[#86868b]">
              <span className="font-medium text-[#1d1d1f]">
                Net Weight: <span className="font-bold text-emerald-900">{product.size || 'Standard Pack'}</span>
              </span>
              <span>&bull;</span>
              <span>Direct From Certified Farms</span>
            </div>

            {/* Price Showcase Card */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#f9fafb] border border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1f] tracking-tight">
                    ₹{product.price}
                  </span>
                  {hasDiscount && (
                    <span className="text-base sm:text-lg text-[#86868b] line-through font-normal">
                      ₹{originalPrice}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Save ₹{savingsAmount} ({discountPercent}%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#86868b] mt-1">
                  Inclusive of all taxes &bull; Free delivery on orders over ₹199
                </p>
              </div>

              {/* Stock Status Badge */}
              <div className="sm:text-right">
                {product.stock === 0 || product.stockStatus === 'out_of_stock' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Out of Stock
                  </span>
                ) : product.stock !== undefined && product.stock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Only {product.stock} units left!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    In Stock ({product.stock !== undefined ? `${product.stock} units` : 'Available'})
                  </span>
                )}
              </div>
            </div>

            {/* Express Delivery Banner */}
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Delivering to your location in <strong className="font-extrabold text-emerald-900">12–15 minutes</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full shadow-2xs border border-emerald-200 hidden sm:inline-block">
                Express Zone
              </span>
            </div>

            {/* Purchase CTA Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {product.stock === 0 || product.stockStatus === 'out_of_stock' ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-3.5 px-6 rounded-full bg-neutral-200 text-neutral-500 font-bold text-sm cursor-not-allowed text-center"
                >
                  Currently Out of Stock
                </button>
              ) : quantity === 0 ? (
                <>
                  <motion.button
                    type="button"
                    onClick={() => onAdd(product)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/25 cursor-pointer transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleBuyNow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="py-3.5 px-6 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-bold text-sm shadow-sm cursor-pointer transition-colors"
                  >
                    Buy Now
                  </motion.button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                  {/* Stepper Control */}
                  <div className="flex items-center justify-between sm:justify-start gap-4 p-2 rounded-full bg-emerald-800 text-white">
                    <button
                      type="button"
                      onClick={() => onRemove(product)}
                      className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <span className="font-extrabold text-sm px-2 min-w-[24px] text-center">
                      {quantity} in Cart
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdd(product)}
                      className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    onClick={onOpenCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 px-6 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-xs cursor-pointer text-center"
                  >
                    View in Cart Drawer &rarr;
                  </motion.button>
                </div>
              )}
            </div>

          </div>

          {/* ==================== TABS: HIGHLIGHTS, SPECS, POLICIES ==================== */}
          <div className="pt-6 border-t border-black/[0.06]">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto no-scrollbar">
              {[
                { id: 'highlights', label: 'Highlights & Overview' },
                { id: 'specs', label: 'Product Specifications' },
                { id: 'delivery', label: 'Delivery & Returns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="pt-3 text-xs leading-relaxed text-[#515154]">
              {activeTab === 'highlights' && (
                <div className="space-y-3">
                  <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed">
                    {product.description || 
                      `Premium quality ${product.name} curated specifically for everyday household needs. Carefully packed to preserve aroma, natural freshness, and essential nutrients.`
                    }
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-[#1d1d1f]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Zero artificial colors or preservatives</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Freshly harvested & cold-chain handled</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Direct farm sourcing with fair pricing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Sealed eco-friendly packaging</span>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#f9fafb] p-4 rounded-2xl border border-black/[0.04]">
                  <div>
                    <span className="text-[11px] text-[#86868b] block">Department / Category</span>
                    <span className="font-semibold text-[#1d1d1f]">{product.category}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#86868b] block">Net Quantity</span>
                    <span className="font-semibold text-[#1d1d1f]">{product.size || 'Standard pack'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#86868b] block">Shelf Life</span>
                    <span className="font-semibold text-[#1d1d1f]">6 to 9 Months</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#86868b] block">Country of Origin</span>
                    <span className="font-semibold text-[#1d1d1f]">India</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#86868b] block">FSSAI Certified</span>
                    <span className="font-semibold text-[#1d1d1f]">Lic. No. 10019022009876</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#86868b] block">Storage Advice</span>
                    <span className="font-semibold text-[#1d1d1f]">Store in cool, dry place</span>
                  </div>
                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="space-y-2.5 text-xs text-[#515154]">
                  <p>
                    <strong>15-Minute Express Fulfilment:</strong> Orders are automatically packed at your nearest neighborhood dark store and dispatched via our dedicated electric delivery fleet.
                  </p>
                  <p>
                    <strong>24-Hour Easy Return Guarantee:</strong> If the packaging is damaged or quality does not meet your expectations, request a free replacement or instant refund directly from your order screen.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ==================== 1. PRICE HISTORY & VALUE TRACKER ==================== */}
      <ProductPriceHistory product={product} />

      {/* ==================== 2. TRUST, FRESHNESS & SERVICE ASSURANCE ==================== */}
      <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
            <Award className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">100% Quality Guarantee</h4>
            <p className="text-[11px] text-neutral-500">Certified farm-direct freshness</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-100">
            <Clock className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">12–15 Min Delivery</h4>
            <p className="text-[11px] text-neutral-500">Dispatched from neighborhood hub</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
            <RotateCcw className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">24h Hassle-Free Returns</h4>
            <p className="text-[11px] text-neutral-500">Instant credit or replacement</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">FSSAI Certified Safety</h4>
            <p className="text-[11px] text-neutral-500">Hygienic multi-layer packing</p>
          </div>
        </div>
      </section>

      {/* ==================== 3. PRODUCT FAQS ACCORDION ==================== */}
      <section className="mt-10 p-5 sm:p-8 bg-white rounded-[28px] border border-black/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
            <HelpCircle className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#1d1d1f] tracking-tight">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-[#86868b]">
              Everything you need to know about {product.name}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              q: `How is the freshness of ${product.name} guaranteed?`,
              a: `Every batch of ${product.name} is temperature monitored, moisture sealed, and procured directly from certified farm clusters daily. Nothing sits in prolonged depot storage.`
            },
            {
              q: 'What is the shelf life and storage recommendation?',
              a: 'Keep in an airtight container away from direct sunlight in a dry place. The packaged shelf life is typically 6 to 9 months from the packaging date stamped on the packet.'
            },
            {
              q: 'Can I return or exchange this if I am not satisfied?',
              a: 'Yes, absolutely. Kirana offers a 24-hour instant replacement or zero-questions-asked refund policy directly through your Orders tab.'
            },
            {
              q: 'How fast will my order arrive?',
              a: 'Orders are packed in under 3 minutes at your hyper-local Kirana dark store and dispatched via our dedicated fleet to arrive within 12 to 15 minutes.'
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl border border-black/[0.05] overflow-hidden bg-[#fafbfc] transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-neutral-900 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
                  )}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 leading-relaxed border-t border-black/[0.04] bg-white">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== 4. CUSTOMER REVIEWS & REAL RATINGS SECTION ==================== */}
      <ProductReviewsSection 
        product={product} 
        isModalOpen={showRatingModal} 
        onCloseModal={() => setShowRatingModal(false)} 
      />

      {/* ==================== 5. SIMILAR PRODUCTS SECTION ==================== */}
      {similarProducts.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight">
                Similar Items in {product.category}
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                Explore popular everyday alternatives and related pantry items
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {similarProducts.map((simProd) => (
              <ProductCard
                key={simProd.id}
                product={simProd}
                quantity={cartItems[simProd.id]?.quantity || 0}
                onAdd={onAdd}
                onRemove={onRemove}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
