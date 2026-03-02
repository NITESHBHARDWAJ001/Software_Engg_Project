import React, { HTMLAttributes } from 'react';
import { classNames } from '../../utils/helpers';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-700 ring-primary-600/20',
    success: 'bg-green-100 text-green-700 ring-green-600/20',
    warning: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20',
    danger: 'bg-red-100 text-red-700 ring-red-600/20',
    info: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    neutral: 'bg-gray-100 text-gray-700 ring-gray-600/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
