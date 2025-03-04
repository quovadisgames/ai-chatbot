'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
    try {
      setLoading(true);
      const response = await fetch(`/api/token-usage?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token usage');
      }
      
      const data = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      setError('Error fetching token usage data');
      console.error(err);
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
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription>Loading token usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription>No token usage data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { totalPromptTokens, totalCompletionTokens, totalTokens } = usage;
  
  // Calculate percentages for the progress bars
  const promptPercentage = totalTokens > 0 ? (totalPromptTokens / totalTokens) * 100 : 0;
  const completionPercentage = totalTokens > 0 ? (totalCompletionTokens / totalTokens) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage</CardTitle>
        <CardDescription>Your AI token consumption</CardDescription>
      </CardHeader>
      <CardContent>
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
            <Progress value={promptPercentage} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Completion Tokens</span>
              <span className="text-sm">{totalCompletionTokens.toLocaleString()} ({completionPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 