import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ className, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex items-center space-x-2">
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {text && <span className="text-sm text-gray-600">{text}</span>}
      </div>
    </div>
  );
}

export function LoadingCard({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loading size="lg" text={text} />
    </div>
  );
}

export function LoadingOverlay({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
      <Loading size="lg" text={text} />
    </div>
  );
}