'use client';

import React from 'react';

export interface SimpleTokenDisplayProps {
  current: number;
  limit: number;
  label?: string;
}

export function SimpleTokenDisplay({
  current,
  limit,
  label = 'Tokens'
}: SimpleTokenDisplayProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.round((current / limit) * 100));
  
  // Determine color based on usage
  const getColor = () => {
    if (percentage < 50) return 'var(--current-accent)';
    if (percentage < 80) return 'orange';
    return 'red';
  };
  
  return (
    <div className="token-display">
      <div className="token-label">{label}</div>
      <div className="token-bar-container">
        <div 
          className="token-bar-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
      <div className="token-count">
        {current} / {limit}
      </div>
    </div>
  );
} 