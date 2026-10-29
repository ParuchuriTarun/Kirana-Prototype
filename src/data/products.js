// Store data with premium, rich color schemes and authentic artisanal grocery items

export const HERO_SLIDES = [
  {
    id: 'slide-1',
    title: 'Farm Fresh Organic Harvest',
    subtitle: 'Direct from heritage organic farms. Hand-picked at dawn & cold-delivered in 15 mins.',
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
    subtitle: 'A2 Vedic cow milk, cultured Greek yogurts & organic farm butter.',
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
    subtitle: 'Pure Valencia orange juice, artisanal single-origin teas & Coorg coffee.',
    badge: 'ZERO PRESERVATIVES',
    ctaText: 'View Beverages',
    ctaLink: '#/shop',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=1600&q=80',
    alt: 'Cold Pressed Juices & Beverages',
    active: true,
    order: 4
  }
];

export const CURATED_DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Organic A2 Gir Cow Vedic Milk',
    category: 'Beverages',
    price: 115,
    originalPrice: 145,
    discount: '20% OFF',
    rating: 4.9,
    ratingCount: 382,
    size: '1000ml Bottle',
    badgeText: 'Farm Direct',
    inStock: true,
    stock: 24,
    description: 'Fresh whole Vedic A2 milk sourced from grass-fed Gir cows. Non-homogenized, chilled immediately at 4°C for peak freshness and natural cream layer.',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    tags: ['Organic', 'Cold Chain', 'Bestseller']
  },
  {
    id: 'prod-2',
    name: 'Artisanal Sourdough Country Loaf',
    category: 'Groceries',
    price: 149,
    originalPrice: 199,
    discount: '25% OFF',
    rating: 4.8,
    ratingCount: 249,
    size: '450g Loaf',
    badgeText: 'Baked Today',
    inStock: true,
    stock: 16,
    description: '36-hour slow fermented sourdough crafted with stone-ground heirloom grains. Golden blistered crust with an airy, pillowy open crumb.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    tags: ['Artisanal', 'Zero Maida', 'Daily Bake']
  },
  {
    id: 'prod-3',
    name: 'Fresh Hass Avocados (Twin Pack)',
    category: 'Groceries',
    price: 189,
    originalPrice: 249,
    discount: '24% OFF',
    rating: 4.9,
    ratingCount: 512,
    size: '2 Units (~400g)',
    badgeText: 'Ripe & Ready',
    inStock: true,
    stock: 30,
    description: 'Creamy Hass avocados ripened to buttery perfection. Rich in heart-healthy monounsaturated fats, dietary fiber, and potassium.',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
    tags: ['Fresh', 'Superfood', 'Express']
  },
  {
    id: 'prod-4',
    name: 'Cold-Pressed Virgin Coconut Oil',
    category: 'Groceries',
    price: 265,
    originalPrice: 320,
    discount: '17% OFF',
    rating: 4.9,
    ratingCount: 194,
    size: '500ml Glass Jar',
    badgeText: 'Wood Pressed',
    inStock: true,
    stock: 20,
    description: 'Extracted from freshly harvested organic coconuts using traditional wooden chekku cold pressing. Zero heat treatment, zero chemicals.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    tags: ['Raw', 'Keto', 'Single Origin']
  },
  {
    id: 'prod-5',
    name: 'Wild Forest Raw Acacia Honey',
    category: 'Groceries',
    price: 295,
    originalPrice: 395,
    discount: '25% OFF',
    rating: 5.0,
    ratingCount: 420,
    size: '350g Glass Jar',
    badgeText: 'Unfiltered',
    inStock: true,
    stock: 18,
    description: 'Pure, raw honey collected from wild acacia blossoms in pristine forest valleys. Unpasteurized and replete with active enzymes and pollen.',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    tags: ['100% Pure', 'Immunity', 'Heritage']
  },
  {
    id: 'prod-6',
    name: 'Single-Estate Coorg Arabica Coffee',
    category: 'Beverages',
    price: 380,
    originalPrice: 450,
    discount: '15% OFF',
    rating: 4.8,
    ratingCount: 180,
    size: '250g Whole Beans',
    badgeText: 'Shade Grown',
    inStock: true,
    stock: 22,
    description: '100% Arabica beans grown under rainforest canopy in Coorg. Roasted in small batches with notes of dark cacao, toasted hazelnut, and caramel.',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    tags: ['Artisanal', 'Arabica', 'Specialty']
  },
  {
    id: 'prod-7',
    name: 'Kashmiri Mammoth Walnut Kernels',
    category: 'Snacks',
    price: 349,
    originalPrice: 440,
    discount: '20% OFF',
    rating: 4.9,
    ratingCount: 310,
    size: '250g Vacuum Pack',
    badgeText: 'Snow Fed',
    inStock: true,
    stock: 25,
    description: 'Hand-cracked jumbo walnut halves harvested from high-altitude Kashmiri orchards. Naturally sweet, buttery crunch packed with Omega-3s.',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80',
    tags: ['Premium', 'Kashmiri', 'Heart Health']
  },
  {
    id: 'prod-8',
    name: 'Himachal Royal Gala Crisp Apples',
    category: 'Groceries',
    price: 165,
    originalPrice: 210,
    discount: '21% OFF',
    rating: 4.7,
    ratingCount: 275,
    size: '4 Units (~600g)',
    badgeText: 'Tree Ripened',
    inStock: true,
    stock: 28,
    description: 'Sun-kissed Gala apples from high-altitude Kinnaur valley orchards. Unwaxed, super juicy with a floral aroma and crisp snap.',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    tags: ['Farm Fresh', 'No Wax', 'Crisp']
  },
  {
    id: 'prod-9',
    name: 'Greek Style Strained Yogurt (Vanilla)',
    category: 'Beverages',
    price: 125,
    originalPrice: 150,
    discount: '16% OFF',
    rating: 4.9,
    ratingCount: 164,
    size: '200g Cup',
    badgeText: 'High Protein',
    inStock: true,
    stock: 14,
    description: 'Thick, velvety double-strained yogurt infused with real Madagascan vanilla pods. Packed with 12g natural dairy protein and live active cultures.',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    tags: ['High Protein', 'Gut Health', 'Probiotic']
  },
  {
    id: 'prod-10',
    name: 'Hydroponic Sweet Cherry Tomatoes',
    category: 'Groceries',
    price: 89,
    originalPrice: 120,
    discount: '25% OFF',
    rating: 4.8,
    ratingCount: 228,
    size: '250g Punnet',
    badgeText: 'Pesticide Free',
    inStock: true,
    stock: 35,
    description: 'Plump ruby red cherry tomatoes grown in clean hydroponic greenhouses. Bursting with sweet, tangy flavor perfect for fresh salads and pasta.',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    tags: ['Hydroponic', 'Pesticide Free', 'Fresh']
  }
];

export const MOST_BOUGHT_PRODUCTS = CURATED_DEFAULT_PRODUCTS.slice(0, 8);
export const ALL_PRODUCTS = CURATED_DEFAULT_PRODUCTS;

export const CATEGORIES = [
  {
    id: 'cat-groceries',
    name: 'Groceries',
    iconType: 'groceries',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900',
    iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-emerald-600/25',
    accentText: 'text-emerald-950',
    badge: 'Farm Direct',
    pillColor: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: 'cat-beverages',
    name: 'Beverages',
    iconType: 'beverages',
    bgClass: 'bg-sky-500/10 border-sky-500/20 text-sky-900',
    iconBg: 'bg-gradient-to-br from-sky-600 to-blue-500 text-white shadow-sky-600/25',
    accentText: 'text-sky-950',
    badge: 'Cold Brews',
    pillColor: 'bg-sky-100 text-sky-800'
  },
  {
    id: 'cat-snacks',
    name: 'Snacks & Bakery',
    iconType: 'snacks',
    bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-900',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25',
    accentText: 'text-amber-950',
    badge: 'Artisanal',
    pillColor: 'bg-amber-100 text-amber-800'
  },
  {
    id: 'cat-personal-care',
    name: 'Personal Care',
    iconType: 'personal-care',
    bgClass: 'bg-rose-500/10 border-rose-500/20 text-rose-900',
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-rose-500/25',
    accentText: 'text-rose-950',
    badge: 'Wellness',
    pillColor: 'bg-rose-100 text-rose-800'
  },
  {
    id: 'cat-home-care',
    name: 'Home Care',
    iconType: 'home-care',
    bgClass: 'bg-purple-500/10 border-purple-500/20 text-purple-900',
    iconBg: 'bg-gradient-to-br from-purple-600 to-indigo-500 text-white shadow-purple-600/25',
    accentText: 'text-purple-950',
    badge: 'Eco Living',
    pillColor: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'cat-more',
    name: 'Curated',
    iconType: 'more',
    bgClass: 'bg-teal-500/10 border-teal-500/20 text-teal-900',
    iconBg: 'bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-teal-600/25',
    accentText: 'text-teal-950',
    badge: 'Explore',
    pillColor: 'bg-teal-100 text-teal-800'
  }
];

export const FEATURED_OFFERS = [
  {
    id: 'offer-1',
    title: 'Golden Harvest',
    subtitle: 'Save up to 30% on heritage grains, flours & organic pantry',
    tag: 'Privilege Deal',
    tagIcon: 'crown',
    cardBg: 'from-amber-500/15 via-orange-500/5 to-white',
    borderColor: 'border-amber-300/60',
    ribbon: 'FLAT 30% OFF',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'offer-2',
    title: 'Orchard Reserve',
    subtitle: 'Crisp apples, berry punnets & greens delivered in 15 mins',
    tag: '100% Farm Fresh',
    tagIcon: 'leaf',
    cardBg: 'from-emerald-500/15 via-teal-500/5 to-white',
    borderColor: 'border-emerald-300/60',
    ribbon: 'HARVEST GOLD',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'offer-3',
    title: 'Gourmet Treats',
    subtitle: 'Handcrafted cookies, artisanal nuts & pure roasted snacks',
    tag: 'Limited Edition',
    tagIcon: 'sparkles',
    cardBg: 'from-purple-500/15 via-pink-500/5 to-white',
    borderColor: 'border-purple-300/60',
    ribbon: 'BUY 1 GET 1',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80'
  }
];

export const BENEFITS = [
  {
    id: 'benefit-1',
    title: '15-Min Express',
    subtitle: 'Chilled & temperature-controlled doorstep delivery',
    iconType: 'delivery',
    iconColor: 'from-emerald-500 to-teal-600',
    bgClass: 'bg-emerald-50/70 border-emerald-200/60'
  },
  {
    id: 'benefit-2',
    title: 'Safe & Encrypted',
    subtitle: 'Bank-grade UPI, One-Touch Cards & Cash on Delivery',
    iconType: 'security',
    iconColor: 'from-blue-500 to-indigo-600',
    bgClass: 'bg-blue-50/70 border-blue-200/60'
  },
  {
    id: 'benefit-3',
    title: '24/7 Concierge',
    subtitle: 'Instant human assistance & no-questions refunds',
    iconType: 'support',
    iconColor: 'from-amber-500 to-orange-600',
    bgClass: 'bg-amber-50/70 border-amber-200/60'
  },
  {
    id: 'benefit-4',
    title: 'Heritage Certified',
    subtitle: '100% verified farm partners & trusted pantry brands',
    iconType: 'quality',
    iconColor: 'from-purple-500 to-fuchsia-600',
    bgClass: 'bg-purple-50/70 border-purple-200/60'
  }
];
