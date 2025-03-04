'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription>Loading token usage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
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
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start using the AI chatbot to see your token usage statistics.
          </p>
        </CardContent>
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
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${promptPercentage}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Completion Tokens</span>
              <span className="text-sm">{totalCompletionTokens.toLocaleString()} ({completionPercentage.toFixed(1)}%)</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 