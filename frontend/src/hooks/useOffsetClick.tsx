import { useState, useCallback } from 'react'

export function useOffsetClick(offset = 8) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      setPosition({
        x: e.currentTarget.getBoundingClientRect().left + offset,
        y: e.currentTarget.getBoundingClientRect().bottom + offset,
      })
    },
    [offset],
  )

  const reset = useCallback(() => setPosition(null), [])

  return { position, handleClick, reset }
}
