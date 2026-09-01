import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', ...props }, ref) => (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        size === 'sm' && 'max-w-2xl',
        size === 'md' && 'max-w-4xl',
        size === 'lg' && 'max-w-6xl',
        size === 'xl' && 'max-w-7xl',
        size === 'full' && 'w-full',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Container.displayName = 'Container';
