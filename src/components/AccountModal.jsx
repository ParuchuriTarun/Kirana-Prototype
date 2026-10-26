import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Package, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Laptop, 
  Smartphone, 
  LogOut, 
  Truck, 
  BadgeCheck,
  PackageOpen,
  Check
} from 'lucide-react';
import { getOrders, getCustomers } from '../data/adminStore';
import { getClientDeviceInfo, getClientNetworkInfo } from '../utils/deviceInfo';

export default function AccountModal({
  isOpen,
  onClose,
  initialTab = 'overview', // 'overview' | 'orders'
  user,
  onLogout,
  onShopClick,
  onAddToCart,
  onOpenCart,
  showNotice,
  cartItemsCount = 0,
  cartTotalValue = 0
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [networkLocation, setNetworkLocation] = useState('India (Active)');
  const [deviceInfo, setDeviceInfo] = useState({ device: 'Desktop / Mobile Browser' });

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Load orders, customers, and device telemetry
  useEffect(() => {
    if (!isOpen) return;

    const loadData = () => {
      try {
        setOrders(getOrders() || []);
        setCustomers(getCustomers() || []);
      } catch (err) {
        console.warn('Error loading account modal data:', err);
      }
    };

    loadData();

    // Listen for live updates
    const handleUpdate = () => loadData();
    window.addEventListener('kirana_store_updated', handleUpdate);

    // Get hardware & network details
    try {
      setDeviceInfo(getClientDeviceInfo());
      getClientNetworkInfo().then((info) => {
        if (info?.location && info.location !== 'Local Network') {
          setNetworkLocation(info.location);
        }
      }).catch(() => {});
    } catch (_) {}

    return () => {
      window.removeEventListener('kirana_store_updated', handleUpdate);
    };
  }, [isOpen]);

  // Find customer CRM profile for this user
  const customerProfile = useMemo(() => {
    if (!user) return null;
    return customers.find((c) => {
      if (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase()) return true;
      if (user.phone && c.phone && c.phone === user.phone) return true;
      if (user.name && c.name && c.name.toLowerCase() === user.name.toLowerCase()) return true;
      return false;
    }) || null;
  }, [customers, user]);

  // Filter orders belonging to this user
  const userOrders = useMemo(() => {
    if (!user) return [];
    const userEmail = (user.email || '').toLowerCase().trim();
    const userPhone = (user.phone || '').trim();
    const userName = (user.name || '').toLowerCase().trim();

    const filtered = orders.filter((ord) => {
      const ordEmail = (ord.customer_email || '').toLowerCase().trim();
      const ordPhone = (ord.customer_phone || '').trim();
      const ordName = (ord.customer_name || '').toLowerCase().trim();

      if (userEmail && ordEmail && userEmail === ordEmail) return true;
      if (userPhone && ordPhone && userPhone === ordPhone) return true;
      if (userName && ordName && (userName === ordName || ordName.includes(userName))) return true;
      return false;
    });

    // If no direct email/phone match found, but this is the active user with orders placed recently
    if (filtered.length === 0 && orders.length > 0) {
      // Check if user is the only customer or recent order matches
      const recentSessionOrder = orders.filter((o) => {
        return ordNameMatch(o.customer_name, user.name);
      });
      if (recentSessionOrder.length > 0) return recentSessionOrder;
    }

    return filtered;
  }, [orders, user]);

  function ordNameMatch(n1, n2) {
    if (!n1 || !n2) return false;
    return n1.toLowerCase().trim() === n2.toLowerCase().trim();
  }

  // Calculate lifetime spend
  const totalSpent = useMemo(() => {
    if (userOrders.length > 0) {
      return userOrders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0);
    }
    return Number(customerProfile?.totalSpent) || 0;
  }, [userOrders, customerProfile]);

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
    onClose();
    if (onOpenCart) onOpenCart();
  };

  if (!isOpen) return null;

  const displayName = user?.name || 'Valued Shopper';
  const displayEmail = user?.email || (user?.isGuest ? 'Guest Access' : 'Not linked');
  const displayPhone = user?.phone || (customerProfile?.phone && customerProfile.phone !== 'N/A' ? customerProfile.phone : 'Not linked');
  const customerType = customerProfile?.type || (user?.isGuest ? 'Guest Explorer' : 'Verified Member');
  let memberSince = 'October 2026';
  if (customerProfile?.registeredDate) {
    try {
      const d = new Date(customerProfile.registeredDate);
      if (!isNaN(d.getTime())) {
        memberSince = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      }
    } catch (_) {}
  }
  const deliveryLocation = customerProfile?.location || networkLocation || 'Pune, India';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          key="account-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/45 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          key="account-modal-shell"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[36px] shadow-[0_24px_80px_rgba(0,0,0,0.22)] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 border border-black/[0.08]"
        >
          {/* Top Bar with Title, Segmented Tabs & Close Button */}
          <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-black/[0.06] flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xl shrink-0">
            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f0f3f1] rounded-full border border-black/[0.04]">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`relative px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'overview' ? 'text-emerald-950' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {activeTab === 'overview' && (
                  <motion.div
                    layoutId="account-tab-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 bg-white rounded-full shadow-xs border border-black/[0.04]"
                  />
                )}
                <User className="w-3.5 h-3.5 relative z-10 stroke-[2.2]" />
                <span className="relative z-10">Account Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`relative px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders' ? 'text-emerald-950' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {activeTab === 'orders' && (
                  <motion.div
                    layoutId="account-tab-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 bg-white rounded-full shadow-xs border border-black/[0.04]"
                  />
                )}
                <Package className="w-3.5 h-3.5 relative z-10 stroke-[2.2]" />
                <span className="relative z-10">Orders</span>
                {userOrders.length > 0 && (
                  <span className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'orders' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {userOrders.length}
                  </span>
                )}
              </button>
            </div>

            {/* Close Button */}
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="w-8 h-8 text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </motion.button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-6">
            
            {/* ===================== TAB 1: ACCOUNT OVERVIEW ===================== */}
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
                className="space-y-6"
              >
                {/* Hero Profile Banner */}
                <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-[0_12px_36px_rgba(5,150,105,0.22)]">
                  {/* Subtle Background Pattern */}
                  <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-white text-emerald-700 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-white/20">
                        {user?.isGuest ? '👤' : (displayName ? displayName.charAt(0).toUpperCase() : 'U')}
                      </div>

                      {/* Name & Email Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                            {displayName}
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/25">
                            <ShieldCheck className="w-3 h-3 text-emerald-200" />
                            {customerType}
                          </span>
                        </div>
                        
                        <p className="text-emerald-100 text-xs sm:text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{displayEmail}</span>
                          {displayPhone !== 'Not linked' && (
                            <>
                              <span className="opacity-60">•</span>
                              <span>{displayPhone}</span>
                            </>
                          )}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 text-[10px] text-emerald-100 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                            Active Connection
                          </span>
                          <span className="text-[10px] text-emerald-200/80">
                            Member since {memberSince}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Button to Orders */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveTab('orders')}
                      className="px-4 py-2 rounded-full bg-white text-emerald-900 font-bold text-xs shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>View Orders</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>

                {/* Account Metrics Grid (4 Key Data Points) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Orders Card */}
                  <div className="bg-[#f8fbf9] p-3.5 rounded-2xl border border-emerald-100/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500">Total Orders</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-extrabold text-neutral-900 block leading-tight">
                        {userOrders.length}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Lifetime purchases</span>
                    </div>
                  </div>

                  {/* Total Spent Card */}
                  <div className="bg-[#f8fbf9] p-3.5 rounded-2xl border border-emerald-100/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500">Total Spent</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-extrabold text-neutral-900 block leading-tight">
                        ₹{totalSpent.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Verified savings</span>
                    </div>
                  </div>

                  {/* Active Bag Card */}
                  <div 
                    onClick={() => {
                      onClose();
                      if (onOpenCart) onOpenCart();
                    }}
                    className="bg-[#f8fbf9] p-3.5 rounded-2xl border border-emerald-100/80 flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500 group-hover:text-emerald-800 transition-colors">Bag Status</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-extrabold text-neutral-900 block leading-tight">
                        {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Tap to open bag</span>
                    </div>
                  </div>

                  {/* Delivery Hub Location */}
                  <div className="bg-[#f8fbf9] p-3.5 rounded-2xl border border-emerald-100/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500">Primary Hub</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm font-extrabold text-neutral-900 truncate block leading-tight">
                        {deliveryLocation.split(',')[0]}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">10-min speed node</span>
                    </div>
                  </div>
                </div>

                {/* Overall Account Information Breakdown */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <BadgeCheck className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                      Account &amp; Security Profile
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                      ID: {(customerProfile?.id || user?.userId || 'KIRANA-US82').slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50/60 border border-black/[0.03]">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-black/[0.04] text-neutral-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-600 block font-medium">Registered Email</span>
                        <span className="font-bold text-[#1d1d1f] break-all">{displayEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50/60 border border-black/[0.03]">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-black/[0.04] text-neutral-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-600 block font-medium">Phone Number</span>
                        <span className="font-bold text-[#1d1d1f]">{displayPhone}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50/60 border border-black/[0.03]">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-black/[0.04] text-neutral-600 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-600 block font-medium">Default Delivery Address</span>
                        <span className="font-bold text-[#1d1d1f]">{deliveryLocation} • Express Local</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50/60 border border-black/[0.03]">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-black/[0.04] text-neutral-600 flex items-center justify-center shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-600 block font-medium">Active Device &amp; Environment</span>
                        <span className="font-bold text-[#1d1d1f] truncate block max-w-[200px]" title={deviceInfo.device}>
                          {deviceInfo.device}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onShopClick) onShopClick();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Continue Shopping</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onLogout) onLogout();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===================== TAB 2: ORDERS ===================== */}
            {activeTab === 'orders' && (
              <motion.div
                key="tab-orders"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1d1d1f]">Order History</h3>
                    <p className="text-[11px] text-neutral-500">Track your past purchases, items &amp; delivery receipts</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/80">
                    {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                {userOrders.length === 0 ? (
                  /* Empty Orders State */
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <PackageOpen className="w-8 h-8 stroke-[1.6]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">No Orders Placed Yet</h4>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                      When you buy farm-fresh organic groceries, your orders, delivery status, and tracking will appear here in real time.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onShopClick) onShopClick();
                      }}
                      className="mt-5 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Explore Farm-Fresh Store</span>
                    </motion.button>
                  </div>
                ) : (
                  /* Orders Cards List */
                  <div className="space-y-4">
                    {userOrders.map((ord) => {
                      const itemsList = Array.isArray(ord.items) ? ord.items : [];
                      return (
                        <div
                          key={ord.id}
                          className="bg-white rounded-2xl border border-black/[0.08] p-4.5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5"
                        >
                          {/* Order Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.04]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                  #{String(ord.id).toUpperCase()}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  {ord.status || 'Confirmed'}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-400 mt-1 block">
                                Placed on {formatDateTime(ord.created_at)}
                              </span>
                            </div>

                            {/* Total Price Header Pill */}
                            <div className="text-right">
                              <span className="text-xs text-neutral-400 block font-medium">Total Paid</span>
                              <span className="text-sm sm:text-base font-extrabold text-[#1d1d1f]">
                                ₹{(Number(ord.total_amount) || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Items in this order */}
                          <div className="space-y-2">
                            {itemsList.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-neutral-50/70 border border-black/[0.02]"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-10 h-10 object-cover rounded-lg border border-black/[0.06] shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <p className="font-bold text-[#1d1d1f] truncate">{item.name}</p>
                                    <p className="text-[10px] text-neutral-400">
                                      {item.size || 'Standard'} • Qty: {item.quantity}
                                    </p>
                                  </div>
                                </div>

                                <span className="font-extrabold text-[#1d1d1f] shrink-0">
                                  ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Footer: Payment & Re-order */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/[0.04] text-xs">
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                              <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{ord.payment_method || 'YouPI-PG (UPI)'}</span>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">{ord.shipping_address || 'Express Home Delivery'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleReorder(ord)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Re-order Items</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
