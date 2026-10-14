import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../lib/cart'
import { useBrand } from '../../lib/brand'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Chip } from '../../components/ui/Badge'

export function CartPage() {
  const { brand } = useBrand()
  const { lines, itemCount, setQty, removeLine } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const estimatedSubtotal = useMemo(() => {
    // We cannot compute real totals without menu prices; show placeholder until checkout calls the backend.
    return lines.reduce((s, l) => s + Number(l.qty || 0) * 200, 0)
  }, [lines])

  // Placeholder delivery/fee values for the UI only — real values come from the backend checkout.
  const fee = brand.freeDeliveryThreshold && estimatedSubtotal >= brand.freeDeliveryThreshold ? 0 : (brand.defaultDeliveryFee ?? 40)
  const tax = brand.taxRate ? Math.round(((estimatedSubtotal - promoDiscount) * brand.taxRate) / 100) : 0
  const total = Math.max(0, estimatedSubtotal + fee + tax - promoDiscount)

  const canCheckout = lines.length > 0

  const handlePromo = async () => {
    if (!promoCode.trim()) return
    setPromoError('')
    // Backend coupon validation is done at checkout. Here we just clear any prior error
    // and let the checkout page validate. For UI polish we react to a mocked flow.
    setPromoApplied(true)
    setPromoDiscount(50) // example
    setTimeout(() => {
      setPromoCode('')
      setPromoApplied(false)
      setPromoDiscount(0)
    }, 3000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      {/* Header */}
      <div className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#111]">Your cart</h1>
            <p className="text-sm text-[#6B7280]">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button className="fe-btn fe-btn.ghost fe-btn.sm">Clear cart</button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-6">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🛒</span>
            <h2 className="text-xl font-bold text-[#111] mb-1">Your cart is empty</h2>
            <p className="text-sm text-[#6B7280] mb-5">Add some delicious food to get started!</p>
            <Link to="/" className="fe-btn fe-btn.primary">Start ordering</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              {lines.map((line) => (
                <CartLine key={line.menuItemId} line={line} onQtyChange={(qty) => setQty(line.menuItemId, qty)} onRemove={() => removeLine(line.menuItemId)} />
              ))}
            </div>

            {/* Summary */}
            <div className="md:col-span-1">
              <Card className="sticky top-20">
                <h3 className="font-bold text-lg text-[#111] mb-4 pb-4 border-b border-[#E6E6EA]">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Subtotal (est.)</span>
                    <span>৳{estimatedSubtotal}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-[#12A860]">
                      <span className="flex items-center gap-1"><Chip>Discount</Chip> Promo applied</span>
                      <span>-৳{promoDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Delivery fee</span>
                    <span>{fee === 0 ? <Chip variant="success">Free</Chip> : `৳${fee}`}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Tax (est.)</span>
                    <span>৳{tax}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-[#111] pt-2 border-t border-[#E6E6EA] mt-2">
                    <span>Total</span>
                    <span>৳{total}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Input
                    label="Promo code"
                    placeholder="e.g. WELCOME10"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    error={promoError}
                  />
                  <Button onClick={handlePromo} className="mt-2 w-full" variant="ghost" disabled={!promoCode.trim() || promoApplied}>
                    Apply
                  </Button>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E6E6EA]">
                  <p className="text-xs text-[#6B7280] mb-3">Real prices, delivery fee and taxes are calculated at checkout.</p>
                  {canCheckout ? (
                    <Link to="/checkout" className="fe-btn fe-btn.primary w-full fe-btn.lg">
                      Proceed to checkout
                    </Link>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CartLine({ line, onQtyChange, onRemove }: { line: import('../../lib/cart').CartLine; onQtyChange: (qty: number) => void; onRemove: () => void }) {
  return (
    <div className="fe-card p-4 flex gap-4">
      <div className="w-20 h-20 rounded-lg bg-[#F6F6F8] flex items-center justify-center text-2xl shrink-0">
        <span>🍽️</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-[#111] text-sm">Menu item</h3>
        <p className="text-xs text-[#6B7280] mt-0.5">{line.note ?? ''}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-[#E6E6EA] rounded-full overflow-hidden bg-[#F6F6F8] w-24">
            <button className="px-2.5 h-9 text-sm font-medium text-[#6B7280] hover:bg-white hover:text-[#111] transition" onClick={() => onQtyChange(line.qty - 1)}>−</button>
            <span className="flex-1 text-center text-sm font-medium">{line.qty}</span>
            <button className="px-2.5 h-9 text-sm font-medium text-[#6B7280] hover:bg-white hover:text-[#111] transition" onClick={() => onQtyChange(line.qty + 1)}>+</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#D70F64]">৳{line.qty * 200}</span>
            <button className="text-[#6B7280] hover:text-[#E22B4A] text-sm transition" onClick={onRemove}>Remove</button>
          </div>
        </div>
      </div>
    </div>
  )
}
