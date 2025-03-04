'use client';

import { useEffect, useState } from 'react';

interface TokenUsageStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
}

export function ChatTokenCount({ chatId }: { chatId: string }) {
  const [usage, setUsage] = useState<TokenUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/token-usage?chatId=${chatId}`);
      
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
    
    // Set up interval to refresh data every 5 seconds
    const intervalId = setInterval(fetchUsage, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [chatId]);

  if (loading && !usage) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 bg-muted/50 rounded">
        <span className="animate-pulse">Loading tokens...</span>
      </div>
    );
  }

  if (error || !usage) {
    return null; // Don't show anything if there's an error or no data
  }

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-2 px-2 py-1 bg-muted/50 rounded">
      <div className="flex items-center gap-1">
        <span>Total:</span>
        <span className="font-medium">{usage.totalTokens.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Prompt:</span>
        <span className="font-medium">{usage.totalPromptTokens.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Completion:</span>
        <span className="font-medium">{usage.totalCompletionTokens.toLocaleString()}</span>
      </div>
    </div>
  );
} 