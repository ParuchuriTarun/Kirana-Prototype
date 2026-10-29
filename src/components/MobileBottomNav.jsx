import React from 'react';
import { motion } from 'framer-motion';
import { Home, Store, Package, ShoppingBag, User } from 'lucide-react';

export default function MobileBottomNav({
  currentPage,
  onNavigate,
  onOpenCart,
  onOpenLogin,
  user,
  cartCount = 0
}) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => onNavigate('home'),
      isActive: currentPage === 'home'
    },
    {
      id: 'shop',
      label: 'Shop',
      icon: Store,
      action: () => onNavigate('shop'),
      isActive: currentPage === 'shop'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      action: () => onNavigate('orders'),
      isActive: currentPage === 'orders'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingBag,
      action: onOpenCart,
      badge: cartCount > 0 ? cartCount : null,
      isActive: false
    },
    {
      id: 'profile',
      label: user && !user.isGuest ? 'Account' : 'Login',
      icon: User,
      action: () => {
        if (user && !user.isGuest) {
          onNavigate('profile');
        } else {
          onOpenLogin();
        }
      },
      isActive: currentPage === 'profile'
    }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] left-3 right-3 z-40 max-w-lg mx-auto"
    >
      <div className="bg-white/92 backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] rounded-full px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              type="button"
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 select-none ${
                active ? 'text-emerald-700' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {/* Active pill background */}
              {active && (
                <motion.div
                  layoutId="mobileNavActivePill"
                  className="absolute inset-0 bg-emerald-50 rounded-full border border-emerald-500/15"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? 'stroke-[2.2] scale-105' : 'stroke-[1.75]'
                    }`}
                  />
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-amber-500 text-neutral-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-sm ring-1.5 ring-white leading-none"
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </motion.span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight font-sans ${
                    active ? 'font-bold text-emerald-800' : 'font-medium text-neutral-500'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
