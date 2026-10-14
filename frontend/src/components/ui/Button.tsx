import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'fill'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  to?: string
  href?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold border-0 border-radius-[999px] cursor-pointer transition-all duration-150 select-none text-sm'

    const variants = {
      primary:
        'bg-[#D70F64] text-white shadow-[0_6px_16px_-6px_rgba(215,15,100,0.55)] hover:bg-[#B3094F] hover:shadow-[0_8px_22px_-6px_rgba(215,15,100,0.7)] active:scale-[0.98]',
      ghost:
        'bg-transparent text-[#111] border border-[#E6E6EA] hover:bg-[#F6F6F8] hover:text-[#111]',
      fill:
        'bg-[#111] text-white hover:bg-[#2A2A2A]',
    }

    const sizes = {
      sm: 'px-5 py-2 text-xs',
      md: 'px-7 py-3 text-sm',
      lg: 'px-9 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
