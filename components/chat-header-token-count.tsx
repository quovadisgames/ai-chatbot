'use client';

import { useEffect, useState } from 'react';

interface TokenUsageStats {
  totalTokens: number;
}

export function ChatHeaderTokenCount({ chatId }: { chatId: string }) {
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/token-usage?chatId=${chatId}`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      setTotalTokens(Number(data.totalTokens) || 0);
    } catch (err) {
      console.error('Error fetching token usage data:', err);
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

  if (loading && totalTokens === 0) {
    return null;
  }

  return (
    <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded flex items-center">
      <span className="font-medium">{totalTokens.toLocaleString()}</span>
      <span className="ml-1">tokens</span>
    </div>
  );
} 