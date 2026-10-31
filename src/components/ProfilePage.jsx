import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RotateCcw,
  Pencil,
  Plus,
  Trash2,
  Bell,
  Heart,
  Gift,
  Home,
  Briefcase,
  Sliders,
  X,
  CheckCheck,
  Sparkle
} from 'lucide-react';
import { getOrders, getCustomers, saveCustomers, recordCustomer } from '../data/adminStore';
import { getClientDeviceInfo, getClientNetworkInfo } from '../utils/deviceInfo';
import { supabase } from '../utils/supabase';

const DEFAULT_SAVED_ADDRESSES = [
  {
    id: 'addr-default-1',
    label: 'Home',
    type: 'home',
    isPrimary: true,
    recipient: 'Valued Shopper',
    flat: 'Flat 402, Sri Rama Meadows',
    area: 'Green Hills Colony, Kothapet',
    city: 'Hyderabad, Telangana',
    pincode: '500035',
    phone: '+91 98765 43210'
  },
  {
    id: 'addr-default-2',
    label: 'Work / Office',
    type: 'work',
    isPrimary: false,
    recipient: 'Valued Shopper',
    flat: 'Building 12B, Mindspace IT Park',
    area: 'HITEC City, Madhapur',
    city: 'Hyderabad, Telangana',
    pincode: '500081',
    phone: '+91 98765 43210'
  }
];

const DEFAULT_PREFERENCES = {
  whatsappUpdates: true,
  ecoPackaging: true,
  digitalInvoices: true,
  coldChainAlerts: true,
  dietary: '100% Certified Organic'
};

export default function ProfilePage({
  user,
  onUpdateUser,
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

  // Interactive Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    dietary: '100% Certified Organic'
  });

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const stored = localStorage.getItem('kirana_saved_addresses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_SAVED_ADDRESSES;
  });

  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Home',
    recipient: '',
    flat: '',
    area: '',
    city: 'Hyderabad, Telangana',
    pincode: '',
    phone: '',
    isPrimary: false
  });

  // Communication & Packaging Preferences State
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem('kirana_user_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (_) {}
    return DEFAULT_PREFERENCES;
  });

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
  const displayEmail = customerProfile?.email || user?.email || (user?.isGuest ? 'guest-shopper@kirana.store' : 'Not linked');
  const displayPhone = customerProfile?.phone && customerProfile.phone !== 'N/A' 
    ? customerProfile.phone 
    : (user?.phone || '+91 98765 43210');
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

  // Primary Address
  const primaryAddress = useMemo(() => {
    return savedAddresses.find((a) => a.isPrimary) || savedAddresses[0] || null;
  }, [savedAddresses]);

  const deliveryLocation = primaryAddress 
    ? `${primaryAddress.area}, ${primaryAddress.city.split(',')[0]}`
    : (customerProfile?.location || networkLocation || 'Kothapet, Hyderabad');

  const customerId = customerProfile?.id || (user?.userId ? 'CUST-' + String(user.userId).slice(-8).toUpperCase() : 'CUST-DB41960');

  const [copiedId, setCopiedId] = useState(false);
  const latestOrder = userOrders && userOrders.length > 0 ? userOrders[0] : null;

  // Sync edit form with current profile
  const openEditProfile = () => {
    setEditForm({
      name: displayName,
      phone: displayPhone === 'Not linked' ? '' : displayPhone,
      email: displayEmail.includes('guest-shopper') ? '' : displayEmail,
      location: primaryAddress ? `${primaryAddress.flat}, ${primaryAddress.area}` : deliveryLocation,
      dietary: preferences.dietary || '100% Certified Organic'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      const newName = editForm.name.trim() || displayName;
      const newPhone = editForm.phone.trim() || displayPhone;
      const newEmail = editForm.email.trim() || displayEmail;
      const newLocation = editForm.location.trim() || deliveryLocation;
      const newDietary = editForm.dietary;

      const updatedUser = {
        ...user,
        name: newName,
        phone: newPhone,
        email: newEmail,
        location: newLocation,
        dietary: newDietary
      };

      // 1. Update parent state & localStorage
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      try {
        localStorage.setItem('kirana_current_user', JSON.stringify(updatedUser));
      } catch (_) {}

      // 2. Update preferences
      const nextPrefs = { ...preferences, dietary: newDietary };
      setPreferences(nextPrefs);
      try {
        localStorage.setItem('kirana_user_preferences', JSON.stringify(nextPrefs));
      } catch (_) {}

      // 3. Update primary address recipient
      if (primaryAddress) {
        const nextAddrs = savedAddresses.map(a => 
          a.id === primaryAddress.id ? { ...a, recipient: newName } : a
        );
        setSavedAddresses(nextAddrs);
        try {
          localStorage.setItem('kirana_saved_addresses', JSON.stringify(nextAddrs));
        } catch (_) {}
      }

      // 4. Update adminStore & Supabase customers table
      const custId = customerProfile?.id || (user?.userId ? 'cust-' + String(user.userId).slice(-8) : `cust-${Date.now()}`);
      const updatedCustomerData = {
        ...(customerProfile || {}),
        id: custId,
        name: newName,
        phone: newPhone,
        email: newEmail,
        location: newLocation,
        lastActive: 'Just now',
        status: 'Active'
      };

      const currentCustomers = getCustomers();
      const existingIdx = currentCustomers.findIndex(c => c.id === custId || (newEmail && c.email === newEmail));
      let nextCustomers;
      if (existingIdx >= 0) {
        nextCustomers = [...currentCustomers];
        nextCustomers[existingIdx] = { ...nextCustomers[existingIdx], ...updatedCustomerData };
      } else {
        nextCustomers = [updatedCustomerData, ...currentCustomers];
      }
      saveCustomers(nextCustomers);
      setDbCustomer(updatedCustomerData);

      // 5. Upsert to Supabase
      try {
        await supabase.from('customers').upsert([updatedCustomerData]);
      } catch (dbErr) {
        console.warn('Supabase profile upsert warning:', dbErr);
      }

      if (showNotice) {
        showNotice('Profile updated successfully!');
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (showNotice) {
        showNotice('Profile updated locally.');
      }
      setIsEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Set Address as Primary
  const handleSetPrimaryAddress = (id) => {
    const updated = savedAddresses.map(a => ({
      ...a,
      isPrimary: a.id === id
    }));
    setSavedAddresses(updated);
    try {
      localStorage.setItem('kirana_saved_addresses', JSON.stringify(updated));
    } catch (_) {}
    const prim = updated.find(a => a.isPrimary);
    if (prim && showNotice) {
      showNotice(`Default delivery address set to ${prim.label}`);
    }
  };

  // Delete Address
  const handleDeleteAddress = (id) => {
    if (savedAddresses.length <= 1) {
      if (showNotice) showNotice('You must keep at least one delivery address');
      return;
    }
    const filtered = savedAddresses.filter(a => a.id !== id);
    if (!filtered.some(a => a.isPrimary) && filtered.length > 0) {
      filtered[0].isPrimary = true;
    }
    setSavedAddresses(filtered);
    try {
      localStorage.setItem('kirana_saved_addresses', JSON.stringify(filtered));
    } catch (_) {}
    if (showNotice) showNotice('Address removed');
  };

  // Add Address Handler
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressForm.flat.trim() || !newAddressForm.area.trim()) {
      if (showNotice) showNotice('Please enter flat/house & area details');
      return;
    }
    const newAddr = {
      id: `addr-${Date.now()}`,
      label: newAddressForm.label || 'Home',
      type: newAddressForm.label.toLowerCase().includes('work') ? 'work' : 'home',
      isPrimary: newAddressForm.isPrimary || savedAddresses.length === 0,
      recipient: newAddressForm.recipient.trim() || displayName,
      flat: newAddressForm.flat.trim(),
      area: newAddressForm.area.trim(),
      city: newAddressForm.city.trim() || 'Hyderabad, Telangana',
      pincode: newAddressForm.pincode.trim() || '500035',
      phone: newAddressForm.phone.trim() || displayPhone
    };

    let updated = savedAddresses;
    if (newAddr.isPrimary) {
      updated = updated.map(a => ({ ...a, isPrimary: false }));
    }
    updated = [newAddr, ...updated];
    setSavedAddresses(updated);
    try {
      localStorage.setItem('kirana_saved_addresses', JSON.stringify(updated));
    } catch (_) {}
    setIsAddAddressModalOpen(false);
    setNewAddressForm({
      label: 'Home',
      recipient: '',
      flat: '',
      area: '',
      city: 'Hyderabad, Telangana',
      pincode: '',
      phone: '',
      isPrimary: false
    });
    if (showNotice) {
      showNotice('New delivery address added!');
    }
  };

  // Toggle Preferences
  const handleTogglePreference = (key) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    try {
      localStorage.setItem('kirana_user_preferences', JSON.stringify(updated));
    } catch (_) {}
    const labels = {
      whatsappUpdates: 'WhatsApp delivery alerts',
      ecoPackaging: 'Eco-friendly cloth packaging',
      digitalInvoices: 'Paperless digital invoices',
      coldChainAlerts: 'Cold-chain dispatch notifications'
    };
    if (showNotice) {
      showNotice(`${labels[key] || 'Preference'} ${updated[key] ? 'enabled' : 'disabled'}`);
    }
  };

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
    <div className="w-[94%] sm:w-[96%] max-w-[1140px] mx-auto py-3 sm:py-9 space-y-4 sm:space-y-6 pb-36 sm:pb-16 font-sans">
      
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
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-xs border border-neutral-300/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
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
        className="space-y-4 sm:space-y-6"
      >
        {/* ===================== HERO PROFILE BANNER ===================== */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[36px] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0f766e] p-4 sm:p-9 text-white shadow-[0_16px_48px_rgba(5,150,105,0.28)] border border-emerald-500/20">
          {/* Subtle decorative mesh and ambient glows */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/3 w-48 h-48 rounded-full bg-teal-300/15 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
              {/* Premium Avatar with Concentric Halo & Online Indicator */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] text-emerald-800 font-black text-2xl sm:text-4xl flex items-center justify-center ring-4 ring-white/30">
                  {user?.isGuest ? '👤' : (displayName ? displayName.charAt(0).toUpperCase() : 'U')}
                </div>
                {/* Active pulsating presence dot */}
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 ring-4 ring-[#064e3b] flex items-center justify-center shadow-sm"
                  title="Live Online Connection"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              {/* Identity & Metadata Details */}
              <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/25 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-200" />
                    {customerType}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-400/20 backdrop-blur-md text-amber-200 text-[10px] sm:text-[11px] font-bold border border-amber-300/30">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Club Member
                  </span>
                </div>
                
                <p className="text-emerald-100 text-xs sm:text-sm flex items-center gap-2 sm:gap-2.5 flex-wrap font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-200/80 shrink-0" />
                    {displayEmail}
                  </span>
                  {displayPhone && (
                    <>
                      <span className="opacity-40 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-200/80 shrink-0" />
                        {displayPhone}
                      </span>
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2 sm:gap-2.5 pt-1 sm:pt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-950/45 text-[10px] sm:text-[11px] text-emerald-100 font-semibold border border-white/10 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase DB Live
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-950/45 text-[10px] sm:text-[11px] text-emerald-200 font-medium border border-white/10">
                    <MapPin className="w-3 h-3 text-emerald-300" />
                    {deliveryLocation.split(',')[0]} Express Node
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-200/90 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 opacity-80" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full lg:w-auto justify-start lg:justify-end flex-wrap">
              {/* Edit Profile Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={openEditProfile}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 text-white font-bold text-xs sm:text-sm backdrop-blur-md shadow-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Edit your Name, Phone and Preferences"
              >
                <Pencil className="w-3.5 h-3.5 text-emerald-200" />
                <span>Edit Profile</span>
              </motion.button>

              {onReplayWelcome && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onReplayWelcome}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md shadow-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="View the Apple iOS Welcome Screen Animation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>iOS Welcome</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOrdersClick}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer border border-white/40"
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
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
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                Total Orders
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-4">
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
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                Total Spent
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-4">
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
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-emerald-800 transition-colors">
                Active Bag
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-4">
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
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 border-neutral-200/90 hover:border-emerald-500/70 shadow-2xs hover:shadow-[0_12px_32px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                Delivery Hub
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100 group-hover:border-emerald-300 group-hover:text-emerald-950 transition-all shadow-2xs">
                <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-4">
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

        {/* ===================== NEW: HERITAGE VIP CLUB & REWARD PERKS ===================== */}
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-amber-300/40 p-4 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-neutral-900">
                    Kirana Heritage VIP Club
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                    Gold Tier
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
                  You have <span className="font-black text-emerald-800">350 Kirana Coins</span> (worth ₹350 instant checkout discount)
                </p>
              </div>
            </div>

            {/* Perks tags */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-neutral-700">
              <span className="px-3 py-1 rounded-full bg-white border border-neutral-200/80 shadow-2xs flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-600" /> Free Express Delivery
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-neutral-200/80 shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Farm Priority Batch
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-neutral-200/80 shadow-2xs flex items-center gap-1.5">
                <Gift className="w-3 h-3 text-rose-500" /> 5% Organic Cashback
              </span>
            </div>
          </div>
        </div>

        {/* ===================== SAVED DELIVERY ADDRESSES SECTION ===================== */}
        <div className="bg-white rounded-[22px] sm:rounded-3xl border-2 border-neutral-200/90 p-4 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-xs sm:text-base font-bold text-neutral-900 tracking-tight">
                  Saved Delivery Addresses ({savedAddresses.length})
                </h2>
                <p className="text-[11px] text-neutral-400">Addresses used for 10-minute lightning dispatch</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setIsAddAddressModalOpen(true)}
              className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Address</span>
            </motion.button>
          </div>

          {/* Address Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {savedAddresses.map((addr) => {
              const isWork = addr.type === 'work' || addr.label.toLowerCase().includes('work') || addr.label.toLowerCase().includes('office');
              return (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                    addr.isPrimary
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                      : 'border-neutral-200/90 bg-neutral-50/50 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${addr.isPrimary ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200/80 text-neutral-700'}`}>
                          {isWork ? <Briefcase className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-extrabold text-neutral-900 text-xs sm:text-sm">
                          {addr.label}
                        </span>
                      </div>

                      {addr.isPrimary ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" /> Default
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryAddress(addr.id)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-neutral-600 space-y-0.5 pt-1">
                      <p className="font-bold text-neutral-900">{addr.recipient || displayName}</p>
                      <p className="text-neutral-700">{addr.flat}</p>
                      <p className="text-neutral-600">{addr.area}</p>
                      <p className="text-neutral-500">{addr.city} {addr.pincode && `• ${addr.pincode}`}</p>
                      {addr.phone && <p className="text-neutral-500 text-[11px]">Contact: {addr.phone}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 text-xs">
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {addr.isPrimary ? '⚡ 10-Min Fast Route Active' : 'Available for one-click checkout'}
                    </span>
                    {!addr.isPrimary && savedAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Remove Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== INTERACTIVE PREFERENCES & DIETARY ===================== */}
        <div className="bg-white rounded-[22px] sm:rounded-3xl border-2 border-neutral-200/90 p-4 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-bold text-neutral-900 tracking-tight">
                Shopping &amp; Delivery Preferences
              </h2>
              <p className="text-[11px] text-neutral-400">Tailor your express deliveries &amp; packaging to your lifestyle</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            {/* WhatsApp Updates Toggle */}
            <div 
              onClick={() => handleTogglePreference('whatsappUpdates')}
              className="p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 transition-all select-none"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-neutral-900 block text-xs sm:text-sm">
                  WhatsApp Order Tracking
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Get live GPS delivery updates &amp; runner phone number
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${preferences.whatsappUpdates ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            {/* Eco Packaging Toggle */}
            <div 
              onClick={() => handleTogglePreference('ecoPackaging')}
              className="p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 transition-all select-none"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-neutral-900 block text-xs sm:text-sm">
                  100% Cloth &amp; Paper Packaging
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Zero plastic bags; reusable organic cotton totes
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${preferences.ecoPackaging ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            {/* Paperless Digital Invoices */}
            <div 
              onClick={() => handleTogglePreference('digitalInvoices')}
              className="p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 transition-all select-none"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-neutral-900 block text-xs sm:text-sm">
                  Paperless Tax Invoices
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Instant GST invoice sent via email &amp; account history
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${preferences.digitalInvoices ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            {/* Cold Chain Dispatch Notification */}
            <div 
              onClick={() => handleTogglePreference('coldChainAlerts')}
              className="p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-300 transition-all select-none"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-neutral-900 block text-xs sm:text-sm">
                  Cold-Chain Milk &amp; Butter Alerts
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Notification 5 mins prior to cold-pack handover
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${preferences.coldChainAlerts ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ===================== LATEST ORDER LIVE SPOTLIGHT (if orders exist) ===================== */}
        {latestOrder && (
          <div className="bg-white rounded-3xl border-2 border-neutral-200/90 shadow-2xs p-5 sm:p-7 space-y-4">
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

        {/* ===================== DETAILED ACCOUNT & SECURITY CREDENTIALS ===================== */}
        <div className="bg-white rounded-[22px] sm:rounded-3xl border-2 border-neutral-200/90 p-4 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <BadgeCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-xs sm:text-base font-bold text-neutral-900 tracking-tight">
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
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white shadow-2xs border border-neutral-200 text-neutral-600 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-500 block font-bold uppercase tracking-wider">Registered Email</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-extrabold">
                    {(user?.isGoogle || user?.method === 'google') && (
                      <svg className="w-2.5 h-2.5 inline-block" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>{(user?.isGoogle || user?.method === 'google') ? 'Google Verified' : 'Verified'}</span>
                  </span>
                </div>
                <span className="font-bold text-[#1d1d1f] text-xs sm:text-sm break-all mt-0.5 block">{displayEmail}</span>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
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
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
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
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50/70 border border-neutral-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
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

      {/* ===================== INTERACTIVE EDIT PROFILE MODAL ===================== */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsEditModalOpen(false)}
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight">Edit Your Profile</h3>
                    <p className="text-[11px] text-emerald-200">Updates sync to Supabase Cloud &amp; local session</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isSaving && setIsEditModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1 text-xs">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                    placeholder="Your Full Name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 font-bold mb-1 text-xs">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1 text-xs">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                      placeholder="shopper@kirana.store"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1 text-xs">
                    Preferred Delivery Node / Hub
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                    placeholder="e.g. Kothapet Express Hub, Hyderabad"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1 text-xs">
                    Dietary &amp; Shopping Profile
                  </label>
                  <select
                    value={editForm.dietary}
                    onChange={(e) => setEditForm({ ...editForm, dietary: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50 cursor-pointer"
                  >
                    <option value="100% Certified Organic">100% Certified Organic</option>
                    <option value="Vegetarian & Pure Plant">Vegetarian &amp; Pure Plant</option>
                    <option value="Artisanal & Stone-Milled Grains">Artisanal &amp; Stone-Milled Grains</option>
                    <option value="Heritage Cold-Pressed Oils & Spices">Heritage Cold-Pressed Oils &amp; Spices</option>
                  </select>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================== INTERACTIVE ADD ADDRESS MODAL ===================== */}
      <AnimatePresence>
        {isAddAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddAddressModalOpen(false)}
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight">Add Delivery Address</h3>
                    <p className="text-[11px] text-emerald-200">Used for 10-minute lightning dark-store dispatch</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddAddress} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 font-bold mb-1 text-xs">
                      Address Label
                    </label>
                    <select
                      value={newAddressForm.label}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50 cursor-pointer"
                    >
                      <option value="Home">Home</option>
                      <option value="Work / Office">Work / Office</option>
                      <option value="Parents / Family">Parents / Family</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1 text-xs">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={newAddressForm.recipient}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                      placeholder={displayName}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1 text-xs">
                    Flat / House / Building Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.flat}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, flat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                    placeholder="e.g. Flat 304, Fortune Heights"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1 text-xs">
                    Street, Area &amp; Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.area}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                    placeholder="e.g. Near Victoria Memorial Metro, Kothapet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-700 font-bold mb-1 text-xs">
                      City, State
                    </label>
                    <input
                      type="text"
                      value={newAddressForm.city}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                      placeholder="Hyderabad, Telangana"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1 text-xs">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={newAddressForm.pincode}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-neutral-900 bg-neutral-50/50"
                      placeholder="500035"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newAddressForm.isPrimary}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300"
                  />
                  <span className="font-semibold text-neutral-800 text-xs">
                    Set as default primary delivery address
                  </span>
                </label>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsAddAddressModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Address</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
