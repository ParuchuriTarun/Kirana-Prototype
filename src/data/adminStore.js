// Centralized Admin Data Store for Kirana Storefront & Management Portal
import { ALL_PRODUCTS, HERO_SLIDES as DEFAULT_SLIDES, CURATED_DEFAULT_PRODUCTS } from './products';
import { supabase } from '../utils/supabase';
import { getClientDeviceInfo, getClientNetworkInfo } from '../utils/deviceInfo';
import { broadcastRemoteLogout } from '../utils/presence';

// Storage Keys
const STORAGE_KEYS = {
  SLIDES: 'kirana_admin_hero_slides',
  PRODUCTS: 'kirana_admin_products',
  CUSTOMERS: 'kirana_admin_customers',
  SESSIONS: 'kirana_admin_sessions',
  SETTINGS: 'kirana_admin_settings',
  ORDERS: 'kirana_admin_orders'
};

// Rich default banner slides with curated high-definition visuals
export const INITIAL_HERO_SLIDES = [
  {
    id: 'slide-1',
    title: 'Farm Fresh Organic Harvest',
    subtitle: 'Direct from heritage organic farms. Hand-picked at dawn.',
    badge: '100% ORGANIC',
    ctaText: 'Explore Groceries',
    ctaLink: '#/shop',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
    alt: 'Organic Farm Harvest',
    active: true,
    order: 1
  },
  {
    id: 'slide-2',
    title: 'Artisanal Bakery & Stone-Milled Pantry',
    subtitle: 'Aged basmati grains, whole-wheat chakki flours & cold-pressed oils.',
    badge: 'COLD-CHAIN DISPATCH',
    ctaText: 'Shop Pantry',
    ctaLink: '#/shop',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80',
    alt: 'Artisanal Pantry & Bakery',
    active: true,
    order: 2
  },
  {
    id: 'slide-3',
    title: 'Pure Chilled Dairy & Morning Essentials',
    subtitle: 'A2 Vedic cow milk, cultured Greek yogurts & farm butter.',
    badge: 'DELIVERED CHILLED',
    ctaText: 'Order Dairy',
    ctaLink: '#/shop',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1600&q=80',
    alt: 'Farm Chilled Dairy',
    active: true,
    order: 3
  },
  {
    id: 'slide-4',
    title: 'Gourmet Beverages & Cold-Pressed Elixirs',
    subtitle: 'Pure Valencia orange juice, artisanal CTC teas & single-origin coffee.',
    badge: 'ZERO PRESERVATIVES',
    ctaText: 'View Beverages',
    ctaLink: '#/shop',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=1600&q=80',
    alt: 'Cold Pressed Juices & Beverages',
    active: true,
    order: 4
  }
];

// Products store (defaults to rich curated catalog, synchronized with Supabase)
export const INITIAL_PRODUCTS_WITH_STOCK = CURATED_DEFAULT_PRODUCTS;

// Customers store (defaults to empty, populated from Supabase)
export const INITIAL_CUSTOMERS = [];

// Active Sessions store
export const INITIAL_ACTIVE_SESSIONS = [];

// Helper to safely parse JSON from localStorage
function getStoredItem(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

// Helper to safely save JSON to localStorage and dispatch update event
function setStoredItem(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event so all listening components update synchronously
    window.dispatchEvent(new CustomEvent('kirana_store_updated', { detail: { key, value } }));
  } catch (err) {
    console.warn(`Error saving ${key} to localStorage:`, err);
  }
}

// ======================== API FUNCTIONS ========================

// 1. HERO SLIDES
export function getHeroSlides() {
  const items = getStoredItem(STORAGE_KEYS.SLIDES, INITIAL_HERO_SLIDES);
  return Array.isArray(items) ? items : INITIAL_HERO_SLIDES;
}

export function saveHeroSlides(slides) {
  setStoredItem(STORAGE_KEYS.SLIDES, slides);
  return slides;
}

export function addHeroSlide(newSlide) {
  const slides = getHeroSlides();
  const slideWithId = {
    id: `slide-${Date.now()}`,
    order: slides.length + 1,
    active: true,
    ...newSlide
  };
  const updated = [...slides, slideWithId];
  saveHeroSlides(updated);
  try {
    supabase.from('hero_slides').insert([slideWithId]).then(({ error }) => {
      if (error) console.warn('Supabase addHeroSlide error:', error.message);
    });
  } catch (e) {
    console.warn('Supabase not reachable:', e);
  }
  return updated;
}

export function updateHeroSlide(slideId, updates) {
  const slides = getHeroSlides();
  const updated = slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s));
  saveHeroSlides(updated);
  try {
    supabase.from('hero_slides').update(updates).eq('id', slideId).then(({ error }) => {
      if (error) console.warn('Supabase updateHeroSlide error:', error.message);
    });
  } catch (e) {
    console.warn('Supabase not reachable:', e);
  }
  return updated;
}

export function deleteHeroSlide(slideId) {
  const slides = getHeroSlides();
  const updated = slides.filter((s) => s.id !== slideId);
  saveHeroSlides(updated);
  try {
    supabase.from('hero_slides').delete().eq('id', slideId).then(({ error }) => {
      if (error) console.warn('Supabase deleteHeroSlide error:', error.message);
    });
  } catch (e) {
    console.warn('Supabase not reachable:', e);
  }
  return updated;
}

// 2. PRODUCTS
export function getProducts() {
  const items = getStoredItem(STORAGE_KEYS.PRODUCTS, null);
  // Auto-cleanse any dummy test artifacts like 'fsfdvsfgdgvc' or empty cache
  const isGarbage = Array.isArray(items) && items.some((p) => {
    const n = (p.name || '').toLowerCase();
    return n.includes('fsfd') || n.includes('gdfj') || n.includes('test product');
  });

  if (!items || !Array.isArray(items) || items.length === 0 || isGarbage) {
    setStoredItem(STORAGE_KEYS.PRODUCTS, CURATED_DEFAULT_PRODUCTS);
    return CURATED_DEFAULT_PRODUCTS;
  }
  return items;
}

export function saveProducts(products) {
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  return products;
}

export function addProduct(newProduct) {
  const products = getProducts();
  const stock = Number(newProduct.stock) || 0;
  let stockStatus = 'in_stock';
  if (stock === 0) stockStatus = 'out_of_stock';
  else if (stock <= 5) stockStatus = 'low_stock';

  const productWithId = {
    id: `prod-${Date.now()}`,
    sku: `KRN-${1000 + products.length + 1}`,
    rating: 4.8,
    reviews: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...newProduct,
    stock,
    stockStatus,
    price: Number(newProduct.price) || 0,
    originalPrice: Number(newProduct.originalPrice) || Number(newProduct.price) || 0
  };

  const updated = [productWithId, ...products];
  saveProducts(updated);
  try {
    supabase.from('products').insert([productWithId]).then(({ error }) => {
      if (error) console.warn('Supabase addProduct error:', error.message);
    });
  } catch (e) {
    console.warn('Supabase not reachable:', e);
  }
  return updated;
}

export function updateProduct(productId, updates) {
  const products = getProducts();
  let updatedProduct = null;
  const updated = products.map((p) => {
    if (p.id !== productId) return p;

    const merged = { ...p, ...updates };
    if (updates.stock !== undefined) {
      const stock = Number(updates.stock);
      merged.stock = stock;
      if (stock === 0) merged.stockStatus = 'out_of_stock';
      else if (stock <= 5) merged.stockStatus = 'low_stock';
      else merged.stockStatus = 'in_stock';
    }
    updatedProduct = merged;
    return merged;
  });
  saveProducts(updated);
  if (updatedProduct) {
    try {
      supabase.from('products').update(updatedProduct).eq('id', productId).then(({ error }) => {
        if (error) console.warn('Supabase updateProduct error:', error.message);
      });
    } catch (e) {
      console.warn('Supabase not reachable:', e);
    }
  }
  return updated;
}

export function deleteProduct(productId) {
  const products = getProducts();
  const updated = products.filter((p) => p.id !== productId);
  saveProducts(updated);
  try {
    supabase.from('products').delete().eq('id', productId).then(({ error }) => {
      if (error) console.warn('Supabase deleteProduct error:', error.message);
    });
  } catch (e) {
    console.warn('Supabase not reachable:', e);
  }
  return updated;
}

// 3. STOCK CONTROL
export function updateProductStock(productId, newStockQty) {
  const stock = Math.max(0, Number(newStockQty));
  return updateProduct(productId, { stock });
}

// Sanitization: Purge legacy hardcoded mock profiles from previous prototypes
function sanitizeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  const fakeSessionIds = ['sess-1', 'sess-2', 'sess-3', 'sess-4'];
  const fakeNames = ['Ananya Iyer', 'Rahul Verma', 'Guest Explorer (Pune)'];
  const fakeEmails = ['ananya.iyer@gmail.com', 'rahul.verma@outlook.com', 'guest-994@kirana.store'];

  return sessions.filter((s) => {
    if (!s || !s.sessionId) return false;
    if (fakeSessionIds.includes(s.sessionId)) return false;
    if (fakeNames.includes(s.userName)) return false;
    if (fakeEmails.includes(s.userEmail)) return false;
    if (s.ipAddress && s.ipAddress.includes('103.21.144.68') && s.userName === 'Tarun Sharma' && s.sessionId === 'sess-1') return false;
    return true;
  });
}

function sanitizeCustomers(customers) {
  if (!Array.isArray(customers)) return [];
  const fakeNames = ['Ananya Iyer', 'Rahul Verma', 'Guest Explorer (Pune)'];
  const fakeEmails = ['ananya.iyer@gmail.com', 'rahul.verma@outlook.com', 'guest-994@kirana.store'];

  return customers.filter((c) => {
    if (!c || !c.id) return false;
    if (fakeNames.includes(c.name)) return false;
    if (fakeEmails.includes(c.email)) return false;
    return true;
  });
}

// 4. ACTIVE SESSIONS (Real logged-in users monitoring)
export function getActiveSessions() {
  const raw = getStoredItem(STORAGE_KEYS.SESSIONS, INITIAL_ACTIVE_SESSIONS);
  const arr = Array.isArray(raw) ? raw : INITIAL_ACTIVE_SESSIONS;
  const sanitized = sanitizeSessions(arr);
  if (Array.isArray(raw) && sanitized.length !== raw.length) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sanitized));
      } catch (_) {}
    }
  }
  return sanitized;
}

export function saveActiveSessions(sessions) {
  const sanitized = sanitizeSessions(sessions);
  setStoredItem(STORAGE_KEYS.SESSIONS, sanitized);
  return sanitized;
}

export function recordUserLogin(userData) {
  const sessions = getActiveSessions();
  const deviceInfo = getClientDeviceInfo();

  const userEmail = userData.email || (userData.phone ? `${userData.phone.replace(/\D/g, '')}@mobile.kirana` : `guest-${Date.now().toString().slice(-4)}@kirana.store`);
  const userName = userData.name || (userData.isGuest ? 'Guest Shopper' : 'Shopper');
  const phone = userData.phone || 'N/A';
  
  let loginMethod = 'Email & Password';
  if (userData.method === 'mobile_otp' || userData.method === 'demo_otp') {
    loginMethod = `Mobile OTP (${phone})`;
  } else if (userData.method === 'google') {
    loginMethod = 'Google OAuth';
  } else if (userData.method === 'email_otp') {
    loginMethod = 'Email OTP';
  } else if (userData.isGuest || userData.method === 'guest') {
    loginMethod = '1-Click Guest Pass';
  }

  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newSession = {
    sessionId,
    userId: userData.email || userData.phone || `user-${Date.now()}`,
    userName,
    userEmail,
    phone,
    loginMethod,
    device: deviceInfo.device,
    ipAddress: 'Detecting network...',
    location: 'Active Connection',
    loginTime: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    isOnline: true,
    cartItemCount: 0
  };

  // Remove any stale session for the same user so only 1 active session exists
  const filtered = sessions.filter((s) => s.userEmail !== newSession.userEmail && s.sessionId !== newSession.sessionId);
  const updated = [newSession, ...filtered];
  saveActiveSessions(updated);

  // Sync to customers table
  recordCustomer({
    name: userName,
    email: userData.email || '',
    phone: userData.phone || '',
    type: userData.isGuest ? 'Guest Shopper' : 'Verified Customer',
    registeredDate: new Date().toISOString().split('T')[0]
  });

  // Query real public IP & location in background and update session
  getClientNetworkInfo().then((netInfo) => {
    if (netInfo && netInfo.display) {
      const currentSessions = getActiveSessions();
      const patched = currentSessions.map((s) => {
        if (s.sessionId === sessionId) {
          return {
            ...s,
            ipAddress: netInfo.display,
            location: netInfo.location || 'Active Connection'
          };
        }
        return s;
      });
      saveActiveSessions(patched);

      // Also sync detected location to customer profile
      if (netInfo.location && netInfo.location !== 'Local Network' && netInfo.location !== 'Active Connection') {
        const curCust = getCustomers();
        const updatedCust = curCust.map((c) => {
          if (c.email === userEmail || (phone && phone !== 'N/A' && c.phone === phone)) {
            return { ...c, location: netInfo.location };
          }
          return c;
        });
        saveCustomers(updatedCust);
      }
    }
  }).catch(() => {});

  return newSession;
}

export function recordUserLogout(user) {
  if (!user) return [];
  const sessions = getActiveSessions();

  // Remove session from active logged-in list
  const remaining = sessions.filter((s) => {
    if (user.email && s.userEmail === user.email) return false;
    if (user.phone && s.phone === user.phone) return false;
    if (user.name && s.userName === user.name) return false;
    return true;
  });

  saveActiveSessions(remaining);

  // Mark status offline in Supabase customers table
  if (user.email || user.phone) {
    try {
      const q = supabase.from('customers').update({ status: 'Offline', lastActive: 'Signed out' });
      if (user.email) q.eq('email', user.email);
      else if (user.phone) q.eq('phone', user.phone);
      q.then(() => {});
    } catch (_) {}
  }

  return remaining;
}

export function terminateSession(sessionId) {
  const sessions = getActiveSessions();
  const target = sessions.find((s) => s.sessionId === sessionId);
  const updated = sessions.filter((s) => s.sessionId !== sessionId);
  saveActiveSessions(updated);

  // If this session is the active user in the current browser, trigger remote logout
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('kirana_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (target && (u.email === target.userEmail || u.phone === target.phone || u.name === target.userName)) {
          localStorage.removeItem('kirana_current_user');
          window.dispatchEvent(new CustomEvent('kirana_remote_logout', { detail: { sessionId } }));
        }
      }
    } catch (_) {}
  }

  // Broadcast to other tabs/browsers via Supabase Realtime
  broadcastRemoteLogout(sessionId);

  return updated;
}

// 5. CUSTOMERS DATA
export function getCustomers() {
  const raw = getStoredItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  const arr = Array.isArray(raw) ? raw : INITIAL_CUSTOMERS;
  const sanitized = sanitizeCustomers(arr);
  if (Array.isArray(raw) && sanitized.length !== raw.length) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sanitized));
      } catch (_) {}
    }
  }
  return sanitized;
}

export function saveCustomers(customers) {
  const sanitized = sanitizeCustomers(customers);
  setStoredItem(STORAGE_KEYS.CUSTOMERS, sanitized);
  return sanitized;
}

export function recordCustomer(customerData) {
  const customers = getCustomers();
  const exists = customers.find(
    (c) => (c.email && c.email === customerData.email) || (c.phone && c.phone === customerData.phone)
  );

  let targetCustomer = null;
  let updated = null;

  if (exists) {
    updated = customers.map((c) => {
      if (c.id === exists.id) {
        targetCustomer = {
          ...c,
          lastActive: 'Just now',
          status: 'Active'
        };
        return targetCustomer;
      }
      return c;
    });
  } else {
    targetCustomer = {
      id: `cust-${Date.now()}`,
      name: customerData.name || 'Valued Shopper',
      email: customerData.email || (customerData.phone ? `${customerData.phone.replace(/\D/g, '')}@mobile.kirana` : 'guest@kirana.store'),
      phone: customerData.phone || 'N/A',
      location: customerData.location || 'Online Store',
      type: customerData.type || 'Registered Customer',
      avatar: customerData.avatar || '',
      totalOrders: customerData.totalOrders || 0,
      totalSpent: customerData.totalSpent || 0,
      registeredDate: customerData.registeredDate || new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      status: 'Active'
    };
    updated = [targetCustomer, ...customers];
  }

  saveCustomers(updated);
  if (targetCustomer) {
    try {
      supabase.from('customers').upsert([targetCustomer]).then(({ error }) => {
        if (error) console.warn('Supabase recordCustomer error:', error.message);
      });
    } catch (e) {
      console.warn('Supabase not reachable:', e);
    }
  }
  return updated;
}

export function deleteCustomer(customerId) {
  const customers = getCustomers();
  const updated = customers.filter((c) => c.id !== customerId);
  saveCustomers(updated);
  try {
    supabase.from('customers').delete().eq('id', customerId).then(({ error }) => {
      if (error) console.warn('Supabase deleteCustomer error:', error.message);
    });
  } catch (e) {
    console.warn('Supabase not reachable:', e);
  }
  return updated;
}

// 6. ORDERS DATA & CHECKOUT PROCESSING
export function getOrders() {
  const raw = getStoredItem(STORAGE_KEYS.ORDERS, []);
  return Array.isArray(raw) ? raw : [];
}

export function saveOrders(orders) {
  setStoredItem(STORAGE_KEYS.ORDERS, orders);
  return orders;
}

export async function createOrder(orderData) {
  const paymentMethodLabel = orderData.utr
    ? `Kirana Pay UPI (UTR: ${orderData.utr})`
    : (orderData.paymentMethod || 'Kirana Pay (UPI)');

  const newOrder = {
    id: `ord-${Date.now()}`,
    customer_name: orderData.customerName || orderData.name || 'Shopper',
    customer_phone: orderData.phone || '',
    customer_email: orderData.email || '',
    shipping_address: orderData.address || '',
    items: orderData.items || [],
    total_amount: Number(orderData.totalAmount || orderData.total || 0),
    payment_method: paymentMethodLabel,
    utr: orderData.utr || '',
    status: 'Confirmed',
    created_at: new Date().toISOString()
  };

  // Save to local cache first
  const existingOrders = getOrders();
  saveOrders([newOrder, ...existingOrders]);

  try {
    // Only send core schema columns to Supabase to prevent schema rejection
    const supabasePayload = {
      id: newOrder.id,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      customer_email: newOrder.customer_email,
      shipping_address: newOrder.shipping_address,
      items: newOrder.items,
      total_amount: newOrder.total_amount,
      payment_method: newOrder.payment_method,
      status: newOrder.status,
      created_at: newOrder.created_at
    };

    const { data, error } = await supabase.from('orders').insert([supabasePayload]).select();
    if (error) {
      console.warn('Failed to save order to Supabase:', error.message);
    }
    return { success: !error, order: data?.[0] || newOrder };
  } catch (err) {
    console.error('Error placing order in Supabase:', err);
    return { success: false, order: newOrder };
  }
}

/**
 * Process a completed cart checkout:
 * 1. Decrements stock for each purchased item
 * 2. Updates product status ('out_of_stock' when 0, 'low_stock' when <= 5)
 * 3. Persists product stock to localStorage & dispatches 'kirana_store_updated' event
 * 4. Syncs decremented stock directly to Supabase products table
 * 5. Creates and stores the order in Supabase and locally with YouPI-PG verification
 * 6. Updates customer purchase history (orders count and total spent)
 */
export async function processCheckoutOrder(
  cartItems, 
  customerInfo = null, 
  paymentMethod = 'Kirana Pay (UPI)',
  paymentDetails = {}
) {
  const items = Object.values(cartItems || {});
  if (!items.length) {
    return { success: false, error: 'Cart is empty' };
  }

  // 1. Fetch current live products
  const currentProducts = getProducts();
  const updatedProducts = [...currentProducts];
  const itemsSummaryForOrder = [];
  let itemsSubtotal = 0;
  const dbStockUpdates = [];

  for (const { product, quantity } of items) {
    const qty = Math.max(1, Number(quantity) || 1);
    const prodIdx = updatedProducts.findIndex((p) => String(p.id) === String(product.id));

    if (prodIdx !== -1) {
      const currentStock = Number(updatedProducts[prodIdx].stock) || 0;
      const newStock = Math.max(0, currentStock - qty);
      let stockStatus = 'in_stock';
      if (newStock === 0) stockStatus = 'out_of_stock';
      else if (newStock <= 5) stockStatus = 'low_stock';

      updatedProducts[prodIdx] = {
        ...updatedProducts[prodIdx],
        stock: newStock,
        stockStatus
      };

      dbStockUpdates.push({
        id: updatedProducts[prodIdx].id,
        stock: newStock,
        stockStatus
      });
    }

    const price = Number(product.price) || 0;
    itemsSubtotal += price * qty;
    itemsSummaryForOrder.push({
      id: product.id,
      name: product.name,
      price,
      quantity: qty,
      size: product.size || '',
      image: product.image || ''
    });
  }

  // 2. Immediately save locally & trigger 'kirana_store_updated' so UI responds synchronously
  saveProducts(updatedProducts);

  // 3. Asynchronously sync stock changes to Supabase products table
  try {
    for (const update of dbStockUpdates) {
      await supabase
        .from('products')
        .update({ stock: update.stock, stockStatus: update.stockStatus })
        .eq('id', update.id);
    }
  } catch (err) {
    console.warn('Failed to update product stock in Supabase:', err);
  }

  // 4. Calculate final billing with delivery & handling (10-minute zero charges active)
  const deliveryFee = 0;
  const handlingFee = 0;
  const grandTotal = itemsSubtotal + deliveryFee + handlingFee;

  const customerName = customerInfo?.name || 'Valued Shopper';
  const customerEmail = customerInfo?.email || '';
  const customerPhone = customerInfo?.phone || '';
  const customerAddress = customerInfo?.address || 'Express Home Delivery';

  // 5. Create Order record in Supabase & local cache
  const orderData = {
    customerName,
    email: customerEmail,
    phone: customerPhone,
    address: customerAddress,
    items: itemsSummaryForOrder,
    totalAmount: grandTotal,
    paymentMethod,
    utr: paymentDetails?.utr || '',
    transactionId: paymentDetails?.transactionId || ''
  };

  const orderResult = await createOrder(orderData);

  // 6. Update Customer profile CRM stats (totalOrders & totalSpent)
  if (customerEmail || customerPhone || customerName) {
    const customers = getCustomers();
    const existingCust = customers.find(
      (c) => (customerEmail && c.email === customerEmail) || (customerPhone && c.phone === customerPhone)
    );

    if (existingCust) {
      const updatedCust = {
        ...existingCust,
        totalOrders: (Number(existingCust.totalOrders) || 0) + 1,
        totalSpent: (Number(existingCust.totalSpent) || 0) + grandTotal,
        lastActive: 'Just now',
        status: 'Active'
      };
      const updatedCustomers = customers.map((c) => (c.id === existingCust.id ? updatedCust : c));
      saveCustomers(updatedCustomers);
      try {
        await supabase.from('customers').upsert([updatedCust]);
      } catch (e) {
        console.warn('Failed to update customer stats in Supabase:', e);
      }
    } else {
      recordCustomer({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        totalOrders: 1,
        totalSpent: grandTotal
      });
    }
  }

  return {
    success: true,
    order: orderResult?.order,
    updatedProducts
  };
}

// 7. SYNC DATA FROM SUPABASE CLOUD ON APP LOAD & REALTIME LISTENERS
export async function fetchCustomersFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data !== null) {
      setStoredItem(STORAGE_KEYS.CUSTOMERS, data);
      return data;
    }
  } catch (err) {
    console.warn('fetchCustomersFromSupabase error:', err);
  }
  return getCustomers();
}

export async function fetchOrdersFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data !== null) {
      setStoredItem(STORAGE_KEYS.ORDERS, data);
      return data;
    }
  } catch (err) {
    console.warn('fetchOrdersFromSupabase error:', err);
  }
  return getOrders();
}

export async function syncFromSupabase() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Sync Products
    const { data: dbProducts, error: prodErr } = await supabase.from('products').select('*');
    if (!prodErr && dbProducts !== null) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, dbProducts);
    }

    // 2. Sync Hero Slides
    const { data: dbSlides, error: slideErr } = await supabase
      .from('hero_slides')
      .select('*')
      .order('order', { ascending: true });
    if (!slideErr && dbSlides !== null) {
      setStoredItem(STORAGE_KEYS.SLIDES, dbSlides);
    }

    // 3. Sync Customers
    await fetchCustomersFromSupabase();

    // 4. Sync Orders
    await fetchOrdersFromSupabase();
  } catch (err) {
    console.warn('Initial Supabase sync skipped:', err);
  }
}

// Automatically initiate sync and subscribe to Realtime database changes
if (typeof window !== 'undefined') {
  syncFromSupabase();

  try {
    supabase
      .channel('kirana_realtime_db_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
        const fresh = await fetchCustomersFromSupabase();
        window.dispatchEvent(new CustomEvent('kirana_store_updated', { detail: { table: 'customers', data: fresh } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const fresh = await fetchOrdersFromSupabase();
        window.dispatchEvent(new CustomEvent('kirana_store_updated', { detail: { table: 'orders', data: fresh } }));
      })
      .subscribe();
  } catch (e) {
    console.warn('Supabase Realtime subscription error:', e);
  }
}

// 8. FACTORY RESET
export function resetAdminDataToDefaults() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SLIDES);
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.ORDERS);
  window.dispatchEvent(new CustomEvent('kirana_store_reset'));
}


