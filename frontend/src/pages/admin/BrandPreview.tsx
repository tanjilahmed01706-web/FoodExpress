import type { AppSetting } from '../../types'

export function BrandPreview({ brand }: { brand: AppSetting }) {
  const logoUrl = brand.logo ? brand.logo.url : '/favicon.png'
  const faviconUrl = brand.favicon ? brand.favicon.url : '/favicon.png'
  const primary = brand.primaryColor || '#D70F64'
  const accent = brand.accentColor || '#FF2B85'

  return (
    <div
      className="flex flex-col items-center rounded-2xl border p-5 w-full max-w-sm bg-white shadow-sm"
      style={{ borderColor: `${primary}33` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white border border-[#E6E6EA] overflow-hidden flex items-center justify-center">
          <img src={logoUrl} alt={brand.siteName} className="w-full h-full object-contain" />
        </div>
        <span className="font-bold text-[#111] text-lg">{brand.siteName}</span>
      </div>
      <p className="text-xs text-[#6B7280] mb-3">{brand.tagline}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#6B7280]">Primary</span>
        <div className="w-6 h-6 rounded-full border border-[#E6E6EA]" style={{ backgroundColor: primary }} />
        <span className="text-[10px] text-[#6B7280]">Accent</span>
        <div className="w-6 h-6 rounded-full border border-[#E6E6EA]" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] text-[#6B7280]">Favicon</span>
        <img src={faviconUrl} alt="favicon" className="w-4 h-4 rounded-full object-contain" />
      </div>
      <div className="mt-4 w-full h-2 rounded-full bg-gradient-to-r from-[var(--fe-primary)] to-[var(--fe-accent)]" />
    </div>
  )
}
