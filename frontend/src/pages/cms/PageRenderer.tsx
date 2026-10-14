import type { Page, PageBlock } from '../../types'
import { useBrand } from '../../lib/brand'
import { Chip } from '../../components/ui/Badge'

interface Props {
  page: Page
  hasLayout?: boolean
}

export function PageRenderer({ page, hasLayout = true }: Props) {
  const { brand } = useBrand()

  if (!hasLayout) {
    // Render a single restaurant menu page as a full app page (with navbar/footer
    // provided by AppShell). This path is used by /r/:slug.
    return (
      <div className="min-h-[70vh] bg-white">
        <RestaurantCoverPage restaurantSlug={page.slug} title={page.title} />
      </div>
    )
  }

  return (
    <article className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {page.layout?.map((block) => (
        <Block key={block.id} block={block} brand={brand} />
      ))}
    </article>
  )
}

function Block({ block, brand }: { block: PageBlock; brand: any }) {
  const b = block as any
  switch (b.type) {
    case 'hero':
      return <HeroBlock block={b} brand={brand} />
    case 'banners':
      return <BannersBlock block={b} brand={brand} />
    case 'categories':
      return <CategoriesBlock block={b} brand={brand} />
    case 'featured':
      return <FeaturedBlock block={b} brand={brand} />
    case 'restaurants':
      return <RestaurantsBlock block={b} brand={brand} />
    case 'features':
      return <FeaturesBlock block={b} brand={brand} />
    case 'how-it-works':
      return <HowItWorksBlock block={b} brand={brand} />
    case 'map':
      return <MapBlock block={b} brand={brand} />
    case 'cta':
      return <CtaBlock block={b} brand={brand} />
    case 'text':
      return <TextBlock block={b} brand={brand} />
    case 'faq':
      return <FaqBlock block={b} brand={brand} />
    default:
      return (
        <div className="bg-white rounded-2xl border border-[#E6E6EA] p-6 text-sm text-[#6B7280]">
          <span className="font-mono text-xs">unknown block type: {b.type}</span>
        </div>
      )
  }
}

export function HeroBlock({ block, brand }: { block: Extract<PageBlock, { type: 'hero' }>; brand: any }) {
  const { props } = block
  return (
    <section className="relative bg-[#111] text-white overflow-hidden rounded-3xl mb-10">
      {/* Optional image behind hero */}
      {brand.logo ? (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <img src={brand.logo.url} alt="" className="w-full h-full object-cover scale-110" />
        </div>
      ) : null}
      <div className="relative z-10 px-6 md:px-14 py-20 md:py-28 max-w-4xl mx-auto text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--fe-accent)] text-white text-xs font-bold mb-4 tracking-wide">
          {brand.siteName ?? 'FoodExpress'}
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
          {props.title ?? brand.heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-[#CCC] max-w-2xl mx-auto mb-6">
          {props.subtitle ?? brand.heroSubtitle}
        </p>
        {props.ctaText ? (
          <a
            href={props.ctaLink ?? '/'}
            className="fe-btn fe-btn.primary fe-btn.lg inline-flex"
          >
            {props.ctaText}
          </a>
        ) : null}
      </div>
      {/* Decorative pink gradient */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[var(--fe-accent)] opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--fe-primary)] opacity-20 blur-3xl pointer-events-none" />
    </section>
  )
}

export function BannersBlock({ block }: { block: Extract<PageBlock, { type: 'banners' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#111]">{props.title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="fe-card overflow-hidden group">
            <div className="h-40 bg-gradient-to-br from-[var(--fe-primary)] to-[var(--fe-accent)] flex items-center justify-center text-white text-xl font-bold">
              Deal {i}
            </div>
            <div className="p-4">
              <p className="font-bold text-[#111]">Today’s offer</p>
              <p className="text-sm text-[#6B7280]">Free delivery on orders above 500৳</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CategoriesBlock({ block }: { block: Extract<PageBlock, { type: 'categories' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#111]">{props.title ?? 'Explore cuisines'}</h2>
      </div>
      <div className="fe-chip-row">
        {['Bengali', 'Burger', 'Pizza', 'BBQ', 'Chinese', 'Desserts', 'Coffee'].map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </div>
    </section>
  )
}

export function FeaturedBlock({ block }: { block: Extract<PageBlock, { type: 'featured' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#111]">{props.title ?? 'Featured restaurants'}</h2>
        <a href="#" className="text-sm text-[#D70F64] font-medium hover:underline">View all</a>
      </div>
      <div className="fe-grid-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="fe-card overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="h-36 bg-gradient-to-br from-[#F6F6F8] to-[#E6E6EA] flex items-center justify-center text-[#6B7280]">
              <span className="text-3xl">🍽️</span>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-sm text-[#111]">Restaurant {i}</span>
                <span className="text-xs text-[#6B7280]">30-45 min</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">Biryani & grill</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#6B7280]">৳200 delivery</span>
                <span className="text-xs text-[#6B7280]">4.7 (1.2k)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RestaurantsBlock({ block }: { block: Extract<PageBlock, { type: 'restaurants' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#111]">{props.title ?? 'All restaurants'}</h2>
        {props.showFilters ? (
          <div className="flex gap-2">
            <Chip active>Open now</Chip>
            <Chip>Delivery 30 min</Chip>
          </div>
        ) : null}
      </div>
      <div className="fe-grid-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fe-card overflow-hidden group">
            <div className="h-36 bg-[#F6F6F8] flex items-center justify-center text-2xl">🍜</div>
            <div className="p-3">
              <p className="font-bold text-sm text-[#111]">Restaurant {i + 1}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Cuisine name</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#6B7280]">৳30-45 min</span>
                <span className="text-xs text-[#6B7280]">4.5 (800)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function FeaturesBlock({ block }: { block: Extract<PageBlock, { type: 'features' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="bg-[#111] text-white rounded-3xl p-8 md:p-12 mb-10">
      <h2 className="text-3xl font-extrabold mb-8">{props.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {props.items.map((item) => (
          <div key={item.title} className="text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl mx-auto mb-3">
              {item.icon}
            </div>
            <h3 className="font-bold text-lg mb-1">{item.title}</h3>
            <p className="text-sm text-[#AAA]">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorksBlock({ block }: { block: Extract<PageBlock, { type: 'how-it-works' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="bg-[#F6F6F8] rounded-3xl p-8 md:p-12 mb-10">
      <h2 className="text-3xl font-extrabold text-[#111] mb-8">{props.title}</h2>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {props.steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-[var(--fe-primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {idx + 1}
            </div>
            <div>
              <span className="text-2xl">{step.icon}</span>
              <h3 className="font-bold text-[#111] mt-1">{step.title}</h3>
              <p className="text-sm text-[#6B7280]">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function MapBlock({ block }: { block: Extract<PageBlock, { type: 'map' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#111]">{props.title}</h2>
        <p className="text-sm text-[#6B7280] max-w-md">{props.subtitle}</p>
      </div>
      <div className="fe-map h-[420px]">
        {/* OpenStreetMap + Leaflet — rendered by the map component */}
        <div className="w-full h-full bg-[#E8E8E8] rounded-[13px] overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--fe-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <p className="text-sm text-[#6B7280]">Interactive map — we deliver across Brahmanbaria</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CtaBlock({ block }: { block: Extract<PageBlock, { type: 'cta' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="bg-gradient-to-r from-[var(--fe-primary)] to-[var(--fe-accent)] rounded-3xl p-10 md:p-14 text-center text-white mb-10 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{props.title}</h2>
        <p className="text-lg text-white/80 mb-6">{props.subtitle}</p>
        <a href={props.buttonLink ?? '/'} className="fe-btn fe-btn.lg bg-white text-[var(--fe-primary)] hover:bg-[#F6F6F8] shadow-lg">
          {props.buttonText}
        </a>
      </div>
    </section>
  )
}

export function TextBlock({ block }: { block: Extract<PageBlock, { type: 'text' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10 max-w-3xl mx-auto">
      {props.title ? <h2 className="text-2xl font-bold text-[#111] mb-4">{props.title}</h2> : null}
      <div className="text-[#333] leading-relaxed whitespace-pre-line">
        {props.body}
      </div>
    </section>
  )
}

export function FaqBlock({ block }: { block: Extract<PageBlock, { type: 'faq' }>; brand?: any }) {
  const { props } = block
  return (
    <section className="mb-10 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[#111] mb-6">{props.title}</h2>
      <div className="fe-card divide-y divide-[#E6E6EA]">
        {props.items.map((item, idx) => (
          <div key={idx} className="p-5">
            <h3 className="font-bold text-[#111]">{item.q}</h3>
            <p className="text-sm text-[#6B7280] mt-1">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function RestaurantCoverPage({ restaurantSlug, title }: { restaurantSlug: string; title: string }) {
  return (
    <div className="bg-white min-h-[70vh]">
      <div className="h-56 bg-gradient-to-br from-[var(--fe-primary)] to-[var(--fe-accent)] flex items-center justify-center text-white font-extrabold text-3xl">
        {title}
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <a href={`/r/${restaurantSlug}`} className="fe-btn fe-btn.primary">Open menu</a>
      </div>
    </div>
  )
}
