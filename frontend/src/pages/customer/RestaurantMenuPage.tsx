import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBrand } from '../../lib/brand'
import { useCart } from '../../lib/cart'
import { fetchRestaurantBySlug, fetchMenuCategoriesForRestaurant, fetchMenuItemsForCategory } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Restaurant, MenuCategory, MenuItem } from '../../types'

export function RestaurantMenuPage() {
  const { slug } = useParams<{ slug: string }>()
  void useBrand()
  const { addLine, open: openCart } = useCart()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({})
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { navigate('/'); return }
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchRestaurantBySlug(slug),
      slug ? fetchMenuCategoriesForRestaurant(slug).then(r => r.data ?? []) : Promise.resolve([]),
    ])
      .then(([rest, cats]) => {
        if (!cancelled && rest) {
          setRestaurant(rest)
          setCategories(cats)
          setActiveCategoryId(cats[0]?.documentId ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) { setLoading(false) }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  // Load items for a category when it becomes active.
  useEffect(() => {
    if (!activeCategoryId || !slug) return
    let cancelled = false
    fetchMenuItemsForCategory(activeCategoryId).then(({ data }) => {
      if (!cancelled) setItemsByCategory((prev) => ({ ...prev, [activeCategoryId]: data }))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [activeCategoryId, slug])

  const activeItems = useMemo(() => (activeCategoryId ? itemsByCategory[activeCategoryId] ?? [] : []), [activeCategoryId, itemsByCategory])

  if (!restaurant) {
    if (loading) {
      return (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton width="100%" height={220} className="rounded-2xl mb-6" />
          <div className="space-y-3">
            <Skeleton width="60%" height={24} />
            <Skeleton width="80%" height={16} />
          </div>
        </div>
      )
    }
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p className="text-[#6B7280]">Restaurant not found.</p>
        <Link to="/" className="fe-btn fe-btn.primary mt-4 fe-btn.sm">Back to home</Link>
      </div>
    )
  }

  const logo = restaurant.logo
  const defaultEmoji = ['🍜', '🍕', '🍔', '🦐', '🍰', '☕'][Math.floor(Math.random() * 6)]

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      {/* Restaurant cover */}
      <div className="h-52 md:h-64 relative bg-gradient-to-br from-[var(--fe-primary)] to-[var(--fe-accent)] flex items-end p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-[0.10]">
          {logo ? <img src={logo.url} alt="" className="w-full h-full object-cover scale-150" /> : <div className="w-full h-full bg-white/10" />}
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to FoodExpress
        </Link>
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo.url} alt={restaurant.name} className="w-14 h-14 rounded-md object-contain bg-white/20 p-1.5 shadow-sm" />
          ) : (
            <span className="text-3xl">{defaultEmoji}</span>
          )}
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{restaurant.name}</h1>
            <p className="text-sm text-white/80">{restaurant.tagline}</p>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-white/70">
              <span>৳{restaurant.deliveryFee ?? 40} delivery</span>
              <span>৳{restaurant.minOrder ?? 150} min</span>
              <span>{restaurant.deliveryTimeMin ?? 30}–{restaurant.deliveryTimeMax ?? 45} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu header */}
      <div className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3">
            {logo ? <img src={logo.url} alt="" className="w-10 h-10 rounded object-contain bg-white p-0.5 shadow-sm" /> : <span className="text-xl">{defaultEmoji}</span>}
            <div>
              <div className="font-bold text-[#111] text-sm">{restaurant.name}</div>
              <div className="text-xs text-[#6B7280]">
                {restaurant.cuisines?.map((c) => c.name).join(' · ') ?? 'Food'} · {restaurant.rating ?? 0} ({restaurant.ratingCount ?? 0}) · {restaurant.city}
              </div>
            </div>
          </div>
          <div className={`ml-auto flex items-center gap-2 text-xs ${restaurant.isOpen ? 'text-[#12A860]' : 'text-[#E22B4A]'}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {restaurant.isOpen ? 'Open • Orders will be cooked when you check out' : 'Closed right now'}
          </div>
        </div>
      </div>

      {/* Menu scrollable area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          {/* Categories */}
          <div className="fe-chip-row mb-6 pb-4 border-b border-[#E6E6EA]">
            {categories.map((cat) => (
              <Chip
                key={cat.documentId}
                active={activeCategoryId === cat.documentId}
                onClick={() => setActiveCategoryId(cat.documentId)}
              >
                {cat.name}
              </Chip>
            ))}
          </div>

          {/* Category items */}
          {loading && categories.length === 0 ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton width="60%" height={18} />
                  {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} height={72} />)}
                </div>
              ))}
            </div>
          ) : activeItems.length === 0 ? (
            <p className="text-center text-[#6B7280] py-10">This category is empty.</p>
          ) : (
            <div className="space-y-6">
              {activeItems.map((item) => (
                <MenuItemCard key={item.documentId} item={item} onAdd={() => { addLine(item.documentId, 1); openCart() }} />
              ))}
            </div>
          )}

          {/* Addresses / note box */}
          <div className="mt-8 pt-6 border-t border-[#E6E6EA]">
            <div className="flex items-center justify-between text-sm text-[#6B7280]">
              <span>Delivery to: <span className="font-medium text-[#111]">56, Road 3, Tilpahar, Brahmanbaria</span></span>
              <Link to="/account/addresses" className="text-[#D70F64] hover:underline">Change</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  // inCart would be derived from the cart here; omitted for simplicity
  return (
    <div className="fe-card p-4 flex gap-4 items-start hover:shadow-sm transition">
      {/* Image */}
      <div className="w-20 h-20 rounded-lg bg-[#F6F6F8] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
        {item.image ? (
          <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="opacity-40 text-2xl">🍽️</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[#111] text-sm leading-snug">{item.name}</h3>
            {item.description ? <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{item.description}</p> : null}
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-[#D70F64]">৳{item.price}</span>
            {item.comparePrice ? <span className="text-xs text-[#6B7280] line-through ml-1.5">৳{item.comparePrice}</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {item.isVegetarian && <Chip>🌱 Veg</Chip>}
          {item.isSpicy && <Chip>🌶️ Spicy</Chip>}
          <Chip variant="ghost">Prep {item.prepTime} min</Chip>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex items-center border border-[#E6E6EA] rounded-full overflow-hidden bg-[#F6F6F8] w-24">
            <button className="px-2.5 h-9 text-sm font-medium text-[#6B7280] hover:bg-white hover:text-[#111] transition">−</button>
            <span className="flex-1 text-center text-sm font-medium">1</span>
            <button className="px-2.5 h-9 text-sm font-medium text-[#6B7280] hover:bg-white hover:text-[#111] transition">+</button>
          </div>
          <Button onClick={onAdd} className="flex-1">Add to cart</Button>
        </div>
      </div>
    </div>
  )
}
