import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { API } from '../config'
import type { FoodExpressUser } from '../types'

/**
 * Admin / profile hook: load the current user's full profile from the Strapi
 * Users endpoint once the admin token is available. Mirrors what the admin
 * profile page wants to display.
 */
export function useUserMe() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<FoodExpressUser | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    if (!token) {
      setProfile(null)
      return
    }
    setLoading(true)
    try {
      const res = await API.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setProfile(null)
        return
      }
      const json = await res.json()
      setProfile((json.data ?? json) as FoodExpressUser)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [token])

  return { profile, loading, refresh }
}