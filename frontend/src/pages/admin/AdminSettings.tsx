import { useState, useEffect } from 'react'
import { useBrand } from '../../lib/brand'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { useAuth } from '../../lib/auth'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { BrandPreview } from './BrandPreview'
import { useMediaUpload } from '../../hooks/useMediaUpload'
import type { AppSetting } from '../../types'

usePageTitle('Settings', 'Branding, fees, contact, and global settings for FoodExpress.')

const BRAND_COLORS = [
  { value: '#D70F64', label: 'Pink (default)' },
  { value: '#2B6BE1', label: 'Blue' },
  { value: '#12A860', label: 'Green' },
  { value: '#FF2B85', label: 'Rose' },
  { value: '#FFA400', label: 'Orange' },
  { value: '#6B7280', label: 'Gray' },
]

export function AdminSettings() {
  const { brand } = useBrand()
  const { token } = useAuth()
  const { uploadMedia } = useMediaUpload()

  const [form, setForm] = useState<Partial<AppSetting>>(brand)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (!brand) return }, [])

  const save = async () => {
    if (!token) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateBrand(token, form)
      setForm({ ...updated })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Failed to save settings', err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const uploaded = await uploadMedia(formData)
      setForm({ ...form, logo: uploaded })
      setSaved(false)
    } catch (err) {
      console.error('Logo upload failed', err)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const uploaded = await uploadMedia(formData)
      setForm({ ...form, favicon: uploaded })
      setSaved(false)
    } catch (err) {
      console.error('Favicon upload failed', err)
    }
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Settings</h2>
          <p className="text-sm text-[#6B7280]">Branding, fees, contact info, and global config.</p>
        </div>
        {saved && <Badge variant="success">Saved ✓</Badge>}
      </div>

      {/* Live preview */}
      <div className="mb-6">
        <BrandPreview brand={form as AppSetting} />
      </div>

      {/* Branding */}
      <Card className="mb-6">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Branding</h3>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-field full">
              <label className="admin-form-label">Site name</label>
              <Input value={form.siteName ?? ''} onChange={(e) => setForm({ ...form, siteName: e.target.value })} placeholder="FoodExpress" />
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Tagline</label>
              <Input value={form.tagline ?? ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Fast • Fresh • For You" />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Primary color</label>
              <Input type="color" value={form.primaryColor ?? '#D70F64'} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="admin-form-input h-10" />
              <Select
                className="mt-2"
                value={form.primaryColor ?? '#D70F64'}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                options={BRAND_COLORS}
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Accent color</label>
              <Input type="color" value={form.accentColor ?? '#FF2B85'} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="admin-form-input h-10" />
              <Select
                className="mt-2"
                value={form.accentColor ?? '#FF2B85'}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                options={BRAND_COLORS}
              />
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#F6F6F8] flex items-center justify-center overflow-hidden border border-[#E6E6EA]">
                  {form.logo ? (
                    <img src={form.logo.url} alt="logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <img src="/favicon.png" alt="default logo" className="max-w-full max-h-full object-contain" />
                  )}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="text-xs text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Upload logo</span>
              </div>
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Favicon</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F6F6F8] flex items-center justify-center overflow-hidden border border-[#E6E6EA]">
                  {form.favicon ? (
                    <img src={form.favicon.url} alt="favicon" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <img src="/favicon.png" alt="default favicon" className="max-w-full max-h-full object-contain" />
                  )}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFaviconUpload} className="text-xs text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Upload favicon</span>
              </div>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Hero title</label>
              <Input value={form.heroTitle ?? ''} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} placeholder="What are you craving today?" />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Hero subtitle</label>
              <Input value={form.heroSubtitle ?? ''} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} placeholder="Order food from the best restaurants…" />
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Announcement bar</label>
              <Input value={form.announcement ?? ''} onChange={(e) => setForm({ ...form, announcement: e.target.value })} placeholder="Free delivery above ৳500!" />
              <p className="text-xs text-[#6B7280] mt-1">Shown at the top of the storefront.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fees & pricing */}
      <Card className="mb-6">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Fees & pricing</h3>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-field">
              <label className="admin-form-label">Default delivery fee (৳)</label>
              <Input type="number" value={form.defaultDeliveryFee ?? 40} onChange={(e) => setForm({ ...form, defaultDeliveryFee: Number(e.target.value) })} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Free delivery threshold (৳)</label>
              <Input type="number" value={form.freeDeliveryThreshold ?? 500} onChange={(e) => setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Tax rate (%)</label>
              <Input type="number" value={form.taxRate ?? 5} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Commission rate (%)</label>
              <Input type="number" value={form.commissionRate ?? 15} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Currency</label>
              <Select
                value={form.currency ?? 'BDT'}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                options={[{ value: 'BDT', label: 'BDT (৳)' }, { value: 'USD', label: 'USD ($)' }]}
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Currency symbol</label>
              <Input value={form.currencySymbol ?? '৳'} onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} />
            </div>
          </div>
        </div>
      </Card>

      {/* Contact & footer */}
      <Card className="mb-6">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Contact & footer</h3>
        </div>
        <div className="admin-card-body">
          <div className="admin-form">
            <div className="admin-form-field">
              <label className="admin-form-label">Contact email</label>
              <Input type="email" value={form.contactEmail ?? ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="hello@foodexpress.com" />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Contact phone</label>
              <Input value={form.contactPhone ?? ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+880 1700-000000" />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Address</label>
              <Input value={form.addressLine ?? ''} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} placeholder="Brahmanbaria, Bangladesh" />
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Footer text</label>
              <Input value={form.footerText ?? ''} onChange={(e) => setForm({ ...form, footerText: e.target.value })} placeholder="FoodExpress — Fast • Fresh • For You" />
            </div>
          </div>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => setForm({ ...brand })}>Reset</Button>
        <Button onClick={save} loading={saving} disabled={!token}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
        {!token && <p className="text-xs text-[#E22B4A]">Sign in as admin to save.</p>}
      </div>
    </div>
  )
}

async function updateBrand(token: string, body: Partial<AppSetting>) {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/app-setting`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Failed to save: ${res.status}`)
  return res.json()
}
