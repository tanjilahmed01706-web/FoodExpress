import { useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useBrand } from '../../lib/brand'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Input, Checkbox } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { FoodExpressLogo } from '../../components/ui/Logo'

usePageTitle('Sign in', 'Sign in to your FoodExpress account to start ordering.')

const PANEL_OPTIONS: { value: 'customer' | 'restaurant' | 'rider'; label: string; href: string }[] = [
  { value: 'customer', label: 'Customer', href: '/' },
  { value: 'restaurant', label: 'Restaurant partner', href: '/restaurant/partner' },
  { value: 'rider', label: 'Rider', href: '/rider/join' },
]

export function AccountLogin() {
  const { brand } = useBrand()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const [identifier, setIdentifier] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roleFocus, setRoleFocus] = useState<'customer' | 'restaurant' | 'rider'>('customer')

  const login = useCallback(async () => {
    if (!identifier.trim() || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      await (window as any).__FE_AUTH?.login?.(identifier, password, rememberMe) ?? Promise.resolve()
      navigate(redirect, { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Invalid email and password combination.')
    } finally {
      setLoading(false)
    }
  }, [identifier, password, rememberMe, redirect, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      login()
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-[#F6F6F8]">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Left: branding */}
          <div className="hidden lg:flex lg:flex-col lg:w-72 bg-[#111] text-white p-8 rounded-2xl shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FoodExpressLogo brand={brand} size={44} />
              <span className="font-extrabold tracking-tight">{brand.siteName ?? 'FoodExpress'}</span>
            </div>
            <p className="text-sm text-[#CCC] leading-relaxed mb-6">{brand.tagline}</p>
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FF2B85]">Sign in as</h3>
              <div className="space-y-2">
                {PANEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoleFocus(opt.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3 ${roleFocus === opt.value ? 'bg-[#D70F64] text-white' : 'hover:bg-white/10'}`}
                  >
                    <span className="text-lg">
                      {opt.value === 'customer' ? '👤' : opt.value === 'restaurant' ? '🍽️' : '🛵'}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white rounded-2xl border border-[#E6E6EA] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FoodExpressLogo brand={brand} size={34} />
              <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">Sign in to your account</p>

            {/* Brand-colored top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-[var(--fe-primary)] to-[var(--fe-accent)] rounded-full mb-5" />

            {roleFocus === 'customer' ? (
              <>
                <h2 className="text-lg font-bold text-[#111] mb-4">Customer login</h2>
                <p className="text-sm text-[#6B7280] mb-4">Welcome back! Sign in to order food.</p>
                <div className="space-y-4">
                  <Input label="Email" type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com" autoFocus error={error && !identifier ? 'Required' : error} onKeyDown={handleKeyDown} />
                  <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={error && !password ? 'Required' : error} onKeyDown={handleKeyDown} />
                  <div className="flex items-center justify-between">
                    <Checkbox label="Remember me" checked={rememberMe} onChange={setRememberMe} />
                    <Link to="#" className="text-xs text-[#D70F64] hover:underline">Forgot password?</Link>
                  </div>
                  {error && <p className="text-sm text-[#E22B4A]">{error}</p>}
                  <Button onClick={login} loading={loading} className="w-full fe-btn.lg">
                    Sign in
                  </Button>
                </div>
              </>
            ) : roleFocus === 'restaurant' ? (
              <>
                <h2 className="text-lg font-bold text-[#111] mb-4">Restaurant partner</h2>
                <p className="text-sm text-[#6B7280] mb-4">Already a partner? Sign in to manage your store.</p>
                <div className="space-y-4">
                  <Input label="Partner email" type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="partner@foodexpress.com" autoFocus error={error && !identifier ? 'Required' : error} onKeyDown={handleKeyDown} />
                  <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={error && !password ? 'Required' : error} onKeyDown={handleKeyDown} />
                  <div className="flex items-center justify-between">
                    <Checkbox label="Remember me" checked={rememberMe} onChange={setRememberMe} />
                  </div>
                  {error && <p className="text-sm text-[#E22B4A]">{error}</p>}
                  <Button onClick={login} loading={loading} className="w-full fe-btn.lg">
                    Partner sign in
                  </Button>
                </div>
                <div className="mt-5 pt-4 border-t border-[#E6E6EA] text-center">
                  <p className="text-sm text-[#6B7280]">Don’t have a store yet?</p>
                  <Link to="/restaurant/partner" className="fe-btn fe-btn.primary mt-2 fe-btn.sm mx-auto">Become a partner</Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#111] mb-4">Rider login</h2>
                <p className="text-sm text-[#6B7280] mb-4">Delivery partner? Sign in to your rider panel.</p>
                <div className="space-y-4">
                  <Input label="Rider email" type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="rider@foodexpress.com" autoFocus error={error && !identifier ? 'Required' : error} onKeyDown={handleKeyDown} />
                  <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={error && !password ? 'Required' : error} onKeyDown={handleKeyDown} />
                  <div className="flex items-center justify-between">
                    <Checkbox label="Remember me" checked={rememberMe} onChange={setRememberMe} />
                  </div>
                  {error && <p className="text-sm text-[#E22B4A]">{error}</p>}
                  <Button onClick={login} loading={loading} className="w-full fe-btn.lg">
                    Rider sign in
                  </Button>
                </div>
                <div className="mt-5 pt-4 border-t border-[#E6E6EA] text-center">
                  <p className="text-sm text-[#6B7280]">Not a rider yet?</p>
                  <Link to="/rider/join" className="fe-btn fe-btn.primary mt-2 fe-btn.sm mx-auto">Join as rider</Link>
                </div>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-[#E6E6EA] text-center">
              <span className="text-sm text-[#6B7280]">
                Demo: customer@foodexpress.com · Partner@123 · Rider@123 · Admin@123
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don’t have an account?{' '}
            <Link to="/account/register" className="text-[#D70F64] font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
