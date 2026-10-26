-- ==============================================================================
-- KIRANA STORE: SUPABASE DATABASE INITIALIZATION SCHEMA & SEED DATA
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard
-- 2. Click the SQL Editor icon (>_ icon on the left sidebar)
-- 3. Click "New query"
-- 4. Paste this entire script and click "Run" (or Ctrl + Enter)
-- ==============================================================================

-- 1. CLEANUP (OPTIONAL DROP EXISTING)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS hero_slides CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. PRODUCTS TABLE
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT,
  category TEXT,
  price NUMERIC NOT NULL,
  "originalPrice" NUMERIC,
  discount TEXT,
  rating NUMERIC DEFAULT 4.8,
  reviews INTEGER DEFAULT 0,
  "badgeText" TEXT,
  "badgeGradient" TEXT,
  image TEXT,
  description TEXT,
  stock INTEGER DEFAULT 20,
  "stockStatus" TEXT DEFAULT 'in_stock',
  sku TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 3. HERO SLIDES TABLE
CREATE TABLE hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  "ctaText" TEXT,
  "ctaLink" TEXT,
  image TEXT,
  alt TEXT,
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CUSTOMERS TABLE
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  type TEXT DEFAULT 'Regular',
  avatar TEXT,
  "totalOrders" INTEGER DEFAULT 0,
  "totalSpent" NUMERIC DEFAULT 0,
  "registeredDate" TEXT,
  "lastActive" TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDERS TABLE
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  shipping_address TEXT,
  items JSONB,
  total_amount NUMERIC,
  payment_method TEXT,
  status TEXT DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling public read and write access for prototyping
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on hero_slides" ON hero_slides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- 7. SEED DATA: HERO SLIDES
INSERT INTO hero_slides (id, title, subtitle, badge, "ctaText", "ctaLink", image, alt, active, "order") VALUES
('slide-1', 'Farm Fresh Organic Harvest', 'Direct from heritage organic farms. Hand-picked at dawn.', '100% ORGANIC', 'Explore Groceries', '#/shop', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80', 'Organic Farm Harvest', true, 1),
('slide-2', 'Artisanal Bakery & Stone-Milled Pantry', 'Aged basmati grains, whole-wheat chakki flours & cold-pressed oils.', 'COLD-CHAIN DISPATCH', 'Shop Pantry', '#/shop', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80', 'Artisanal Pantry & Bakery', true, 2),
('slide-3', 'Pure Chilled Dairy & Morning Essentials', 'A2 Vedic cow milk, cultured Greek yogurts & farm butter.', 'DELIVERED CHILLED', 'Order Dairy', '#/shop', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1600&q=80', 'Farm Chilled Dairy', true, 3),
('slide-4', 'Gourmet Beverages & Cold-Pressed Elixirs', 'Pure Valencia orange juice, artisanal CTC teas & single-origin coffee.', 'ZERO PRESERVATIVES', 'View Beverages', '#/shop', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=1600&q=80', 'Cold Pressed Juices & Beverages', true, 4);

-- 8. (OPTIONAL) PRODUCTS & CUSTOMERS ARE CLEAN (NO FAKE SEED DATA)
