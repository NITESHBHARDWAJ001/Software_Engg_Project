import React from 'react';
import { classNames } from '../../utils/helpers';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className={classNames('inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-primary', sizes[size], className)} role="status" aria-label="loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  text = 'Loading...',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-sm text-gray-600">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-gray-600">{text}</p>
      </div>
    </div>
  );
};
