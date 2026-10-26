import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export default function Footer({ onCategoryClick, onOffersClick, onAdminClick }) {
  return (
    <footer className="w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2 pt-2 pb-10 relative">
      {/* Outer Animated Outline Container */}
      <div className="relative p-[2px] rounded-[32px] overflow-hidden group shadow-[0_8px_32px_rgba(5,150,105,0.06)] hover:shadow-[0_16px_48px_rgba(5,150,105,0.18)] transition-all duration-500">
        
        {/* Base Outline Track (Soft Emerald Guide) */}
        <div 
          className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-emerald-500/30 via-emerald-300/15 to-teal-500/25 pointer-events-none" 
          aria-hidden="true" 
        />

        {/* 1. Rotating Conic Radiant Beam (Continuous Traveling Perimeter Outline) */}
        <div 
          className="absolute -inset-[200%] animate-spin-slow pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 250deg, rgba(5,150,105,0.2) 280deg, #059669 310deg, #10b981 335deg, #34d399 350deg, #6ee7b7 358deg, #a7f3d0 360deg)'
          }}
          aria-hidden="true"
        />

        {/* 2. Soft Ambient Aura (Breathing Glow Behind the Outline) */}
        <div 
          className="absolute -inset-[200%] animate-spin-slow blur-xl pointer-events-none opacity-30 group-hover:opacity-55 transition-opacity duration-300"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 250deg, rgba(5,150,105,0.2) 280deg, #059669 310deg, #10b981 335deg, #34d399 350deg, #6ee7b7 358deg, #a7f3d0 360deg)'
          }}
          aria-hidden="true"
        />

        {/* 3. Top Edge Flowing Laser Beam (Glides across the top rim) */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] z-20 overflow-hidden pointer-events-none rounded-t-[32px]">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-beam-flow blur-[0.5px]" />
        </div>

        {/* 4. Top Corners Ambient Pulses */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none animate-pulse-slow" aria-hidden="true" />
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-teal-400/15 rounded-full blur-2xl pointer-events-none animate-pulse-slow" aria-hidden="true" />

        {/* Inner Footer Body Container */}
        <div className="relative rounded-[30px] bg-[#f5f5f7]/95 backdrop-blur-2xl p-8 sm:p-12 z-10">
          
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-black/[0.06]">
            {/* Subtle inner accent separator */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" aria-hidden="true" />
            
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  <div className="w-3.5 h-3.5 rounded-[3px] border border-white/80 bg-white/20"></div>
                </div>
                <span className="text-xl font-semibold tracking-tight text-[#1d1d1f] font-sans">
                  Kirana<span className="text-emerald-600 font-bold">.</span>
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-[#86868b] max-w-xs leading-relaxed">
                Curated everyday groceries and artisanal pantry staples. <span className="text-[#1d1d1f] font-medium">Delivered to your door in 15 minutes.</span>
              </p>

              {/* Micro Badges */}
              <div className="mt-4 flex items-center gap-2" aria-label="Values">
                <span className="text-[11px] font-medium text-[#86868b] bg-white border border-black/[0.04] px-2.5 py-1 rounded-full shadow-2xs">
                  100% Organic
                </span>
                <span className="text-[11px] font-medium text-[#86868b] bg-white border border-black/[0.04] px-2.5 py-1 rounded-full shadow-2xs">
                  Cold-Chain
                </span>
                <span className="text-[11px] font-medium text-[#86868b] bg-white border border-black/[0.04] px-2.5 py-1 rounded-full shadow-2xs">
                  Zero Plastic
                </span>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] font-sans tracking-tight uppercase mb-3">
                Shop &amp; Explore
              </h4>
              <ul className="space-y-2.5 text-xs text-[#86868b]">
                <li><a href="#products" className="hover:text-[#1d1d1f] transition-colors duration-150">All Products</a></li>
                <li><button type="button" onClick={onCategoryClick} className="hover:text-[#1d1d1f] transition-colors duration-150 text-left cursor-pointer">Categories</button></li>
                <li><button type="button" onClick={onOffersClick} className="hover:text-[#1d1d1f] transition-colors duration-150 text-left cursor-pointer">Offers &amp; Bundles</button></li>
                <li><a href="#privilege" className="hover:text-[#1d1d1f] transition-colors duration-150">Privilege Pass</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] font-sans tracking-tight uppercase mb-3">
                Kirana Support
              </h4>
              <ul className="space-y-2.5 text-xs text-[#86868b]">
                <li><a href="#faqs" className="hover:text-[#1d1d1f] transition-colors duration-150">Order Status</a></li>
                <li><a href="#shipping" className="hover:text-[#1d1d1f] transition-colors duration-150">Express Delivery</a></li>
                <li><a href="#returns" className="hover:text-[#1d1d1f] transition-colors duration-150">Returns &amp; Refunds</a></li>
                <li><a href="#contact" className="hover:text-[#1d1d1f] transition-colors duration-150">Contact Concierge</a></li>
                <li><button type="button" onClick={onAdminClick} className="text-emerald-700 font-semibold hover:underline cursor-pointer">Admin Dashboard</button></li>
              </ul>
            </div>

            {/* Values */}
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] font-sans tracking-tight uppercase mb-3">
                Values &amp; Ethics
              </h4>
              <ul className="space-y-2.5 text-xs text-[#86868b]">
                <li><a href="#privacy" className="hover:text-[#1d1d1f] transition-colors duration-150">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-[#1d1d1f] transition-colors duration-150">Terms of Service</a></li>
                <li><a href="#sustainability" className="hover:text-[#1d1d1f] transition-colors duration-150">Farm Sustainability</a></li>
                <li><a href="#cookies" className="hover:text-[#1d1d1f] transition-colors duration-150">Cookie Preferences</a></li>
              </ul>
            </div>

          </div>

          {/* Footer Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86868b] font-normal">
            <div>Copyright &copy; 2026 Kirana Inc. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span className="hover:text-[#1d1d1f] cursor-pointer">India</span>
              <span className="w-1 h-1 rounded-full bg-black/20" />
              <div className="flex items-center gap-1.5">
                <span>Engineered with precision</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
