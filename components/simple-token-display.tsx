'use client';

import React from 'react';
import { useTheme } from '@/hooks/use-theme';

interface SimpleTokenDisplayProps {
  current: number;
  limit: number;
  savings?: number;
}

export function SimpleTokenDisplay({ current, limit, savings }: SimpleTokenDisplayProps) {
  const { currentTheme } = useTheme();
  const percentage = (current / limit) * 100;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col items-end">
        <div className="text-sm font-medium">
          {current}/{limit} tokens
        </div>
        {savings !== undefined && (
          <div className="text-xs text-muted-foreground">
            {savings}% savings
          </div>
        )}
      </div>
      <div className="w-24 h-2 bg-accent/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full
            ${currentTheme === 'kotor' ? 'bg-[rgb(0,191,255)]' :
              currentTheme === 'swjs' ? 'bg-[rgb(255,136,0)]' :
              'bg-accent'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 