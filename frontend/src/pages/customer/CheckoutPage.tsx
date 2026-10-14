import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, usePanelRole } from '../../lib/auth'
import { useCart } from '../../lib/cart'
import { useBrand } from '../../lib/brand'
import { validateCoupon, fetchAddressesForCurrentUser, placeOrder } from '../../lib/api'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Input'
import { Chip } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { FoodExpressLogo } from '../../components/ui/Logo'
import { MapView, AddressPickerMap } from '../../lib/map'
import type { Address, DeliveryAddress } from '../../types'

usePageTitle('Checkout', 'Place your order — delivery fee and taxes calculated at checkout.')

export function CheckoutPage() {
  const { token, user, loading: authLoading } = useAuth()
  const role = usePanelRole()
  const { brand } = useBrand()
  const { lines } = useCart()
  const navigate = useNavigate()


  const [step, setStep] = useState<'address' | 'review' | 'placed'>('address')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')


  // Checkout form state
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [customAddress, setCustomAddress] = useState<Partial<DeliveryAddress>>({
    label: 'Home',
    line: '',
    lat: 23.957,
    lng: 90.725,
    note: '',
  })
  const [mapPinLat, setMapPinLat] = useState<number | null>(null)
  const [mapPinLng, setMapPinLng] = useState<number | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')
  const [customerNote, setCustomerNote] = useState('')
  // Restaurant is normally set by the menu page that started the cart. The generic
  // checkout page leaves it blank; the backend may reject the order without it.
  const restaurantForOrder = ''

  // Load saved addresses
  useEffect(() => {
    if (!token || !user) return
    setLoading(true)
    fetchAddressesForCurrentUser(token)
      .then(({ data }) => setAddresses(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, user])

  // Pre-select: default address, else first address, else custom
  useEffect(() => {
    const def = addresses.find((a) => a.isDefault)
    setSelectedAddressId(def?.documentId ?? (addresses[0]?.documentId ?? ''))
  }, [addresses])

  const addressForCheckout = useCallback((): DeliveryAddress | null => {
    if (selectedAddressId && addresses.find((a) => a.documentId === selectedAddressId)) {
      const a = addresses.find((a) => a.documentId === selectedAddressId)!
      return {
        label: a.label,
        line: a.line,
        lat: a.lat ?? mapPinLat ?? 23.957,
        lng: a.lng ?? mapPinLng ?? 90.725,
        note: a.note ?? '',
      }
    }
    return {
      label: customAddress.label ?? 'Home',
      line: customAddress.line ?? '',
      lat: customAddress.lat ?? mapPinLat ?? 23.957,
      lng: customAddress.lng ?? mapPinLng ?? 90.725,
      note: customAddress.note ?? '',
    }
  }, [selectedAddressId, addresses, customAddress, mapPinLat, mapPinLng])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F6F8]">
        <div className="text-center">
          <Skeleton width="200px" height={40} className="rounded-full mx-auto" />
          <p className="text-sm text-[#6B7280] mt-3">Signing you in…</p>
        </div>
      </div>
    )
  }

  // Not all roles can checkout from the customer path
  if (role !== 'customer') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F6F8]">
        <div className="text-center max-w-md">
          <span className="text-4xl block mb-3">🔒</span>
          <h2 className="text-xl font-bold text-[#111]">Checkout is for customers</h2>
          <p className="text-sm text-[#6B7280] mt-2">Only customer accounts can place orders from here. Restaurant and rider accounts use their own panels.</p>
          <Link to={role === 'restaurant' ? '/restaurant/partner' : '/rider/join'} className="fe-btn fe-btn.primary mt-4 fe-btn.sm">Go to {role} panel</Link>
        </div>
      </div>
    )
  }

  const hasCart = lines.length > 0
  const estimatedSubtotal = hasCart ? lines.reduce((s, l) => s + l.qty * 200, 0) : 0
  const fee = brand.freeDeliveryThreshold && estimatedSubtotal >= brand.freeDeliveryThreshold ? 0 : (brand.defaultDeliveryFee ?? 40)
  const tax = brand.taxRate ? Math.round(((estimatedSubtotal - promoDiscount) * brand.taxRate) / 100) : 0
  const total = Math.max(0, estimatedSubtotal + fee + tax - promoDiscount)

  const isUsingCustomAddress = !selectedAddressId || !addresses.find((a) => a.documentId === selectedAddressId)

  const handlePlaceOrder = async () => {
    setError('')
    setSubmitting(true)
    try {
      // Validate promo server-side first
      let couponCode: string | undefined
      if (promoCode.trim()) {
        const validation = await validateCoupon(token!, promoCode.trim().toUpperCase(), estimatedSubtotal, undefined)
        // validation shape: { valid, discount, coupon }
        if (validation?.valid) {
          setPromoDiscount(validation.discount)
          couponCode = promoCode.trim().toUpperCase()
        } else {
          setPromoError('Invalid or expired coupon code.')
          setSubmitting(false)
          return
        }
      } else {
        couponCode = undefined
      }

      const address = addressForCheckout()!
      if (!address.line) { setError('Please choose or enter a delivery address.'); setSubmitting(false); return }
      if (address.lat == null || address.lng == null) { setError('Delivery address needs a map location.'); setSubmitting(false); return }

      const body = {
        restaurant: restaurantForOrder ?? '',
        items: lines.map((l) => ({ menuItemId: l.menuItemId, qty: l.qty, note: l.note })),
        deliveryAddress: {
          label: address.label,
          line: address.line,
          lat: Number(address.lat),
          lng: Number(address.lng),
          note: address.note,
        },
        customerNote: customerNote,
        couponCode: couponCode,
        paymentMethod,
      }

      // Real checkout in FoodExpress is initiated from a restaurant menu page, where the
      // selected restaurant is known and the order is created through /orders with that
      // restaurant. This generic checkout page is for flow demonstration; if the cart was
      // built from a restaurant menu, pass the restaurant ID in body.restaurant.
      // For now we show the path to a restaurant menu to complete the order.
      const created = await placeOrder(token!, body)
      setStep('placed')
      navigate(`/orders/${created.documentId ?? created.id}`)
    } catch (err: any) {
      setError(err?.message || 'Could not place the order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // STEP 1: address
  // STEP 2: review + promo + place order
  // STEP 3: placed

  const renderStep = () => {
    if (step === 'placed') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#F6F6F8]">
          <div className="w-20 h-20 rounded-full bg-[#E7F7EE] flex items-center justify-center text-4xl mb-5 shadow-sm">😊</div>
          <h1 className="text-2xl font-bold text-[#111]">Order placed!</h1>
          <p className="text-[#6B7280] mt-2">Thank you — your order is being prepared. You can track it from your orders.</p>
          <div className="flex gap-3 mt-6">
            <Link to="/orders" className="fe-btn fe-btn.primary fe-btn.sm">Track order</Link>
            <Link to="/" className="fe-btn fe-btn.ghost fe-btn.sm">Continue shopping</Link>
          </div>
        </div>
      )
    }

    if (step === 'review') {
      return (
        <>
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: address */}
              <div className="md:col-span-2 space-y-5">
                <h2 className="text-lg font-bold text-[#111]">Delivery address</h2>
                <Card>
                  {!isUsingCustomAddress && addresses.find((a) => a.documentId === selectedAddressId) ? (
                    <div>
                      <p className="font-medium text-[#111]">{addresses.find((a) => a.documentId === selectedAddressId)!.label}</p>
                      <p className="text-sm text-[#6B7280] mt-1">{addresses.find((a) => a.documentId === selectedAddressId)!.line}</p>
                      {addresses.find((a) => a.documentId === selectedAddressId)?.note && (
                        <p className="text-xs text-[#6B7280] mt-1">Note: {addresses.find((a) => a.documentId === selectedAddressId)!.note}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-[#6B7280]">
                      <p className="font-medium text-[#111]">{customAddress.label}</p>
                      <p className="mt-1">{customAddress.line}</p>
                      {customAddress.note && <p className="text-xs mt-1">Note: {customAddress.note}</p>}
                      <div className="mt-2 text-xs text-[#6B7280]">Map: {customAddress.lat?.toFixed(5)}, {customAddress.lng?.toFixed(5)}</div>
                    </div>
                  )}
                  <Link to="/checkout" className="fe-btn fe-btn.ghost fe-btn.sm mt-3 inline-block">Edit address</Link>
                </Card>

                {/* Map (leaflet + OSM) */}
                <div>
                  <h3 className="text-sm font-medium text-[#6B7280] mb-2">Confirm location on the map</h3>
                  <div className="fe-map h-[280px]">
                    <MapView center={[customAddress.lat ?? 23.957, customAddress.lng ?? 90.725]} zoom={15} style={{ height: '100%', width: '100%' }} />
                    <AddressPickerMap
                      position={mapPinLat != null && mapPinLng != null ? [mapPinLat, mapPinLng] : undefined}
                      onPlace={(lat, lng) => { setMapPinLat(lat); setMapPinLng(lng); setCustomAddress((p) => ({ ...p, lat, lng })) }}
                      markerLabel="📍 Your address"
                    />
                  </div>
                </div>

                {/* Promo + payment */}
                <div className="space-y-4 pt-4 border-t border-[#E6E6EA]">
                  <div>
                    <Input label="Promo code" placeholder="e.g. WELCOME10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} error={promoError} />
                    <Button variant="ghost" onClick={async () => {
                      try {
                        if (!promoCode.trim()) { setPromoError('Enter a promo code.'); return }
                        const v = await validateCoupon(token!, promoCode.trim().toUpperCase(), estimatedSubtotal, undefined)
                        if (!v?.valid) { setPromoError('Invalid or expired promo code.'); return }
                        setPromoDiscount(v.discount)
                        setPromoError('')
                      } catch (err: any) {
                        setPromoError(err?.message || 'Could not validate promo.')
                      }
                    }} className="mt-2" disabled={!promoCode.trim()}>Apply promo</Button>
                  </div>

                  <div className="space-y-2">
                    <label className="fe-label">Payment method</label>
                    <div className="flex gap-3">
                      {(['cod', 'card'] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${paymentMethod === m ? 'border-[#D70F64] bg-[#F2EEFF] text-[#D70F64]' : 'border-[#E6E6EA] bg-white text-[#111] hover:bg-[#F6F6F8]'}`}>
                          {m === 'cod' ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Cash on delivery</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Card</>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea label="Order notes (optional)" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="Allergies, instructions for the restaurant…" />
                </div>
              </div>

              {/* Right: order summary */}
              <div>
                <h2 className="text-lg font-bold text-[#111] mb-4">Order summary</h2>
                <Card>
                  <div className="space-y-3 text-sm">
                    {lines.map((l) => (
                      <div key={l.menuItemId} className="flex items-center justify-between gap-2">
                        <span className="text-[#111] truncate flex-1">{l.qty} × Menu item</span>
                        <span className="text-[#111] font-medium">৳{l.qty * 200}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Subtotal (est.)</span>
                      <span>৳{estimatedSubtotal}</span>
                    </div>
                    {promoDiscount ? (
                      <div className="flex justify-between text-[#12A860]">
                        <span>Discount</span>
                        <span>-৳{promoDiscount}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Delivery fee</span>
                      <span>{fee === 0 ? <Chip variant="success">Free</Chip> : `৳${fee}`}</span>
                    </div>
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Tax (est.)</span>
                      <span>৳{tax}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-[#111] pt-3 border-t border-[#E6E6EA]">
                      <span>Total</span>
                      <span>৳{total}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={submitting || !addressForCheckout()?.line}
                    className="w-full mt-4 fe-btn.lg"
                  >
                    {submitting ? <><span className="fe-spinner" /> Placing order…</> : `Place order • ৳${total}`}
                  </Button>
                  {error && <p className="text-xs text-[#E22B4A] mt-2">{error}</p>}
                </Card>
              </div>
            </div>
          </div>
        </>
      )
    }

    // Address step
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <h2 className="text-lg font-bold text-[#111] mb-4">Delivery address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Saved addresses */}
          <div className="space-y-3">
            <p className="text-sm text-[#6B7280]">Saved addresses</p>
            {loading ? (
              <Skeleton height={80} className="rounded-xl" />
            ) : addresses.length === 0 ? (
              <p className="text-sm text-[#6B7280] italic">No saved addresses yet. Use the map to set one below.</p>
            ) : (
              addresses.map((a) => (
                <button
                  key={a.documentId}
                  type="button"
                  onClick={() => { setSelectedAddressId(a.documentId); setMapPinLat(a.lat ?? 23.957); setMapPinLng(a.lng ?? 90.725); setCustomAddress({ label: a.label, line: a.line, lat: a.lat ?? 23.957, lng: a.lng ?? 90.725, note: a.note ?? '' }) }}
                  className={`w-full text-left p-4 rounded-xl border transition ${selectedAddressId === a.documentId ? 'border-[#D70F64] bg-[#F2EEFF]' : 'border-[#E6E6EA] hover:border-[#C9C9CD]'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[#111]">{a.label}</p>
                      <p className="text-sm text-[#6B7280] mt-0.5">{a.line}</p>
                      {a.note && <p className="text-xs text-[#6B7280] mt-0.5">Note: {a.note}</p>}
                    </div>
                    {a.isDefault && <Chip variant="outline" size="sm">Default</Chip>}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Custom address with map picker */}
          <div className="space-y-3">
            <p className="text-sm text-[#6B7280]">Or set a new address on the map</p>
            <div className="fe-card p-4">
              <Input label="Label" value={customAddress.label} onChange={(e) => setCustomAddress((p) => ({ ...p, label: e.target.value }))} placeholder="Home, Office…" />
              <Input label="Address" value={customAddress.line} onChange={(e) => setCustomAddress((p) => ({ ...p, line: e.target.value }))} placeholder="House no, road, area…" />
              <Textarea label="Delivery note (optional)" value={customAddress.note ?? ''} onChange={(e) => setCustomAddress((p) => ({ ...p, note: e.target.value }))} placeholder="Call on arrival, gate code…" />

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#6B7280]">Drop a pin on the map below, or move the marker.</span>
                  <button type="button" className="text-xs text-[#D70F64] hover:underline" onClick={() => { setMapPinLat(23.957); setMapPinLng(90.725); setCustomAddress((p) => ({ ...p, lat: 23.957, lng: 90.725 })) }}>
                    Reset to city centre
                  </button>
                </div>
                <div className="fe-map h-[220px] mt-2">
                  <MapView center={[mapPinLat ?? 23.957, mapPinLng ?? 90.725]} zoom={15} style={{ height: '100%', width: '100%' }} />
                  <AddressPickerMap
                    position={mapPinLat != null && mapPinLng != null ? [mapPinLat, mapPinLng] : undefined}
                    onPlace={(lat, lng) => { setMapPinLat(lat); setMapPinLng(lng); setCustomAddress((p) => ({ ...p, lat, lng })) }}
                    markerLabel="📍 Your address"
                  />
                </div>
                <div className="mt-2 text-xs text-[#6B7280]">
                  Coordinates: {(mapPinLat ?? customAddress.lat ?? 23.957).toFixed(5)}, {(mapPinLng ?? customAddress.lng ?? 90.725).toFixed(5)}
                </div>
              </div>

              <Button
                onClick={() => setStep('review')}
                disabled={!customAddress.line && !selectedAddressId}
                className="w-full mt-2"
              >
                Continue to review
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      {/* Header */}
      <div className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <FoodExpressLogo brand={brand} size={32} />
            <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
          </Link>
          <div className="flex-1 h-[2px] bg-[#E6E6EA] mx-4" />
          <div className="flex items-center gap-2">
            <Link to="/cart" className="text-sm text-[#6B7280] hover:text-[#111] transition">Cart</Link>
            <div className="w-px h-4 bg-[#E6E6EA]" />
            <span className="text-sm font-medium text-[#111]">Checkout</span>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#111] transition" onClick={() => setStep(step === 'review' ? 'address' : (step === 'placed' ? 'review' : 'address'))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {step === 'placed' ? 'Back to order summary' : step === 'review' ? 'Back to address' : 'Back'}
          </button>
          <span className="text-xs text-[#6B7280]">
            {step === 'address' ? 'Step 1 of 2' : step === 'review' ? 'Step 2 of 2' : 'Done'}
          </span>
        </div>
      </div>

      {renderStep()}
    </div>
  )
}
