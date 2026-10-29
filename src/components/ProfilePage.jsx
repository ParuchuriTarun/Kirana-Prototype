import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft, 
  Laptop, 
  LogOut, 
  Truck, 
  BadgeCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Shield,
  Award,
  Clock,
  CheckCircle2,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { getOrders, getCustomers, fetchCustomersFromSupabase, fetchOrdersFromSupabase } from '../data/adminStore';
import { getClientDeviceInfo, getClientNetworkInfo } from '../utils/deviceInfo';
import { supabase } from '../utils/supabase';

export default function ProfilePage({
  user,
  onLogout,
  onBackToShop,
  onOrdersClick,
  onOpenCart,
  onReplayWelcome,
  showNotice,
  cartItemsCount = 0
}) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dbCustomer, setDbCustomer] = useState(null);
  const [dbOrders, setDbOrders] = useState([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [networkLocation, setNetworkLocation] = useState('India (Active)');
  const [deviceInfo, setDeviceInfo] = useState({ device: 'Desktop / Mobile Browser' });

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch directly from real Supabase database & subscribe to Realtime changes
  useEffect(() => {
    let isMounted = true;

    const fetchDirectFromDb = async () => {
      try {
        const userEmail = (user?.email || '').toLowerCase().trim();
        const userPhone = (user?.phone || '').trim();
        const userName = (user?.name || '').trim();

        // 1. Fetch live customer profile directly from real Supabase database
        let custQuery = supabase.from('customers').select('*');
        if (userEmail) {
          custQuery = custQuery.ilike('email', userEmail);
        } else if (userPhone && userPhone !== 'N/A') {
          custQuery = custQuery.eq('phone', userPhone);
        } else if (userName) {
          custQuery = custQuery.ilike('name', userName);
        }

        const { data: custRows, error: custErr } = await custQuery.limit(1);
        if (isMounted && !custErr && custRows && custRows.length > 0) {
          setDbCustomer(custRows[0]);
        }

        // 2. Fetch live orders directly from real Supabase database
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
        console.warn('Direct database fetch in ProfilePage error:', err);
      }
    };

    fetchDirectFromDb();

    // Also populate fallback store cache
    const loadCache = () => {
      try {
        setOrders(getOrders() || []);
        setCustomers(getCustomers() || []);
      } catch (_) {}
    };
    loadCache();

    // Subscribe to real-time changes directly from Supabase
    const channel = supabase.channel(`profile_realtime_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchDirectFromDb();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDirectFromDb();
      })
      .subscribe();

    const handleUpdate = () => {
      loadCache();
      fetchDirectFromDb();
    };
    window.addEventListener('kirana_store_updated', handleUpdate);

    // Get hardware & network details
    try {
      setDeviceInfo(getClientDeviceInfo());
      getClientNetworkInfo().then((info) => {
        if (isMounted && info?.location && info.location !== 'Local Network') {
          setNetworkLocation(info.location);
        }
      }).catch(() => {});
    } catch (_) {}

    return () => {
      isMounted = false;
      window.removeEventListener('kirana_store_updated', handleUpdate);
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [user]);

  // Find customer CRM profile (real DB record takes priority)
  const cachedCustomerProfile = useMemo(() => {
    if (!user) return null;
    return customers.find((c) => {
      if (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase()) return true;
      if (user.phone && c.phone && c.phone === user.phone) return true;
      if (user.name && c.name && c.name.toLowerCase() === user.name.toLowerCase()) return true;
      return false;
    }) || null;
  }, [customers, user]);

  const customerProfile = dbCustomer || cachedCustomerProfile;

  // Filter orders (real DB orders take priority)
  const cachedUserOrders = useMemo(() => {
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

    return filtered;
  }, [orders, user]);

  const userOrders = dbOrders.length > 0 ? dbOrders : cachedUserOrders;

  // Calculate lifetime spend directly from database records
  const totalSpent = useMemo(() => {
    if (customerProfile?.totalSpent !== undefined && customerProfile?.totalSpent !== null) {
      return Number(customerProfile.totalSpent) || 0;
    }
    if (userOrders.length > 0) {
      return userOrders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0);
    }
    return 0;
  }, [userOrders, customerProfile]);

  const displayName = customerProfile?.name || user?.name || 'Valued Shopper';
  const displayEmail = customerProfile?.email || user?.email || (user?.isGuest ? 'Guest Access' : 'Not linked');
  const displayPhone = customerProfile?.phone && customerProfile.phone !== 'N/A' 
    ? customerProfile.phone 
    : (user?.phone || 'Not linked');
  const customerType = customerProfile?.type || (user?.isGuest ? 'Guest Explorer' : 'Verified Customer');
  
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
  const customerId = customerProfile?.id || (user?.userId ? 'CUST-' + String(user.userId).slice(-8).toUpperCase() : 'CUST-DB41960');

  const [copiedId, setCopiedId] = useState(false);
  const latestOrder = userOrders && userOrders.length > 0 ? userOrders[0] : null;

  const handleCopyId = () => {
    if (customerId) {
      navigator.clipboard.writeText(customerId);
      setCopiedId(true);
      if (showNotice) showNotice('Customer ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatOrderDate = (dateStr) => {
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

  return (
    <div className="w-[94%] sm:w-[96%] max-w-[1140px] mx-auto py-4 sm:py-9 space-y-4 sm:space-y-6 pb-24 sm:pb-8">
      
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-black/[0.06]">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <button
            type="button"
            onClick={onBackToShop}
            className="hover:text-emerald-800 transition-colors cursor-pointer font-medium"
          >
            Store
          </button>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Account</span>
          <span className="text-neutral-300">/</span>
          <span className="font-bold text-emerald-950">My Profile</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onBackToShop}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-xs border border-neutral-300/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neutral-600" />
          <span>Back to Shop</span>
        </motion.button>
      </div>

      {/* Main Profile Shell */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="space-y-6"
      >
        {/* ===================== HERO PROFILE BANNER ===================== */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[36px] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0f766e] p-4.5 sm:p-9 text-white shadow-[0_16px_48px_rgba(5,150,105,0.28)] border border-emerald-500/20">
          {/* Subtle decorative mesh and ambient glows */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/3 w-48 h-48 rounded-full bg-teal-300/15 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5 sm:gap-6 flex-wrap sm:flex-nowrap">
              {/* Premium Avatar with Concentric Halo & Online Indicator */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] text-emerald-800 font-black text-3xl sm:text-4xl flex items-center justify-center ring-4 ring-white/30">
                  {user?.isGuest ? '👤' : (displayName ? displayName.charAt(0).toUpperCase() : 'U')}
                </div>
                {/* Active pulsating presence dot */}
                <div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-[#064e3b] flex items-center justify-center shadow-sm"
                  title="Live Online Connection"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              {/* Identity & Metadata Details */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/25 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    {customerType}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 backdrop-blur-md text-amber-200 text-[11px] font-bold border border-amber-300/30">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Club Member
                  </span>
                </div>
                
                <p className="text-emerald-100 text-xs sm:text-sm flex items-center gap-2.5 flex-wrap font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-200/80 shrink-0" />
                    {displayEmail}
                  </span>
                  {displayPhone !== 'Not linked' && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-200/80 shrink-0" />
                        {displayPhone}
                      </span>
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/45 text-[11px] text-emerald-100 font-semibold border border-white/10 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase DB Live
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/45 text-[11px] text-emerald-200 font-medium border border-white/10">
                    <MapPin className="w-3 h-3 text-emerald-300" />
                    {deliveryLocation.split(',')[0]} Express Node
                  </span>
                  <span className="text-[11px] text-emerald-200/90 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 opacity-80" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start lg:self-center flex-wrap">
              {onReplayWelcome && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onReplayWelcome}
                  className="px-4 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md shadow-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="View the Apple iOS Welcome Screen Animation"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>iOS Welcome</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOrdersClick}
                className="px-6 py-3 rounded-full bg-white text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer border border-white/40"
              >
                <Package className="w-4 h-4 text-emerald-700" />
                <span>View Orders ({userOrders.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ===================== 4-CARD OVERVIEW QUAD-GRID ===================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Total Orders Card */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                Total Orders
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border-2 border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <span className="text-xl sm:text-3xl font-black text-neutral-900 block leading-tight tracking-tight">
                {userOrders.length}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] sm:text-xs text-neutral-600 font-semibold truncate">Lifetime purchases</span>
              </div>
            </div>
          </motion.div>

          {/* Total Spent Card */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                Total Spent
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border-2 border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <span className="text-xl sm:text-3xl font-black text-neutral-900 block leading-tight tracking-tight">
                ₹{totalSpent.toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] sm:text-xs text-emerald-700 font-semibold truncate">Verified organic savings</span>
              </div>
            </div>
          </motion.div>

          {/* Bag Status Card */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={onOpenCart}
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-emerald-800 transition-colors">
                Active Bag
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border-2 border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <span className="text-xl sm:text-3xl font-black text-neutral-900 block leading-tight tracking-tight">
                {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-xs text-emerald-700 font-semibold group-hover:text-emerald-800">
                <span>Tap to open cart</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Primary Delivery Hub Card */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                Delivery Hub
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border-2 border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <span className="text-base sm:text-2xl font-black text-neutral-900 truncate block leading-tight tracking-tight">
                {deliveryLocation.split(',')[0]}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] sm:text-xs text-emerald-700 font-semibold truncate">10-min lightning node</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ===================== LATEST ORDER LIVE SPOTLIGHT (if orders exist) ===================== */}
        {latestOrder && (
          <div className="bg-white rounded-3xl border-2 border-neutral-200/90 shadow-2xs p-6 sm:p-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-neutral-900">
                    Latest Order &bull; #{String(latestOrder.id).slice(-8).toUpperCase()}
                  </h3>
                  <span className="text-xs text-neutral-400 block">
                    Placed on {formatOrderDate(latestOrder.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  {latestOrder.status || 'Confirmed'}
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onOrdersClick}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>Track in Orders</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* 4-Step Interactive Live Delivery Tracker */}
            <div className="py-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[9.5px] sm:text-[11px] font-bold text-emerald-900 block leading-tight">1. Confirmed</span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[9.5px] sm:text-[11px] font-bold text-emerald-900 block leading-tight">2. Farm Packed</span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-emerald-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/40 animate-pulse" />
                  </div>
                  <span className="text-[9.5px] sm:text-[11px] font-bold text-emerald-900 block leading-tight">3. Out for Delivery</span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-neutral-200" />
                  <span className="text-[9.5px] sm:text-[11px] font-semibold text-neutral-400 block leading-tight">4. Delivered</span>
                </div>
              </div>
            </div>

            {/* Order Items Preview Snippet */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-neutral-800">Items:</span>
                {Array.isArray(latestOrder.items) && latestOrder.items.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-medium">
                    {item.name} &bull; Qty {item.quantity}
                  </span>
                ))}
                {Array.isArray(latestOrder.items) && latestOrder.items.length > 3 && (
                  <span className="text-neutral-400">+{latestOrder.items.length - 3} more</span>
                )}
              </div>
              <span className="font-black text-neutral-900 text-sm">
                Total Paid: ₹{Number(latestOrder.total_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* ===================== KIRANA HERITAGE PRIVILEGES ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100 flex items-start gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-neutral-900">10-Min Speed Route</h4>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 leading-snug">
                Prioritized dispatch from your nearest Kothapet dark store node
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100 flex items-start gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-neutral-900">100% Organic Direct</h4>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 leading-snug">
                Verified heritage origin with certified pesticide-free guarantee
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100 flex items-start gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-neutral-900">Cloud Bank-Grade Auth</h4>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 leading-snug">
                Secured by Supabase Postgres Realtime &amp; encrypted sessions
              </p>
            </div>
          </div>
        </div>

        {/* ===================== DETAILED ACCOUNT & SECURITY CREDENTIALS ===================== */}
        <div className="bg-white rounded-[22px] sm:rounded-3xl border-2 border-neutral-200/90 p-4 sm:p-8 shadow-2xs space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 pb-3 sm:pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <BadgeCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight">
                  Verified Account &amp; Security Credentials
                </h2>
                <p className="text-[11px] text-neutral-400">Authenticated user details stored in Supabase Cloud</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync
              </span>

              {/* Copyable Customer ID Badge */}
              <button
                type="button"
                onClick={handleCopyId}
                className="group flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-[11px] font-mono font-bold transition-all cursor-pointer border border-neutral-200"
                title="Click to copy Customer ID"
              >
                <span>ID: {customerId}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 text-xs">
            {/* Registered Email */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white shadow-2xs border border-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-500 block font-bold uppercase tracking-wider">Registered Email</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-extrabold">Verified</span>
                </div>
                <span className="font-bold text-[#1d1d1f] text-xs sm:text-sm break-all mt-0.5 block">{displayEmail}</span>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white shadow-2xs border border-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-500 block font-bold uppercase tracking-wider">Phone Number</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-extrabold">Active</span>
                </div>
                <span className="font-bold text-[#1d1d1f] text-xs sm:text-sm mt-0.5 block">{displayPhone}</span>
              </div>
            </div>

            {/* Default Delivery Address */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white shadow-2xs border border-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-500 block font-bold uppercase tracking-wider">Default Delivery Hub</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-extrabold">Primary Node</span>
                </div>
                <span className="font-bold text-[#1d1d1f] text-xs sm:text-sm mt-0.5 block">{deliveryLocation} &bull; Express Local</span>
              </div>
            </div>

            {/* Active Device & Environment */}
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white shadow-2xs border border-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                <Laptop className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-500 block font-bold uppercase tracking-wider">Active Device &amp; Session</span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[9px] sm:text-[10px] font-extrabold">Online</span>
                </div>
                <span className="font-bold text-[#1d1d1f] text-xs sm:text-sm truncate block mt-0.5" title={deviceInfo.device}>
                  {deviceInfo.device}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== ACTION CONTROLS FOOTER ===================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-200/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onBackToShop}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-full text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onOrdersClick}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-full text-xs font-black text-neutral-800 bg-white hover:bg-neutral-50 border-2 border-neutral-300/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-700" />
              <span>Order History</span>
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-full text-xs font-bold text-rose-600 hover:text-white bg-rose-50/80 hover:bg-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-200/80"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
