/**
 * Customer cart context.
 * Holds lines the customer is about to checkout. The actual pricing is computed
 * server-side in the backend order pipeline (menu-item prices are never trusted
 * from the client). This context only stores what the backend expects at checkout:
 *   { menuItemId, qty, note? }[]
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface CartLine {
  menuItemId: string
  qty: number
  note?: string
}

interface CartContextValue {
  lines: CartLine[]
  itemCount: number
  isOpen: boolean
  addLine: (menuItemId: string, qty?: number, note?: string) => void
  setQty: (menuItemId: string, qty: number) => void
  removeLine: (menuItemId: string) => void
  clear: () => void
  open: () => void
  close: () => void
  toggle: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Persist cart across refreshes so a customer can come back to it within a
  // session (in-memory only — never localStorage secrets).
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('fe_cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setLines(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      if (lines.length) window.sessionStorage.setItem('fe_cart', JSON.stringify(lines))
      else window.sessionStorage.removeItem('fe_cart')
    } catch {
      /* ignore */
    }
  }, [lines])

  const addLine = useCallback((menuItemId: string, qty = 1, note?: string) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.menuItemId === menuItemId)
      if (idx >= 0) {
        const next = prev.slice()
        next[idx] = { ...next[idx], qty: Math.min(50, Math.max(1, next[idx].qty + qty)), note: note ?? next[idx].note }
        return next
      }
      return [...prev, { menuItemId, qty: Math.min(50, Math.max(1, qty)), note }]
    })
    setIsOpen(true)
  }, [])

  const setQty = useCallback((menuItemId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.menuItemId === menuItemId ? { ...l, qty: Math.min(50, Math.max(0, qty)) } : l)),
    )
  }, [])

  const removeLine = useCallback((menuItemId: string) => {
    setLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((o) => !o), [])

  const itemCount = lines.reduce((s, l) => s + l.qty, 0)

  return (
    <CartContext.Provider
      value={{ lines, itemCount, isOpen, addLine, setQty, removeLine, clear, open, close, toggle }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
