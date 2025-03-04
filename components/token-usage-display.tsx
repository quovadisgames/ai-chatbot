'use client';

import { useEffect, useState } from 'react';

interface TokenUsageStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
}

interface TokenUsageDisplayProps {
  userId: string;
  refreshInterval?: number; // in milliseconds
}

export function TokenUsageDisplay({ 
  userId, 
  refreshInterval = 60000 // default to 1 minute
}: TokenUsageDisplayProps) {
  const [usage, setUsage] = useState<TokenUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/token-usage?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token usage: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure we have the expected data structure
      setUsage({
        totalPromptTokens: Number(data.totalPromptTokens) || 0,
        totalCompletionTokens: Number(data.totalCompletionTokens) || 0,
        totalTokens: Number(data.totalTokens) || 0
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching token usage data:', err);
      setError(err instanceof Error ? err.message : 'Error fetching token usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    
    // Set up interval to refresh data
    const intervalId = setInterval(fetchUsage, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [userId, refreshInterval]);

  if (loading && !usage) {
    return (
      <div className="border rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Token Usage</h3>
          <p className="text-sm text-muted-foreground">Loading token usage data...</p>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Token Usage</h3>
          <p className="text-sm text-muted-foreground">Error loading data</p>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="border rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Token Usage</h3>
          <p className="text-sm text-muted-foreground">No token usage data available</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Start using the AI chatbot to see your token usage statistics.
        </p>
      </div>
    );
  }

  const { totalPromptTokens, totalCompletionTokens, totalTokens } = usage;
  
  // Calculate percentages for the progress bars
  const promptPercentage = totalTokens > 0 ? (totalPromptTokens / totalTokens) * 100 : 0;
  const completionPercentage = totalTokens > 0 ? (totalCompletionTokens / totalTokens) * 100 : 0;

  return (
    <div className="border rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Token Usage</h3>
        <p className="text-sm text-muted-foreground">Your AI token consumption</p>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Total Tokens</span>
            <span className="text-sm font-medium">{totalTokens.toLocaleString()}</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Prompt Tokens</span>
            <span className="text-sm">{totalPromptTokens.toLocaleString()} ({promptPercentage.toFixed(1)}%)</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${promptPercentage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Completion Tokens</span>
            <span className="text-sm">{totalCompletionTokens.toLocaleString()} ({completionPercentage.toFixed(1)}%)</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 