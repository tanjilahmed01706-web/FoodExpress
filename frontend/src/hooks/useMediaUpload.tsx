import { useState, useCallback } from 'react'
import { useAuth } from '../lib/auth'
import { API_URL } from '../config'

export function useMediaUpload() {
  const { token } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadMedia = useCallback(
    async (form: FormData) => {
      if (!token) throw new Error('Not authenticated')
      setUploading(true)
      setUploadError(null)
      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err.message as string) || `Upload failed: ${res.status}`)
        }
        return res.json()
      } finally {
        setUploading(false)
      }
    },
    [token],
  )

  return { uploadMedia, uploading, uploadError, clearError: () => setUploadError(null) }
}
