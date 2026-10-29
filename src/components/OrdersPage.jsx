import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ShoppingBag, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  Clock, 
  CreditCard, 
  Truck, 
  Search, 
  PackageOpen, 
  CheckCircle2, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Copy,
  FileText,
  Printer,
  MapPin
} from 'lucide-react';
import { getOrders, fetchOrdersFromSupabase } from '../data/adminStore';
import { supabase } from '../utils/supabase';

export default function OrdersPage({
  user,
  onBackToShop,
  onAddToCart,
  onOpenCart,
  showNotice,
  onProfileClick
}) {
  const [orders, setOrders] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Confirmed' | 'Delivered'
  const [isSticky, setIsSticky] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Monitor window scroll to toggle sticky elevation shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on load & setup search keyboard shortcut
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('orders-search-input');
        if (input) input.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const input = document.getElementById('orders-search-input');
        if (input) input.focus();
      } else if (e.key === 'Escape' && document.activeElement?.id === 'orders-search-input') {
        document.activeElement.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch directly from real Supabase database & subscribe to Realtime changes
  useEffect(() => {
    let isMounted = true;

    const fetchDirectFromDb = async () => {
      try {
        const userEmail = (user?.email || '').toLowerCase().trim();
        const userPhone = (user?.phone || '').trim();
        const userName = (user?.name || '').trim();

        // 1. Fetch live orders directly from real Supabase database
        let ordQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (userEmail) {
          ordQuery = ordQuery.ilike('customer_email', userEmail);
        } else if (userPhone && userPhone !== 'N/A') {
          ordQuery = ordQuery.eq('customer_phone', userPhone);
        } else if (userName) {
          ordQuery = ordQuery.ilike('customer_name', userName);
        }

        const { data: ordRows, error: ordErr } = await ordQuery;
        if (isMounted && !ordErr && ordRows) {
          setDbOrders(ordRows);
        }

        if (isMounted) setIsDbLoaded(true);
      } catch (err) {
        console.warn('Direct database fetch in OrdersPage error:', err);
      }
    };

    fetchDirectFromDb();

    // Also populate fallback store cache
    const loadCache = () => {
      try {
        setOrders(getOrders() || []);
      } catch (err) {
        console.warn('Error loading orders cache:', err);
      }
    };

    loadCache();
    fetchOrdersFromSupabase().catch(() => {});

    const handleUpdate = () => {
      loadCache();
      fetchDirectFromDb();
    };
    window.addEventListener('kirana_store_updated', handleUpdate);

    // Subscribe to real-time changes directly from Supabase
    const channel = supabase.channel(`orders_page_realtime_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDirectFromDb();
      })
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener('kirana_store_updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Combine direct DB orders with cache, preferring verified Supabase records
  const userOrders = useMemo(() => {
    if (dbOrders && dbOrders.length > 0) {
      return dbOrders;
    }

    if (!user) return [];
    const userEmail = (user.email || '').toLowerCase().trim();
    const userPhone = (user.phone || '').trim();
    const userName = (user.name || '').toLowerCase().trim();

    const matched = orders.filter((ord) => {
      const ordEmail = (ord.customer_email || '').toLowerCase().trim();
      const ordPhone = (ord.customer_phone || '').trim();
      const ordName = (ord.customer_name || '').toLowerCase().trim();

      if (userEmail && ordEmail && userEmail === ordEmail) return true;
      if (userPhone && ordPhone && userPhone === ordPhone) return true;
      if (userName && ordName && (userName === ordName || ordName.includes(userName))) return true;
      return false;
    });

    if (matched.length === 0 && orders.length > 0) {
      const recentSessionOrder = orders.filter((o) => {
        return o.customer_name && user.name && o.customer_name.toLowerCase().trim() === user.name.toLowerCase().trim();
      });
      if (recentSessionOrder.length > 0) return recentSessionOrder;
    }

    return matched;
  }, [dbOrders, orders, user]);

  // Helper to build a comprehensive multi-field search index for an order
  const buildOrderSearchText = (ord) => {
    if (!ord) return '';
    const parts = [];

    // 1. Order ID variations
    if (ord.id) {
      const rawId = String(ord.id);
      parts.push(rawId);
      parts.push(`#${rawId}`);
      parts.push(rawId.replace(/^ord-?/i, ''));
      parts.push(rawId.replace(/\D/g, ''));
      if (rawId.length > 4) {
        parts.push(rawId.slice(-4));
        parts.push(rawId.slice(-6));
        parts.push(rawId.slice(-8));
      }
    }

    // 2. Products kept (items)
    if (Array.isArray(ord.items)) {
      ord.items.forEach((item) => {
        if (item.name) parts.push(item.name);
        if (item.size) parts.push(item.size);
        if (item.category) parts.push(item.category);
        if (item.price) {
          parts.push(String(item.price), `₹${item.price}`, `rs ${item.price}`);
        }
        if (item.quantity) {
          parts.push(`qty ${item.quantity}`, `${item.quantity}x`, `quantity ${item.quantity}`);
        }
      });
    }

    // 3. Date of ordered (all localized & international formats)
    if (ord.created_at) {
      try {
        const d = new Date(ord.created_at);
        if (!isNaN(d.getTime())) {
          parts.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
          parts.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
          parts.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
          parts.push(d.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' }));
          parts.push(d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }));
          parts.push(d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
          parts.push(d.toLocaleDateString('en-IN', { weekday: 'long' }));
          parts.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
          parts.push(d.toLocaleDateString('en-IN', { month: 'long' }));
          parts.push(d.toLocaleDateString('en-IN', { month: 'short' }));
          parts.push(String(d.getFullYear()));
          parts.push(String(d.getDate()));
          parts.push(`${d.getDate()}th`, `${d.getDate()}st`, `${d.getDate()}nd`, `${d.getDate()}rd`);
          parts.push(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
          parts.push(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
          parts.push(d.toISOString().split('T')[0]);
          parts.push(d.toLocaleDateString('en-GB')); // DD/MM/YYYY
          parts.push(d.toLocaleDateString('en-US')); // MM/DD/YYYY

          // Relative terms
          const now = new Date();
          if (d.toDateString() === now.toDateString()) {
            parts.push('today');
          }
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          if (d.toDateString() === yesterday.toDateString()) {
            parts.push('yesterday');
          }
        }
      } catch (_) {}
    }

    // 4. Total Amount / Paid Price
    if (ord.total_amount !== undefined && ord.total_amount !== null) {
      const amt = String(ord.total_amount);
      parts.push(amt, `₹${amt}`, `rs ${amt}`, `rs. ${amt}`, `inr ${amt}`, `${amt} rupees`);
    }

    // 5. Payment method
    if (ord.payment_method) {
      parts.push(String(ord.payment_method));
    }

    // 6. Status
    if (ord.status) {
      parts.push(String(ord.status));
    }

    // 7. Delivery Address & Customer details
    if (ord.shipping_address) parts.push(String(ord.shipping_address));
    if (ord.customer_name) parts.push(String(ord.customer_name));
    if (ord.customer_email) parts.push(String(ord.customer_email));
    if (ord.customer_phone) parts.push(String(ord.customer_phone));

    return parts.join(' ').toLowerCase();
  };

  // Apply comprehensive multi-field search and status filter
  const displayedOrders = useMemo(() => {
    return userOrders.filter((ord) => {
      // 1. Status filter
      if (statusFilter !== 'all') {
        const ordStatus = (ord.status || 'Confirmed').toLowerCase();
        if (ordStatus !== statusFilter.toLowerCase()) return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const searchIndex = buildOrderSearchText(ord);

      // Support multi-term queries: every term entered must match somewhere in the order
      const tokens = q
        .replace(/₹/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length === 0) return true;

      return tokens.every((token) => {
        const cleanToken = token.startsWith('#') ? token.slice(1) : token;
        return searchIndex.includes(token) || (cleanToken && searchIndex.includes(cleanToken));
      });
    });
  }, [userOrders, searchQuery, statusFilter]);

  // Format order date safely
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return dateStr;
    }
  };

  // Metric calculations
  const totalAmountSpent = useMemo(() => {
    return userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  }, [userOrders]);

  const totalItemsCount = useMemo(() => {
    return userOrders.reduce((sum, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return sum + items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
    }, 0);
  }, [userOrders]);

  // Copy Order ID with visual feedback
  const handleCopyOrderId = (id) => {
    const textToCopy = String(id).toUpperCase();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
    }
    setCopiedOrderId(id);
    if (showNotice) {
      showNotice(`Copied #${textToCopy} to clipboard`);
    }
    setTimeout(() => {
      setCopiedOrderId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // Quick single item re-order handler
  const handleReorderSingleItem = (item) => {
    if (!onAddToCart) return;
    onAddToCart({
      id: item.id || `item-${Math.random()}`,
      name: item.name,
      price: item.price,
      size: item.size || 'Standard',
      image: item.image || ''
    });
    if (showNotice) {
      showNotice(`Added 1x ${item.name} to cart`);
    }
    if (onOpenCart) onOpenCart();
  };

  // Re-order handler
  const handleReorder = (order) => {
    if (!onAddToCart || !order.items || order.items.length === 0) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      onAddToCart({
        id: item.id || `item-${Math.random()}`,
        name: item.name,
        price: item.price,
        size: item.size || 'Standard',
        image: item.image || ''
      });
      addedCount += item.quantity || 1;
    });

    if (showNotice) {
      showNotice(`Re-ordered ${addedCount} item(s) from #${order.id.slice(-6).toUpperCase()}`);
    }
    if (onOpenCart) onOpenCart();
  };

  return (
    <div className="w-[94%] sm:w-[96%] max-w-[1100px] mx-auto py-4 sm:py-8 space-y-5 sm:space-y-6">
      
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-black/[0.05]">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <button
            type="button"
            onClick={onBackToShop}
            className="hover:text-emerald-800 transition-colors cursor-pointer font-medium"
          >
            Store
          </button>
          <span className="text-neutral-300">/</span>
          <span className="font-bold text-emerald-950">My Orders</span>
        </div>

        <div className="flex items-center gap-2">
          {onProfileClick && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onProfileClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs border border-black/[0.07] shadow-2xs transition-colors cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span>View Profile</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02, x: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBackToShop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shop</span>
          </motion.button>
        </div>
      </div>

      {/* Main Orders Shell */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{ transform: 'none' }}
        className="bg-white rounded-[24px] sm:rounded-[36px] shadow-[0_16px_50px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] border border-black/[0.07] p-4 sm:p-6 md:p-9 space-y-5 sm:space-y-6 relative"
      >
        {/* Header Title with Live DB Status */}
        <div className="space-y-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20">
                <Package className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1d1d1f] tracking-tight">
                    My Orders &amp; Receipts
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                    {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase DB Live
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Live delivery tracking, digital GST invoices &amp; farm-fresh re-ordering
                </p>
              </div>
            </div>
          </div>

          {/* Executive Overview KPI Strip */}
          {userOrders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Card 1: Total Orders */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100/80 flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Package className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block truncate">
                    Total Orders
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#1d1d1f] tracking-tight block">
                    {userOrders.length} Placed
                  </span>
                  <span className="text-[10px] text-neutral-500 block truncate">
                    100% Verified Delivery
                  </span>
                </div>
              </div>

              {/* Card 2: Total Spent */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100/80 flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <CreditCard className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block truncate">
                    Total Spent
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#1d1d1f] tracking-tight block">
                    ₹{totalAmountSpent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-neutral-500 block truncate">
                    {totalItemsCount} fresh items ordered
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Search & Filter Header - Locks at top below fixed navbar on scroll */}
        {userOrders.length > 0 && (
          <div
            className={`sticky top-[64px] sm:top-[72px] z-30 transition-all duration-200 -mx-6 sm:-mx-9 px-6 sm:px-9 py-3 sm:py-3.5 bg-white/95 backdrop-blur-xl border-y border-black/[0.06] ${
              isSticky ? 'shadow-[0_10px_28px_rgba(0,0,0,0.06)] bg-white/98 border-neutral-200/90' : 'bg-transparent'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Authentic iOS Spring Segmented Tab Control */}
              <div 
                role="tablist"
                aria-label="Order status filter"
                className="p-1 rounded-full bg-[#edf1ee] border border-black/[0.06] inline-flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-1 text-xs shrink-0 shadow-2xs select-none relative"
              >
                {['all', 'Confirmed', 'Delivered'].map((status) => {
                  const count = status === 'all' 
                    ? userOrders.length 
                    : userOrders.filter(o => (o.status || 'Confirmed') === status).length;
                  const isActive = statusFilter === status;
                  return (
                    <motion.button
                      key={status}
                      role="tab"
                      aria-selected={isActive}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      whileTap={{ scale: 0.95 }}
                      className="group relative px-4 py-1.5 rounded-full font-extrabold text-xs flex items-center gap-2 cursor-pointer shrink-0 outline-none select-none transition-colors"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {/* iOS Fluid Sliding Background Pill */}
                      {isActive && (
                        <motion.span
                          layoutId="activeOrderSegmentPill"
                          className="absolute inset-0 rounded-full bg-emerald-700 shadow-[0_2px_8px_rgba(4,120,87,0.3),0_1px_2px_rgba(0,0,0,0.12)] z-0"
                          transition={{
                            type: "spring",
                            stiffness: 480,
                            damping: 34,
                            mass: 0.75
                          }}
                        />
                      )}

                      {/* Tab Label */}
                      <span className={`relative z-10 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-neutral-700 group-hover:text-neutral-950 font-bold'
                      }`}>
                        {status === 'all' ? 'All Orders' : status}
                      </span>

                      {/* Tab Counter Badge */}
                      <span className={`relative z-10 text-[10px] min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full font-black transition-colors duration-200 ${
                        isActive 
                          ? 'bg-white/20 text-white backdrop-blur-xs' 
                          : 'bg-neutral-300/70 text-neutral-700 group-hover:bg-neutral-300'
                      }`}>
                        {count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Modernized Quick Search with Darker, High-Visibility Outline */}
              <div className="relative w-full sm:w-72 md:w-80 lg:w-96 group">
                <div className="relative flex items-center w-full bg-white hover:bg-neutral-50/60 rounded-full border-2 border-neutral-300 hover:border-neutral-600 focus-within:border-emerald-700 shadow-2xs hover:shadow-xs focus-within:shadow-[0_4px_20px_rgba(5,150,105,0.14)] focus-within:ring-4 focus-within:ring-emerald-500/15 transition-all duration-200">
                  {/* Search Icon */}
                  <div className="pl-3.5 pr-2 text-neutral-600 group-hover:text-neutral-800 group-focus-within:text-emerald-700 transition-colors shrink-0">
                    <Search className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-focus-within:scale-110" />
                  </div>

                  {/* Input Field */}
                  <input
                    id="orders-search-input"
                    type="text"
                    placeholder="Search order ID, product, date, price..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 sm:py-2.5 pr-2 text-xs sm:text-[13px] font-semibold text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400 placeholder:font-normal"
                  />

                  {/* Clear Button or Keyboard Shortcut Pill */}
                  {searchQuery ? (
                    <motion.button
                      type="button"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      onClick={() => setSearchQuery('')}
                      className="mr-3 w-5 h-5 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center transition-all hover:scale-110 cursor-pointer shrink-0"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </motion.button>
                  ) : (
                    <div className="mr-3 hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-300 text-[10px] font-mono font-bold text-neutral-500 pointer-events-none shrink-0 shadow-2xs">
                      <span>⌘K</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active search query feedback row */}
            {searchQuery && (
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 px-1">
                <span>
                  Showing <strong className="text-emerald-800 font-bold">{displayedOrders.length}</strong> matching {displayedOrders.length === 1 ? 'order' : 'orders'} for "<span className="text-neutral-800 font-semibold">{searchQuery}</span>"
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Listing */}
        {userOrders.length === 0 ? (
          /* Empty Orders State */
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
              <PackageOpen className="w-10 h-10 stroke-[1.6]" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#1d1d1f]">No Orders Placed Yet</h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Your order history is currently empty. Start discovering farm-fresh organic vegetables, fruits, dairy, and cold-pressed staples!
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onBackToShop}
              className="mt-6 px-6 py-3 rounded-full bg-emerald-700 text-white font-extrabold text-xs shadow-md hover:bg-emerald-800 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Farm-Fresh Store</span>
            </motion.button>
          </div>
        ) : displayedOrders.length === 0 ? (
          /* Search Empty State */
          <div className="py-12 text-center text-neutral-500 text-xs">
            <p className="font-semibold text-neutral-800 text-sm">No orders match "{searchQuery}"</p>
            <p className="mt-1.5 max-w-md mx-auto text-neutral-500 leading-relaxed">
              Try searching by product name (e.g. "vtfc"), Order ID (#ORD-...), date (e.g. "13 Oct", "October", "2026"), price (e.g. "₹204"), or delivery hub.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="mt-4 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold transition-colors cursor-pointer"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          /* Order Cards Stack */
          <div className="space-y-5 sm:space-y-6">
            <AnimatePresence mode="popLayout">
              {displayedOrders.map((ord) => {
                const itemsList = Array.isArray(ord.items) ? ord.items : [];
                const isDelivered = (ord.status || 'Confirmed').toLowerCase() === 'delivered';

                return (
                  <motion.div
                    key={ord.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="bg-white rounded-[22px] sm:rounded-[32px] border border-black/[0.08] p-4 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_36px_rgba(5,150,105,0.08)] transition-shadow duration-300 space-y-4 sm:space-y-5 relative group"
                  >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Copyable Order ID with Click-to-Copy Feedback */}
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(ord.id)}
                          title="Click to copy Order ID"
                          className="group/copy flex items-center gap-1.5 font-mono text-xs font-black text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200/90 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>#{String(ord.id).toUpperCase()}</span>
                          {copiedOrderId === ord.id ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded-md">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Copied!</span>
                            </span>
                          ) : (
                            <Copy className="w-3 h-3 text-emerald-600 opacity-60 group-hover/copy:opacity-100 transition-opacity" />
                          )}
                        </button>

                        {/* Status Badge with Live Indicator */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                          isDelivered
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isDelivered ? 'bg-teal-500' : 'bg-emerald-500 animate-pulse'
                          }`} />
                          {isDelivered ? 'Delivered' : 'Order Confirmed'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                        <span className="flex items-center gap-1 text-neutral-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          Placed on {formatDateTime(ord.created_at)}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          ⚡ 15-Min Express Delivery
                        </span>
                      </div>
                    </div>

                    {/* Total Amount Pill */}
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
                        Total Paid (Tax Incl.)
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#1d1d1f] tracking-tight block">
                        ₹{(Number(ord.total_amount) || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-semibold">
                        {itemsList.length} item(s) • Paid via {ord.payment_method || 'UPI'}
                      </span>
                    </div>
                  </div>

                  {/* Live Delivery Progress Stepper / Timeline */}
                  <div className="bg-[#f8faf8] rounded-2xl p-4 border border-black/[0.04] space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-600 pb-1">
                      <span className="text-[#1d1d1f] flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <span>Live Delivery Status</span>
                      </span>
                      <span className="text-emerald-700 text-[11px] font-extrabold">
                        {isDelivered
                          ? 'Completed • Verified Delivery'
                          : 'In Progress • Quality Inspected'}
                      </span>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="relative flex items-center justify-between px-2">
                      <div className="absolute left-6 right-6 top-3 h-1 bg-neutral-200 rounded-full z-0">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                          style={{
                            width: isDelivered ? '100%' : '50%'
                          }}
                        />
                      </div>

                      {/* Step 1: Placed */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 mt-1">Placed</span>
                      </div>

                      {/* Step 2: Packed */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 mt-1">Packed</span>
                      </div>

                      {/* Step 3: Out for delivery */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                          isDelivered
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-600 animate-pulse'
                        }`}>
                          <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 mt-1">On the way</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                          isDelivered
                            ? 'bg-emerald-700 text-white'
                            : 'bg-neutral-200 text-neutral-400'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 mt-1">Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Items purchased in this order */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-1">
                      <span>Items in this Order ({itemsList.length})</span>
                      <span>Subtotal</span>
                    </div>

                    {itemsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 text-xs p-3.5 rounded-2xl bg-[#fafcfa] hover:bg-emerald-50/40 border border-black/[0.04] transition-colors group/item"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-xl border border-black/[0.06] shadow-2xs shrink-0 group-hover/item:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                              📦
                            </div>
                          )}
                          <div className="truncate space-y-0.5">
                            <p className="font-extrabold text-[#1d1d1f] text-xs sm:text-[13px] truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                              <span className="bg-neutral-100 px-1.5 py-0.2 rounded text-neutral-600 font-semibold">
                                {item.size || 'Standard pack'}
                              </span>
                              <span>•</span>
                              <span className="font-bold text-emerald-800">
                                Qty: {item.quantity || 1}
                              </span>
                              <span>•</span>
                              <span className="text-neutral-400">
                                ₹{Number(item.price) || 0} each
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-black text-[#1d1d1f] text-xs sm:text-sm">
                            ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                          </span>

                          {/* Quick single-item re-order CTA */}
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            type="button"
                            onClick={() => handleReorderSingleItem(item)}
                            title={`Add 1x ${item.name} to cart`}
                            className="w-7 h-7 rounded-full bg-white hover:bg-emerald-700 hover:text-white text-neutral-600 border border-black/[0.08] shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="text-sm font-black">+</span>
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer: Payment Method, Shipping Address, Receipt Modal & Re-order */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-black/[0.06] text-xs">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium bg-neutral-50 px-2.5 py-1 rounded-lg border border-black/[0.04]">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-neutral-700 font-semibold">{ord.payment_method || 'UPI / COD'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 truncate max-w-xs font-medium bg-neutral-50 px-2.5 py-1 rounded-lg border border-black/[0.04]">
                        <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate text-neutral-700">{ord.shipping_address || 'Express Home Delivery'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Digital Receipt / Invoice button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs border border-black/[0.1] shadow-2xs transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Receipt</span>
                      </motion.button>

                      {/* Re-order All Items Button */}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => handleReorder(ord)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Re-order All ({itemsList.length})</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Digital Invoice / Tax Receipt Modal */}
      <AnimatePresence>
        {selectedReceiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-black/[0.08] relative max-h-[90vh] overflow-y-auto space-y-5"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Modal Header */}
              <div className="text-center pb-3 border-b border-black/[0.06] space-y-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 mb-1">
                  <Package className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex items-center justify-center gap-1 text-xl font-black text-[#1d1d1f] tracking-tight">
                  <span>Kirana</span>
                  <span className="text-emerald-600">.</span>
                </div>
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                  Farm-Fresh Organic Retail • Digital Tax Invoice
                </p>
                <p className="text-[10px] text-neutral-400">
                  GSTIN: 27AABCK1234F1Z8 • FSSAI Lic. 11521018000452
                </p>
              </div>

              {/* Receipt Meta Details */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-2xl bg-[#f8faf8] border border-black/[0.04]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Order Reference</span>
                  <span className="font-mono font-black text-emerald-900 text-xs">#{String(selectedReceiptOrder.id).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Date &amp; Time</span>
                  <span className="font-medium text-neutral-700">{formatDateTime(selectedReceiptOrder.created_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Billed To</span>
                  <span className="font-medium text-neutral-800 truncate block">{selectedReceiptOrder.customer_name || user?.name || 'Shopper'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Payment Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAID ({selectedReceiptOrder.payment_method || 'YouPI-PG UPI'})
                  </span>
                  {selectedReceiptOrder.utr && (
                    <span className="block text-[10px] font-mono font-medium text-neutral-500 mt-0.5">
                      UTR: {selectedReceiptOrder.utr}
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider pb-1 border-b border-black/[0.05]">
                  <span>Item</span>
                  <span>Qty • Rate • Total</span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {(Array.isArray(selectedReceiptOrder.items) ? selectedReceiptOrder.items : []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate pr-2">
                        <span className="font-bold text-neutral-800 block truncate">{item.name}</span>
                        <span className="text-[10px] text-neutral-400">{item.size || 'Standard'}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-neutral-800">
                          {item.quantity || 1} × ₹{Number(item.price) || 0} = ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="pt-3 border-t border-black/[0.06] space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>₹{(Number(selectedReceiptOrder.total_amount) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Express Delivery Fee</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Taxes (5% GST included)</span>
                  <span className="font-medium text-neutral-700">₹{(Math.round((Number(selectedReceiptOrder.total_amount) || 0) * 0.05)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#1d1d1f] pt-2 border-t border-black/[0.06]">
                  <span>Grand Total</span>
                  <span className="text-emerald-800 font-black">₹{(Number(selectedReceiptOrder.total_amount) || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="px-5 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
