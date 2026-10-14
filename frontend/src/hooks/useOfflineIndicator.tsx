import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="bg-[#E22B4A] text-white text-center text-xs py-1.5 px-4 font-medium tracking-wide animate-pulse">
      You are offline — some features may not work until you reconnect.
    </div>
  )
}
