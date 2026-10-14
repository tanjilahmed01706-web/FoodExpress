import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useBrand } from '../../lib/brand'
import { fetchOrder } from '../../lib/api'
import { useParams } from 'react-router-dom'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { FoodExpressLogo } from '../../components/ui/Logo'
import { MapView, OSMTileLayer, PinMarker, RestaurantMarker, CustomerMarker } from '../../lib/map'
import type { Order } from '../../types'
import { ORDER_STATUS } from '../../config'

usePageTitle('Track your order', 'See exactly where your rider is and follow the delivery status live.')

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--fe-info)',
  confirmed: 'var(--fe-info)',
  preparing: 'var(--fe-warning)',
  ready: 'var(--fe-warning)',
  picked_up: 'var(--fe-warning)',
  on_the_way: 'var(--fe-accent)',
  delivered: 'var(--fe-success)',
  cancelled: 'var(--fe-danger)',
}

function OrderTrackingPage({ orderId }: { orderId?: string }) {
  const { token, user, loading: authLoading } = useAuth()
  const { brand } = useBrand()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const { orderId: paramOrderId } = useParams()
  const id = orderId ?? paramOrderId

  useEffect(() => {
  if (!token || !user || !id) {
    setError('Order not found.')
    return
  }
  setError('')
  fetchOrder(id, token)
      .then((o) => {
        setOrder(o)
        if (o) {
          const rLat = o.restaurant?.lat ?? 23.957
          const rLng = o.restaurant?.lng ?? 90.725
          const dLat = o.deliveryAddress?.lat ?? 23.957
          const dLng = o.deliveryAddress?.lng ?? 90.725
          if (!o.rider?.currentLat && o.status !== 'delivered' && o.status !== 'cancelled') {
            const t = (Date.now() % 120000) / 120000
            const riderLat = rLat + (dLat - rLat) * (0.25 + 0.5 * (1 + Math.sin(t * 6)) / 2)
            const riderLng = rLng + (dLng - rLng) * (0.25 + 0.5 * (1 + Math.cos(t * 6)) / 2)
            setOrder((prev) => prev && prev.rider ? { ...prev, rider: { ...prev.rider, currentLat: riderLat, currentLng: riderLng } } : prev)
          }
        }
      })
      .catch(() => setError('Could not load this order.'))
  }, [token, user, id])

  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return
    const runner = setInterval(() => {
      setOrder((prev) => {
        if (!prev) return prev
        const rLat = prev.restaurant?.lat ?? 23.957
        const rLng = prev.restaurant?.lng ?? 90.725
        const dLat = prev.deliveryAddress?.lat ?? 23.957
        const dLng = prev.deliveryAddress?.lng ?? 90.725
        const t = (Date.now() % 10000) / 10000
        const riderLat = rLat + (dLat - rLat) * (0.18 + 0.6 * (0.5 + 0.5 * (1 + Math.sin(t * 8)) / 2))
        const riderLng = rLng + (dLng - rLng) * (0.18 + 0.6 * (0.5 + 0.5 * (1 + Math.cos(t * 8)) / 2))
        return prev && prev.rider ? { ...prev, rider: { ...prev.rider, currentLat: riderLat, currentLng: riderLng } } : prev
      })
    }, 1800)
    return () => clearInterval(runner)
  }, [order?.status])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F6F8]">
        <div className="text-center">
          <Skeleton width="220px" height={40} className="rounded-full mx-auto" />
          <p className="text-sm text-[#6B7280] mt-3">Loading order…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#F6F6F8] text-center px-4">
        <span className="text-5xl mb-4">🔍</span>
        <h1 className="text-xl font-bold text-[#111]">Could not find this order</h1>
        <p className="text-sm text-[#6B7280] mt-2 max-w-md">{error || 'This order may not exist or you may not have permission to view it.'}</p>
        <div className="flex gap-3 mt-6">
          <Link to="/orders" className="fe-btn fe-btn.primary fe-btn.sm">My orders</Link>
          <Link to="/" className="fe-btn fe-btn.ghost fe-btn.sm">Back to home</Link>
        </div>
      </div>
    )
  }

  const rLat = order.restaurant?.lat ?? 23.957
  const rLng = order.restaurant?.lng ?? 90.725
  const dLat = order.deliveryAddress?.lat ?? 23.957
  const dLng = order.deliveryAddress?.lng ?? 90.725
  const riderLat = order.rider?.currentLat ?? (order.status === 'delivered' ? dLat : rLat)
  const riderLng = order.rider?.currentLng ?? (order.status === 'delivered' ? dLng : rLng)
  const center: [number, number] = order.status === 'delivered' || order.status === 'cancelled'
    ? [rLat, rLng]
    : [(riderLat + dLat) / 2, (riderLng + dLng) / 2]

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      {/* Header */}
      <div className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <FoodExpressLogo brand={brand} size={30} />
            <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
          </Link>
          <div className="flex-1 h-[2px] bg-[#E6E6EA] mx-4" />
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-[#6B7280]'}`} />
            <span className="text-sm font-medium text-[#111]">{ORDER_STATUS.find((s) => s.value === order.status)?.label ?? order.status}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="fe-map h-[360px] lg:h-[460px]">
              <MapView center={center} zoom={15} style={{ height: '100%', width: '100%' }} />
              <OSMTileLayer />
              <RestaurantMarker position={[rLat, rLng]} label={order.restaurant?.name ?? 'Restaurant'} />
              <CustomerMarker position={[dLat, dLng]} label="You" />
              {order.status !== 'cancelled' && order.status !== 'pending' ? (
                <PinMarker position={[riderLat, riderLng] as [number, number]} color={order.status === 'on_the_way' ? '#FF2B85' : '#2B6BE1'} label={order.status === 'on_the_way' ? '🛵 Your rider' : 'Your order'} />
              ) : null}
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF2B85]" /> Rider</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2B6BE1]" /> Delivery address</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#111]" /> Restaurant</span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-lg text-[#111]">{order.orderNumber}</span>
                    <Chip variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'primary' : 'outline'} size="sm">
                      {ORDER_STATUS.find((s) => s.value === order.status)?.label ?? order.status}
                    </Chip>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-1">{order.restaurant?.name}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {new Date(order.placedAt).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#111]">৳{order.total}</div>
                  <div className="text-xs text-[#6B7280]">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card'}</div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-sm text-[#111] mb-3">Status timeline</h3>
              <div className="space-y-0">
                {order.timeline?.map((t, idx) => {
                  const isLast = idx === order.timeline.length - 1
                  const isCurrent = t.status === order.status
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${isLast ? STATUS_COLOR[order.status] : 'bg-[#C9C9CD]'}`} />
                        {!isLast && <div className="w-0.5 flex-1 bg-[#E6E6EA] my-1" />}
                      </div>
                      <div className={`flex-1 pb-3 ${isLast ? '' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-medium text-sm ${isCurrent ? 'text-[#111]' : 'text-[#6B7280]'}`}>{t.label}</span>
                          {isCurrent && <Chip variant="outline" size="sm">Now</Chip>}
                        </div>
                        <span className="text-xs text-[#6B7280]">{new Date(t.at).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {order.rider && order.status !== 'cancelled' && (
              <Card>
                <h3 className="font-bold text-sm text-[#111] mb-3">
                  {order.status === 'on_the_way' ? 'Your rider is on the way' : order.status === 'delivered' ? 'Delivery complete' : 'Your rider'}
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF2B85] text-white flex items-center justify-center text-2xl font-bold">
                    {order.rider.name?.[0] ?? 'R'}
                  </div>
                  <div>
                    <p className="font-medium text-[#111]">{order.rider.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {order.rider.vehicleType === 'motorbike' ? '🛵 Motorbike' : order.rider.vehicleType === 'bicycle' ? '🚲 Bicycle' : '🚗 Car'}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-[#6B7280]">Rating</span>
                    <span className="text-xs font-medium text-[#111]">{order.rider.rating ?? 0}</span>
                  </div>
                </div>
                {order.status === 'on_the_way' && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Estimated arrival</p>
                    <p className="text-sm font-medium text-[#111]">Soon</p>
                  </div>
                )}
                {order.status === 'on_the_way' && (
                  <div className="flex gap-2 mt-3">
                    <a href={`tel:${order.rider.phone?.replace(/[^0-9+]/g, '')}`} className="fe-btn fe-btn.ghost fe-btn.sm flex-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call rider
                    </a>
                    <a href={`sms:${order.rider.phone?.replace(/[^0-9+]/g, '')}`} className="fe-btn fe-btn.ghost fe-btn.sm flex-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Message rider
                    </a>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className="text-xs text-[#12A860] bg-[#E7F7EE] rounded-xl p-3">
                    ✅ Your order has been delivered. Enjoy your meal! Rate the restaurant in the Orders tab.
                  </div>
                )}
              </Card>
            )}

            <Card>
              <h3 className="font-bold text-sm text-[#111] mb-3">What you ordered</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#111]">{item.qty}× {item.name}</span>
                    <span className="font-medium text-[#111]">৳{item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E6E6EA] space-y-1 text-sm text-[#6B7280]">
                <div className="flex justify-between"><span>Subtotal</span><span>৳{order.subtotal}</span></div>
                {order.discount ? <div className="flex justify-between text-[#12A860]"><span>Discount</span><span>-৳{order.discount}</span></div> : null}
                <div className="flex justify-between"><span>Delivery fee</span><span>৳{order.deliveryFee}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>৳{order.tax}</span></div>
                <div className="flex justify-between text-base font-bold text-[#111] pt-1 border-t border-[#E6E6EA]"><span>Total</span><span>৳{order.total}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTrackingPage
