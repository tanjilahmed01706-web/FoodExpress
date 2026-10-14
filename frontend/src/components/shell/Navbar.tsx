import { Link, NavLink } from 'react-router-dom'
import { useBrand } from '../../lib/brand'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'
import { FoodExpressLogo } from '../ui/Logo'

export function Navbar() {
  const { brand, loading: brandLoading } = useBrand()
  const { itemCount } = useCart()
  const { user, logout } = useAuth()

  if (brandLoading) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6E6EA] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-center">
          <div className="w-32 h-7 bg-[#F6F6F8] rounded animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E6E6EA] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 -ml-1">
            <FoodExpressLogo brand={brand} size={34} />
            <span className="font-extrabold text-[#111] text-sm sm:text-base">{brand.siteName ?? 'FoodExpress'}</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={({ isActive }) => nclass(isActive)}>
              Home
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => nclass(isActive)}>
              Orders
            </NavLink>
            <NavLink to="/cart" className={({ isActive }) => nclass(isActive)}>
              Cart
            </NavLink>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/account/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6E6EA] hover:bg-[#F6F6F8] transition text-sm">
                  <span className="w-7 h-7 rounded-full bg-[#D70F64] text-white text-xs font-bold flex items-center justify-center">
                    {user.firstName?.[0] ?? user.username?.[0] ?? '?'}
                  </span>
                  <span className="text-sm font-medium text-[#111]">{user.firstName ?? user.username}</span>
                </Link>
                <button
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6E6EA] hover:bg-[#F6F6F8] transition text-sm"
                  onClick={logout}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-sm">Sign out</span>
                </button>
                <Link to="/admin" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D70F64] text-white text-sm font-medium hover:bg-[#B3094F] transition shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                  </svg>
                  Admin
                </Link>
              </>
            ) : (
              <>
                <Link to="/account/login" className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D70F64] text-white text-sm font-medium hover:bg-[#B3094F] transition shadow-sm">
                  Sign in
                </Link>
                <Link to="/account/register" className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6E6EA] text-sm font-medium hover:bg-[#F6F6F8] transition">
                  Join
                </Link>
              </>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D70F64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h1l2.68 12.3c.3-.56 1-.8 1.55-.8C5.46 13.78 7 12.96 7.9 12.25c.9-.7 1.95-1.08 2.9-.98L13 13l-2.68 8.3c-.3.56-1 .8-1.55.8C9.14 21.12 7.6 21.4 6.75 21c-.9.7-1.95 1.08-2.9.98L3 13l2.68-8.3c.3-.56 1-.8 1.55-.8C7.42 1.38 9.14.6 11 .0c1.6-.58 3.35-.2 4.35.98l.72 4.2L17 8l2.79-1.7c.55-.36.94-1.04.94-1.74V1c0-.7-.55-1.29-1.25-1.29H4.25C3.5 1 3 .51 3 0v1.02l1.71 13.9c.3-.56 1-.8 1.55-.8C7.42 1.38 9.14.6 11 .0c1.6-.58 3.35-.2 4.35.98l.72 4.2L17 8l2.79-1.7C21.62 4.93 23 6.73 23 9.5v9.5c0 2.77-2.38 5-6 5H9l-2.68 12.3c-.3-.56-1-.8-1.55-.8C5.46 13.78 7 12.96 7.9 12.25c.9-.7 1.95-1.08 2.9-.98L13 13l-2.68 8.3c-.3.56-1 .8-1.55.8C9.14 21.12 7.6 21.4 6.75 21c-.9.7-1.95 1.08-2.9.98L3 13l2.68-8.3c.3-.56 1-.8 1.55-.8C7.42 1.38 9.14.6 11 .0c1.6-.58 3.35-.2 4.35.98L13 13" />
                <path d="M9 16.2V8.8l6 4.4" />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#D70F64] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function nclass(active: boolean) {
  return `px-3 py-1.5 text-sm font-medium rounded-full transition ${active ? 'bg-[#F6F6F8] text-[#D70F64]' : 'text-[#6B7280] hover:bg-[#F6F6F8] hover:text-[#111]'}`
}
