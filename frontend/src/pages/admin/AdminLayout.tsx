import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useBrand } from '../../lib/brand'
import { useAuth } from '../../lib/auth'
import { FoodExpressLogo } from '../../components/ui/Logo'
import { usePageTitle } from '../../hooks/useBrandedTitle'

usePageTitle('Admin', 'FoodExpress admin — manage restaurants, riders, orders, content, and branding.')

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { to: '/admin/restaurants', label: 'Restaurants', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { to: '/admin/riders', label: 'Riders', icon: 'M10 17v-4h2 M5 17h14 M5 17a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4 M10 7a2 2 0 1 1 0 4 M5 11a2 2 0 1 0 0 4h14a2 2 0 1 0 0-4' },
  { to: '/admin/orders', label: 'Orders', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M16 13H6 M16 17H6 M10 9H6' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'M12 2v20 M17 7l-5-5-5 5 M7 3h10' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'M18 8A6 6 0 0 0 6 8 M18 8A6 6 0 0 0 18 2 M14 18v-4 M10 18v-4 M18 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M10 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0' },
  { to: '/admin/tickets', label: 'Support', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M17 8h1a4 4 0 1 1 0 8h1 M12 8.5a4 4 0 1 0 0 8 M12 4a4 4 0 1 0 0 8' },
  { to: '/admin/pages', label: 'CMS pages', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { to: '/admin/zones', label: 'Map zones', icon: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M12 2v4 M12 14v4' },
  { to: '/admin/settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.65 1.65 0 0 0 .36 1.81l.03.04a1.65 1.65 0 0 0 1.11 1.11l.04-.03a1.65 1.65 0 0 0 1.81-.36l.15-.18a2 2 0 0 1 1.9 0l.25.22a2 2 0 0 1 0 2.82l-.22.25a1.65 1.65 0 0 0-.36 1.81 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
]

export function AdminLayout() {
  const { brand } = useBrand()
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F6F8]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-[#D70F64] mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-[#6B7280]">Loading admin…</p>
        </div>
      </div>
    )
  }

  if (user.panelRole !== 'admin') {
    navigate('/account/login?redirect=/admin', { replace: true })
    return null
  }

  const currentLabel = NAV.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Dashboard'

  return (
    <div className="admin-shell">
      {/* Left rail */}
      <aside className="admin-sidebar">
        {/* FoodExpress brand */}
        <div className="admin-brand">
          <FoodExpressLogo brand={brand} size={32} />
          <div>
            <div className="admin-brand-name">{brand.siteName ?? 'FoodExpress'}</div>
            <div className="admin-brand-tagline">{brand.tagline}</div>
          </div>
        </div>

        {/* Nav */}
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-footer">
          FoodExpress Admin<br />
          <span style={{ color: '#444' }}>v1.0.0</span>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <div>
            <div className="admin-title">{currentLabel}</div>
            <div className="admin-subtitle">FoodExpress admin</div>
          </div>

          <div className="admin-actions">
            {brand.announcement && (
              <div className="admin-announcement">{brand.announcement}</div>
            )}
            <button
              className="admin-user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="admin-avatar">
                {user.firstName?.[0] ?? user.username?.[0] ?? '?'}
              </span>
              <span className="hidden sm:inline" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName ?? user.username}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0" style={{ zIndex: 40 }} onClick={() => setShowUserMenu(false)} />
                <div className="admin-user-menu">
                  <div className="admin-user-menu-header">
                    <div className="admin-user-name">{user.firstName ?? user.username}</div>
                    <div className="admin-user-email">{user.email}</div>
                    <span className="admin-user-role" style={{ textTransform: 'capitalize' }}>{user.panelRole}</span>
                  </div>
                  <button onClick={() => { logout(); navigate('/account/login'); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                  <button onClick={() => { setShowUserMenu(false); navigate('/'); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <path d="M9 22V12h6v10"/>
                    </svg>
                    View storefront
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Outlet */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
