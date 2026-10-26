import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  LayoutDashboard,
  Layers,
  Package,
  Boxes,
  Users,
  Radio,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  Image as ImageIcon,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  ShieldCheck,
  Store,
  LogOut,
  Save,
  Download,
  Filter,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';

import {
  getHeroSlides,
  saveHeroSlides,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getProducts,
  saveProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getActiveSessions,
  terminateSession,
  getCustomers,
  deleteCustomer,
  getOrders,
  resetAdminDataToDefaults,
  syncFromSupabase,
  fetchCustomersFromSupabase,
  fetchOrdersFromSupabase
} from '../../data/adminStore';
import { supabase } from '../../utils/supabase';

const CATEGORY_OPTIONS = [
  'Groceries',
  'Fresh Produce',
  'Dairy & Breakfast',
  'Beverages',
  'Snacks',
  'Personal Care',
  'Home Care'
];

// Robust Date & Time Formatting Helpers to prevent RangeError / invalid date crashes
const safeFormatDateTime = (dateStr, fallback = 'Recently') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return fallback;
  }
};

const safeFormatTime = (dateStr, fallback = 'Active now') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return fallback;
  }
};

// GSAP Animated Number Counter Component (Null, NaN, and Undefined Safe)
function GsapCounter({ value = 0, prefix = '', suffix = '' }) {
  const safeInitial = Number(value) || 0;
  const [displayVal, setDisplayVal] = useState(safeInitial);
  const prevVal = useRef(safeInitial);

  useEffect(() => {
    const targetVal = Number(value) || 0;
    const startVal = Number(prevVal.current) || 0;
    const tweenObj = { val: startVal };
    const tween = gsap.to(tweenObj, {
      val: targetVal,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        const rounded = Math.round(tweenObj.val);
        setDisplayVal(isNaN(rounded) ? 0 : rounded);
      }
    });
    prevVal.current = targetVal;
    return () => {
      if (tween) tween.kill();
    };
  }, [value]);

  const formatted = (Number(displayVal) || 0).toLocaleString('en-IN');
  return <span>{prefix}{formatted}{suffix}</span>;
}

// Framer Motion Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05
    }
  }
};

const fadeCardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function AdminDashboard({ onNavigateToStore, showNotice }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'slides' | 'products' | 'stock' | 'orders' | 'sessions' | 'customers'

  // Data states (guaranteed array fallback)
  const [slides, setSlides] = useState(() => getHeroSlides() || []);
  const [products, setProducts] = useState(() => getProducts() || []);
  const [customers, setCustomers] = useState(() => getCustomers() || []);
  const [sessions, setSessions] = useState(() => getActiveSessions() || []);
  const [orders, setOrders] = useState(() => getOrders() || []);

  // Search & filter states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out'

  // Modals state
  const [editingSlide, setEditingSlide] = useState(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Personalized Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    item: null,
    confirmLabel: 'Confirm',
    confirmStyle: 'danger',
    onConfirm: () => {}
  });

  // Refresh data safely from storage & real database
  const refreshData = () => {
    try {
      setSlides(getHeroSlides() || []);
      setProducts(getProducts() || []);
      setCustomers(getCustomers() || []);
      setSessions(getActiveSessions() || []);
      setOrders(getOrders() || []);
    } catch (err) {
      console.warn('Admin refreshData caught error:', err);
    }
  };

  useEffect(() => {
    const handleStoreUpdate = () => refreshData();
    window.addEventListener('kirana_store_updated', handleStoreUpdate);
    window.addEventListener('kirana_store_reset', handleStoreUpdate);
    window.addEventListener('storage', handleStoreUpdate);

    // Initial background sync from Supabase
    fetchCustomersFromSupabase().then(() => refreshData()).catch(() => {});
    fetchOrdersFromSupabase().then(() => refreshData()).catch(() => {});

    // Subscribe to unified live presence & postgres changes
    let presenceChannel = null;
    let dbChannel = null;

    try {
      const syncLiveSessions = () => {
        try {
          const rawState = presenceChannel ? presenceChannel.presenceState() : {};
          const activePresences = Object.values(rawState).flat().filter(Boolean);
          if (activePresences.length > 0) {
            const formatted = activePresences.map((p) => ({
              sessionId: p.sessionId || `sess-${Math.random()}`,
              userName: p.userName || p.name || 'Shopper',
              userEmail: p.userEmail || p.email || '',
              phone: p.phone || '',
              loginMethod: p.loginMethod || p.method || 'Active Login',
              device: p.device || 'Desktop / Mobile Browser',
              ipAddress: p.ipAddress || 'Active Connection',
              location: p.location || 'India (Active)',
              loginTime: p.loginTime || p.onlineAt || new Date().toISOString(),
              lastActive: new Date().toISOString(),
              isOnline: true
            }));

            // Merge with local sessions, deduplicating by sessionId or email
            const stored = getActiveSessions() || [];
            const sessionMap = new Map();
            formatted.forEach((f) => sessionMap.set(f.sessionId, f));
            stored.forEach((s) => {
              if (!sessionMap.has(s.sessionId) && (!s.userEmail || !sessionMap.has(s.userEmail))) {
                sessionMap.set(s.sessionId, s);
              }
            });
            setSessions(Array.from(sessionMap.values()));
          } else {
            refreshData();
          }
        } catch (_) {
          refreshData();
        }
      };

      const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
      const existing = existingChannels.find(
        (c) => c.topic === 'realtime:kirana_live_presence' || c.subTopic === 'kirana_live_presence'
      );

      if (existing && (existing.state === 'joined' || existing.state === 'joining')) {
        presenceChannel = existing;
        syncLiveSessions();
      } else {
        presenceChannel = supabase.channel('kirana_live_presence');
        presenceChannel
          .on('presence', { event: 'sync' }, syncLiveSessions)
          .on('presence', { event: 'join' }, syncLiveSessions)
          .on('presence', { event: 'leave' }, syncLiveSessions)
          .subscribe();
      }

      // Dedicated channel for database changes
      dbChannel = supabase.channel(`admin_db_sync_${Date.now()}`);
      dbChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
          await fetchOrdersFromSupabase();
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
          await fetchCustomersFromSupabase();
          refreshData();
        })
        .subscribe();
    } catch (err) {
      console.warn('Failed to subscribe to Realtime channel in AdminDashboard:', err);
    }

    // Periodic gentle refresh every 45s while admin panel is open to prevent idle staleness
    const intervalId = setInterval(() => {
      refreshData();
      try {
        syncFromSupabase().catch(() => {});
      } catch (_) {}
    }, 45000);

    return () => {
      window.removeEventListener('kirana_store_updated', handleStoreUpdate);
      window.removeEventListener('kirana_store_reset', handleStoreUpdate);
      window.removeEventListener('storage', handleStoreUpdate);
      clearInterval(intervalId);
      if (dbChannel) {
        try {
          supabase.removeChannel(dbChannel);
        } catch (_) {}
      }
      if (presenceChannel) {
        try {
          supabase.removeChannel(presenceChannel);
        } catch (_) {}
      }
    };
  }, []);

  // Notifications
  const notify = (msg) => {
    if (showNotice) showNotice(msg);
  };

  // ======================== SLIDE ACTIONS ========================
  const handleSaveSlide = (e) => {
    e.preventDefault();
    const form = e.target;
    const slideData = {
      title: form.title.value.trim(),
      subtitle: form.subtitle.value.trim(),
      badge: form.badge.value.trim() || 'FEATURED',
      ctaText: form.ctaText.value.trim() || 'Shop Now',
      ctaLink: form.ctaLink.value.trim() || '#/shop',
      image: form.image.value.trim(),
      alt: form.title.value.trim(),
      active: form.active.checked
    };

    if (editingSlide && editingSlide.id) {
      const updated = updateHeroSlide(editingSlide.id, slideData);
      setSlides(updated);
      notify(`Updated slide: "${slideData.title || 'Slide'}"`);
    } else {
      const updated = addHeroSlide(slideData);
      setSlides(updated);
      notify('New slide added to homepage carousel');
    }
    setIsSlideModalOpen(false);
    setEditingSlide(null);
  };

  const handleToggleSlideActive = (slideId, currentStatus) => {
    const updated = updateHeroSlide(slideId, { active: !currentStatus });
    setSlides(updated);
    notify(`Slide ${!currentStatus ? 'activated' : 'hidden'}`);
  };

  const promptDeleteSlide = (slide) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete_slide',
      title: 'Remove Hero Carousel Slide?',
      message: `Are you sure you want to remove "${slide.title || 'this slide'}"? It will be permanently removed from the storefront carousel.`,
      item: slide,
      confirmLabel: 'Delete Slide',
      confirmStyle: 'danger',
      onConfirm: () => {
        const updated = deleteHeroSlide(slide.id);
        setSlides(updated);
        notify('Hero slide removed');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ======================== PRODUCT ACTIONS ========================
  const handleSaveProduct = (e) => {
    e.preventDefault();
    const form = e.target;
    const stockVal = Number(form.stock.value) || 0;
    
    const prodData = {
      name: form.name.value.trim(),
      category: form.category.value,
      price: Number(form.price.value) || 0,
      originalPrice: Number(form.originalPrice.value) || Number(form.price.value) || 0,
      discount: form.discount.value.trim() || '',
      size: form.size.value.trim() || 'Standard pack',
      badgeText: form.badgeText.value.trim() || 'Prime',
      image: form.image.value.trim(),
      description: form.description.value.trim(),
      stock: stockVal
    };

    if (editingProduct && editingProduct.id) {
      const updated = updateProduct(editingProduct.id, prodData);
      setProducts(updated);
      notify(`Updated product: ${prodData.name}`);
    } else {
      const updated = addProduct(prodData);
      setProducts(updated);
      notify(`Added new product: ${prodData.name}`);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const promptDeleteProduct = (product) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete_product',
      title: 'Delete Product Permanently?',
      message: `Are you sure you want to remove "${product.name}" from the store catalog? Shoppers won't be able to view or purchase this item.`,
      item: product,
      confirmLabel: 'Delete Product',
      confirmStyle: 'danger',
      onConfirm: () => {
        const updated = deleteProduct(product.id);
        setProducts(updated);
        notify(`Deleted "${product.name}" from store`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ======================== STOCK ACTIONS ========================
  const handleInlineStockChange = (productId, delta) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, (prod.stock || 0) + delta);
    const updated = updateProductStock(productId, newStock);
    setProducts(updated);
  };

  const handleSetStockValue = (productId, value) => {
    const qty = Math.max(0, parseInt(value, 10) || 0);
    const updated = updateProductStock(productId, qty);
    setProducts(updated);
  };

  const handleToggleStockStatus = (productId, currentStatus) => {
    const newStock = currentStatus === 'out_of_stock' ? 25 : 0;
    const updated = updateProductStock(productId, newStock);
    setProducts(updated);
    notify(newStock > 0 ? 'Marked product In Stock (25 units)' : 'Marked Out of Stock');
  };

  // ======================== SESSION & CUSTOMER ACTIONS ========================
  const handleTerminateSession = (sessionId, name) => {
    const updated = terminateSession(sessionId);
    setSessions(updated);
    notify(`Logged out session for ${name}`);
  };

  const promptDeleteCustomer = (customer) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete_customer',
      title: 'Remove Customer Account?',
      message: `Are you sure you want to delete ${customer.name}'s customer profile and order history?`,
      item: customer,
      confirmLabel: 'Remove Customer',
      confirmStyle: 'danger',
      onConfirm: () => {
        const updated = deleteCustomer(customer.id);
        setCustomers(updated);
        notify(`Customer profile removed for ${customer.name}`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptFactoryReset = () => {
    setConfirmModal({
      isOpen: true,
      type: 'reset_data',
      title: 'Reset Store to Factory Defaults?',
      message: 'This will reset all slides, product catalog items, stock units, and customer accounts to their fresh demo state.',
      item: null,
      confirmLabel: 'Reset All Data',
      confirmStyle: 'warning',
      onConfirm: () => {
        resetAdminDataToDefaults();
        refreshData();
        notify('Reset all store data to factory defaults');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Filtered Products (Null safe)
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p) => {
      if (!p) return false;
      const q = (productSearch || '').trim().toLowerCase();
      const matchSearch = !q || (
        (p.name ? String(p.name).toLowerCase().includes(q) : false) ||
        (p.category ? String(p.category).toLowerCase().includes(q) : false) ||
        (p.sku ? String(p.sku).toLowerCase().includes(q) : false)
      );
      const matchCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
      
      let matchStock = true;
      const stock = Number(p.stock) || 0;
      if (stockFilter === 'low') matchStock = stock > 0 && stock <= 5;
      if (stockFilter === 'out') matchStock = stock === 0;

      return matchSearch && matchCat && matchStock;
    });
  }, [products, productSearch, productCategoryFilter, stockFilter]);

  // Filtered Customers (Null safe)
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    return customers.filter((c) => {
      if (!c) return false;
      const q = (customerSearch || '').trim().toLowerCase();
      if (!q) return true;
      const nameMatch = c.name ? String(c.name).toLowerCase().includes(q) : false;
      const emailMatch = c.email ? String(c.email).toLowerCase().includes(q) : false;
      const phoneMatch = c.phone ? String(c.phone).toLowerCase().includes(q) : false;
      const locMatch = c.location ? String(c.location).toLowerCase().includes(q) : false;
      return nameMatch || emailMatch || phoneMatch || locMatch;
    });
  }, [customers, customerSearch]);

  // Filtered Orders (Null safe)
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter((o) => {
      if (!o) return false;
      const q = (orderSearch || '').trim().toLowerCase();
      if (!q) return true;
      const idMatch = o.id ? String(o.id).toLowerCase().includes(q) : false;
      const nameMatch = o.customer_name ? String(o.customer_name).toLowerCase().includes(q) : false;
      const emailMatch = o.customer_email ? String(o.customer_email).toLowerCase().includes(q) : false;
      const phoneMatch = o.customer_phone ? String(o.customer_phone).toLowerCase().includes(q) : false;
      const itemMatch = Array.isArray(o.items) && o.items.some((it) => it?.name && String(it.name).toLowerCase().includes(q));
      return idMatch || nameMatch || emailMatch || phoneMatch || itemMatch;
    });
  }, [orders, orderSearch]);

  // Overview KPIs (Defensively calculated)
  const totalStockUnits = useMemo(() => {
    if (!Array.isArray(products)) return 0;
    return products.reduce((sum, p) => sum + (Number(p?.stock) || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => {
      const s = Number(p?.stock) || 0;
      return s > 0 && s <= 5;
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    if (!Array.isArray(products)) return 0;
    return products.filter((p) => Number(p?.stock) === 0).length;
  }, [products]);

  const activeOnlineCount = useMemo(() => {
    if (!Array.isArray(sessions)) return 0;
    return sessions.filter((s) => s && s.isOnline).length;
  }, [sessions]);

  return (
    <div className="min-h-screen bg-[#f2fbf6] text-black font-sans antialiased relative overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* Background Subtle Green Ambient Wash */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-emerald-200/40 via-emerald-100/20 to-transparent blur-[120px] pointer-events-none z-0"
        aria-hidden="true"
      />
      <div 
        className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-100/30 blur-[140px] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* ===================== TOP ADMIN HEADER ===================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-emerald-100 shadow-[0_4px_20px_rgba(5,150,105,0.06)]">
        <div className="w-[96%] max-w-[1600px] mx-auto px-2 sm:px-4 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 6, scale: 1.06 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-black font-sans">
                  Kirana Master Admin
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 hidden sm:block font-medium">
                Centralized Control: Slides, Products, Stock, Real-Time Sessions & CRM
              </p>
            </div>
          </div>

          {/* Quick Info & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Online Logins Badge with White -> Green hover */}
            <motion.button
              type="button"
              onClick={() => setActiveTab('sessions')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-300 hover:border-emerald-600 text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm group"
              title="Click to view all logged-in users"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white animate-pulse transition-colors" />
              <span>{activeOnlineCount} Logged In Online</span>
            </motion.button>

            {/* Back to Live Store Button */}
            <motion.button
              type="button"
              onClick={onNavigateToStore}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-md shadow-emerald-600/25 cursor-pointer transition-all duration-200"
            >
              <Store className="w-3.5 h-3.5" />
              <span>View Store</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation Bar with Framer Motion layoutId Indicator */}
        <div className="w-[96%] max-w-[1600px] mx-auto px-2 sm:px-4 border-t border-emerald-100/80 overflow-x-auto scrollbar-none flex items-center gap-1.5 py-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'slides', label: `Carousel Slides (${slides.length})`, icon: Layers },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { 
              id: 'stock', 
              label: 'Stock & Inventory', 
              icon: Boxes, 
              badge: (lowStockCount > 0 || outOfStockCount > 0) ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-1" />
              ) : null 
            },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'sessions', label: `Logged-In Sessions (${sessions.length})`, icon: Radio },
            { id: 'customers', label: `Customers CRM (${customers.length})`, icon: Users },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComp = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer z-10 group border ${
                  isActive 
                    ? 'text-white border-emerald-600' 
                    : 'bg-white hover:bg-emerald-600 text-black hover:text-white border-emerald-200/90 hover:border-emerald-600 shadow-2xs'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAdminTabIndicator"
                    className="absolute inset-0 bg-emerald-600 rounded-full shadow-md shadow-emerald-600/30 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <IconComp className={`w-3.5 h-3.5 transition-colors ${
                  isActive ? 'text-white' : 'text-emerald-700 group-hover:text-white'
                }`} />
                <span>{tab.label}</span>
                {tab.badge}
              </button>
            );
          })}
        </div>
      </header>

      {/* ===================== MAIN CONTENT CONTAINER ===================== */}
      <main className="w-[96%] max-w-[1600px] mx-auto px-2 sm:px-4 py-6 relative z-10">

        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6"
          >
            
            {/* Top 4 KPI Metric Cards: White becoming Green & Black becoming White on Hover */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Live Logged-in Users */}
              <motion.div 
                variants={fadeCardVariant}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-white hover:bg-emerald-600 text-black hover:text-white rounded-[26px] p-5 border border-emerald-200 hover:border-emerald-600 shadow-[0_4px_24px_rgba(5,150,105,0.06)] hover:shadow-[0_16px_36px_rgba(5,150,105,0.3)] transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-600 group-hover:text-white transition-colors duration-200">
                    People Logged In
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-white text-emerald-700 group-hover:text-emerald-700 flex items-center justify-center shadow-xs transition-colors duration-200">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-black group-hover:text-white tracking-tight transition-colors duration-200">
                    <GsapCounter value={activeOnlineCount} />
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white transition-colors duration-200 shadow-2xs">
                    Active Right Now
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 group-hover:text-emerald-100 mt-2 font-medium transition-colors duration-200">
                  {sessions.length} total active browser sessions recorded
                </p>
              </motion.div>

              {/* Metric 2: Products Catalog */}
              <motion.div 
                variants={fadeCardVariant}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-white hover:bg-emerald-600 text-black hover:text-white rounded-[26px] p-5 border border-emerald-200 hover:border-emerald-600 shadow-[0_4px_24px_rgba(5,150,105,0.06)] hover:shadow-[0_16px_36px_rgba(5,150,105,0.3)] transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-600 group-hover:text-white transition-colors duration-200">
                    Active Catalog
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-white text-emerald-700 group-hover:text-emerald-700 flex items-center justify-center shadow-xs transition-colors duration-200">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-black group-hover:text-white tracking-tight transition-colors duration-200">
                    <GsapCounter value={products.length} />
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white transition-colors duration-200 shadow-2xs">
                    Live Items
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 group-hover:text-emerald-100 mt-2 font-medium transition-colors duration-200">
                  Across 7 curated grocery departments
                </p>
              </motion.div>

              {/* Metric 3: Total Stock Units */}
              <motion.div 
                variants={fadeCardVariant}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-white hover:bg-emerald-600 text-black hover:text-white rounded-[26px] p-5 border border-emerald-200 hover:border-emerald-600 shadow-[0_4px_24px_rgba(5,150,105,0.06)] hover:shadow-[0_16px_36px_rgba(5,150,105,0.3)] transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-600 group-hover:text-white transition-colors duration-200">
                    Stock Available
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-white text-emerald-700 group-hover:text-emerald-700 flex items-center justify-center shadow-xs transition-colors duration-200">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-black group-hover:text-white tracking-tight transition-colors duration-200">
                    <GsapCounter value={totalStockUnits} />
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white transition-colors duration-200 shadow-2xs">
                    Units in Warehouse
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 group-hover:text-emerald-100 mt-2 flex items-center gap-2 font-medium transition-colors duration-200">
                  {outOfStockCount > 0 && (
                    <span className="text-rose-600 group-hover:text-rose-200 font-bold flex items-center gap-1 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:bg-white" />
                      {outOfStockCount} Out of stock
                    </span>
                  )}
                  {lowStockCount > 0 && (
                    <span className="text-amber-700 group-hover:text-amber-200 font-bold flex items-center gap-1 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:bg-white" />
                      {lowStockCount} Low stock
                    </span>
                  )}
                  {outOfStockCount === 0 && lowStockCount === 0 && (
                    <span className="text-emerald-700 group-hover:text-white font-bold flex items-center gap-1 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                      100% Stock Healthy
                    </span>
                  )}
                </p>
              </motion.div>

              {/* Metric 4: Registered Customers */}
              <motion.div 
                variants={fadeCardVariant}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-white hover:bg-emerald-600 text-black hover:text-white rounded-[26px] p-5 border border-emerald-200 hover:border-emerald-600 shadow-[0_4px_24px_rgba(5,150,105,0.06)] hover:shadow-[0_16px_36px_rgba(5,150,105,0.3)] transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-600 group-hover:text-white transition-colors duration-200">
                    Total Customers
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-white text-emerald-700 group-hover:text-emerald-700 flex items-center justify-center shadow-xs transition-colors duration-200">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-black group-hover:text-white tracking-tight transition-colors duration-200">
                    <GsapCounter value={Array.isArray(customers) ? customers.length : 0} />
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white transition-colors duration-200 shadow-2xs">
                    Profiles
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 group-hover:text-emerald-100 mt-2 font-medium transition-colors duration-200">
                  ₹{(Array.isArray(customers) ? customers.reduce((s, c) => s + (Number(c?.totalSpent) || 0), 0) : 0).toLocaleString('en-IN')} Lifetime Orders Value
                </p>
              </motion.div>
            </div>

            {/* Quick Actions & Control Center */}
            <motion.div 
              variants={fadeCardVariant}
              className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-emerald-100">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-black">Quick Store Controls</h2>
                  <p className="text-xs text-neutral-600 mt-0.5">Fast shortcuts to manage all 5 core elements of Kirana</p>
                </div>
                <motion.button
                  type="button"
                  onClick={promptFactoryReset}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-xl transition-all cursor-pointer shadow-2xs group"
                  title="Reset demo data"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700 group-hover:text-white transition-colors" />
                  <span>Reset Demo Data</span>
                </motion.button>
              </div>

              {/* 5 Quick Control Action Cards: White to Green & Black to White on Hover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {[
                  {
                    title: 'Add Carousel Slide',
                    desc: 'Publish new hero banner',
                    icon: Plus,
                    onClick: () => {
                      setEditingSlide(null);
                      setIsSlideModalOpen(true);
                    }
                  },
                  {
                    title: 'Add New Product',
                    desc: 'Insert price, image, stock',
                    icon: Package,
                    onClick: () => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }
                  },
                  {
                    title: 'Manage Low Stock',
                    desc: `${lowStockCount + outOfStockCount} items need attention`,
                    icon: Boxes,
                    onClick: () => {
                      setActiveTab('stock');
                      setStockFilter('low');
                    }
                  },
                  {
                    title: 'Monitor Live Logins',
                    desc: `${activeOnlineCount} users active right now`,
                    icon: Radio,
                    pulse: true,
                    onClick: () => setActiveTab('sessions')
                  },
                  {
                    title: 'View Customers CRM',
                    desc: 'Orders, spend & contact info',
                    icon: Users,
                    onClick: () => setActiveTab('customers')
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={item.onClick}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="p-4 rounded-2xl bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all duration-200 text-left group cursor-pointer shadow-xs hover:shadow-lg hover:shadow-emerald-600/20"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-white text-emerald-700 group-hover:text-emerald-700 border border-emerald-200 group-hover:border-white flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-all duration-200">
                        <Icon className={`w-4 h-4 ${item.pulse ? 'animate-pulse' : ''}`} />
                      </div>
                      <h3 className="text-xs font-extrabold text-black group-hover:text-white transition-colors duration-200">{item.title}</h3>
                      <p className="text-[11px] text-neutral-600 group-hover:text-emerald-100 mt-1 transition-colors duration-200">{item.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Split Preview Grid: Current Live Slides & Real-Time Logged-in Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Carousel Slides Preview */}
              <motion.div 
                variants={fadeCardVariant}
                className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-extrabold text-black">Homepage Carousel ({slides.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('slides')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Manage All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {slides.slice(0, 3).map((slide) => (
                    <motion.div
                      key={slide.id}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-200 hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => {
                        setEditingSlide(slide);
                        setIsSlideModalOpen(true);
                      }}
                    >
                      <div className="w-16 h-11 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-emerald-200/80 group-hover:border-white transition-colors">
                        {slide.image ? (
                          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400">Blank</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-black group-hover:text-white truncate transition-colors">{slide.title || 'Slide Title'}</h4>
                          {slide.active ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white transition-colors">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-neutral-100 group-hover:bg-white/20 text-neutral-700 group-hover:text-white transition-colors">Hidden</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-600 group-hover:text-emerald-100 truncate mt-0.5 transition-colors">{slide.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Real-Time Logged-in Users Preview */}
              <motion.div 
                variants={fadeCardVariant}
                className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-black">Live Logged-In Shoppers ({sessions.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Sessions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {(Array.isArray(sessions) ? sessions : []).slice(0, 3).map((sess) => (
                    <motion.div
                      key={sess.sessionId}
                      whileHover={{ x: 3 }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-200 hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all duration-200 group cursor-pointer"
                      onClick={() => setActiveTab('sessions')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 group-hover:bg-white text-white group-hover:text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                          {(sess.userName ? String(sess.userName).charAt(0) : 'U').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-black group-hover:text-white transition-colors">{sess.userName || 'Shopper'}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-white animate-pulse transition-colors" />
                          </div>
                          <span className="text-[11px] text-neutral-600 group-hover:text-emerald-100 block transition-colors">{sess.device}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white transition-colors">
                        {sess.loginMethod}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

          </motion.div>
        )}

        {/* ===================== TAB 2: SLIDES IN THE WEBSITE ===================== */}
        {activeTab === 'slides' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-emerald-100">
                <div>
                  <h2 className="text-lg font-extrabold text-black">Hero Carousel Slides</h2>
                  <p className="text-xs text-neutral-600 mt-0.5">Control the banners, images, headings, and CTA links on the Kirana homepage carousel</p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => {
                    setEditingSlide(null);
                    setIsSlideModalOpen(true);
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Slide</span>
                </motion.button>
              </div>

              {/* Slide Cards Grid: White becoming Green on hover */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {slides.map((slide, idx) => (
                  <motion.div
                    key={slide.id}
                    whileHover={{ y: -4 }}
                    className="bg-white hover:bg-emerald-600 text-black hover:text-white rounded-[24px] border border-emerald-200 hover:border-emerald-600 overflow-hidden shadow-xs hover:shadow-lg hover:shadow-emerald-600/20 transition-all duration-200 group"
                  >
                    {/* Slide Image Preview Area */}
                    <div className="aspect-[16/9] w-full bg-neutral-100 relative overflow-hidden border-b border-emerald-100">
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50">
                          <ImageIcon className="w-8 h-8 text-neutral-300 mb-1" />
                          <span className="text-xs font-semibold">No image provided</span>
                        </div>
                      )}

                      {/* Active Status Badge */}
                      <div className="absolute top-3 left-3">
                        {slide.active ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-sm">
                            Active in Carousel
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-neutral-700 text-white text-[10px] font-extrabold shadow-sm">
                            Hidden / Inactive
                          </span>
                        )}
                      </div>

                      {/* Slide Order Badge */}
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-black text-[10px] font-extrabold border border-black/10 shadow-xs">
                        Slide #{idx + 1}
                      </span>
                    </div>

                    {/* Content & Actions */}
                    <div className="p-4 sm:p-5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 group-hover:text-emerald-800 bg-emerald-100 group-hover:bg-white px-2.5 py-0.5 rounded-md inline-block mb-1.5 border border-emerald-200 group-hover:border-white transition-colors">
                          {slide.badge || 'PROMOTION'}
                        </span>
                        <h3 className="text-sm font-extrabold text-black group-hover:text-white leading-snug transition-colors">
                          {slide.title || 'Untitled Banner'}
                        </h3>
                        <p className="text-xs text-neutral-600 group-hover:text-emerald-100 mt-1 leading-relaxed transition-colors">
                          {slide.subtitle || 'No subtitle provided.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-100 group-hover:border-white/20 flex items-center justify-between gap-2 transition-colors">
                        <div className="text-[11px] text-neutral-600 group-hover:text-emerald-100 truncate max-w-[200px] transition-colors">
                          CTA: <span className="font-bold text-black group-hover:text-white transition-colors">{slide.ctaText || 'Shop Now'}</span> &bull; {slide.ctaLink}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSlideActive(slide.id, slide.active)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              slide.active
                                ? 'bg-white group-hover:bg-white text-black group-hover:text-emerald-800 border border-emerald-200'
                                : 'bg-emerald-700 group-hover:bg-white text-white group-hover:text-emerald-800'
                            }`}
                          >
                            {slide.active ? 'Hide' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingSlide(slide);
                              setIsSlideModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white group-hover:bg-white text-black group-hover:text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                            title="Edit slide"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => promptDeleteSlide(slide)}
                            className="p-1.5 rounded-lg bg-rose-50 group-hover:bg-white text-rose-700 group-hover:text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== TAB 3: PRODUCTS CATALOG ===================== */}
        {activeTab === 'products' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]">
              
              {/* Header and Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-emerald-100">
                <div>
                  <h2 className="text-lg font-extrabold text-black">Products Catalog Management</h2>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Manage pricing, descriptions, categories, images, and live store listings
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-400 hover:border-neutral-700 rounded-full text-black placeholder:text-neutral-500 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-colors"
                    />
                  </div>

                  {/* Category Selector */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-[#f8fcf9] border border-emerald-200 rounded-full font-bold text-black outline-none focus:border-emerald-600"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Add Product Button */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </motion.button>
                </div>
              </div>

              {/* Products Table: Rows White to Green & Black to White on Hover */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-100 text-neutral-600 uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Stock Units</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100/70">
                    {filteredProducts.map((prod) => (
                      <tr 
                        key={prod.id} 
                        className="hover:bg-emerald-600 transition-colors duration-200 group text-black cursor-pointer"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-emerald-100 group-hover:border-white transition-colors">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <h4 className="font-extrabold text-black group-hover:text-white truncate transition-colors">{prod.name}</h4>
                              <span className="text-[11px] text-neutral-600 group-hover:text-emerald-100 transition-colors">{prod.size} &bull; {prod.sku || 'KRN-ITEM'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 text-[11px] font-bold border border-emerald-200 group-hover:border-white transition-colors">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-black group-hover:text-white text-sm transition-colors">₹{prod.price}</span>
                            {prod.originalPrice > prod.price && (
                              <span className="text-[10px] text-neutral-500 group-hover:text-emerald-200 line-through transition-colors">₹{prod.originalPrice}</span>
                            )}
                          </div>
                          {prod.discount && (
                            <span className="text-[9px] font-extrabold text-emerald-700 group-hover:text-white transition-colors">{prod.discount}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-black group-hover:text-white min-w-[24px] transition-colors">
                              {prod.stock || 0}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInlineStockChange(prod.id, -1);
                                }}
                                className="w-5 h-5 rounded bg-neutral-100 group-hover:bg-white text-black group-hover:text-emerald-700 hover:bg-neutral-200 text-xs font-extrabold flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInlineStockChange(prod.id, 1);
                                }}
                                className="w-5 h-5 rounded bg-neutral-100 group-hover:bg-white text-black group-hover:text-emerald-700 hover:bg-neutral-200 text-xs font-extrabold flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          {prod.stock === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 group-hover:bg-white text-rose-700 group-hover:text-rose-700 text-[10px] font-bold border border-rose-200 group-hover:border-white transition-colors">
                              <XCircle className="w-3 h-3" />
                              Out of Stock
                            </span>
                          ) : prod.stock <= 5 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 group-hover:bg-white text-amber-800 group-hover:text-amber-800 text-[10px] font-bold border border-amber-200 group-hover:border-white transition-colors">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock ({prod.stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 text-[10px] font-bold border border-emerald-200 group-hover:border-white transition-colors shadow-2xs">
                              <CheckCircle2 className="w-3 h-3" />
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProduct(prod);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-white group-hover:bg-white text-black group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white cursor-pointer transition-colors shadow-2xs"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                promptDeleteProduct(prod);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 group-hover:bg-white text-rose-700 group-hover:text-rose-700 border border-rose-200 group-hover:border-white cursor-pointer transition-colors shadow-2xs"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== TAB 4: STOCK AVAILABLE ===================== */}
        {activeTab === 'stock' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]">
              
              {/* Header and Quick Stock Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-emerald-100">
                <div>
                  <h2 className="text-lg font-extrabold text-black">Inventory &amp; Stock Availability</h2>
                  <p className="text-xs text-neutral-600 mt-0.5">Control real-time available inventory counts and prevent overselling</p>
                </div>

                {/* Stock Status Filter Buttons: White to Green & Black to White on Hover */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockFilter('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                      stockFilter === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-600 text-black hover:text-white border-emerald-200 hover:border-emerald-600'
                    }`}
                  >
                    All Items ({products.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockFilter('low')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                      stockFilter === 'low'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white hover:bg-emerald-600 text-black hover:text-white border-emerald-200 hover:border-emerald-600'
                    }`}
                  >
                    Low Stock ({lowStockCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockFilter('out')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                      stockFilter === 'out'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-600 text-black hover:text-white border-emerald-200 hover:border-emerald-600'
                    }`}
                  >
                    Out of Stock ({outOfStockCount})
                  </button>
                </div>
              </div>

              {/* Stock Items Grid: White to Green & Black to White on Hover */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {filteredProducts.map((prod) => (
                  <motion.div
                    key={prod.id}
                    whileHover={{ y: -4 }}
                    className="p-4 rounded-[22px] bg-white hover:bg-emerald-600 text-black hover:text-white border border-emerald-200 hover:border-emerald-600 flex items-center justify-between gap-3 shadow-xs hover:shadow-lg hover:shadow-emerald-600/20 transition-all duration-200 group cursor-default"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-emerald-100 group-hover:border-white transition-colors">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-black group-hover:text-white truncate transition-colors">{prod.name}</h4>
                        <span className="text-[10px] text-neutral-600 group-hover:text-emerald-100 block transition-colors">{prod.category} &bull; ₹{prod.price}</span>
                        <div className="mt-1">
                          {prod.stock === 0 ? (
                            <span className="text-[10px] font-extrabold text-rose-600 group-hover:text-white transition-colors">● 0 Units (Out of Stock)</span>
                          ) : prod.stock <= 5 ? (
                            <span className="text-[10px] font-extrabold text-amber-700 group-hover:text-white transition-colors">● Low: {prod.stock} units left</span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-emerald-700 group-hover:text-white transition-colors">● In Stock: {prod.stock} units</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock Input & Stepper */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-[#f8fcf9] group-hover:bg-white p-1 rounded-xl border border-emerald-200 group-hover:border-white transition-colors">
                        <button
                          type="button"
                          onClick={() => handleInlineStockChange(prod.id, -5)}
                          className="px-1.5 py-1 text-[10px] font-bold text-neutral-600 group-hover:text-emerald-800 hover:bg-emerald-100 rounded cursor-pointer transition-colors"
                          title="Subtract 5"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInlineStockChange(prod.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white group-hover:bg-emerald-100 text-black group-hover:text-emerald-800 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          title="Subtract 1"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          value={prod.stock || 0}
                          onChange={(e) => handleSetStockValue(prod.id, e.target.value)}
                          className="w-12 text-center text-xs font-extrabold text-black group-hover:text-emerald-800 bg-transparent outline-none transition-colors"
                        />

                        <button
                          type="button"
                          onClick={() => handleInlineStockChange(prod.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white group-hover:bg-emerald-100 text-black group-hover:text-emerald-800 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          title="Add 1"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInlineStockChange(prod.id, 5)}
                          className="px-1.5 py-1 text-[10px] font-bold text-neutral-600 group-hover:text-emerald-800 hover:bg-emerald-100 rounded cursor-pointer transition-colors"
                          title="Add 5"
                        >
                          +5
                        </button>
                      </div>

                      {/* Quick Out of Stock / In Stock toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStockStatus(prod.id, prod.stockStatus)}
                        className={`text-[10px] font-bold underline cursor-pointer transition-colors ${
                          prod.stock === 0 
                            ? 'text-emerald-700 group-hover:text-white' 
                            : 'text-rose-600 group-hover:text-white'
                        }`}
                      >
                        {prod.stock === 0 ? 'Restore 25 Units' : 'Mark Out of Stock'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== TAB: ORDERS & FULFILLMENT ===================== */}
        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]">
              
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-emerald-100">
                <div>
                  <h2 className="text-lg font-extrabold text-black">Customer Orders &amp; Fulfillment</h2>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Live record of customer orders placed in shop with item quantities and real-time inventory deductions
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search order ID, shopper, item..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-400 hover:border-neutral-700 rounded-full text-black placeholder:text-neutral-500 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-colors"
                    />
                  </div>

                  <span className="text-xs font-bold text-neutral-700">
                    {filteredOrders.length} Orders &bull; ₹{(Array.isArray(orders) ? orders.reduce((sum, o) => sum + (Number(o?.total_amount) || 0), 0) : 0).toLocaleString('en-IN')} Total
                  </span>
                </div>
              </div>

              {/* Orders Table */}
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                    <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-black">No Orders Recorded Yet</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    When shoppers complete checkout in the shop, their orders and live inventory deductions will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-100 text-neutral-600 uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3">Shopper</th>
                        <th className="py-3 px-3">Items Purchased</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3">Total Amount</th>
                        <th className="py-3 px-3">Date &amp; Time</th>
                        <th className="py-3 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/70">
                      {filteredOrders.map((ord) => {
                        const itemsList = Array.isArray(ord.items) ? ord.items : [];
                        const formattedDate = safeFormatDateTime(ord.created_at);

                        return (
                          <tr
                            key={ord.id}
                            className="hover:bg-emerald-600 transition-colors duration-200 group text-black cursor-pointer"
                          >
                            <td className="py-3.5 px-3">
                              <span className="font-mono font-bold text-xs text-emerald-800 group-hover:text-white transition-colors">
                                {ord.id}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <div>
                                <span className="font-extrabold text-black group-hover:text-white block transition-colors">
                                  {ord.customer_name || 'Valued Shopper'}
                                </span>
                                {(ord.customer_email || ord.customer_phone) && (
                                  <span className="text-[11px] text-neutral-600 group-hover:text-emerald-100 transition-colors">
                                    {ord.customer_email || ord.customer_phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {itemsList.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full bg-emerald-50 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white text-[10px] font-bold transition-colors"
                                  >
                                    {item.name} &times; {item.quantity}
                                  </span>
                                ))}
                                {itemsList.length === 0 && (
                                  <span className="text-neutral-500 group-hover:text-emerald-100 text-[11px]">No item details</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-1 rounded-full bg-white group-hover:bg-emerald-700 text-neutral-800 group-hover:text-white border border-emerald-200 text-[10px] font-bold transition-colors">
                                {ord.payment_method || 'COD'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-sm font-extrabold text-black group-hover:text-white transition-colors">
                                ₹{ord.total_amount || 0}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-neutral-600 group-hover:text-emerald-100 transition-colors">
                              {formattedDate}
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 text-[10px] font-extrabold border border-emerald-200 group-hover:border-white transition-colors">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {ord.status || 'Confirmed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* ===================== TAB 5: HOW MANY PEOPLE LOGGED IN ===================== */}
        {activeTab === 'sessions' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-emerald-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-700 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-black">Live Logged-In Sessions</h2>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Real-time monitoring of active shopper logins, authentications, devices and connected browsers
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                    {activeOnlineCount} Shoppers Connected Now
                  </span>
                </div>
              </div>

              {/* Real-Time Sessions Table: Rows White to Green on Hover */}
              {sessions.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                    <Users className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-black">No Active Logged-In Shoppers</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    When shoppers sign in to the store via Mobile OTP, Google, or Email, their live sessions, real detected devices, and connection details will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-100 text-neutral-600 uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="py-3 px-3">Shopper / User</th>
                        <th className="py-3 px-3">Login Method</th>
                        <th className="py-3 px-3">Device / Browser</th>
                        <th className="py-3 px-3">IP &amp; Location</th>
                        <th className="py-3 px-3">Login Time</th>
                        <th className="py-3 px-3">Live Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/70">
                      {(Array.isArray(sessions) ? sessions : []).map((sess) => (
                        <tr 
                          key={sess.sessionId} 
                          className="hover:bg-emerald-600 transition-colors duration-200 group text-black cursor-pointer"
                        >
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 group-hover:bg-white text-white group-hover:text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                                {(sess.userName ? String(sess.userName).charAt(0) : 'U').toUpperCase()}
                              </div>
                              <div>
                                <span className="font-extrabold text-black group-hover:text-white block transition-colors">{sess.userName || 'Shopper'}</span>
                                <span className="text-[11px] text-neutral-600 group-hover:text-emerald-100 transition-colors">{sess.userEmail || sess.phone || 'Connected'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border border-emerald-200 group-hover:border-white text-[11px] font-bold transition-colors">
                              {sess.loginMethod || 'Active Login'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-black group-hover:text-white font-medium transition-colors">
                            <div className="flex items-center gap-1.5">
                              {sess.device && (sess.device.includes('iPhone') || sess.device.includes('Samsung') || sess.device.includes('Android')) ? (
                                <Smartphone className="w-3.5 h-3.5 text-emerald-700 group-hover:text-white transition-colors" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-emerald-700 group-hover:text-white transition-colors" />
                              )}
                              <span>{sess.device || 'Desktop Browser'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-neutral-600 group-hover:text-emerald-100 transition-colors">
                            {sess.ipAddress || 'Connected'}
                          </td>

                          <td className="py-3.5 px-3 text-neutral-600 group-hover:text-emerald-100 transition-colors">
                            {safeFormatTime(sess.loginTime)}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 text-[10px] font-bold border border-emerald-200 group-hover:border-white transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTerminateSession(sess.sessionId, sess.userName);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 group-hover:bg-white text-rose-700 group-hover:text-rose-700 border border-rose-200 group-hover:border-white text-xs font-bold transition-colors cursor-pointer"
                              title="Force logout"
                            >
                              Remote Logout
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===================== TAB 6: CUSTOMERS DATA ===================== */}
        {activeTab === 'customers' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[28px] p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(5,150,105,0.06)]">
              
              {/* Header and CRM Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-emerald-100">
                <div>
                  <h2 className="text-lg font-extrabold text-black">Customer Database &amp; Profiles</h2>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Manage shoppers data, delivery addresses, order histories, and lifetime store spending
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name, phone, email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-400 hover:border-neutral-700 rounded-full text-black placeholder:text-neutral-500 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-colors"
                    />
                  </div>

                  <span className="text-xs font-bold text-neutral-700">
                    {filteredCustomers.length} Customers
                  </span>
                </div>
              </div>

              {/* Customers CRM Table: Rows White to Green on Hover */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-100 text-neutral-600 uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Contact Details</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Customer Type</th>
                      <th className="py-3 px-3">Orders</th>
                      <th className="py-3 px-3">Total Spent</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100/70">
                    {filteredCustomers.map((cust) => (
                      <tr 
                        key={cust.id} 
                        className="hover:bg-emerald-600 transition-colors duration-200 group text-black cursor-pointer"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 group-hover:bg-white text-white group-hover:text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                              {cust.avatar ? (
                                <img src={cust.avatar} alt={cust.name || 'Customer'} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                (cust.name ? String(cust.name).charAt(0) : 'S').toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-black group-hover:text-white block transition-colors">{cust.name || 'Valued Shopper'}</span>
                              <span className="text-[10px] text-neutral-600 group-hover:text-emerald-100 transition-colors">Registered {cust.registeredDate || 'Recently'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-black group-hover:text-white transition-colors">
                          <span className="block font-bold">{cust.phone || 'N/A'}</span>
                          <span className="text-[11px] text-neutral-600 group-hover:text-emerald-100 transition-colors">{cust.email || 'No email'}</span>
                        </td>

                        <td className="py-3.5 px-3 text-neutral-600 group-hover:text-emerald-100 transition-colors">
                          {cust.location || 'India'}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            cust.type === 'VIP Member'
                              ? 'bg-amber-100 group-hover:bg-white text-amber-900 group-hover:text-amber-900 border-amber-300 group-hover:border-white'
                              : 'bg-emerald-50 group-hover:bg-white text-emerald-800 group-hover:text-emerald-800 border-emerald-200 group-hover:border-white'
                          }`}>
                            {cust.type || 'Shopper'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-black group-hover:text-white transition-colors">
                          {Number(cust.totalOrders) || 0} orders
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-extrabold text-sm text-emerald-800 group-hover:text-white transition-colors">
                            ₹{(Number(cust.totalSpent) || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteCustomer(cust);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 group-hover:bg-white text-rose-700 group-hover:text-rose-700 border border-rose-200 group-hover:border-white transition-colors cursor-pointer shadow-2xs"
                            title="Delete customer record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* ===================== SLIDE EDITOR MODAL ===================== */}
      <AnimatePresence>
        {isSlideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSlideModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl border border-emerald-200 z-10 overflow-hidden text-black"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-100">
                <h3 className="text-base font-extrabold text-black">
                  {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-emerald-600 hover:text-white flex items-center justify-center text-black cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlide} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-black mb-1.5">Slide Title / Headline</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingSlide?.title || ''}
                    placeholder="e.g. 100% Farm Fresh Organic Harvest"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1.5">Subtitle / Description</label>
                  <input
                    type="text"
                    name="subtitle"
                    defaultValue={editingSlide?.subtitle || ''}
                    placeholder="e.g. Hand-picked heritage fruits & vegetables delivered in 15 mins"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1.5">Banner Image URL</label>
                  <input
                    type="url"
                    name="image"
                    defaultValue={editingSlide?.image || ''}
                    placeholder="https://images.unsplash.com/... or /path/to/image.jpg"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1.5">Badge Tag</label>
                    <input
                      type="text"
                      name="badge"
                      defaultValue={editingSlide?.badge || 'FARM FRESH'}
                      placeholder="e.g. 100% ORGANIC"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1.5">Button Text</label>
                    <input
                      type="text"
                      name="ctaText"
                      defaultValue={editingSlide?.ctaText || 'Shop Groceries'}
                      placeholder="e.g. Shop Now"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1.5">Button Target Link</label>
                  <input
                    type="text"
                    name="ctaLink"
                    defaultValue={editingSlide?.ctaLink || '#/shop'}
                    placeholder="#/shop or #products"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="slideActiveCheckbox"
                    name="active"
                    defaultChecked={editingSlide ? editingSlide.active : true}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="slideActiveCheckbox" className="font-bold text-black cursor-pointer">
                    Display this slide actively in the carousel
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsSlideModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-black hover:bg-neutral-100 font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Save Slide
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================== PRODUCT EDITOR MODAL ===================== */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-2xl border border-emerald-200 z-10 text-black"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-100">
                <h3 className="text-base font-extrabold text-black">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-emerald-600 hover:text-white flex items-center justify-center text-black cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-black mb-1.5">Product Title</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name || ''}
                    placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1.5">Category</label>
                    <select
                      name="category"
                      defaultValue={editingProduct?.category || 'Groceries'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600 font-bold"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1.5">Size / Weight Unit</label>
                    <input
                      type="text"
                      name="size"
                      defaultValue={editingProduct?.size || '1 kg'}
                      placeholder="e.g. 5 kg or 500 ml"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1.5">Selling Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      defaultValue={editingProduct?.price || 199}
                      min="1"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black font-extrabold outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1.5">Original Price (₹)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      defaultValue={editingProduct?.originalPrice || 249}
                      min="1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1.5">Discount Tag</label>
                    <input
                      type="text"
                      name="discount"
                      defaultValue={editingProduct?.discount || '15% OFF'}
                      placeholder="e.g. 15% OFF"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1.5">Stock Quantity Available</label>
                    <input
                      type="number"
                      name="stock"
                      defaultValue={editingProduct?.stock !== undefined ? editingProduct.stock : 35}
                      min="0"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-emerald-800 font-extrabold outline-none focus:bg-white focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-neutral-600 mt-1 block">0 = Automatically marks Out of Stock</span>
                  </div>
                  <div>
                    <label className="block font-bold text-black mb-1.5">Pill Badge Text</label>
                    <input
                      type="text"
                      name="badgeText"
                      defaultValue={editingProduct?.badgeText || 'Bestseller'}
                      placeholder="e.g. Farm Fresh"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1.5">Product Image URL</label>
                  <input
                    type="url"
                    name="image"
                    defaultValue={editingProduct?.image || ''}
                    placeholder="https://images.unsplash.com/..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1.5">Short Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingProduct?.description || ''}
                    placeholder="100% stone-milled wheat flour for soft golden rotis..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fcf9] border border-emerald-200 text-xs text-black outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-black hover:bg-neutral-100 font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================== PERSONALIZED CONFIRMATION POP-UP ======================== */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-black/55 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-lg bg-white rounded-[28px] border border-emerald-100 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden text-black z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Stripe */}
              <div
                className={`h-2 w-full ${
                  confirmModal.confirmStyle === 'warning'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600'
                }`}
              />

              <div className="p-6 sm:p-7">
                {/* Header with Icon and Close Button */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        confirmModal.confirmStyle === 'warning'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      {confirmModal.confirmStyle === 'warning' ? (
                        <RotateCcw className="w-6 h-6" />
                      ) : (
                        <Trash2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold tracking-wider uppercase text-neutral-500">
                        Confirmation Required
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-black tracking-tight leading-tight">
                        {confirmModal.title}
                      </h3>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                    className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Explanatory Message */}
                <p className="text-sm text-neutral-600 leading-relaxed mb-5">
                  {confirmModal.message}
                </p>

                {/* Personalized Item Preview Box */}
                {confirmModal.type === 'delete_product' && confirmModal.item && (
                  <div className="bg-[#f7fbf8] rounded-2xl p-4 border border-emerald-200/80 mb-5 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white border border-emerald-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                      {confirmModal.item.image ? (
                        <img
                          src={confirmModal.item.image}
                          alt={confirmModal.item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {confirmModal.item.category || 'General'}
                        </span>
                        {confirmModal.item.badgeText && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-neutral-600 border border-neutral-200">
                            {confirmModal.item.badgeText}
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-sm text-black truncate">
                        {confirmModal.item.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="font-extrabold text-emerald-800">
                          ₹{confirmModal.item.price}
                        </span>
                        <span className="text-neutral-500 font-medium">
                          {confirmModal.item.size || '1 unit'}
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="text-neutral-600 font-bold">
                          Stock: <span className={confirmModal.item.stock > 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>{confirmModal.item.stock || 0} units</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {confirmModal.type === 'delete_slide' && confirmModal.item && (
                  <div className="bg-[#f7fbf8] rounded-2xl p-3 border border-emerald-200/80 mb-5 overflow-hidden">
                    <div className="relative aspect-[16/6] w-full rounded-xl overflow-hidden bg-neutral-900 border border-emerald-100">
                      {confirmModal.item.image && (
                        <img
                          src={confirmModal.item.image}
                          alt={confirmModal.item.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex flex-col justify-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          {confirmModal.item.tag || 'Hero Carousel Slide'}
                        </span>
                        <h4 className="text-sm font-black text-white truncate">
                          {confirmModal.item.title}
                        </h4>
                        <p className="text-xs text-neutral-300 truncate">
                          {confirmModal.item.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {confirmModal.type === 'delete_customer' && confirmModal.item && (
                  <div className="bg-[#f7fbf8] rounded-2xl p-4 border border-emerald-200/80 mb-5 flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-lg flex items-center justify-center shrink-0">
                      {(confirmModal.item?.name ? String(confirmModal.item.name).charAt(0) : 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-black truncate">
                        {confirmModal.item?.name || 'Shopper'}
                      </h4>
                      <p className="text-xs text-neutral-600 truncate mt-0.5">
                        {confirmModal.item?.phone || 'No phone'} • {confirmModal.item?.email || 'No email'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="font-extrabold text-black">
                          {Number(confirmModal.item?.totalOrders) || 0} orders
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="font-extrabold text-emerald-800">
                          ₹{Number(confirmModal.item?.totalSpent || 0).toLocaleString('en-IN')} spent
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {confirmModal.type === 'reset_data' && (
                  <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 mb-5">
                    <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase tracking-wider mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Data Restoration Target</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Reverts the store catalog to the curated demo items (Atta, Rice, Ghee, Masalas, etc.), restores default hero promotion banners, re-initializes stock counts, and restores initial customer profiles.
                    </p>
                  </div>
                )}

                {/* Permanent deletion caution note */}
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-neutral-100/90 text-neutral-600 text-xs font-semibold mb-6">
                  <AlertTriangle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>This action cannot be undone once confirmed.</span>
                </div>

                {/* Action Buttons: Green & White Theme With Black Text and Dynamic Hover */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-100">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black border border-neutral-200 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (typeof confirmModal.onConfirm === 'function') {
                        confirmModal.onConfirm();
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white cursor-pointer shadow-md transition-all flex items-center gap-1.5 ${
                      confirmModal.confirmStyle === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    }`}
                  >
                    {confirmModal.confirmStyle === 'warning' ? (
                      <RotateCcw className="w-3.5 h-3.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{confirmModal.confirmLabel || 'Confirm Action'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
