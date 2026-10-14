/**
 * FoodExpress auth context.
 * Every panel + the admin shell uses this to know who is logged in and which
 * panel (customer / restaurant / rider / admin) to show.
 *
 * Storage: JWT + user are persisted in memory only (not localStorage) so a
 * refresh does not leave a stale session; the app re-logs in from the stored
 * credentials only when the user explicitly enabled "remember me".
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { AUTH } from '../config'
import type { FoodExpressUser } from '../types'

interface AuthState {
  user: FoodExpressUser | null
  token: string | null
  loading: boolean
  rememberMe: boolean
}

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (
    username: string,
    email: string,
    password: string,
    panelRole: FoodExpressUser['panelRole'],
    rememberMe?: boolean,
  ) => Promise<void>
  logout: () => void
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'foodexpress_auth'

function decodeTokenUser(token: string): FoodExpressUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''))
    if (!payload || typeof payload !== 'object') return null
    // Strapi JWT payload: id, username, email, iat, exp, ... plus any custom
    // fields we set on the user (panelRole, firstName, lastName, phone, ...).
    return {
      id: payload.id as number,
      documentId: payload.documentId as string ?? '',
      username: payload.username as string ?? '',
      email: payload.email as string ?? '',
      provider: payload.provider as string ?? 'local',
      confirmed: Boolean(payload.confirmed),
      blocked: Boolean(payload.blocked),
      firstName: payload.firstName as string | undefined,
      lastName: payload.lastName as string | undefined,
      phone: payload.phone as string | undefined,
      avatar: undefined,
      panelRole: (payload.panelRole as FoodExpressUser['panelRole']) ?? 'customer',
      createdAt: '',
      updatedAt: '',
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    rememberMe: false,
  })
  const mountedRef = useRef(true)

  // Restore a "remember me" session from persisted storage on mount.
  useEffect(() => {
    mountedRef.current = true
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = null
    }
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const user = decodeTokenUser(parsed.token)
        if (user && parsed.token && Date.now() < (parsed.exp * 1000 || Infinity)) {
          setState({ user, token: parsed.token, loading: false, rememberMe: true })
        } else {
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } else {
      setState((s) => ({ ...s, loading: false }))
    }
    return () => {
      mountedRef.current = false
    }
  }, [])

  const saveSession = useCallback(
    (token: string, user: FoodExpressUser, rememberMe: boolean) => {
      if (!mountedRef.current) return
      if (rememberMe) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1] ?? ''))
          const exp = payload.exp as number | undefined
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ token, user, exp: exp ?? Date.now() / 1000 + 3600 }),
          )
        } catch {
          /* ignore storage errors */
        }
      } else {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
      }
    },
    [],
  )

  const login = useCallback(
    async (identifier: string, password: string, rememberMe = false) => {
      const res = await AUTH.login(identifier, password)
      if (!res.jwt || !res.user) throw new Error('Login failed')
      setState({ user: res.user, token: res.jwt, loading: false, rememberMe })
      saveSession(res.jwt, res.user, rememberMe)
    },
    [saveSession],
  )

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      panelRole: FoodExpressUser['panelRole'],
      rememberMe = false,
    ) => {
      const res = await AUTH.register({ username, email, password })
      if (!res.jwt || !res.user) throw new Error('Registration failed')
      // Ensure the panel role is written back to the user record so the backend
      // policies can scope data to this panel. We patch the user after creation.
      const patched = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/users/${res.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${res.jwt}`,
        },
        body: JSON.stringify({ panelRole }),
      }).then((r) => r.ok ? r.json() : null)
      const finalUser = patched?.user ? ({ ...res.user, ...patched.user } as FoodExpressUser) : res.user
      setState({ user: finalUser, token: res.jwt, loading: false, rememberMe })
      saveSession(res.jwt, finalUser, rememberMe)
    },
    [saveSession],
  )

  const logout = useCallback(() => {
    setState({ user: null, token: null, loading: false, rememberMe: false })
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const checkSession = useCallback(async () => {
    if (!state.token) return
    // In a real app you would call /api/users/me to validate the token. For
    // FoodExpress we treat the decoded payload as valid until a request fails.
    const user = decodeTokenUser(state.token)
    if (!user) {
      logout()
      return
    }
    setState((s) => ({ ...s, user }))
  }, [state.token, logout])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Convenience: true when a real (non-guest) user is logged in. */
export function useIsLoggedIn() {
  const { user, loading } = useAuth()
  return { loggedIn: !!user && !loading, user, loading }
}

/** Convenience: the current panel role, defaulting to 'customer' when unknown. */
export function usePanelRole() {
  const { user } = useAuth()
  return (user?.panelRole ?? 'customer') as FoodExpressUser['panelRole']
}
