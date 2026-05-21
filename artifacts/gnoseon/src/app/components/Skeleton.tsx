/**
 * Skeleton loading components for better UX
 * Provides placeholder UI while content is loading
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'text',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton variants for common UI patterns
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? '60%' : '100%'}
        variant="text"
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <Skeleton
    width={size}
    height={size}
    variant="circular"
    className={className}
  />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <SkeletonAvatar size={48} />
      <div className="flex-1">
        <Skeleton height={20} width="40%" className="mb-2" />
        <Skeleton height={14} width="60%" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonMessage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-start space-x-3 mb-4 ${className}`}>
    <SkeletonAvatar size={32} />
    <div className="flex-1">
      <Skeleton height={16} width="30%" className="mb-2" />
      <Skeleton height={40} width="80%" variant="rectangular" className="rounded-lg" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1">
          <Skeleton height={16} width="40%" className="mb-1" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonButton: React.FC<{ width?: string | number; className?: string }> = ({
  width = 120,
  className = '',
}) => (
  <Skeleton
    width={width}
    height={36}
    variant="rectangular"
    className={className}
  />
);

export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton height={40} variant="rectangular" className={`rounded-md ${className}`} />
);

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}> = ({ isLoading, children, message }) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          {message && <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>}
        </div>
      </div>
    )}
  </div>
);

// Loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Progress bar component
export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}> = ({ progress, className = '', showLabel = false, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

// Loading states for specific components
export const ChatSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-col h-full ${className}`}>
    <div className="p-4 border-b dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1">
          <Skeleton height={16} width="30%" className="mb-1" />
          <Skeleton height={12} width="20%" />
        </div>
      </div>
    </div>
    <div className="flex-1 p-4 space-y-4">
      <SkeletonMessage />
      <SkeletonMessage />
      <SkeletonMessage />
    </div>
    <div className="p-4 border-t dark:border-gray-700">
      <SkeletonInput />
    </div>
  </div>
);

export const ContactsSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 ${className}`}>
    <Skeleton height={32} width="60%" className="mb-4" />
    <SkeletonList items={8} />
  </div>
);

export const SettingsSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 space-y-6 ${className}`}>
    <div className="space-y-4">
      <Skeleton height={20} width="30%" />
      <SkeletonInput className="mb-4" />
      <SkeletonInput />
    </div>
    <div className="space-y-4">
      <Skeleton height={20} width="40%" />
      <SkeletonInput className="mb-4" />
      <SkeletonInput />
    </div>
    <div className="flex justify-end space-x-3">
      <SkeletonButton width={80} />
      <SkeletonButton width={100} />
    </div>
  </div>
);

// Add shimmer animation to global styles
export const addShimmerStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
    const style = document.createElement('style');
    style.id = 'shimmer-styles';
    style.textContent = `
      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }
      
      .animate-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite;
      }
      
      .dark .animate-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        background-size: 1000px 100%;
      }
    `;
    document.head.appendChild(style);
  }
};
