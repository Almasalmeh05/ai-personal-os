/**
 * Badge Component - Small indicator for status/categories
 * 
 * Design System:
 * - 5 visual variants (primary, success, warning, danger, info)
 * - 3 sizes (sm, md, lg)
 * - Pill and regular shapes
 * - Icon support
 * 
 * Performance:
 * - Lightweight
 * - No state management
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-accent-500/20 text-accent-300',
        success: 'bg-success-500/20 text-success-300',
        warning: 'bg-warning-500/20 text-warning-300',
        danger: 'bg-danger-500/20 text-danger-300',
        info: 'bg-surface-700 text-surface-200',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'md',
    },
  }
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
  onRemove?: () => void;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, icon, onRemove, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-current hover:opacity-70 transition-opacity"
          aria-label={`Remove ${children}`}
        >
          ✕
        </button>
      )}
    </span>
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export type { BadgeProps };
