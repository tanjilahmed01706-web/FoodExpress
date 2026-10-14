import type { FoodExpressUser } from './types'

/**
 * FoodExpress app-wide config.
 * In production you would set STRAPI_URL from env; in development it points
 * at the local Strapi backend (the headless CMS + data layer) so every panel
 * reads live data from the same source of truth.
 */
export const API_URL =
  (typeof window !== 'undefined' && (window as any).__FE_API_URL) ||
  (import.meta.env.VITE_STRAPI_URL as string | undefined) ||
  'http://localhost:1337'

export const API = {
  get: (path: string, opts?: RequestInit) =>
    fetch(`${API_URL}/api${path}`, {
      headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
      ...opts,
      credentials: 'omit',
    }),
  post: (path: string, body: unknown, opts?: RequestInit) =>
    fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
      body: JSON.stringify(body),
      ...opts,
      credentials: 'omit',
    }),
  put: (path: string, body: unknown, opts?: RequestInit) =>
    fetch(`${API_URL}/api${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
      body: JSON.stringify(body),
      ...opts,
      credentials: 'omit',
    }),
  del: (path: string, opts?: RequestInit) =>
    fetch(`${API_URL}/api${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
      ...opts,
      credentials: 'omit',
    }),
}

/**
 * Auth helpers — FoodExpress uses the Strapi Users & Permissions plugin
 * (local strategy) as the identity layer. Every panel logs in through
 * /api/auth/local and sends the JWT on protected requests.
 */
export const AUTH = {
  login: (identifier: string, password: string) =>
    fetch(`${API_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
      credentials: 'omit',
    }).then((r) => r.json() as Promise<{
      jwt: string
      user: FoodExpressUser
    }>),
  register: (body: { username: string; email: string; password: string }) =>
    fetch(`${API_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
    }).then((r) => r.json() as Promise<{ jwt: string; user: FoodExpressUser }>),
}

/**
 * Where FoodExpress stores its data (for the user's visibility).
 * - Relational data (restaurants, orders, riders, pages, coupons ...):
 *     SQLite file at backend/.tmp/data.db  (managed by Strapi)
 * - Uploaded media (logos, covers, cuisine images):
 *     backend/public/uploads/
 * - Brand config (logo, favicon, colors, hero text, fees):
 *     backend/src/api/app-setting -> table: app_settings  (singleton row)
 *
 * The FoodExpress panels never touch these files directly; they talk to the
 * Strapi API, which is the single source of truth.
 */
export const STORAGE_NOTE =
  'FoodExpress data is stored in the Strapi backend: SQLite database (backend/.tmp/data.db), uploaded media (backend/public/uploads), and brand settings (api::app-setting singleton).'

/**
 * Branding fallback when no media is uploaded to Strapi yet.
 * The attached FoodExpress artwork (unnamed-1.png) is bundled here so the
 * project is branded from the first run, and the admin can later upload the
 * real logo/favicon through the FoodExpress admin settings page.
 */
export const BRAND_FALLBACK = {
  logo: '/favicon.png', // bundled FoodExpress logo (also used as favicon)
  favicon: '/favicon.png',
}

/** Order status pipeline (matches backend order state machine). */
export const ORDER_STATUS = [
  { value: 'pending', label: 'Pending', color: 'var(--fe-info)' },
  { value: 'confirmed', label: 'Confirmed', color: 'var(--fe-info)' },
  { value: 'preparing', label: 'Preparing', color: 'var(--fe-warning)' },
  { value: 'ready', label: 'Ready for pickup', color: 'var(--fe-warning)' },
  { value: 'picked_up', label: 'Picked up', color: 'var(--fe-warning)' },
  { value: 'on_the_way', label: 'On the way', color: 'var(--fe-accent)' },
  { value: 'delivered', label: 'Delivered', color: 'var(--fe-success)' },
  { value: 'cancelled', label: 'Cancelled', color: 'var(--fe-danger)' },
] as const

export type OrderStatus = (typeof ORDER_STATUS)[number]['value']

/** Rider availability badges. */
export const RIDER_AVAILABILITY = {
  available: { label: 'Available now', color: 'var(--fe-success)' },
  unavailable: { label: 'Off duty', color: 'var(--fe-subtext)' },
} as const
