import { cn } from '@/utils/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'navy'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-baazex text-ink shadow-float hover:bg-baazex-600 disabled:bg-baazex/50',
  secondary:
    'border border-bright/25 bg-white/5 text-ink hover:border-bright/50 hover:text-accent',
  ghost: 'bg-transparent text-ink hover:bg-white/10',
  outline: 'border border-ink/20 bg-white/50 text-ink hover:bg-white',
  danger: 'bg-danger text-white hover:bg-danger/90',
  navy: 'border border-bright/20 bg-navy text-ink hover:border-bright/40 hover:bg-navy-700',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-base rounded-xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition duration-200 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
