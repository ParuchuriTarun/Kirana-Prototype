import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  ThumbsUp, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  X, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  Award,
  ChevronDown,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductReviewsSection({ product, isModalOpen, onCloseModal }) {
  const productId = product?.id || 'default';
  const storageKey = `kirana_reviews_${productId}`;

  // Default seed reviews tailored to this grocery item
  const seedReviews = useMemo(() => [
    {
      id: 'rev-1',
      name: 'Priya Sundaram',
      location: 'Hyderabad',
      verified: true,
      rating: 5,
      date: '2 days ago',
      title: 'Remarkable freshness and super fast delivery!',
      comment: `Received ${product.name} in 12 minutes flat. The quality and aroma exceeded my expectations. Sealed properly with zero moisture leakage. Definitely ordering again!`,
      helpful: 19,
      isHelpful: false
    },
    {
      id: 'rev-2',
      name: 'Rahul Varma',
      location: 'Bangalore',
      verified: true,
      rating: 5,
      date: '5 days ago',
      title: 'Top tier grocery quality at honest pricing',
      comment: `Compared this to standard supermarket packs and this is noticeably fresher and better priced. Kirana has done a fantastic job with farm-direct sourcing.`,
      helpful: 14,
      isHelpful: false
    },
    {
      id: 'rev-3',
      name: 'Anita K.',
      location: 'Vijayawada',
      verified: true,
      rating: 4,
      date: '1 week ago',
      title: 'Good everyday pantry staple',
      comment: `Very good product. Delivered clean and well packed. Giving 4 stars only because the delivery agent took 16 minutes instead of 15, but product quality is 5/5.`,
      helpful: 8,
      isHelpful: false
    },
    {
      id: 'rev-4',
      name: 'Kiran Kumar',
      location: 'Guntur',
      verified: true,
      rating: 5,
      date: '2 weeks ago',
      title: 'Authentic taste & great shelf life',
      comment: `Genuine natural quality. You can tell there are no artificial coatings or stale preservatives. Very happy with the purchase.`,
      helpful: 6,
      isHelpful: false
    }
  ], [product.name]);

  // Load reviews from localStorage + seeds
  const [reviews, setReviews] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return seedReviews;
  });

  // Active filter tab: 'all' | 5 | 4 | 3 | 2 | 1 | 'verified'
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Write Review Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Persist reviews to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(reviews));
      } catch (e) {}
    }
  }, [reviews, storageKey]);

  // Rating Distribution & Math
  const totalReviewCount = 248 + reviews.length - seedReviews.length;
  
  // Realistic breakdown for 248 total ratings
  const distribution = useMemo(() => {
    return [
      { stars: 5, count: 193, percent: 78 },
      { stars: 4, count: 35, percent: 14 },
      { stars: 3, count: 12, percent: 5 },
      { stars: 2, count: 5, percent: 2 },
      { stars: 1, count: 3, percent: 1 }
    ];
  }, []);

  const handleHelpfulClick = (reviewId) => {
    setReviews(prev => prev.map(rev => {
      if (rev.id === reviewId) {
        const nextState = !rev.isHelpful;
        return {
          ...rev,
          isHelpful: nextState,
          helpful: nextState ? rev.helpful + 1 : rev.helpful - 1
        };
      }
      return rev;
    }));
  };

  const handleCreateReview = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!newTitle.trim()) {
      setSubmitError('Please enter a review headline.');
      return;
    }
    if (!newComment.trim()) {
      setSubmitError('Please write your review experience.');
      return;
    }

    const createdReview = {
      id: `rev-${Date.now()}`,
      name: newName.trim(),
      location: 'Local Customer',
      verified: true,
      rating: newRating,
      date: 'Just now',
      title: newTitle.trim(),
      comment: newComment.trim(),
      helpful: 0,
      isHelpful: false
    };

    setReviews([createdReview, ...reviews]);
    setIsWriteModalOpen(false);
    setNewName('');
    setNewTitle('');
    setNewComment('');
    setSubmitError('');
    setToastMsg('Thank you! Your verified review has been published.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const filteredReviews = useMemo(() => {
    if (selectedFilter === 'all') return reviews;
    if (selectedFilter === 'verified') return reviews.filter(r => r.verified);
    return reviews.filter(r => r.rating === selectedFilter);
  }, [reviews, selectedFilter]);

  return (
    <div id="product-reviews-section" className="mt-12 sm:mt-16 font-sans">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Review Section Card */}
      <div className="bg-white rounded-[32px] border border-black/[0.06] p-5 sm:p-8 lg:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-black/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1d1d1f] tracking-tight">
                Customer Ratings &amp; Reviews
              </h2>
            </div>
            <p className="text-xs text-[#86868b]">
              Verified feedback from actual shoppers who received delivery from this store
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Ratings Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 pb-8 border-b border-black/[0.06]">
          
          {/* Overall Rating Score (4 of 12 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-center items-center sm:items-start p-6 rounded-2xl bg-[#fbfbfd] border border-black/[0.05] text-center sm:text-left">
            <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1 block">
              Overall Rating
            </span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-black text-[#1d1d1f] tracking-tight">
                {product.rating || '4.8'}
              </span>
              <span className="text-base text-[#86868b] font-medium">/ 5.0</span>
            </div>
            
            <div className="flex items-center gap-1 text-amber-500 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>

            <p className="text-xs text-[#86868b]">
              Based on <strong className="text-neutral-900">{totalReviewCount}</strong> ratings &amp; <strong className="text-neutral-900">{reviews.length}</strong> written customer reviews
            </p>
            
            <div className="mt-4 pt-3 border-t border-black/[0.06] w-full flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 96% Recommend
              </span>
              <span className="text-neutral-500 text-[11px]">100% Verified</span>
            </div>
          </div>

          {/* Star Distribution Bars (5 of 12 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-2.5">
            <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1">
              Rating Distribution (Click to filter)
            </span>
            {distribution.map((item) => (
              <button
                key={item.stars}
                type="button"
                onClick={() => setSelectedFilter(selectedFilter === item.stars ? 'all' : item.stars)}
                className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-xl transition-all cursor-pointer group text-left ${
                  selectedFilter === item.stars ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-neutral-50'
                }`}
              >
                <span className="w-12 font-bold text-[#1d1d1f] flex items-center gap-1 shrink-0">
                  <span>{item.stars}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>

                <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500 group-hover:bg-amber-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <span className="w-10 text-right text-[11px] font-semibold text-[#86868b] shrink-0">
                  {item.percent}%
                </span>

                <span className="text-[10px] text-neutral-400 min-w-[50px] text-right shrink-0 hidden sm:inline">
                  ({item.count})
                </span>
              </button>
            ))}
          </div>

          {/* Key Product Attributes (3 of 12 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-center p-5 rounded-2xl bg-[#f9fafb] border border-black/[0.04] space-y-3">
            <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider block">
              Feature Highlights
            </span>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">Freshness &amp; Quality</span>
                <span className="font-bold text-emerald-800">4.9 ★</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[98%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">Value for Money</span>
                <span className="font-bold text-emerald-800">4.8 ★</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[96%]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">Eco Packaging</span>
                <span className="font-bold text-emerald-800">4.7 ★</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[94%]" />
              </div>
            </div>
          </div>

        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
          <span className="text-xs text-[#86868b] font-semibold flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>
          {[
            { id: 'all', label: `All (${reviews.length})` },
            { id: 5, label: '5 Stars' },
            { id: 4, label: '4 Stars' },
            { id: 'verified', label: 'Verified Buyers Only' }
          ].map((flt) => (
            <button
              key={flt.id}
              type="button"
              onClick={() => setSelectedFilter(flt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedFilter === flt.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              {flt.label}
            </button>
          ))}

          {selectedFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer ml-2"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-[#86868b] bg-[#f9fafb] rounded-2xl border border-dashed border-neutral-300">
              <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-neutral-700">No reviews found matching this filter</p>
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className="mt-2 text-xs text-emerald-700 font-bold underline cursor-pointer"
              >
                View all reviews
              </button>
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-5 sm:p-6 rounded-2xl bg-[#fafbfc] border border-black/[0.05] hover:border-black/[0.1] transition-all"
              >
                {/* Review Header: User info, stars, date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                      {rev.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-[#1d1d1f]">
                          {rev.name}
                        </span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#86868b]">{rev.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs text-[#86868b] font-medium">{rev.date}</span>
                  </div>
                </div>

                {/* Review Title & Body */}
                <h4 className="text-sm font-bold text-[#1d1d1f] mb-1.5">
                  {rev.title}
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {rev.comment}
                </p>

                {/* Helpful CTA */}
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-[#86868b]">
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      rev.isHelpful
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${rev.isHelpful ? 'fill-emerald-700 text-emerald-700' : ''}`} />
                    <span>Helpful ({rev.helpful})</span>
                  </button>

                  <span className="text-[11px] text-neutral-400">Direct Delivery Receipt</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ==================== WRITE REVIEW MODAL ==================== */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-black/[0.08] relative max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Customer Review
                </span>
                <h3 className="text-xl font-bold text-[#1d1d1f]">
                  Rate &amp; Review {product.name}
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Share your genuine experience with other shoppers
                </p>
              </div>

              <form onSubmit={handleCreateReview} className="space-y-4">
                {/* Star Picker */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                    Your Rating:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-115"
                      >
                        <Star 
                          className={`w-7 h-7 ${
                            (hoverRating || newRating) >= star 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-neutral-200'
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-800 ml-2 bg-amber-50 px-2 py-0.5 rounded-full">
                      {(hoverRating || newRating)} of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tarun P."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs sm:text-sm outline-none"
                  />
                </div>

                {/* Headline */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Review Headline:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh packaging, prompt delivery"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs sm:text-sm outline-none"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Detailed Experience:
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="How was the taste, packaging, and freshness?"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs sm:text-sm outline-none resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-rose-600 font-semibold">{submitError}</p>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsWriteModalOpen(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DETAILED RATING BREAKDOWN MODAL ==================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-black/[0.08] relative font-sans max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={onCloseModal}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Verified Ratings Audit
                </span>
                <h3 className="text-xl font-bold text-[#1d1d1f]">
                  Rating Breakdown
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  How {totalReviewCount} verified customers rated {product.name}
                </p>
              </div>

              {/* Big Score Header */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center mb-5">
                <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-neutral-900">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  <span>{product.rating || '4.8'}</span>
                  <span className="text-sm text-neutral-500 font-medium">/ 5.0</span>
                </div>
                <span className="text-xs text-amber-900 font-semibold block mt-1">
                  96% of buyers recommended this item
                </span>
              </div>

              {/* Exact Star Count Breakdown Bars */}
              <div className="space-y-2.5 mb-5">
                {distribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-2 text-xs">
                    <span className="w-12 font-bold text-neutral-800 flex items-center gap-1 shrink-0">
                      <span>{item.stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full" 
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-neutral-700 shrink-0">
                      {item.percent}%
                    </span>
                    <span className="w-14 text-right text-[11px] text-neutral-400 shrink-0">
                      {item.count} people
                    </span>
                  </div>
                ))}
              </div>

              {/* Breakdown by Feature */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-2 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Taste &amp; Freshness</span>
                  <span className="font-bold text-neutral-900">4.9 / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Price &amp; Value</span>
                  <span className="font-bold text-neutral-900">4.8 / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Delivery Speed</span>
                  <span className="font-bold text-neutral-900">4.9 / 5.0</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onCloseModal();
                  const el = document.getElementById('product-reviews-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm text-center"
              >
                Read All Written Reviews &rarr;
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
