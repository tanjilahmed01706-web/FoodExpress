import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  children: ReactNode
  active?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', size = 'md', children, className = '', active, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-semibold rounded-full whitespace-nowrap transition-all duration-150'

    const sizes = {
      sm: 'px-2.5 py-0.5 text-[11px]',
      md: 'px-3 py-1 text-xs',
    }

    const variants: Record<Variant, string> = {
      primary: 'bg-[#D70F64] text-white',
      outline: 'bg-transparent border border-[#D70F64] text-[#D70F64]',
      ghost: 'bg-transparent text-[#D70F64]',
      success: 'bg-[#12A860] text-white',
      warning: 'bg-[#F5A623] text-[#111]',
      danger: 'bg-[#E22B4A] text-white',
    }

    const activeClass = active ? 'ring-2 ring-offset-1 ring-[#D70F64]' : ''

    return (
      <span
        ref={ref}
        className={`
          ${base}
          ${variants[variant]}
          ${sizes[size]}
          ${activeClass}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: 'default' | 'outline' | 'primary' | 'success' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  active?: boolean
  onClick?: () => void
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ children, variant = 'default', size = 'md', active, onClick, className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 cursor-pointer select-none'

    const sizes = {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-3 py-1 text-xs',
    }

    const variants: Record<string, string> = {
      default: 'bg-white text-[#111] border border-[#E6E6EA] hover:border-[#C9C9CD]',
      outline: 'bg-transparent text-[#111] border border-[#E6E6EA] hover:border-[#C9C9CD]',
      primary: 'bg-[#F2EEFF] text-[#D70F64] border border-[#D70F64]/20',
      success: 'bg-[#E7F7EE] text-[#12A860] border border-[#12A860]/20',
      ghost: 'bg-transparent text-[#6B7280]',
    }

    const activeClass = active
      ? 'bg-[#D70F64] text-white border-[#D70F64] shadow-sm'
      : ''

    return (
      <span
        ref={ref}
        className={`
          ${base}
          ${variants[variant]}
          ${sizes[size]}
          ${activeClass}
          ${className}
        `}
        onClick={onClick}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Chip.displayName = 'Chip'
