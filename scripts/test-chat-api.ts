/**
 * Test script for the chat API
 * 
 * This script sends a POST request to the /api/chat endpoint and logs the full response stream.
 * It's useful for debugging issues with the chat API without involving the UI.
 * 
 * To run this script:
 * 1. Install dependencies: cd scripts && npm install
 * 2. Run with your Vercel URL: npm run test-chat -- https://ai-chatbot-git-good-testing-branch-alexs-projects-27b9957e.vercel.app
 * 
 * If running locally:
 * npm run test-chat -- http://localhost:3000
 */

// @ts-ignore - node-fetch types
import fetch from 'node-fetch';
import { TextDecoder } from 'util';

async function testChatAPI() {
  // Get the base URL from command line arguments or use default
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const url = `${baseUrl}/api/chat`;
  
  console.log(`🚀 Testing chat API at: ${url}`);
  
  const payload = {
    id: "test-chat-1",
    messages: [
      {
        role: "user",
        content: "Write code to demonstrate Dijkstra's algorithm"
      }
    ]
  };
  
  try {
    console.log('📦 Sending request with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log(`🔍 Response status: ${response.status} ${response.statusText}`);
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    // Check if we got a stream response
    const contentType = response.headers.get('content-type');
    console.log(`🔍 Content-Type: ${contentType}`);
    
    if (contentType?.includes('text/event-stream')) {
      console.log('📊 Received event stream. Processing events:');
      
      // Process the stream
      const reader = (response.body as unknown as ReadableStream<Uint8Array>)?.getReader();
      if (!reader) {
        console.error('❌ Failed to get reader from response body');
        return;
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let eventCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream complete');
          break;
        }
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete events in the buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep the last incomplete event in the buffer
        
        for (const event of events) {
          if (event.trim()) {
            eventCount++;
            console.log(`\n📄 Event #${eventCount}:`);
            console.log(event);
            
            // Parse data lines
            const dataLines = event.split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.substring(6));
            
            if (dataLines.length > 0) {
              console.log('📝 Parsed data:');
              console.log(dataLines.join('\n'));
            }
          }
        }
      }
      
      console.log(`\n📊 Total events received: ${eventCount}`);
    } else {
      // Not a stream, just log the response
      const responseText = await response.text();
      console.log('📄 Response body:');
      console.log(responseText);
    }
    
  } catch (error) {
    console.error('❌ Error during API test:', error);
  }
}

// Run the test
testChatAPI().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}); 