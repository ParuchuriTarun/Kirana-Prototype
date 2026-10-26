import React from 'react';
import { ArrowRight, Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';

export default function HeroBanner({ onExplore }) {
  return (
    <section className="relative pt-6 pb-10 sm:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Layered Card Container */}
        <div className="relative mx-auto max-w-4xl py-4 sm:py-6">
          
          {/* Left Peeking Card Backdrop */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-gray-200/90 rounded-2xl sm:rounded-3xl transform -translate-x-6 sm:-translate-x-12 scale-90 border border-gray-300 shadow-sm pointer-events-none"
            aria-hidden="true"
          />

          {/* Right Peeking Card Backdrop */}
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-gray-200/90 rounded-2xl sm:rounded-3xl transform translate-x-6 sm:translate-x-12 scale-90 border border-gray-300 shadow-sm pointer-events-none"
            aria-hidden="true"
          />

          {/* Foreground Main Hero Card */}
          <div className="relative z-10 bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-900/10 sm:border-gray-900/15 p-8 sm:p-14 shadow-hero text-center overflow-hidden">
            
            {/* Subtle background glow & badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Flat 20% OFF on your first 3 orders &bull; Code: FIRST20</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-950 font-sans leading-tight">
              Welcome to <br />
              <span className="text-gray-500 font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent">
                Kirana
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-gray-600 max-w-xl mx-auto font-normal leading-relaxed">
              Your friendly neighborhood Kirana, delivered straight to your doorstep in 15 minutes. Quality staples, daily dairy, snacks, and home essentials.
            </p>

            {/* Quick action buttons & trust pill */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onExplore}
                className="px-6 py-3 text-sm sm:text-base font-semibold text-white bg-gray-950 hover:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center gap-2 group active:scale-[0.98]"
              >
                <span>Shop Best Deals</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </button>

              <a
                href="#categories"
                className="px-5 py-3 text-sm sm:text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
              >
                Browse Categories
              </a>
            </div>

            {/* Quick trust strip */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>15 Min Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>100% Genuine Brands</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Zero Delivery Fee on ₹199+</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
