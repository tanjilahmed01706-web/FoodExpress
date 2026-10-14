import { useParams as reactUseParams } from 'react-router-dom'
import { useMemo } from 'react'

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  const params = reactUseParams()
  return useMemo(() => params as T, [params])
}
