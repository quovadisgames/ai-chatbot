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
        
        // Create a custom response with paired streams
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        
        // Process the request in the background
        (async () => {
          try {
            // Make the actual API call
            const response = await originalFetch(input, init);
            
            console.log(`🔍 Response status: ${response.status} ${response.statusText}`);
            console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ Error response:', errorText);
              throw new Error(`Failed to send message: ${errorText}`);
            }
            
            // Check if we got a stream response
            const contentType = response.headers.get('content-type');
            console.log(`🔍 Content-Type: ${contentType}`);
            
            if (!contentType?.includes('text/event-stream')) {
              const text = await response.text();
              console.error('❌ Expected SSE stream but got:', text);
              throw new Error('Invalid response format');
            }
            
            // Process the stream
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('Failed to get reader from response body');
            }
            
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            let buffer = '';
            let eventCount = 0;
            let fullContent = '';
            
            // Create a new assistant message
            const assistantMessage: Message = {
              id: generateUUID(),
              createdAt: new Date(),
              content: '',
              role: 'assistant',
            };
            
            // Add the empty assistant message to the state via the append function
            if (appendRef.current) {
              appendRef.current(assistantMessage);
            }
            
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('✅ Stream complete');
                
                // Send a final empty data event to close the stream
                const finalEvent = encoder.encode('data: [DONE]\n\n');
                await writer.write(finalEvent);
                await writer.close();
                break;
              }
              
              // Decode the chunk and add to buffer
              const chunk = decoder.decode(value, { stream: true });
              console.log(`📥 Received chunk #${++eventCount}:`, chunk.length > 100 ? chunk.substring(0, 100) + '...' : chunk);
              buffer += chunk;
              
              // Process complete events in the buffer
              const events = buffer.split('\n\n');
              buffer = events.pop() || ''; // Keep the last incomplete event in the buffer
              
              for (const event of events) {
                if (event.trim()) {
                  // Parse data lines
                  const dataLines = event.split('\n')
                    .filter(line => line.startsWith('data: '))
                    .map(line => line.substring(6));
                  
                  if (dataLines.length > 0) {
                    const content = dataLines.join('\n');
                    console.log('📝 Parsed content:', content.length > 50 ? content.substring(0, 50) + '...' : content);
                    
                    // Accumulate the full content
                    fullContent = content;
                    
                    // Format the content as a proper SSE event for the AI SDK
                    const formattedEvent = encoder.encode(`data: ${JSON.stringify({ role: 'assistant', content, id: assistantMessage.id })}\n\n`);
                    await writer.write(formattedEvent);
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Error processing stream:', error);
            
            // Close the stream with an error
            const encoder = new TextEncoder();
            const errorEvent = encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
            await writer.write(errorEvent);
            await writer.close();
          }
        })();
        
        // Return a custom response with our controlled stream
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
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
