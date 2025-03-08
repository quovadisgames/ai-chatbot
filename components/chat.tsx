'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { SimpleTokenDisplay } from './simple-token-display';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const appendRef = useRef<((message: Message) => void) | null>(null);
  const chatIdRef = useRef<string>(id);

  // Add custom fetch implementation for the useChat hook
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const [input, init] = args;
      
      // Only intercept calls to our chat API
      if (typeof input === 'string' && input.includes('/api/chat') && init?.method === 'POST') {
        console.log('📤 Intercepted fetch to /api/chat:', { 
          url: input,
          method: init?.method,
          headers: init?.headers,
          body: init?.body ? JSON.parse(init.body as string) : undefined
        });
        
        try {
          // Make the actual API call
          const response = await originalFetch(...args);
          
          console.log(`🔍 Response status: ${response.status} ${response.statusText}`);
          console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            console.error('❌ Error response status:', response.status);
            return response; // Return the error response as-is
          }
          
          // Check if we got a stream response
          const contentType = response.headers.get('content-type');
          console.log(`🔍 Content-Type: ${contentType}`);
          
          if (!contentType?.includes('text/event-stream')) {
            console.error('❌ Expected SSE stream but got different content type');
            return response; // Return the response as-is
          }
          
          // For mock responses (Dijkstra algorithm), we'll handle it specially
          // Clone the response so we can check its content
          const clonedResponse = response.clone();
          const reader = clonedResponse.body?.getReader();
          
          if (!reader) {
            console.error('❌ Failed to get reader from response body');
            return response; // Return the original response
          }
          
          // Read the first chunk to check if it's a mock response
          const { value } = await reader.read();
          const decoder = new TextDecoder();
          const firstChunk = decoder.decode(value);
          
          if (firstChunk && firstChunk.includes('Dijkstra') && firstChunk.includes('algorithm')) {
            console.log('🤖 Detected mock Dijkstra response, creating a custom response');
            
            // Create a simple response with the Dijkstra algorithm
            const dijkstraCode = `
function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  const pq = [[0, start]];
  
  // Initialize distances
  for (let node in graph) distances[node] = Infinity;
  distances[start] = 0;
  
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [dist, u] = pq.shift();
    
    if (visited.has(u)) continue;
    visited.add(u);
    
    for (let v in graph[u]) {
      const newDist = dist + graph[u][v];
      if (newDist < distances[v]) {
        distances[v] = newDist;
        pq.push([newDist, v]);
      }
    }
  }
  
  return distances;
}
            `;
            
            // Create a simple stream with a properly formatted message
            const stream = new ReadableStream({
              start(controller) {
                const encoder = new TextEncoder();
                
                // Send a properly formatted message for the AI SDK
                const message = {
                  id: generateUUID(),
                  role: 'assistant',
                  content: `Here's a simple Dijkstra's algorithm in JavaScript:\n\n\`\`\`js\n${dijkstraCode}\n\`\`\`\n\nThis algorithm finds the shortest paths from a start node to all other nodes in a weighted graph.`
                };
                
                // Send the message in the format expected by the AI SDK
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
                
                // Send the DONE message
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              }
            });
            
            // Return a new response with our custom stream
            return new Response(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            });
          }
          
          // For non-mock responses, return the original response
          console.log('📊 Passing through original response');
          return response;
          
        } catch (error) {
          console.error('❌ Error in fetch interceptor:', error);
          throw error;
        }
      }
      
      // Pass through other requests unchanged
      return originalFetch(...args);
    };
    
    // Restore original fetch on cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Log SSE messages
  useEffect(() => {
    // Add a global event listener to catch all message events
    const messageHandler = (e: Event) => {
      if (e instanceof MessageEvent && e.origin === window.location.origin) {
        try {
          console.log('📥 SSE message received:', e.data);
        } catch (err) {
          // Ignore errors in logging
        }
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  // Update refs when props change
  useEffect(() => {
    chatIdRef.current = id;
  }, [id]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      console.log('✅ Chat response completed');
      mutate('/api/history');
    },
    onError: (error) => {
      console.error('❌ Chat error:', error);
      toast.error('An error occurred, please try again!');
    },
  });

  // Store the append function in a ref so we can access it from the fetch interceptor
  useEffect(() => {
    appendRef.current = (message: Message) => {
      // Only append if the chat ID matches
      if (chatIdRef.current === id) {
        setMessages((prev) => {
          // Check if this message ID already exists to avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    };
  }, [id, setMessages]);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />
        
        {/* Token display - with cost information */}
        <div className="flex justify-end px-4 py-3 border-b bg-blue-50 dark:bg-blue-900/20">
          <div className="border-2 border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
            <SimpleTokenDisplay chatId={id} />
          </div>
        </div>

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
