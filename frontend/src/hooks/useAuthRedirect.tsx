import { useSearchParams } from 'react-router-dom'

export function useAuthRedirect() {
  const [searchParams] = useSearchParams()
  return searchParams.get('redirect') ?? '/'
}
