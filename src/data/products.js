// Store data with premium, rich color schemes

export const HERO_SLIDES = [
  {
    id: 'slide-1',
    image: '', // Put your image URL or path here (e.g., 'https://...' or '/banners/banner1.jpg')
    alt: 'Slide 1',
  },
  {
    id: 'slide-2',
    image: '',
    alt: 'Slide 2',
  },
  {
    id: 'slide-3',
    image: '',
    alt: 'Slide 3',
  },
  {
    id: 'slide-4',
    image: '',
    alt: 'Slide 4',
  }
];

export const MOST_BOUGHT_PRODUCTS = [];

export const CATEGORIES = [
  {
    id: 'cat-groceries',
    name: 'Groceries',
    iconType: 'groceries',
    bgClass: 'bg-gradient-to-b from-brand-50/80 via-white to-brand-50/30 border-brand-100 hover:border-brand-300',
    iconBg: 'bg-gradient-to-br from-brand-600 via-brand-500 to-teal-400 text-white shadow-md shadow-brand-500/20',
    accentText: 'text-brand-950',
    badge: 'Farm Direct',
    pillColor: 'bg-brand-100 text-brand-700'
  },
  {
    id: 'cat-beverages',
    name: 'Beverages',
    iconType: 'beverages',
    bgClass: 'bg-gradient-to-b from-sky-50/80 via-white to-sky-50/30 border-sky-100 hover:border-sky-300',
    iconBg: 'bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white shadow-md shadow-blue-500/20',
    accentText: 'text-sky-950',
    badge: 'Cold Brews',
    pillColor: 'bg-sky-100 text-sky-700'
  },
  {
    id: 'cat-snacks',
    name: 'Snacks',
    iconType: 'snacks',
    bgClass: 'bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 border-amber-100 hover:border-amber-300',
    iconBg: 'bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-400 text-white shadow-md shadow-amber-500/20',
    accentText: 'text-amber-950',
    badge: 'Artisanal',
    pillColor: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'cat-personal-care',
    name: 'Personal Care',
    iconType: 'personal-care',
    bgClass: 'bg-gradient-to-b from-rose-50/80 via-white to-rose-50/30 border-rose-100 hover:border-rose-300',
    iconBg: 'bg-gradient-to-br from-rose-600 via-pink-500 to-fuchsia-400 text-white shadow-md shadow-rose-500/20',
    accentText: 'text-rose-950',
    badge: 'Glow Wellness',
    pillColor: 'bg-rose-100 text-rose-700'
  },
  {
    id: 'cat-home-care',
    name: 'Home Care',
    iconType: 'home-care',
    bgClass: 'bg-gradient-to-b from-violet-50/80 via-white to-violet-50/30 border-violet-100 hover:border-violet-300',
    iconBg: 'bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-400 text-white shadow-md shadow-violet-500/20',
    accentText: 'text-violet-950',
    badge: 'Eco Living',
    pillColor: 'bg-violet-100 text-violet-700'
  },
  {
    id: 'cat-more',
    name: 'More',
    iconType: 'more',
    bgClass: 'bg-gradient-to-b from-teal-50/80 via-white to-teal-50/30 border-teal-100 hover:border-teal-300',
    iconBg: 'bg-gradient-to-br from-teal-600 via-brand-500 to-cyan-400 text-white shadow-md shadow-teal-500/20',
    accentText: 'text-teal-950',
    badge: 'Curated',
    pillColor: 'bg-teal-100 text-teal-700'
  }
];

export const FEATURED_OFFERS = [
  {
    id: 'offer-1',
    title: 'Golden Harvest',
    subtitle: 'Save up to 30% on heritage grains, flours & organic staples',
    tag: 'Privilege Deal',
    tagIcon: 'crown',
    cardBg: 'bg-gradient-to-br from-amber-50/80 via-orange-50/20 to-white',
    borderColor: 'border-amber-200/90 hover:border-amber-400',
    ribbon: 'FLAT 25% OFF',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'offer-2',
    title: 'Orchard Reserve',
    subtitle: 'Crisp apples, berry punnets & greens delivered in 15 mins',
    tag: '100% Farm Fresh',
    tagIcon: 'leaf',
    cardBg: 'bg-gradient-to-br from-brand-50/80 via-teal-50/20 to-white',
    borderColor: 'border-brand-200/90 hover:border-brand-400',
    ribbon: 'HARVEST GOLD',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'offer-3',
    title: 'Gourmet Treats',
    subtitle: 'Handcrafted cookies, artisanal nuts & pure roasted snacks',
    tag: 'Limited Edition',
    tagIcon: 'sparkles',
    cardBg: 'bg-gradient-to-br from-violet-50/80 via-fuchsia-50/20 to-white',
    borderColor: 'border-violet-200/90 hover:border-violet-400',
    ribbon: 'BUY 1 GET 1',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80'
  }
];

export const BENEFITS = [
  {
    id: 'benefit-1',
    title: '15-Min Express',
    subtitle: 'Chilled & temperature-controlled doorstep delivery',
    iconType: 'delivery',
    haloClass: 'bg-gradient-to-br from-brand-500 to-teal-400 text-white shadow-lg shadow-brand-400/30',
    cardBorder: 'hover:border-brand-200'
  },
  {
    id: 'benefit-2',
    title: 'Safe & Encrypted',
    subtitle: 'Bank-grade UPI, One-Touch Cards & Cash on Delivery',
    iconType: 'security',
    haloClass: 'bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-400/30',
    cardBorder: 'hover:border-blue-200'
  },
  {
    id: 'benefit-3',
    title: '24/7 Concierge',
    subtitle: 'Instant human assistance & no-questions refunds',
    iconType: 'support',
    haloClass: 'bg-gradient-to-br from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-400/30',
    cardBorder: 'hover:border-amber-200'
  },
  {
    id: 'benefit-4',
    title: 'Heritage Certified',
    subtitle: '100% verified farm partners & trusted pantry brands',
    iconType: 'quality',
    haloClass: 'bg-gradient-to-br from-violet-500 to-purple-400 text-white shadow-lg shadow-violet-400/30',
    cardBorder: 'hover:border-violet-200'
  }
];

export const ALL_PRODUCTS = [];

