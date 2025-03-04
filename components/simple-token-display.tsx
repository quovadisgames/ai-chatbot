'use client';

import { useEffect, useRef } from 'react';

export function SimpleTokenDisplay({ chatId }: { chatId: string }) {
  // Use a ref to store the div element
  const divRef = useRef<HTMLDivElement | null>(null);
  
  // Function to fetch and update token count
  function updateTokenCount() {
    fetch(`/api/token-usage?chatId=${chatId}`)
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Failed to fetch token usage');
      })
      .then(data => {
        const tokenCount = Number(data.totalTokens) || 0;
        
        // Update the DOM directly if the element exists
        if (divRef.current) {
          if (tokenCount > 0) {
            divRef.current.textContent = `${tokenCount.toLocaleString()} tokens`;
            divRef.current.style.display = 'block';
          } else {
            divRef.current.style.display = 'none';
          }
        }
      })
      .catch(error => {
        console.error('Error fetching token usage:', error);
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
  
  return (
    <div 
      ref={divRef}
      className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
      style={{ display: 'none' }}
    >
      Loading...
    </div>
  );
} 