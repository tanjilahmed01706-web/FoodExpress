import type { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ width, height, className = '', style, ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-[#F0F0F2] rounded-xl animate-pulse ${className}`}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  )
}
