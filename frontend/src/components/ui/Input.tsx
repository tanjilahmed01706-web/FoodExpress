import { forwardRef } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-semibold text-[#111]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-3 py-2.5 rounded-xl border text-sm text-[#111] bg-white placeholder-[#6B7280]
            transition-all duration-150
            ${error
              ? 'border-[#E22B4A] ring-[2px] ring-[#E22B4A]/20'
              : 'border-[#E6E6EA] focus:border-[#D70F64] focus:ring-2 focus:ring-[#D70F64]/20'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-[#E22B4A] mt-0.5">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-semibold text-[#111]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-xl border text-sm text-[#111] bg-white
            appearance-none cursor-pointer transition-all duration-150
            ${error
              ? 'border-[#E22B4A]'
              : 'border-[#E6E6EA] focus:border-[#D70F64] focus:ring-2 focus:ring-[#D70F64]/20'
            }
            ${className}
            bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:10px] bg-[right_10px_center] pr-9
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#E22B4A] mt-0.5">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-semibold text-[#111]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-xl border text-sm text-[#111] bg-white placeholder-[#6B7280]
            resize-y min-h-[88px] transition-all duration-150
            ${error
              ? 'border-[#E22B4A] ring-[2px] ring-[#E22B4A]/20'
              : 'border-[#E6E6EA] focus:border-[#D70F64] focus:ring-2 focus:ring-[#D70F64]/20'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-[#E22B4A] mt-0.5">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

interface CheckboxProps {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked = false, onChange, disabled, className = '' }, ref) => {
    return (
      <label
        className={`
          flex items-center gap-2.5 cursor-pointer select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-[#E6E6EA] text-[#D70F64] focus:ring-[#D70F64]/30 focus:ring-offset-0 cursor-pointer"
        />
        {label && <span className="text-sm text-[#111]">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
