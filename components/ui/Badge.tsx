import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium', {
  variants: {
    variant: {
      default: 'bg-gray-100 text-gray-900',
      primary: 'bg-blue-100 text-blue-900',
      success: 'bg-green-100 text-green-900',
      warning: 'bg-yellow-100 text-yellow-900',
      danger: 'bg-red-100 text-red-900',
      secondary: 'bg-purple-100 text-purple-900',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div className={cn(badgeVariants({ variant }), className)} ref={ref} {...props} />
  )
);

Badge.displayName = 'Badge';
