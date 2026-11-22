import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-td disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        brand: 'bg-brand text-brand-foreground hover:bg-td-green-600 hover:text-primary-foreground',
        accent: 'bg-gold text-accent-foreground hover:bg-td-gold-600',
        secondary: 'border border-primary bg-surface text-primary hover:bg-td-green-50',
        neutral: 'bg-surface text-foreground shadow-card hover:bg-surface-muted',
        ghost: 'text-primary hover:bg-td-green-50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, fullWidth, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props} />
}
