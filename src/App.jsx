import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import ProductSection from './components/ProductSection';
import CategorySection from './components/CategorySection';
import OffersSection from './components/OffersSection';
import BenefitsSection from './components/BenefitsSection';
import ShopPage from './components/ShopPage';
import ProductDetailPage from './components/ProductDetailPage';
import ProfilePage from './components/ProfilePage';
import OrdersPage from './components/OrdersPage';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import LoginModal from './components/LoginModal';
import IOSWelcomeScreen from './components/IOSWelcomeScreen';
import GsapTicker from './components/GsapTicker';
import { gsapBounce, gsapPulseGlow } from './utils/animations';

import {
  MOST_BOUGHT_PRODUCTS,
  ALL_PRODUCTS,
  CATEGORIES,
  FEATURED_OFFERS,
  BENEFITS
} from './data/products';
import AdminDashboard from './components/Admin/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { getProducts, recordUserLogout, recordUserLogin } from './data/adminStore';
import { trackPresence } from './utils/presence';
import { supabase } from './utils/supabase';

import { ShoppingBag } from 'lucide-react';

const sectionReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

// Subtle section divider
const SectionDivider = () => (
  <div className="w-[96%] max-w-[1600px] mx-auto py-2">
    <div className="h-px bg-gradient-to-r from-transparent via-black/[0.04] to-transparent" />
  </div>
);

export default function App() {
  const getInitialPage = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#/admin' || hash === '#admin' || path === '/admin') {
        return 'admin';
      }
      if (hash === '#/shop' || hash === '#shop' || path === '/shop') {
        return 'shop';
      }
      if (hash === '#/profile' || hash === '#profile' || path === '/profile') {
        return 'profile';
      }
      if (hash === '#/orders' || hash === '#orders' || path === '/orders') {
        return 'orders';
      }
      if (hash.startsWith('#/product/') || hash.startsWith('#product/')) {
        return 'product';
      }
      // If user is already logged in, enter shop page instead of home page
      try {
        const savedUser = localStorage.getItem('kirana_current_user');
        if (savedUser && (!hash || hash === '#/' || hash === '#' || hash === '')) {
          return 'shop';
        }
      } catch (_) {}
    }
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [storeProducts, setStoreProducts] = useState(() => getProducts());
  const [selectedProduct, setSelectedProduct] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#/product/') || hash.startsWith('#product/')) {
        const prodId = hash.replace(/^#\/?product\/?/, '');
        const prods = getProducts();
        return prods.find((p) => p.id === prodId) || null;
      }
    }
    return null;
  });
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kirana_cart_items');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (err) {
        console.warn('Failed to load cart from localStorage:', err);
      }
    }
    return {};
  });

  // Sync cart items with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kirana_cart_items', JSON.stringify(cartItems));
      } catch (err) {
        console.warn('Failed to save cart to localStorage:', err);
      }
    }
  }, [cartItems]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [welcomeActive, setWelcomeActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#welcome' || hash === '#/welcome') {
        return true;
      }
    }
    return false;
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('input');

  const handleOpenLogin = () => {
    setLoginModalMode('input');
    setIsLoginOpen(true);
  };

  const handleReplayWelcome = () => {
    setWelcomeActive(true);
  };
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kirana_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          const fakeNames = ['Ananya Iyer', 'Rahul Verma', 'Guest Explorer (Pune)'];
          if (fakeNames.includes(parsed?.name)) {
            localStorage.removeItem('kirana_current_user');
            return null;
          }
          return parsed;
        }
        return null;
      } catch (_) {
        return null;
      }
    }
    return null;
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Sync store products when admin edits, adds, or changes stock
  useEffect(() => {
    const handleUpdate = () => {
      setStoreProducts(getProducts());
    };
    window.addEventListener('kirana_store_updated', handleUpdate);
    window.addEventListener('kirana_store_reset', handleUpdate);
    return () => {
      window.removeEventListener('kirana_store_updated', handleUpdate);
      window.removeEventListener('kirana_store_reset', handleUpdate);
    };
  }, []);

  // Sync navigation with browser forward / back buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#/admin' || hash === '#admin' || path === '/admin') {
        setCurrentPage('admin');
      } else if (hash === '#/shop' || hash === '#shop' || path === '/shop') {
        setCurrentPage('shop');
      } else if (hash === '#/profile' || hash === '#profile' || path === '/profile') {
        setCurrentPage('profile');
      } else if (hash === '#/orders' || hash === '#orders' || path === '/orders') {
        setCurrentPage('orders');
      } else if (hash.startsWith('#/product/') || hash.startsWith('#product/')) {
        const prodId = hash.replace(/^#\/?product\/?/, '');
        const prods = getProducts();
        const found = prods.find((p) => p.id === prodId);
        if (found) {
          setSelectedProduct(found);
        }
      } else if (hash === '#/welcome' || hash === '#welcome' || window.location.search.includes('welcome')) {
        setWelcomeActive(true);
      } else {
        setCurrentPage('home');
      }
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (page, prodId = null) => {
    setCurrentPage(page);
    let targetHash = '#/';
    if (page === 'shop') targetHash = '#/shop';
    if (page === 'admin') targetHash = '#/admin';
    if (page === 'profile') targetHash = '#/profile';
    if (page === 'orders') targetHash = '#/orders';
    if (page === 'product' && prodId) targetHash = `#/product/${prodId}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ page }, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    navigateTo('product', product.id);
  };

  const liveSelectedProduct = useMemo(() => {
    if (!selectedProduct) return null;
    return storeProducts.find((p) => p.id === selectedProduct.id) || selectedProduct;
  }, [selectedProduct, storeProducts]);

  const showNotice = (msg) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Listen for Supabase email link confirmation / magic link logins only when opened via an email link callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only process if user opened an actual email confirmation URL containing an auth token/hash
    const hasAuthCallback = 
      window.location.hash.includes('access_token=') || 
      window.location.hash.includes('type=signup') ||
      window.location.hash.includes('type=magiclink') ||
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('code=');

    if (!hasAuthCallback) {
      return;
    }

    const handleAuthSession = (session) => {
      if (!session?.user) return;
      const u = session.user;
      const userEmail = u.email || '';
      const emailPrefix = userEmail.split('@')[0];
      const name = u.user_metadata?.full_name || 
        u.user_metadata?.name || 
        (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Shopper');
      
      const sessionUser = {
        name,
        email: userEmail,
        userId: u.id,
        method: 'email_otp'
      };

      try {
        const activeSess = recordUserLogin(sessionUser);
        const fullUser = {
          ...sessionUser,
          sessionId: activeSess?.sessionId || `sess-${Date.now()}`
        };
        setUser(fullUser);
        localStorage.setItem('kirana_current_user', JSON.stringify(fullUser));
        setIsLoginOpen(false);
        setWelcomeActive(true);
        showNotice(`Welcome, ${name}! Signed in via email.`);
        // Clean URL hash so it doesn't re-trigger on subsequent reloads
        if (window.history?.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        navigateTo('shop');
      } catch (err) {
        console.warn('Error recording Supabase user session:', err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        handleAuthSession(session);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (user) {
      try {
        recordUserLogout(user);
      } catch (_) {}
    }
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kirana_current_user');
      } catch (_) {}
    }
    showNotice('Signed out successfully');
    navigateTo('home');
  };

  // Remote Logout listener (triggered when admin terminates session)
  useEffect(() => {
    const handleRemoteLogout = (e) => {
      const payload = e?.detail;
      if (user) {
        if (!payload?.sessionId || payload.sessionId === user.sessionId || payload.sessionId === user.email || payload.sessionId === user.phone) {
          setUser(null);
          try {
            localStorage.removeItem('kirana_current_user');
          } catch (_) {}
          showNotice('Your session was ended by admin');
          navigateTo('home');
        }
      }
    };
    window.addEventListener('kirana_remote_logout', handleRemoteLogout);
    return () => window.removeEventListener('kirana_remote_logout', handleRemoteLogout);
  }, [user]);

  // Real-time Presence Tracking for active user
  useEffect(() => {
    if (!user) return;
    let unsub = null;
    try {
      unsub = trackPresence(user);
    } catch (err) {
      console.warn('Real-time presence tracking non-fatal error:', err);
    }
    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    };
  }, [user]);

  // Sync user profile state with real Supabase customers table
  useEffect(() => {
    if (!user || user.isGuest) return;
    let isCancelled = false;
    const syncDbProfile = async () => {
      try {
        let q = supabase.from('customers').select('*');
        if (user.email) {
          q = q.ilike('email', user.email.trim());
        } else if (user.phone && user.phone !== 'N/A') {
          q = q.eq('phone', user.phone.trim());
        } else {
          return;
        }

        const { data, error } = await q.limit(1);
        if (!error && data && data.length > 0 && !isCancelled) {
          const dbCust = data[0];
          setUser((curr) => {
            if (!curr) return curr;
            const updated = {
              ...curr,
              name: dbCust.name || curr.name,
              location: dbCust.location || curr.location,
              type: dbCust.type || curr.type,
              avatar: dbCust.avatar || curr.avatar,
              totalOrders: dbCust.totalOrders ?? curr.totalOrders,
              totalSpent: dbCust.totalSpent ?? curr.totalSpent,
              dbId: dbCust.id
            };
            try {
              localStorage.setItem('kirana_current_user', JSON.stringify(updated));
            } catch (_) {}
            return updated;
          });
        }
      } catch (err) {
        console.warn('Error syncing db customer profile into user state:', err);
      }
    };
    syncDbProfile();
    return () => {
      isCancelled = true;
    };
  }, [user?.email, user?.phone]);

  const handleShopClick = () => {
    navigateTo('shop');
  };

  const handleHomeClick = () => {
    navigateTo('home');
  };

  const handleAdminClick = () => {
    navigateTo('admin');
  };

  const handleAddToCart = (product) => {
    const liveProduct = storeProducts.find((p) => p.id === product.id) || product;
    // Check stock availability
    if (liveProduct.stock === 0 || liveProduct.stockStatus === 'out_of_stock') {
      showNotice(`${liveProduct.name} is currently out of stock`);
      return;
    }

    let reachedMax = false;
    setCartItems((prev) => {
      const currentQty = prev[liveProduct.id]?.quantity || 0;
      if (liveProduct.stock !== undefined && currentQty >= liveProduct.stock) {
        reachedMax = true;
        return prev;
      }

      return {
        ...prev,
        [liveProduct.id]: { product: liveProduct, quantity: currentQty + 1 }
      };
    });

    if (reachedMax) {
      showNotice(`Maximum available stock (${liveProduct.stock}) reached`);
      return;
    }

    showNotice(`Added ${liveProduct.name} to cart`);
    setTimeout(() => {
      gsapBounce('#floating-cart-btn');
      gsapPulseGlow('#floating-cart-btn');
    }, 50);
  };

  const handleRemoveFromCart = (product) => {
    setCartItems((prev) => {
      const currentQty = prev[product.id]?.quantity || 0;
      if (currentQty <= 1) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return {
        ...prev,
        [product.id]: { product, quantity: currentQty - 1 }
      };
    });
  };

  const handleClearCart = () => {
    setCartItems({});
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kirana_cart_items');
      } catch (_) {}
    }
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalCartValue = useMemo(() => {
    return Object.values(cartItems).reduce(
      (sum, item) => sum + item.product.price * item.quantity, 0
    );
  }, [cartItems]);

  const displayedProducts = useMemo(() => {
    let list = storeProducts;
    if (selectedCategory) {
      list = list.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [storeProducts, selectedCategory, searchQuery]);

  if (currentPage === 'admin') {
    return (
      <div className="min-h-screen bg-[#f2fbf6] text-black font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950">
        {/* Dynamic Island Toast */}
        <AnimatePresence>
          {feedbackNotice && (
            <motion.div 
              key="feedback-notice"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              role="status"
              className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 backdrop-blur-2xl text-white text-[13px] font-medium px-5 py-2.5 rounded-full shadow-[0_16px_36px_rgba(4,120,87,0.3)] pointer-events-none flex items-center gap-2.5 border border-emerald-500/30"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow"></span>
              <span>{feedbackNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <ErrorBoundary onReset={() => navigateTo('home')}>
          <AdminDashboard
            onNavigateToStore={() => navigateTo('home')}
            showNotice={showNotice}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#fbfbfd]">
      {/* 1. Fullscreen iOS Welcome Animation - The website will NOT appear until the whole text finishes */}
      <AnimatePresence>
        {welcomeActive && (
          <motion.div
            key="site-welcome-takeover"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden bg-[#0a1f14]"
          >
            <IOSWelcomeScreen
              onEnter={() => {
                setWelcomeActive(false);
                if (typeof window !== 'undefined' && (window.location.hash === '#welcome' || window.location.hash === '#/welcome')) {
                  window.history.replaceState(null, '', window.location.pathname + (window.location.search || ''));
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Store Website - completely hidden while welcome screen is active */}
      <div 
        className={`min-h-screen bg-[#fbfbfd] text-[#1d1d1f] font-sans antialiased selection:bg-emerald-500/15 selection:text-emerald-950 relative transition-opacity duration-300 ${
          welcomeActive ? 'invisible pointer-events-none h-0 overflow-hidden' : 'visible'
        }`}
      >
        {/* Top Rich Green Aura Background */}
        <div 
          className="absolute top-0 left-0 right-0 h-[480px] sm:h-[580px] lg:h-[660px] pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse 130% 85% at 50% -20%, #10b981 0%, #34d399 35%, #a7f3d0 65%, rgba(251, 251, 253, 0) 100%)`,
          }}
        />

      <div className="relative z-10">
        {/* Dynamic Island Toast */}
        <AnimatePresence>
          {feedbackNotice && (
            <motion.div 
              key="feedback-notice"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              role="status"
              className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 backdrop-blur-2xl text-white text-[13px] font-medium px-5 py-2.5 rounded-full shadow-[0_16px_36px_rgba(4,120,87,0.3)] pointer-events-none flex items-center gap-2.5 border border-emerald-500/30"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow"></span>
              <span>{feedbackNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar
          onLoginClick={handleOpenLogin}
          onReplayWelcome={handleReplayWelcome}
          user={user}
          onLogout={handleLogout}
          cartItems={cartItems}
          totalCartCount={totalCartCount}
          totalCartValue={totalCartValue}
          onCartClick={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onShopClick={handleShopClick}
          currentPage={currentPage}
          onHomeClick={handleHomeClick}
          onAdminClick={handleAdminClick}
          onProfileClick={() => navigateTo('profile')}
          onOrdersClick={() => navigateTo('orders')}
          onAddToCart={handleAddToCart}
          showNotice={showNotice}
        />

      <main className="relative z-0 pt-[72px] sm:pt-[74px]">
        {currentPage === 'product' && liveSelectedProduct ? (
          <ProductDetailPage
            product={liveSelectedProduct}
            allProducts={storeProducts}
            cartItems={cartItems}
            onAdd={handleAddToCart}
            onRemove={handleRemoveFromCart}
            onBack={() => navigateTo('shop')}
            onProductClick={handleProductClick}
            onOpenCart={() => setIsCartOpen(true)}
            showNotice={showNotice}
          />
        ) : currentPage === 'shop' ? (
          <ShopPage
            products={storeProducts}
            cartItems={cartItems}
            onAdd={handleAddToCart}
            onRemove={handleRemoveFromCart}
            onBackToHome={handleHomeClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onProductClick={handleProductClick}
          />
        ) : currentPage === 'profile' ? (
          <ProfilePage
            user={user}
            onLogout={handleLogout}
            onBackToShop={handleShopClick}
            onOrdersClick={() => navigateTo('orders')}
            onOpenCart={() => setIsCartOpen(true)}
            onReplayWelcome={handleReplayWelcome}
            showNotice={showNotice}
            cartItemsCount={totalCartCount}
          />
        ) : currentPage === 'orders' ? (
          <OrdersPage
            user={user}
            onBackToShop={handleShopClick}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            showNotice={showNotice}
            onProfileClick={() => navigateTo('profile')}
          />
        ) : (
          <>
            <HeroCarousel onShopClick={handleShopClick} />
            <GsapTicker />

            <SectionDivider />

            <motion.div id="products" {...sectionReveal}>
              <ProductSection
                products={displayedProducts}
                cartItems={cartItems}
                onAdd={handleAddToCart}
                onRemove={handleRemoveFromCart}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onProductClick={handleProductClick}
              />
            </motion.div>

            <SectionDivider />

            <motion.div id="categories" {...sectionReveal}>
              <CategorySection
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  if (cat) showNotice(`Filtered by ${cat}`);
                }}
              />
            </motion.div>

            <SectionDivider />

            <motion.div id="offers" {...sectionReveal}>
              <OffersSection
                offers={FEATURED_OFFERS}
                onOfferClick={(offer) => showNotice(`Offer selected: ${offer.title}`)}
              />
            </motion.div>

            <SectionDivider />

            <motion.div {...sectionReveal}>
              <BenefitsSection benefits={BENEFITS} />
            </motion.div>
          </>
        )}
      </main>

      <Footer
        onCategoryClick={() => {
          if (currentPage === 'shop') {
            navigateTo('home');
            setTimeout(() => {
              const el = document.getElementById('categories');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            const el = document.getElementById('categories');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onOffersClick={() => {
          if (currentPage === 'shop') {
            navigateTo('home');
            setTimeout(() => {
              const el = document.getElementById('offers');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            const el = document.getElementById('offers');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onAdminClick={handleAdminClick}
      />

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalCartCount > 0 && (
          <motion.aside 
            key="floating-cart-summary"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Shopping Cart Summary"
            className="fixed bottom-6 right-6 z-40"
          >
            <motion.button
              id="floating-cart-btn"
              type="button"
              onClick={() => setIsCartOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-3 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-[0_16px_36px_rgba(4,120,87,0.35),0_0_0_1px_rgba(255,255,255,0.2)] border border-emerald-500/30 font-sans cursor-pointer transition-all duration-200 group"
              aria-label={`View cart with ${totalCartCount} items worth ₹${totalCartValue}`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-white group-hover:scale-105 transition-transform duration-200" />
                <motion.span 
                  key={totalCartCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute -top-1.5 -right-2 bg-amber-400 text-neutral-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm ring-2 ring-emerald-800"
                >
                  {totalCartCount}
                </motion.span>
              </div>
              <div className="text-left leading-tight pr-1">
                <span className="text-[11px] block text-emerald-100 font-medium">Cart</span>
                <span className="text-[13px] font-semibold text-white font-sans">₹{totalCartValue}</span>
              </div>
            </motion.button>
          </motion.aside>
        )}
      </AnimatePresence>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        user={user}
        onAdd={handleAddToCart}
        onRemove={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      <LoginModal
        isOpen={isLoginOpen}
        initialStep={loginModalMode}
        previewUser={user}
        onClose={() => {
          setIsLoginOpen(false);
          setLoginModalMode('input');
          if (typeof window !== 'undefined' && (window.location.hash === '#welcome' || window.location.hash === '#/welcome')) {
            window.history.replaceState(null, '', window.location.pathname + (window.location.search || ''));
          }
        }}
        onLoginSuccess={(userData) => {
          setUser(userData);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('kirana_current_user', JSON.stringify(userData));
            } catch (_) {}
            if (window.location.hash === '#welcome' || window.location.hash === '#/welcome') {
              window.history.replaceState(null, '', window.location.pathname + (window.location.search || ''));
            }
          }
          setWelcomeActive(true);
          showNotice(`Logged in as ${userData.name}`);
          navigateTo('shop');
        }}
      />

      </div>
    </div>
    </div>
  );
}
