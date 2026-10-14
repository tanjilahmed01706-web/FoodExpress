/**
 * Shared FoodExpress types.
 * These are the canonical shapes every panel (customer, restaurant, rider,
 * admin) and the FoodExpress admin shell use when talking to the Strapi API.
 * They are kept in one place so the pipelines between panels are coherent.
 */

/** A Strapi-style upload media object. */
export interface MediaFile {
  id: number
  documentId: string
  name: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  mime?: string
  hash?: string
  ext?: string
  url: string
  formats?: Record<string, { url: string; width?: number; height?: number; quality?: number }>
}

/** The brand singleton pulled from /api/app-setting. */
export interface AppSetting {
  id: number
  documentId: string
  siteName: string
  tagline: string
  primaryColor: string
  accentColor: string
  currency: string
  currencySymbol: string
  announcement: string
  heroTitle: string
  heroSubtitle: string
  contactEmail: string
  contactPhone: string
  addressLine: string
  defaultDeliveryFee: number
  freeDeliveryThreshold: number
  taxRate: number
  commissionRate: number
  footerText: string
  logo?: MediaFile
  favicon?: MediaFile
  socials?: Record<string, string>
}

/** A FoodExpress user (from /api/auth/local or /api/users/me). */
export interface FoodExpressUser {
  id: number
  documentId: string
  username: string
  email: string
  provider: string
  confirmed: boolean
  blocked: boolean
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: MediaFile
  panelRole: 'customer' | 'restaurant' | 'rider' | 'admin'
  createdAt: string
  updatedAt: string
}

/** Cuisine. */
export interface Cuisine {
  id: number
  documentId: string
  name: string
  slug: string
  icon?: string
  description?: string
  image?: MediaFile
  sortOrder: number
}

/** Delivery zone (polygon on the map). */
export interface Zone {
  id: number
  documentId: string
  name: string
  city: string
  color: string
  deliveryFee: number
  minOrder: number
  isActive: boolean
  polygon?: number[][] | null
  centerLat: number
  centerLng: number
}

/** Restaurant (tenant). */
export interface Restaurant {
  id: number
  documentId: string
  name: string
  slug: string
  tagline?: string
  description?: string
  logo?: MediaFile
  cover?: MediaFile
  phone?: string
  email?: string
  address: string
  city: string
  lat: number
  lng: number
  cuisines?: Cuisine[]
  zone?: Zone
  openingHours?: OpeningHour[]
  isOpen: boolean
  isApproved: boolean
  isFeatured: boolean
  rating: number
  ratingCount: number
  deliveryTimeMin: number
  deliveryTimeMax: number
  deliveryFee: number
  minOrder: number
  owner?: Pick<FoodExpressUser, 'id' | 'documentId' | 'username' | 'firstName' | 'lastName' | 'phone'>
}

export interface OpeningHour {
  day: string
  open: string
  close: string
  closed: boolean
}

/** Menu category. */
export interface MenuCategory {
  id: number
  documentId: string
  name: string
  sortOrder: number
  isAvailable: boolean
  restaurant?: Pick<Restaurant, 'id' | 'documentId' | 'name'>
  restaurantId?: number
}

/** Menu item. */
export interface MenuItem {
  id: number
  documentId: string
  name: string
  description?: string
  price: number
  comparePrice?: number | null
  image?: MediaFile
  isAvailable: boolean
  isVegetarian: boolean
  isSpicy: boolean
  prepTime: number
  category?: MenuCategory
  categoryId?: number
  restaurant?: Pick<Restaurant, 'id' | 'documentId' | 'name'>
  restaurantId?: number
}

/** Order. */
export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  qty: number
  subtotal: number
  note?: string
}

export interface DeliveryAddress {
  label: string
  line: string
  lat: number
  lng: number
  note?: string
}

export interface TimelineEntry {
  status: string
  label: string
  at: string
  note?: string
}

/**
 * Order status pipeline (matches backend order state machine).
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: number
  documentId: string
  orderNumber: string
  customer?: Pick<FoodExpressUser, 'id' | 'documentId' | 'username' | 'firstName' | 'lastName' | 'phone'>
  restaurant?: Pick<Restaurant, 'id' | 'documentId' | 'name' | 'slug' | 'lat' | 'lng' | 'logo' | 'address'>
  rider?: Pick<Rider, 'id' | 'documentId' | 'name' | 'vehicleType' | 'phone' | 'isAvailable' | 'currentLat' | 'currentLng' | 'rating' | 'ratingCount'>
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  total: number
  couponCode?: string | null
  paymentMethod: 'cod' | 'card'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  status: OrderStatus
  deliveryAddress: DeliveryAddress
  customerNote?: string
  cancelReason?: string | null
  timeline: TimelineEntry[]
  riderEarning: number
  placedAt: string
  deliveredAt?: string | null
}

/** Customer saved address. */
export interface Address {
  id: number
  documentId: string
  label: string
  line: string
  note?: string
  lat?: number | null
  lng?: number | null
  isDefault: boolean
  user?: Pick<FoodExpressUser, 'id'>
}

/** Review. */
export interface Review {
  id: number
  documentId: string
  rating: number
  comment?: string
  isApproved: boolean
  restaurant?: Pick<Restaurant, 'id' | 'documentId' | 'name'>
  user?: Pick<FoodExpressUser, 'id' | 'documentId' | 'username' | 'firstName' | 'lastName'>
  createdAt: string
}

/** Coupon. */
export interface Coupon {
  id: number
  documentId: string
  code: string
  title?: string
  description?: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxDiscount?: number | null
  expiryDate?: string | null
  usageLimit: number
  usedCount: number
  isActive: boolean
  restaurant?: Pick<Restaurant, 'id' | 'documentId' | 'name'>
}

/** Banner (storefront). */
export interface Banner {
  id: number
  documentId: string
  title: string
  subtitle?: string
  link?: string
  colorFrom: string
  colorTo: string
  image?: MediaFile
  isActive: boolean
  sortOrder: number
}

/** Rider (delivery boy). */
export interface Rider {
  id: number
  documentId: string
  name: string
  phone?: string
  vehicleType: 'bicycle' | 'motorbike' | 'car'
  isAvailable: boolean
  isApproved: boolean
  currentLat: number
  currentLng: number
  rating: number
  ratingCount: number
  totalDeliveries: number
  totalEarnings: number
  zone?: Zone
  user?: Pick<FoodExpressUser, 'id' | 'documentId' | 'username' | 'firstName' | 'lastName' | 'phone'>
}

/** Support ticket. */
export interface TicketReply {
  message: string
  by: 'customer' | 'admin' | 'restaurant'
  at?: string
}

export interface Ticket {
  id: number
  documentId: string
  subject: string
  message: string
  type: 'order' | 'payment' | 'account' | 'restaurant' | 'other'
  status: 'open' | 'replied' | 'closed'
  replies: TicketReply[]
  user?: Pick<FoodExpressUser, 'id' | 'documentId' | 'username' | 'firstName' | 'lastName' | 'phone' | 'email'>
  createdAt: string
  updatedAt: string
}

/** Notification. */
export interface Notification {
  id: number
  documentId: string
  title: string
  message?: string
  link?: string
  type: 'info' | 'order' | 'promo' | 'system'
  isRead: boolean
  user?: Pick<FoodExpressUser, 'id'>
  createdAt: string
}

/** A CMS page block for the drag-and-drop page builder. */
export type PageBlock =
  | { id: string; type: 'hero'; props: HeroBlockProps }
  | { id: string; type: 'banners'; props: BannersBlockProps }
  | { id: string; type: 'categories'; props: CategoriesBlockProps }
  | { id: string; type: 'featured'; props: FeaturedBlockProps }
  | { id: string; type: 'restaurants'; props: RestaurantsBlockProps }
  | { id: string; type: 'features'; props: FeaturesBlockProps }
  | { id: string; type: 'how-it-works'; props: HowItWorksBlockProps }
  | { id: string; type: 'map'; props: MapBlockProps }
  | { id: string; type: 'cta'; props: CtaBlockProps }
  | { id: string; type: 'text'; props: TextBlockProps }
  | { id: string; type: 'faq'; props: FaqBlockProps }

export interface HeroBlockProps {
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
}
export interface BannersBlockProps {
  title: string
}
export interface CategoriesBlockProps {
  title: string
  limit: number
}
export interface FeaturedBlockProps {
  title: string
  limit: number
}
export interface RestaurantsBlockProps {
  title: string
  showFilters: boolean
}
export interface FeaturesBlockProps {
  title: string
  items: { icon: string; title: string; text: string }[]
}
export interface HowItWorksBlockProps {
  title: string
  steps: { icon: string; title: string; text: string }[]
}
export interface MapBlockProps {
  title: string
  subtitle: string
}
export interface CtaBlockProps {
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
}
export interface TextBlockProps {
  title: string
  body: string
}
export interface FaqBlockProps {
  title: string
  items: { q: string; a: string }[]
}
export interface Page {
  id: number
  documentId: string
  title: string
  slug: string
  layout: PageBlock[]
  isPublished: boolean
  seoTitle?: string
  seoDescription?: string
}

/** Admin dashboard stats. */
export interface AdminStats {
  ordersThisWeek: number
  ordersThisMonth: number
  revenueThisMonth: number
  activeRestaurants: number
  activeRiders: number
  avgDeliveryMin: number
  recentOrders: Order[]
  topRestaurants: { name: string; orderCount: number; revenue: number }[]
  statusBreakdown: { status: string; count: number }[]
}

/** Admin menu item editor shape (same as MenuItem but flat for the form). */
export interface MenuItemForm extends Omit<MenuItem, 'category' | 'categoryId' | 'restaurant' | 'restaurantId'> {
  categoryId?: string
}

/** Admin restaurant form shape. */
export interface RestaurantForm {
  name: string
  slug: string
  tagline?: string
  description?: string
  phone?: string
  email?: string
  address: string
  city: string
  lat: number
  lng: number
  deliveryFee: number
  minOrder: number
  deliveryTimeMin: number
  deliveryTimeMax: number
  isOpen: boolean
  isFeatured: boolean
  cuisines: string[]
  zoneId?: string
  logoId?: string
  coverId?: string
}
