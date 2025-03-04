'use client';

import { useEffect, useState } from 'react';

// Set this to true to use mock data instead of fetching from the API
const USE_MOCK_DATA = true;

export function SimpleTokenDisplay({ chatId }: { chatId: string }) {
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch and update token count
  function updateTokenCount() {
    console.log('Fetching token usage for chat:', chatId);
    setLoading(true);
    
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      console.log('Using mock token data');
      setTimeout(() => {
        setTokenCount(1250); // Mock token count
        setLoading(false);
      }, 500); // Simulate loading delay
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
        setTokenCount(Number(data.totalTokens) || 0);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching token usage:', error);
        setError(error.message || 'Error fetching token usage');
      })
      .finally(() => {
        setLoading(false);
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
  
  // Always show something - for debugging purposes
  return (
    <div className="text-xs border rounded px-3 py-1.5 bg-gray-100 dark:bg-gray-800">
      {loading ? (
        <span className="animate-pulse">Loading tokens...</span>
      ) : error ? (
        <span className="text-red-500">Error: {error}</span>
      ) : tokenCount === null || tokenCount === 0 ? (
        <span>No token data available</span>
      ) : (
        <span className="font-medium">{tokenCount.toLocaleString()} tokens used</span>
      )}
    </div>
  );
} 