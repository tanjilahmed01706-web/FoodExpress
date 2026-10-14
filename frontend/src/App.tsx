import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { FoodExpressShell } from './components/shell/FoodExpressShell'
import { Navbar } from './components/shell/Navbar'
import { Footer } from './components/shell/Footer'
import Toast from './components/ui/Toast'
import { useBrand } from './lib/brand'
import { useAuth } from './lib/auth'
import { usePageTitle } from './hooks/useBrandedTitle'
import { CartProvider } from './lib/cart'
import { OfflineBanner } from './hooks/useOfflineIndicator'
import { HomePage } from './pages/customer/HomePage'
import { CustomerLayout } from './pages/customer/CustomerLayout'
import { RestaurantMenuPage } from './pages/customer/RestaurantMenuPage'
import { CartPage } from './pages/customer/CartPage'
import { CheckoutPage } from './pages/customer/CheckoutPage'
import { OrdersPage } from './pages/customer/OrdersPage'
import OrderTrackingPage from './pages/customer/OrderTrackingPage'
import { AccountLogin } from './pages/account/AccountLogin'
import { AccountRegister } from './pages/account/AccountRegister'
import { AccountProfile } from './pages/account/AccountProfile'
import { AccountAddresses } from './pages/account/AccountAddresses'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminStats } from './pages/admin/AdminStats'
import { AdminRestaurants } from './pages/admin/AdminRestaurants'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminRiders } from './pages/admin/AdminRiders'
import { AdminCoupons } from './pages/admin/AdminCoupons'
import { AdminNotifications } from './pages/admin/AdminNotifications'
import { AdminTickets } from './pages/admin/AdminTickets'
import { AdminPages } from './pages/admin/AdminPages'
import { AdminZones } from './pages/admin/AdminZones'
import { AdminSettings } from './pages/admin/AdminSettings'
import { PageLoader } from './pages/cms/PageLoader'
import { NotFoundPage } from './pages/NotFoundPage'
import { useEffect, useState } from 'react'

usePageTitle('FoodExpress', 'Fast • Fresh • For You')

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [adminToast, setAdminToast] = useState<{ title: string; message: string; icon: string } | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.panelRole !== 'admin')) {
      navigate('/account/login?redirect=/admin', { replace: true })
    }
  }, [loading, user, navigate])

  useEffect(() => {
    if (!adminToast) return
    const t = setTimeout(() => setAdminToast(null), 3200)
    return () => clearTimeout(t)
  }, [adminToast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F6F8]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-[#D70F64] mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-[#6B7280]">Loading admin…</p>
        </div>
      </div>
    )
  }

  if (!user || user.panelRole !== 'admin') {
    return null
  }

  return (
    <>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {adminToast && (
          <div className="admin-toast">
            <div className="admin-toast-icon">{adminToast.icon}</div>
            <div>
              <p className="admin-toast-title">{adminToast.title}</p>
              <p className="admin-toast-message">{adminToast.message}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function AppRoutes() {
  const { brand } = useBrand()
  const { orderId } = useParams() as { orderId?: string }

  return (
    <FoodExpressShell>
      <OfflineBanner />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="p/:slug" element={<PageLoader hasLayout={true} />} />
          <Route path="r/:slug" element={<RestaurantMenuPage />} />

          <Route element={<CustomerLayout />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderTrackingPage orderId={orderId} />} />
          </Route>

          <Route path="account/login" element={<AccountLogin />} />
          <Route path="account/register" element={<AccountRegister />} />
          <Route path="account/profile" element={<AccountProfile />} />
          <Route path="account/addresses" element={<AccountAddresses />} />

          <Route
            element={
              <AdminGate>
                <AdminLayout />
              </AdminGate>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="restaurants" element={<AdminRestaurants />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="riders" element={<AdminRiders />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="zones" element={<AdminZones />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer brand={brand} />
      <Toast show={false} message="" />
    </FoodExpressShell>
  )
}

export default function App() {
  return (
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  )
}