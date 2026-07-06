/**
 * Card Component - Container for grouped content
 * 
 * Design System:
 * - Flexible layout (header, body, footer)
 * - Elevation shadows for depth
 * - Hover states for interactive cards
 * - Support for loading states
 * 
 * Performance:
 * - Memoized sections
 * - Efficient re-renders
 * 
 * Accessibility:
 * - Semantic HTML
 * - Proper heading hierarchy
 */

'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, elevated = false, loading = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface-900 border border-surface-800 rounded-xl overflow-hidden transition-all duration-200',
        interactive && 'hover:border-surface-700 hover:shadow-elevation-2 cursor-pointer',
        elevated && 'shadow-elevation-2',
        !elevated && 'shadow-elevation-1',
        loading && 'opacity-70 pointer-events-none',
        className
      )}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, icon, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-surface-800', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && <div className="flex-shrink-0 text-surface-400">{icon}</div>}
          <div className="min-w-0">
            {title && <h2 className="text-heading-sm text-surface-50 truncate">{title}</h2>}
            {subtitle && <p className="text-body-sm text-surface-500 mt-1 truncate">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, padded = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col', padded && 'px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardBody.displayName = 'CardBody';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  divider?: boolean;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, divider = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 flex items-center justify-between gap-4',
        divider && 'border-t border-surface-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps };
