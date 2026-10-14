/**
 * FoodExpress API helpers.
 * Every panel + the admin shell resolves branding and media through these.
 * Media URLs are built from the Strapi upload `url` field, prefixed with the
 * configured API base so they resolve correctly in dev and in deployment.
 */

import { API, API_URL } from '../config'
import type {
  AppSetting,
  Cuisine,
  Zone,
  Restaurant,
  MenuCategory,
  MenuItem,
  Order,
  Address,
  Review,
  Coupon,
  Banner,
  Rider,
  Ticket,
  Notification,
  Page,
  FoodExpressUser,
} from '../types'

/** Empty-ish brand object for the initial paint before /api/app-setting loads. */
export const EMPTY_BRAND: AppSetting = {
  id: 0,
  documentId: '',
  siteName: 'FoodExpress',
  tagline: 'Fast • Fresh • For You',
  primaryColor: '#D70F64',
  accentColor: '#FF2B85',
  currency: 'BDT',
  currencySymbol: '৳',
  announcement: '',
  heroTitle: 'What are you craving today?',
  heroSubtitle: 'Order food from the best restaurants in Brahmanbaria',
  contactEmail: 'hello@foodexpress.com',
  contactPhone: '+880 1700-000000',
  addressLine: 'Brahmanbaria, Bangladesh',
  defaultDeliveryFee: 40,
  freeDeliveryThreshold: 500,
  taxRate: 5,
  commissionRate: 15,
  footerText: 'FoodExpress — Fast • Fresh • For You',
  logo: undefined,
  favicon: undefined,
}

/**
 * Build a full media URL from a Strapi upload object.
 * Strapi's `url` is already absolute in this environment (http://localhost:1337/uploads/...),
 * so we return it as-is; otherwise we prefix with API_URL.
 */
export function mediaUrl(file: { url: string } | undefined): string {
  if (!file) return ''
  const raw = file.url.trim()
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `${API_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

/**
 * Resolve the FoodExpress logo URL for the current brand.
 * Prefer the uploaded logo from app-setting; fall back to the bundled
 * FoodExpress artwork (also served as favicon).
 */
export function brandLogoUrl(brand: AppSetting): string {
  return mediaUrl(brand.logo) || '/favicon.png'
}

/**
 * Resolve the FoodExpress favicon URL for the current brand.
 * Prefer the uploaded favicon from app-setting; fall back to bundled.
 */
export function brandFaviconUrl(brand: AppSetting): string {
  return mediaUrl(brand.favicon) || '/favicon.png'
}

/** Typed fetch helpers returning the Strapi `data` array shape. */
export async function fetchCuisines(opts?: {
  populate?: string
  fields?: string
  filters?: string
  page?: number
  pageSize?: number
  sort?: string
}): Promise<{ data: Cuisine[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.populate) q.set('populate', opts.populate)
  if (opts?.fields) q.set('fields', opts.fields)
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  if (opts?.sort) q.set('sort', opts.sort)
  const qs = q.toString()
  const res = await API.get(`/cuisines${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Failed to load cuisines: ${res.status}`)
  return res.json()
}

export async function fetchZones(): Promise<{ data: Zone[]; meta: any }> {
  const res = await API.get('/zones?fields=name,city,color,deliveryFee,minOrder,isActive,polygon,centerLat,centerLng&populate=zones')
  if (!res.ok) throw new Error(`Failed to load zones: ${res.status}`)
  return res.json()
}

export async function fetchRestaurants(opts?: {
  populate?: string
  fields?: string
  filters?: string
  page?: number
  pageSize?: number
  sort?: string
  locale?: string
}): Promise<{ data: Restaurant[]; meta: any }> {
  const q = new URLSearchParams()
  q.set('populate', opts?.populate ?? 'logo,cover,cuisines,owner,zone')
  if (opts?.fields) q.set('fields', opts.fields)
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  if (opts?.sort) q.set('sort', opts.sort)
  const qs = q.toString()
  const res = await API.get(`/restaurants${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Failed to load restaurants: ${res.status}`)
  return res.json()
}

export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const res = await API.get(`/restaurants?filters[slug]=${encodeURIComponent(slug)}&populate=logo,cover,cuisines,owner,zone,menuCategories,menuItems,menuCategories.menuItems&fields=name,slug,tagline,description,phone,email,address,city,lat,lng,deliveryFee,minOrder,deliveryTimeMin,deliveryTimeMax,isOpen,isFeatured,rating,ratingCount,isApproved,openingHours`)
  if (!res.ok) throw new Error(`Failed to load restaurant: ${res.status}`)
  const json = await res.json()
  return (json.data?.[0] ?? null) as Restaurant | null
}

export async function fetchMenuCategoriesForRestaurant(
  restaurantDocumentId: string,
): Promise<{ data: MenuCategory[]; meta: any }> {
  const res = await API.get(
    `/menu-categories?filters[restaurant][documentId]=${encodeURIComponent(restaurantDocumentId)}&populate=restaurant&sort=sortOrder`,
  )
  if (!res.ok) throw new Error(`Failed to load menu categories: ${res.status}`)
  return res.json()
}

export async function fetchMenuItemsForCategory(
  categoryDocumentId: string,
): Promise<{ data: MenuItem[]; meta: any }> {
  const res = await API.get(
    `/menu-items?filters[category][documentId]=${encodeURIComponent(categoryDocumentId)}&populate=category,restaurant,image&sort=sortOrder&fields=name,description,price,comparePrice,image,isAvailable,isVegetarian,isSpicy,prepTime`,
  )
  if (!res.ok) throw new Error(`Failed to load menu items: ${res.status}`)
  return res.json()
}

export async function fetchOrder(orderDocumentId: string, token: string): Promise<Order | null> {
  const res = await API.get(`/orders/${orderDocumentId}?populate=restaurant,rider,customer`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load order: ${res.status}`)
  const json = await res.json()
  return (json.data?.[0] ?? null) as Order | null
}

export async function fetchOrdersForCurrentUser(token: string, opts?: { page?: number; pageSize?: number; sort?: string }): Promise<{ data: Order[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  if (opts?.sort) q.set('sort', opts.sort)
  const qs = q.toString()
  const res = await API.get(`/orders${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`)
  return res.json()
}

export async function fetchAddressesForCurrentUser(token: string): Promise<{ data: Address[]; meta: any }> {
  const res = await API.get('/addresses?sort=createdAt:desc', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load addresses: ${res.status}`)
  return res.json()
}

export async function createAddress(token: string, body: Partial<Address>): Promise<Address> {
  const res = await API.post('/addresses', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to save address: ${res.status}`)
  return (await res.json()).data as Address
}

export async function updateAddress(token: string, documentId: string, body: Partial<Address>): Promise<Address> {
  const res = await API.put(`/addresses/${encodeURIComponent(documentId)}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to update address: ${res.status}`)
  return (await res.json()).data as Address
}

export async function deleteAddress(token: string, documentId: string): Promise<void> {
  const res = await API.del(`/addresses/${encodeURIComponent(documentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to delete address: ${res.status}`)
}

export async function fetchReviewsForRestaurant(
  restaurantDocumentId: string,
): Promise<{ data: Review[]; meta: any }> {
  const res = await API.get(
    `/reviews?filters[restaurant][documentId]=${encodeURIComponent(restaurantDocumentId)}&filters[isApproved]=true&sort=createdAt:desc&pagination[pageSize]=20`,
  )
  if (!res.ok) throw new Error(`Failed to load reviews: ${res.status}`)
  return res.json()
}

export async function submitReview(
  token: string,
  restaurantDocumentId: string,
  rating: number,
  comment?: string,
): Promise<Review> {
  const res = await API.post('/reviews', { restaurant: restaurantDocumentId, rating, comment }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`)
  return (await res.json()).data as Review
}

export async function fetchCoupons(opts?: { page?: number; pageSize?: number }): Promise<{ data: Coupon[]; meta: any }> {
  const q = new URLSearchParams()
  q.set('filters[isActive]', 'true')
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  const qs = q.toString()
  const res = await API.get(`/coupons${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Failed to load coupons: ${res.status}`)
  return res.json()
}

export async function validateCoupon(token: string, code: string, subtotal: number, restaurantDocumentId?: string): Promise<any> {
  const res = await API.post('/coupons/validate', { code, subtotal, restaurant: restaurantDocumentId }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || `Invalid coupon`)
  }
  return res.json()
}

export async function fetchBanners(): Promise<{ data: Banner[]; meta: any }> {
  const res = await API.get('/banners?filters[isActive]=true&sort=sortOrder&populate=image&fields=title,subtitle,link,colorFrom,colorTo,image,isActive,sortOrder')
  if (!res.ok) throw new Error(`Failed to load banners: ${res.status}`)
  return res.json()
}

export async function fetchPages(): Promise<{ data: Page[]; meta: any }> {
  const res = await API.get('/pages?filters[isPublished]=true&sort=title&populate=layout')
  if (!res.ok) throw new Error(`Failed to load pages: ${res.status}`)
  return res.json()
}

export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  const res = await API.get(`/pages?filters[slug]=${encodeURIComponent(slug)}&filters[isPublished]=true&populate=layout&fields=title,slug,layout,isPublished,seoTitle,seoDescription`)
  if (!res.ok) throw new Error(`Failed to load page: ${res.status}`)
  const json = await res.json()
  return (json.data?.[0] ?? null) as Page | null
}

export async function fetchRiders(opts?: { page?: number; pageSize?: number; filters?: string }): Promise<{ data: Rider[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  const qs = q.toString()
  const res = await API.get(`/riders${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Failed to load riders: ${res.status}`)
  return res.json()
}

export async function fetchRiderBySlugOrId(idOrSlug: string, token: string): Promise<Rider | null> {
  const res = await API.get(`/riders/${encodeURIComponent(idOrSlug)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load rider: ${res.status}`)
  const json = await res.json()
  return (json.data?.[0] ?? null) as Rider | null
}

export async function updateRider(token: string, documentId: string, body: Partial<Rider>): Promise<Rider> {
  const res = await API.put(`/riders/${encodeURIComponent(documentId)}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to update rider: ${res.status}`)
  return (await res.json()).data as Rider
}

export async function createRiderProfile(token: string, body: Partial<Rider>): Promise<Rider> {
  const res = await API.post('/riders', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to create rider profile: ${res.status}`)
  return (await res.json()).data as Rider
}

export async function fetchNotificationsForCurrentUser(token: string): Promise<{ data: Notification[]; meta: any }> {
  const res = await API.get('/notifications?sort=createdAt:desc&pagination[pageSize]=50', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load notifications: ${res.status}`)
  return res.json()
}

export async function markNotificationRead(token: string, documentId: string): Promise<void> {
  const res = await API.put(`/notifications/${encodeURIComponent(documentId)}`, { isRead: true }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to mark notification: ${res.status}`)
}

export async function fetchTicketsForCurrentUser(token: string): Promise<{ data: Ticket[]; meta: any }> {
  const res = await API.get('/tickets?sort=createdAt:desc&populate=user', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load tickets: ${res.status}`)
  return res.json()
}

export async function fetchTicket(token: string, documentId: string): Promise<Ticket | null> {
  const res = await API.get(`/tickets/${encodeURIComponent(documentId)}?populate=user`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load ticket: ${res.status}`)
  const json = await res.json()
  return (json.data?.[0] ?? null) as Ticket | null
}

export async function createTicket(token: string, body: { subject: string; message: string; type?: string }): Promise<Ticket> {
  const res = await API.post('/tickets', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to create ticket: ${res.status}`)
  return (await res.json()).data as Ticket
}

export async function replyToTicket(token: string, documentId: string, message: string): Promise<Ticket> {
  const res = await API.put(`/tickets/${encodeURIComponent(documentId)}`, { replies: [{ message, by: 'customer' }] }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to reply to ticket: ${res.status}`)
  return (await res.json()).data as Ticket
}

export async function fetchBrand(): Promise<AppSetting> {
  const res = await API.get('/app-setting')
  if (!res.ok) throw new Error(`Failed to load brand: ${res.status}`)
  const json = await res.json()
  return (json.data ?? EMPTY_BRAND) as AppSetting
}

export async function updateBrand(token: string, body: Partial<AppSetting>): Promise<AppSetting> {
  const res = await API.put('/app-setting', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to update brand: ${res.status}`)
  return (await res.json()).data as AppSetting
}

export async function uploadMedia(token: string, form: FormData): Promise<any> {
  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Failed to upload media: ${res.status}`)
  return res.json()
}

/** FoodExpress order — mutate status through the state machine. */
export async function changeOrderStatus(
  token: string,
  orderDocumentId: string,
  status: string,
  note?: string,
): Promise<Order> {
  const res = await API.post(`/orders/${encodeURIComponent(orderDocumentId)}/status`, { status, note }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || `Cannot set status to ${status}`)
  }
  return (await res.json()).data as Order
}

/** Stats for the logged-in panel (admin / restaurant / rider / customer). */
export async function fetchStats(token: string, scope?: string): Promise<any> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : ''
  const res = await API.get(`/orders/stats${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load stats: ${res.status}`)
  return res.json()
}

/** Place a new order (checkout). */
export async function placeOrder(
  token: string,
  body: {
    restaurant?: string
    items: { menuItemId: string; qty: number; note?: string }[]
    deliveryAddress: {
      label: string
      line: string
      lat: number
      lng: number
      note?: string
    }
    customerNote?: string
    couponCode?: string
    paymentMethod?: 'cod' | 'card'
  },
): Promise<Order> {
  const res = await API.post('/orders', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || `Order failed`)
  }
  return (await res.json()).data as Order
}

/** List restaurant orders (restaurant partner or admin). */
export async function fetchRestaurantOrders(
  token: string,
  restaurantDocumentId: string,
  opts?: { page?: number; pageSize?: number; sort?: string },
): Promise<{ data: Order[]; meta: any }> {
  const q = new URLSearchParams()
  q.set('filters[restaurant][documentId]', restaurantDocumentId)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  if (opts?.sort) q.set('sort', opts.sort)
  const qs = q.toString()
  const res = await API.get(`/orders${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load restaurant orders: ${res.status}`)
  return res.json()
}

/** List rider orders (assigned + ready-for-pickup). */
export async function fetchRiderOrders(
  token: string,
  riderDocumentId: string,
  opts?: { page?: number; pageSize?: number; sort?: string },
): Promise<{ data: Order[]; meta: any }> {
  const q = new URLSearchParams()
  q.set('filters[$or][0][rider][documentId]', riderDocumentId)
  q.set('filters[$or][1][status]', 'ready')
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  if (opts?.sort) q.set('sort', opts.sort)
  const qs = q.toString()
  const res = await API.get(`/orders${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load rider orders: ${res.status}`)
  return res.json()
}

/** Create a new restaurant (restaurant partner onboarding). */
export async function createRestaurant(
  token: string,
  body: Partial<Restaurant>,
): Promise<Restaurant> {
  const res = await API.post('/restaurants', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Restaurant not created')
  }
  return (await res.json()).data as Restaurant
}

/** Update restaurant (partner self-edit or admin). */
export async function updateRestaurant(
  token: string,
  documentId: string,
  body: Partial<Restaurant>,
): Promise<Restaurant> {
  const res = await API.put(`/restaurants/${encodeURIComponent(documentId)}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Restaurant not updated')
  }
  return (await res.json()).data as Restaurant
}

/** Approve / feature / activate a restaurant (admin only). */
export async function updateRestaurantAdmin(
  token: string,
  documentId: string,
  body: Partial<Restaurant>,
): Promise<Restaurant> {
  return updateRestaurant(token, documentId, body)
}

/** Create menu category (partner self-edit or admin). */
export async function createMenuCategory(
  token: string,
  restaurantDocumentId: string,
  body: Partial<MenuCategory>,
): Promise<MenuCategory> {
  const res = await API.post('/menu-categories', { ...body, restaurant: restaurantDocumentId }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Category not created')
  }
  return (await res.json()).data as MenuCategory
}

/** Update menu category. */
export async function updateMenuCategory(
  token: string,
  documentId: string,
  body: Partial<MenuCategory>,
): Promise<MenuCategory> {
  const res = await API.put(`/menu-categories/${encodeURIComponent(documentId)}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Category not updated')
  }
  return (await res.json()).data as MenuCategory
}

/** Delete menu category (soft — returns the deleted row). */
export async function deleteMenuCategory(token: string, documentId: string): Promise<void> {
  const res = await API.del(`/menu-categories/${encodeURIComponent(documentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to delete category: ${res.status}`)
}

/** Create menu item (partner or admin). */
export async function createMenuItem(
  token: string,
  restaurantDocumentId: string,
  categoryDocumentId: string,
  body: Partial<MenuItem>,
): Promise<MenuItem> {
  const res = await API.post('/menu-items', {
    ...body,
    restaurant: restaurantDocumentId,
    category: categoryDocumentId,
  }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Item not created')
  }
  return (await res.json()).data as MenuItem
}

/** Update menu item. */
export async function updateMenuItem(
  token: string,
  documentId: string,
  body: Partial<MenuItem>,
): Promise<MenuItem> {
  const res = await API.put(`/menu-items/${encodeURIComponent(documentId)}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Item not updated')
  }
  return (await res.json()).data as MenuItem
}

/** Delete menu item. */
export async function deleteMenuItem(token: string, documentId: string): Promise<void> {
  const res = await API.del(`/menu-items/${encodeURIComponent(documentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to delete item: ${res.status}`)
}

/** Create/update a CMS page (admin only). */
export async function createOrUpdatePage(
  _token: string,
  pageDocumentId: string | null,
  body: Partial<Page>,
): Promise<Page> {
  const path = pageDocumentId ? `/pages/${encodeURIComponent(pageDocumentId)}` : '/pages'
  const method = pageDocumentId ? 'put' : 'post'
  const res = await (method === 'put' ? API.put(path, body) : API.post(path, body))
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Page not saved')
  }
  return (await res.json()).data as Page
}

/** Fetch a single admin entity by documentId (generic helper). */
export async function fetchAdminEntity<T>(
  endpoint: string,
  documentId: string,
  token: string,
  populate?: string,
  fields?: string,
): Promise<T | null> {
  const q = new URLSearchParams()
  if (populate) q.set('populate', populate)
  if (fields) q.set('fields', fields)
  const qs = q.toString()
  const res = await API.get(`/${endpoint}/${encodeURIComponent(documentId)}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load ${endpoint}: ${res.status}`)
  const json = await res.json()
  return ((json.data as T[])?.[0] ?? null) as T | null
}

/** Admin helpers — content-type management behind the custom FoodExpress admin. */

export async function fetchAdminUsers(token: string, opts?: { page?: number; pageSize?: number; filters?: string }): Promise<{ data: FoodExpressUser[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  const qs = q.toString()
  const res = await API.get(`/users${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load users: ${res.status}`)
  return res.json()
}

export async function updateAdminUser(token: string, documentId: string, body: Partial<FoodExpressUser>): Promise<FoodExpressUser> {
  const res = await API.put(`/users/${encodeURIComponent(documentId)}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'User not updated')
  }
  return (await res.json()).data as FoodExpressUser
}

export async function createAdminUser(token: string, body: { username: string; email: string; password: string; panelRole?: FoodExpressUser['panelRole'] }): Promise<FoodExpressUser> {
  const res = await API.post('/users', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'User not created')
  }
  return (await res.json()).data as FoodExpressUser
}

export async function fetchAdminCoupons(_token: string, opts?: { page?: number; pageSize?: number; filters?: string }): Promise<{ data: Coupon[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  const qs = q.toString()
  const res = await API.get(`/coupons${qs ? '?' + qs : ''}`, {})
  if (!res.ok) throw new Error(`Failed to load coupons: ${res.status}`)
  return res.json()
}

export async function createOrUpdateCoupon(_token: string, couponDocumentId: string | null, body: Partial<Coupon>): Promise<Coupon> {
  const path = couponDocumentId ? `/coupons/${encodeURIComponent(couponDocumentId)}` : '/coupons'
  const method = couponDocumentId ? 'put' : 'post'
  const res = await (method === 'put' ? API.put(path, body) : API.post(path, body))
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.message as string) || 'Coupon not saved')
  }
  return (await res.json()).data as Coupon
}

export async function fetchAdminTickets(_token: string, opts?: { page?: number; pageSize?: number; filters?: string }): Promise<{ data: Ticket[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  const qs = q.toString()
  const res = await API.get(`/tickets${qs ? '?' + qs : ''}`, {})
  if (!res.ok) throw new Error(`Failed to load tickets: ${res.status}`)
  return res.json()
}

export async function replyToAdminTicket(token: string, documentId: string, message: string): Promise<Ticket> {
  const res = await API.put(`/tickets/${encodeURIComponent(documentId)}`, { replies: [{ message, by: 'admin' }] }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to reply to ticket: ${res.status}`)
  return (await res.json()).data as Ticket
}

export async function createOrGetAppSetting(token: string, body: Partial<AppSetting>): Promise<AppSetting> {
  // app-setting is a singleton. Try GET first; if nothing exists, create it.
  let res = await API.get('/app-setting')
  if (!res.ok) throw new Error(`Failed to load app-setting: ${res.status}`)
  const json = await res.json()
  if (json.data) {
    // Update existing singleton.
    const putRes = await API.put('/app-setting', body, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!putRes.ok) throw new Error(`Failed to update app-setting: ${putRes.status}`)
    const putJson = await putRes.json()
    return (putJson.data ?? EMPTY_BRAND) as AppSetting
  }
  // Create the singleton.
  const postRes = await API.post('/app-setting', body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!postRes.ok) throw new Error(`Failed to create app-setting: ${postRes.status}`)
  const postJson = await postRes.json()
  return (postJson.data ?? EMPTY_BRAND) as AppSetting
}

export async function fetchAdminPages(_token: string, opts?: { page?: number; pageSize?: number; filters?: string }): Promise<{ data: Page[]; meta: any }> {
  const q = new URLSearchParams()
  if (opts?.filters) q.set('filters', opts.filters)
  if (opts?.page) q.set('pagination[page]', String(opts.page))
  if (opts?.pageSize) q.set('pagination[pageSize]', String(opts.pageSize))
  const qs = q.toString()
  const res = await API.get(`/pages${qs ? '?' + qs : ''}`, {})
  if (!res.ok) throw new Error(`Failed to load pages: ${res.status}`)
  return res.json()
}
