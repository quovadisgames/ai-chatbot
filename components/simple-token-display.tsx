'use client';

import { Progress } from '@/components/ui/progress';

interface SimpleTokenDisplayProps {
  current: number;
  limit: number;
  label?: string;
  className?: string;
}

export function SimpleTokenDisplay({
  current,
  limit,
  label = 'Tokens',
  className = ''
}: SimpleTokenDisplayProps) {
  // Calculate percentage
  const percentage = Math.min(Math.round((current / limit) * 100), 100);
  
  // Determine color based on usage
  const getColorClass = () => {
    if (percentage < 50) return 'text-green-600 dark:text-green-400';
    if (percentage < 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className={`font-medium ${getColorClass()}`}>
          {label}: {current}/{limit}
        </span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 w-32" 
        indicatorClassName={
          percentage < 50 ? "bg-green-500" : 
          percentage < 80 ? "bg-amber-500" : 
          "bg-red-500"
        }
      />
    </div>
  );
} 