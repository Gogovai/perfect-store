import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        hoverable && 'transition-all duration-200 hover:shadow-md hover:border-gray-300',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)} ref={ref} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('px-6 py-4', className)} ref={ref} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50', className)} ref={ref} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';
