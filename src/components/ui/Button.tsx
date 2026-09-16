import { type ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export const buttonVariantClasses: Record<Variant, string> = {
  primary:
    'bg-gold text-ink hover:bg-gold-bright active:brightness-95 disabled:bg-surface-2 disabled:text-ivory-faint',
  secondary:
    'bg-transparent text-ivory border border-surface-border hover:border-gold hover:text-gold',
  ghost: 'bg-transparent text-ivory-muted hover:text-ivory hover:bg-surface-2',
  danger: 'bg-danger text-ivory hover:brightness-110',
};

export const buttonSizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return clsx(
    'inline-flex items-center justify-center font-medium tracking-wide rounded-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    extra,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonClasses(variant, size, className)}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
