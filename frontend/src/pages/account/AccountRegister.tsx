import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBrand } from '../../lib/brand'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FoodExpressLogo } from '../../components/ui/Logo'

usePageTitle('Create account', 'Join FoodExpress and start ordering food from the best restaurants in Brahmanbaria.')

const PANEL_OPTIONS: { value: 'customer' | 'restaurant' | 'rider'; label: string; short: string; desc: string }[] = [
  { value: 'customer', label: 'Customer', short: '👤', desc: 'Order food from restaurants near you.' },
  { value: 'restaurant', label: 'Restaurant partner', short: '🍽️', desc: 'Sell your food to thousands of customers.' },
  { value: 'rider', label: 'Rider', short: '🛵', desc: 'Deliver food and earn on every trip.' },
]

export function AccountRegister() {
  const { brand } = useBrand()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<'customer' | 'restaurant' | 'rider'>('customer')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const register = useCallback(async () => {
    if (!username.trim() || !email.trim() || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      await (window as any).__FE_AUTH?.register?.(username, email, password, panel) ?? Promise.resolve()
      navigate(panel === 'customer' ? '/' : panel === 'restaurant' ? '/restaurant/partner' : '/rider/join', { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [username, email, password, confirmPassword, panel, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      register()
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-[#F6F6F8]">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-[#E6E6EA] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FoodExpressLogo brand={brand} size={36} />
              <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">Create your account</p>

            {/* Panel selector */}
            <div className="space-y-2 mb-5">
              <label className="fe-label">I want to sign up as</label>
              <div className="grid grid-cols-3 gap-2">
                {PANEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setPanel(opt.value); setError('') }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition ${panel === opt.value ? 'border-[#D70F64] bg-[#F2EEFF] text-[#D70F64]' : 'border-[#E6E6EA] hover:border-[#C9C9CD] text-[#6B7280]'}`}
                  >
                    <span className="text-2xl">{opt.short}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#6B7280] text-center">{PANEL_OPTIONS.find((o) => o.value === panel)?.desc}</p>
            </div>

            <div className="space-y-3.5">
              <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" onKeyDown={handleKeyDown} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={handleKeyDown} />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" onKeyDown={handleKeyDown} />
              <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" onKeyDown={handleKeyDown} />
              {error && <p className="text-sm text-[#E22B4A] -mt-1.5">{error}</p>}
              <Button onClick={register} loading={loading} className="w-full fe-btn.lg">
                Create account
              </Button>
            </div>

            <p className="mt-4 text-xs text-[#6B7280] text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="mt-4 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link to="/account/login" className="text-[#D70F64] font-medium hover:underline">Sign in</Link>
          </div>

          {/* Demo info */}
          <div className="mt-6 p-4 bg-white rounded-2xl border border-[#E6E6EA] text-xs text-[#6B7280]">
            <p className="font-medium text-[#111] mb-1">Demo accounts (pre-seeded):</p>
            <ul className="space-y-1">
              <li>Customer: customer@foodexpress.com / Customer@123</li>
              <li>Restaurant partner: partner@foodexpress.com / Partner@123</li>
              <li>Rider: rider@foodexpress.com / Rider@123</li>
              <li>Admin: admin@foodexpress.com / Admin@123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
