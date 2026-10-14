import { useEffect, useState } from 'react'

interface ToastProps {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

export default function Toast({ show, message, type = 'success', duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    setVisible(show)
    if (show) {
      const timer = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!visible) return null

  const styles: Record<string, string> = {
    success: 'bg-[#12A860] text-white',
    error: 'bg-[#E22B4A] text-white',
    info: 'bg-[#2B6BE1] text-white',
  }

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-2xl shadow-lg text-sm font-medium
        flex items-center gap-2
        animate-fade-in
        ${styles[type]}
      `}
    >
      {type === 'success' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {type === 'error' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
      {message}
    </div>
  )
}
