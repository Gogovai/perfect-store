import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  message?: string;
}

export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = 'md', fullscreen = false, message, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-6 w-6',
      md: 'h-10 w-10',
      lg: 'h-16 w-16',
    };

    const spinner = (
      <svg
        className={cn('animate-spin text-blue-600', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    if (fullscreen) {
      return (
        <div
          className={cn(
            'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50',
            className
          )}
          ref={ref}
          {...props}
        >
          <div className="flex flex-col items-center gap-4">
            {spinner}
            {message && <p className="text-gray-600 text-sm">{message}</p>}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn('flex items-center justify-center gap-3', className)}
        ref={ref}
        {...props}
      >
        {spinner}
        {message && <p className="text-gray-600 text-sm">{message}</p>}
      </div>
    );
  }
);

Loading.displayName = 'Loading';
