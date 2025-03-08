'use client';

import { useEffect, useState } from 'react';

// Set this to true to use mock data instead of fetching from the API
const USE_MOCK_DATA = true;
// Token rate in dollars per token - adjust based on your model
const TOKEN_RATE = 0.00001;

interface TokenData {
  queryTokens: number;
  totalTokens: number;
  queryCost: number;
  totalCost: number;
  isLoading: boolean;
  error: string | null;
}

export function SimpleTokenDisplay({ chatId }: { chatId: string }) {
  const [tokenData, setTokenData] = useState<TokenData>({
    queryTokens: 250,
    totalTokens: 1250,
    queryCost: 250 * TOKEN_RATE,
    totalCost: 1250 * TOKEN_RATE,
    isLoading: false,
    error: null
  });
  
  // Function to fetch and update token count
  function updateTokenCount() {
    console.log('Fetching token usage for chat:', chatId);
    setTokenData(prev => ({ ...prev, isLoading: true }));
    
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      console.log('Using mock token data');
      // Simulate a new message being added
      const newQueryTokens = Math.floor(Math.random() * 100) + 50;
      const newTotalTokens = tokenData.totalTokens + newQueryTokens;
      
      setTokenData({
        queryTokens: newQueryTokens,
        totalTokens: newTotalTokens,
        queryCost: newQueryTokens * TOKEN_RATE,
        totalCost: newTotalTokens * TOKEN_RATE,
        isLoading: false,
        error: null
      });
      return;
    }
    
    fetch(`/api/token-usage?chatId=${chatId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch token usage: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Token usage data:', data);
        const queryTokens = Number(data.lastMessageTokens) || 0;
        const totalTokens = Number(data.totalTokens) || 0;
        
        setTokenData({
          queryTokens,
          totalTokens,
          queryCost: queryTokens * TOKEN_RATE,
          totalCost: totalTokens * TOKEN_RATE,
          isLoading: false,
          error: null
        });
      })
      .catch(error => {
        console.error('Error fetching token usage:', error);
        setTokenData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Error fetching token usage'
        }));
      });
  }
  
  // Set up the interval when the component is mounted
  useEffect(() => {
    // Initial fetch
    updateTokenCount();
    
    // Set up interval for updates
    const intervalId = setInterval(updateTokenCount, 5000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [chatId]);
  
  // Always show something - with enhanced styling
  return (
    <div className="flex flex-col gap-1 text-sm font-medium border rounded px-3 py-2 bg-white dark:bg-gray-800 min-w-[220px]">
      <div className="flex items-center justify-between gap-2">
        {tokenData.isLoading ? (
          <>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Current Message</span>
            <span className="font-semibold">Calculating...</span>
            <span></span>
          </>
        ) : tokenData.error ? (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Current Message</span>
            <span className="text-red-500">Error</span>
            <span></span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Current Message</span>
            <span className="font-semibold">{tokenData.queryTokens.toLocaleString()} tokens</span>
            <span className="font-semibold">${tokenData.queryCost.toFixed(4)}</span>
          </>
        )}
      </div>
      
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
      
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">Total Chat</span>
        <span className="font-semibold">{tokenData.totalTokens.toLocaleString()} tokens</span>
        <span className="font-semibold">${tokenData.totalCost.toFixed(4)}</span>
      </div>
    </div>
  );
} 