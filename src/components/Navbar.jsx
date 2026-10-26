import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  User as UserIcon, 
  ShoppingBag, 
  Store, 
  Home, 
  ShieldCheck, 
  Package,
  Sparkles
} from 'lucide-react';
import { getOrders } from '../data/adminStore';

export default function Navbar({ 
  onLoginClick, 
  user, 
  onLogout,
  cartItems = {},
  totalCartCount = 0,
  totalCartValue = 0,
  onCartClick,
  searchQuery = '',
  onSearchChange,
  onShopClick,
  currentPage = 'home',
  onHomeClick,
  onAdminClick,
  onProfileClick,
  onOrdersClick,
  onAddToCart,
  onReplayWelcome,
  showNotice
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userOrdersCount, setUserOrdersCount] = useState(0);
  const menuRef = useRef(null);

  // Sync user orders count dynamically
  useEffect(() => {
    const updateCount = () => {
      try {
        const ords = getOrders() || [];
        if (!user) {
          setUserOrdersCount(0);
          return;
        }
        const uEmail = (user.email || '').toLowerCase().trim();
        const uPhone = (user.phone || '').trim();
        const uName = (user.name || '').toLowerCase().trim();

        const count = ords.filter((o) => {
          const oEmail = (o.customer_email || '').toLowerCase().trim();
          const oPhone = (o.customer_phone || '').trim();
          const oName = (o.customer_name || '').toLowerCase().trim();
          if (uEmail && oEmail && uEmail === oEmail) return true;
          if (uPhone && oPhone && uPhone === oPhone) return true;
          if (uName && oName && (uName === oName || oName.includes(uName))) return true;
          return false;
        }).length;
        setUserOrdersCount(count);
      } catch (_) {}
    };

    updateCount();
    window.addEventListener('kirana_store_updated', updateCount);
    return () => window.removeEventListener('kirana_store_updated', updateCount);
  }, [user]);

  const openAccountModal = (tab = 'overview') => {
    setAccountTab(tab);
    setIsAccountOpen(true);
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full pt-2 sm:pt-2.5 pb-2 pointer-events-none">
      <motion.div 
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-[96%] max-w-[1600px] mx-auto px-1 sm:px-2"
      >
        <nav 
          aria-label="Main Navigation"
          className="pointer-events-auto w-full bg-white/90 backdrop-blur-2xl border border-black/[0.06] rounded-full px-4 sm:px-6 lg:px-7 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
        >
          {/* LEFT: Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => {
                if (onSearchChange) onSearchChange('');
                if (onHomeClick) {
                  onHomeClick();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <motion.div 
                whileHover={{ rotate: 3, scale: 1.04 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-sm"
                aria-hidden="true"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/90 bg-white/30"></div>
              </motion.div>

              <div className="flex items-baseline">
                <span className="text-[17px] sm:text-[18px] font-bold tracking-[-0.03em] text-[#1d1d1f]">
                  Kirana
                </span>
                <span className="text-emerald-600 font-extrabold ml-0.5">.</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Shop Button, Cart Button & Profile when logged in; or Log in button when logged out */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {user ? (
              <>
                {/* Dynamic Shop / Home Button: In Shop page replaced with Home button, otherwise Shop button */}
                {currentPage === 'shop' ? (
                  <motion.button
                    type="button"
                    onClick={onHomeClick}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    aria-label="Back to Home"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                    <span className="font-semibold">Home</span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={onShopClick}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    aria-label="Shop catalog"
                  >
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                    <span className="font-semibold">Shop</span>
                  </motion.button>
                )}

                {/* Cart Button with live total & item badge */}
                <motion.button
                  type="button"
                  onClick={onCartClick}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold shadow-xs transition-colors duration-200 cursor-pointer"
                  aria-label={`Open shopping cart with ${totalCartCount} items`}
                >
                  <div className="relative">
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                    {totalCartCount > 0 && (
                      <motion.span
                        key={totalCartCount}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute -top-2 -right-2 bg-amber-400 text-neutral-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-emerald-800 shadow-xs"
                      >
                        {totalCartCount}
                      </motion.span>
                    )}
                  </div>
                  <span className="hidden sm:inline font-semibold">Cart</span>
                  {totalCartValue > 0 && (
                    <span className="text-[11px] font-bold text-emerald-100 hidden xs:inline">
                      ₹{totalCartValue}
                    </span>
                  )}
                </motion.button>

                {/* User Profile Pill */}
                <div className="relative" ref={menuRef}>
                  <motion.button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 cursor-pointer shadow-2xs border ${
                      isMenuOpen
                        ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300 ring-2 ring-emerald-500/15'
                        : 'bg-emerald-50 text-emerald-950 border-emerald-200/80 hover:bg-emerald-100/60'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                      {user.isGuest ? '👤' : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <span className="font-semibold text-xs truncate max-w-[80px] sm:max-w-[110px]">
                      {user.name}
                    </span>
                    <motion.span
                      animate={{ 
                        rotate: isMenuOpen ? 180 : 0,
                        scale: isMenuOpen ? [1, 1.25, 1] : 1
                      }}
                      transition={{ type: "spring", stiffness: 450, damping: 14 }}
                      className="flex items-center justify-center"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-700 stroke-[2.2]" />
                    </motion.span>
                  </motion.button>

                  {/* Dropdown Menu with Lively Elastic Spring Bounce */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.72, y: -16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.16, ease: "easeOut" } }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 15,
                          mass: 0.7
                        }}
                        style={{ transformOrigin: "top right" }}
                        className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.06)] p-2 z-50 overflow-hidden"
                      >
                        {/* Profile Header Button (Opens Profile Page) */}
                        <motion.button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (onProfileClick) onProfileClick();
                          }}
                          initial={{ opacity: 0, y: -8, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          whileHover={{ scale: 1.01, backgroundColor: 'rgba(236, 253, 245, 0.9)' }}
                          whileTap={{ scale: 0.97 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 14,
                            delay: 0.04
                          }}
                          className="w-full text-left px-3.5 py-3 border-b border-black/[0.05] rounded-[16px] hover:bg-emerald-50/70 transition-colors duration-150 cursor-pointer group flex items-center justify-between gap-2"
                          title="Click to view full profile"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <motion.div 
                              initial={{ scale: 0.6 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 450, damping: 12, delay: 0.08 }}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform"
                            >
                              {user.isGuest ? '👤' : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                            </motion.div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-[#1d1d1f] truncate leading-tight group-hover:text-emerald-950 transition-colors">{user.name}</p>
                              <p className="text-[10px] text-[#86868b] truncate mt-0.5">{user.isGuest ? 'Guest Access' : (user.phone || user.email)}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-emerald-700/60 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                        </motion.button>

                        {/* Actions List with Spring Cascades */}
                        <div className="pt-1.5 space-y-0.5">
                          {/* Orders Button (Opens Orders Page) */}
                          <motion.button
                            initial={{ opacity: 0, x: -10, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              delay: 0.06
                            }}
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (onOrdersClick) onOrdersClick();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 rounded-[12px] transition-colors duration-150 cursor-pointer text-left group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="w-3.5 h-3.5 stroke-[2.2]" />
                              </div>
                              <span>Orders</span>
                            </div>
                            {userOrdersCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                {userOrdersCount}
                              </span>
                            )}
                          </motion.button>

                          <motion.button
                            initial={{ opacity: 0, x: -10, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              delay: 0.08
                            }}
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (onAdminClick) onAdminClick();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-[12px] transition-colors duration-150 cursor-pointer text-left group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                            <span>Admin Dashboard</span>
                          </motion.button>

                          {user.isGuest && (
                            <motion.button
                              initial={{ opacity: 0, x: -10, scale: 0.92 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              whileHover={{ scale: 1.02, x: 2 }}
                              whileTap={{ scale: 0.96 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                                delay: 0.1
                              }}
                              type="button"
                              onClick={() => {
                                setIsMenuOpen(false);
                                if (onLoginClick) onLoginClick();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-[12px] transition-colors duration-150 cursor-pointer text-left group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UserIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                              </div>
                              <span>Sign in with account</span>
                            </motion.button>
                          )}

                          {onReplayWelcome && (
                            <motion.button
                              initial={{ opacity: 0, x: -10, scale: 0.92 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              whileHover={{ scale: 1.02, x: 2 }}
                              whileTap={{ scale: 0.96 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 15,
                                delay: 0.11
                              }}
                              type="button"
                              onClick={() => {
                                setIsMenuOpen(false);
                                onReplayWelcome();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-[12px] transition-colors duration-150 cursor-pointer text-left group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
                              </div>
                              <span>Replay iOS Welcome</span>
                            </motion.button>
                          )}

                          <motion.button
                            initial={{ opacity: 0, x: -10, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              delay: 0.12
                            }}
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (onLogout) onLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-[12px] transition-colors duration-150 cursor-pointer text-left group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                            <span>Sign out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-900/80 hover:text-emerald-950 hover:bg-emerald-50/80 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-emerald-900/10"
                  title="Kirana Admin Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden xs:inline">Admin</span>
                </button>

                <motion.button
                  type="button"
                  onClick={onLoginClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-full shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Log in
                </motion.button>
              </div>
            )}
          </div>
        </nav>
      </motion.div>
    </header>
  );
}
