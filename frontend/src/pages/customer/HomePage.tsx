import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBrand } from '../../lib/brand'
import { useCart } from '../../lib/cart'
import { FoodExpressLogo } from '../../components/ui/Logo'
import { Card } from '../../components/ui/Card'
import { Badge, Chip } from '../../components/ui/Badge'
import type { Cuisine, Restaurant, Banner } from '../../types'

export function HomePage() {
  const { brand } = useBrand()
  void useCart()
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [activeCuisine, setActiveCuisine] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchCuisines({ fields: 'name,slug,icon,description', sort: 'sortOrder' }),
      fetchRestaurants({ fields: 'name,slug,tagline,rating,deliveryFee,minOrder,deliveryTimeMin,deliveryTimeMax,isOpen,isFeatured,address,city,lat,lng,cuisines,owner', sort: 'isFeatured:desc,name:asc', pageSize: 12 }),
      fetchBanners(),
    ])
      .then(([cus, rests, bns]) => {
        if (!cancelled) {
          setCuisines(cus.data ?? [])
          setRestaurants(rests.data ?? [])
          setBanners(bns.data ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!activeCuisine) return restaurants
    return restaurants.filter((r) =>
      r.cuisines?.some((c) => c.slug === activeCuisine) ||
      r.name.toLowerCase().includes(activeCuisine.toLowerCase()),
    )
  }, [restaurants, activeCuisine])

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      {/* Hero */}
      <section className="relative bg-[#111] text-white overflow-hidden rounded-b-[3rem] px-4 md:px-8 py-16 md:py-24">
        <div className="absolute inset-0 opacity-[0.10]">
          {brand.logo ? (
            <img src={brand.logo.url} alt="" className="w-full h-full object-cover scale-150" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF2B85] to-[#D70F64]" />
          )}
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--fe-accent)] text-white text-xs font-bold tracking-wide mb-5">
            <span>{brand.siteName ?? 'FoodExpress'}</span>
            <span className="w-1 h-1 rounded-full bg-white" />
            <span>{brand.tagline ?? 'Fast • Fresh • For You'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-3 tracking-tight">
            {brand.heroTitle ?? 'What are you craving today?'}
          </h1>
          <p className="text-lg md:text-xl text-[#CCC] max-w-2xl mx-auto mb-6">
            {brand.heroSubtitle ?? 'Order food from the best restaurants in Brahmanbaria.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="fe-btn fe-btn.lg bg-white text-[#D70F64] hover:bg-[#F6F6F8] shadow-lg">
              Order now
            </Link>
            <Link to="/account/register" className="fe-btn fe-btn.lg bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#D70F64] transition">
              Partner with us
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-[var(--fe-accent)] opacity-30 blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full bg-[var(--fe-primary)] opacity-30 blur-3xl pointer-events-none" />
      </section>

      {/* Announcement bar */}
      {brand.announcement && (
        <div className="bg-[#D70F64] text-white text-sm py-2.5 px-4 text-center font-medium tracking-wide">
          {brand.announcement}
        </div>
      )}

      {/* Search / quick links */}
      <section className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-[#111] mb-3 text-center">{brand.heroTitle ?? 'Explore by cuisine'}</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {cuisines.length === 0 && !loading ? (
              <Chip>Bengali</Chip>
            ) : cuisines.map((c) => (
              <Chip
                key={c.slug}
                active={activeCuisine === c.slug}
                onClick={() => setActiveCuisine(activeCuisine === c.slug ? '' : c.slug)}
              >
                {c.icon ?? '🍽'} {c.name}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* Banners */}
      {banners.length > 0 && (
        <section className="px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {banners.map((b) => (
                <Card key={b.documentId}>
                  <div className="h-36 bg-gradient-to-br from-[var(--fe-primary)] to-[var(--fe-accent)] flex items-center justify-center text-white font-bold">
                    <span className="px-4">{b.title}</span>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm text-[#111]">{b.title}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{b.subtitle}</p>
                    {b.link && <Link to={b.link} className="fe-btn fe-btn.sm fe-btn.primary mt-3 inline-block">See offer</Link>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured restaurants */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-[#111]">{activeCuisine ? `Cuisine: ${activeCuisine}` : 'Featured restaurants'}</h2>
            <Link to="/account/register" className="text-sm text-[#D70F64] font-medium hover:underline">Partner with us</Link>
          </div>
          {loading ? (
            <div className="fe-grid-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-[#6B7280]">
              <p className="text-lg">No restaurants yet in this category.</p>
              <Link to="/account/register" className="fe-btn fe-btn.primary mt-4 fe-btn.sm inline-block">Become a partner</Link>
            </div>
          ) : (
            <div className="fe-grid-3">
              {filtered.map((r) => (
                <RestaurantCard key={r.documentId} restaurant={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why FoodExpress */}
      <section className="bg-[#111] text-white px-4 md:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-8">Why FoodExpress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Lightning fast', text: 'Average delivery in 30 minutes across Brahmanbaria.' },
              { icon: '🥗', title: 'Freshly made', text: 'Every order is cooked after you place it, never pre-made.' },
              { icon: '🛵', title: 'Live tracking', text: 'Follow your rider on the map in real time, every step.' },
              { icon: '💳', title: 'Easy payments', text: 'Cash on delivery or card — your choice, no surprises.' },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-3xl mx-auto mb-3">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-[#CCC]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#F6F6F8] px-4 md:px-8 py-12 rounded-b-[3rem]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111] text-center mb-6">How it works</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {[
              { icon: '🔎', title: 'Explore', text: 'Browse restaurants and cuisines near you.' },
              { icon: '🛒', title: 'Order', text: 'Add dishes to your cart and check out in seconds.' },
              { icon: '🛵', title: 'Track', text: 'Watch your rider approach on the live map.' },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-[var(--fe-primary)] text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <span className="text-3xl">{s.icon}</span>
                  <h3 className="font-bold text-[#111] mt-1">{s.title}</h3>
                  <p className="text-sm text-[#6B7280]">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map teaser */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#111]">We deliver across Brahmanbaria</h2>
            <p className="text-sm text-[#6B7280] max-w-md">Hover a zone to see delivery fee and minimum order.</p>
          </div>
          <div className="fe-map h-[380px]">
            <div className="w-full h-full bg-[#E8E8E8] rounded-[13px] overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="w-18 h-18 rounded-full bg-white shadow flex items-center justify-center mx-auto mb-3 relative">
                  <span className="absolute -left-1 -top-1 w-3 h-3 bg-[var(--fe-primary)] rounded-full" />
                  <span className="absolute -right-1 -top-1 w-3 h-3 bg-[var(--fe-accent)] rounded-full" />
                  <span className="absolute -left-1 bottom-1 w-3 h-3 bg-[var(--fe-info)] rounded-full" />
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--fe-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p className="text-sm text-[#6B7280]">Interactive map — OpenStreetMap + Leaflet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#D70F64] to-[#FF2B85] text-white px-4 md:px-8 py-14 rounded-b-[3rem] text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Ready to eat?</h2>
          <p className="text-lg text-white/80 mb-6">Your next favourite meal is a few taps away.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/account/register" className="fe-btn fe-btn.lg bg-white text-[#D70F64] hover:bg-[#F6F6F8] shadow-lg">
              Start ordering
            </Link>
            <Link to="/account/login" className="fe-btn fe-btn.lg bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#D70F64] transition">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E6E6EA] bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <FoodExpressLogo brand={brand} size={42} />
                <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">{brand.tagline}</p>
              <p className="text-xs text-[#6B7280] mt-2">{brand.addressLine}</p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#111] mb-3">Customers</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li><Link to="/" className="hover:text-[#D70F64] transition">Home</Link></li>
                <li><Link to="/orders" className="hover:text-[#D70F64] transition">My orders</Link></li>
                <li><Link to="/account/login" className="hover:text-[#D70F64] transition">Sign in</Link></li>
                <li><Link to="/account/register" className="hover:text-[#D70F64] transition">Join</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#111] mb-3">Partners</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li><Link to="/restaurant/partner" className="hover:text-[#D70F64] transition">Become a restaurant</Link></li>
                <li><Link to="/rider/join" className="hover:text-[#D70F64] transition">Become a rider</Link></li>
                <li><Link to="/admin" className="hover:text-[#D70F64] transition">Admin portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#E6E6EA] mt-6 pt-4 text-center text-xs text-[#6B7280]">
            {brand.footerText ?? 'FoodExpress — Fast • Fresh • For You'}
          </div>
        </div>
      </footer>
    </div>
  )
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const logo = restaurant.logo
  const defaultEmoji = ['🍜', '🍕', '🍔', '🦐', '🍰', '☕'][Math.floor(Math.random() * 6)]
  return (
    <Link to={`/r/${restaurant.slug}`} className="fe-card overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="h-36 bg-gradient-to-br from-[#F6F6F8] to-[#EAEAEA] flex items-center justify-center relative">
        {logo ? (
          <img
            src={logo.url}
            alt={restaurant.name}
            className="max-h-full max-w-full mx-auto object-contain rounded-lg"
          />
        ) : (
          <span className="text-4xl opacity-40">{defaultEmoji}</span>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="outline">{restaurant.deliveryTimeMin ?? 30}–{restaurant.deliveryTimeMax ?? 45} min</Badge>
        </div>
        {restaurant.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="success">Featured</Badge>
          </div>
        )}
        {!restaurant.isOpen && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="ghost">Closed</Badge>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-bold text-sm text-[#111] truncate">{restaurant.name}</h3>
          <span className="text-xs text-[#6B7280]">{restaurant.deliveryTimeMin ?? 30}–{restaurant.deliveryTimeMax ?? 45} min</span>
        </div>
        <p className="text-xs text-[#6B7280] mt-0.5 truncate">{restaurant.tagline ?? restaurant.cuisines?.[0]?.name ?? 'Food'}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#6B7280]">৳{restaurant.deliveryFee ?? 40} delivery · ৳{restaurant.minOrder ?? 150} min</span>
          <span className="text-xs text-[#6B7280]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D70F64] mr-1" />
            {restaurant.rating ?? 0} ({restaurant.ratingCount ?? 0})
          </span>
        </div>
      </div>
    </Link>
  )
}

import { Skeleton } from '../../components/ui/Skeleton'

async function fetchCuisines(opts?: { fields?: string; sort?: string }) {
  const params = new URLSearchParams()
  if (opts?.fields) params.set('fields', opts.fields)
  if (opts?.sort) params.set('sort', opts.sort)
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/cuisines?${params}`)
  return res.json()
}

async function fetchRestaurants(opts?: { fields?: string; sort?: string; pageSize?: number }) {
  const params = new URLSearchParams()
  if (opts?.fields) params.set('fields', opts.fields)
  if (opts?.sort) params.set('sort', opts.sort)
  if (opts?.pageSize) params.set('pagination[pageSize]', String(opts.pageSize))
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/restaurants?${params}`)
  return res.json()
}

async function fetchBanners() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/banners?filters[isActive]=true&sort=sortOrder`)
  return res.json()
}
