'use client';

import type { Attachment, Message, ChatRequestOptions } from 'ai';
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
import { usePersona } from '@/hooks/use-persona';

// Extend the ChatRequestOptions type to include message property
interface ExtendedChatRequestOptions extends ChatRequestOptions {
  message?: string;
}

export function Chat({
  chatId,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [messages, setMessages] = useState<Array<Message>>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get the current persona
  const { persona } = usePersona();
  
  // Calculate token limit based on persona's response time
  const tokenLimit = persona?.responseTime === 'Fast' ? 100 : 
                    persona?.responseTime === 'Medium' ? 250 : 500;
  
  // Track token usage (mock implementation)
  const [tokenUsage, setTokenUsage] = useState({
    current: 0,
    limit: tokenLimit
  });
  
  // Update token limit when persona changes
  useEffect(() => {
    setTokenUsage(prev => ({
      current: prev.current,
      limit: tokenLimit
    }));
  }, [tokenLimit]);

  // Function to send a message to the API
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    setIsLoading(true);
    
    // Create a new user message
    const userMessage: Message = {
      id: generateUUID(),
      content: message,
      role: 'user',
      createdAt: new Date()
    };
    
    // Add the user message to the state
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input
    setInput('');
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      console.log(`🧙‍♂️ ${persona?.character || 'AI'} is preparing a response...`);
      console.log(`📤 Sending message to /api/chat: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      
      // Send the request to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: chatId,
          messages: [...messages, userMessage],
          persona: persona // Send persona info to influence response
        }),
        signal: abortControllerRef.current.signal
      });
      
      console.log(`🔍 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      // Check if we got a stream response
      const contentType = response.headers.get('content-type');
      console.log(`🔍 Content-Type: ${contentType}`);
      
      if (!contentType?.includes('text/event-stream')) {
        const text = await response.text();
        console.error('❌ Expected SSE stream but got:', text);
        throw new Error('Invalid response format');
      }
      
      // Create a new assistant message
      const assistantMessage: Message = {
        id: generateUUID(),
        content: '',
        role: 'assistant',
        createdAt: new Date()
      };
      
      // Add the empty assistant message to the state
      setMessages(prev => [...prev, assistantMessage]);
      
      // Process the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader from response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let eventCount = 0;
      let fullContent = '';
      let tokenCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Spell casting complete!');
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
              
              // Estimate token count (rough approximation: ~4 chars per token)
              tokenCount = Math.ceil(fullContent.length / 4);
              
              // Update token usage
              setTokenUsage(prev => ({
                current: Math.min(tokenCount, prev.limit),
                limit: prev.limit
              }));
              
              // Update the assistant message with the new content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: fullContent
                  };
                }
                return newMessages;
              });
            }
          }
        }
      }
      
      // Update history after completion
      mutate('/api/history');
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('❌ Error in chat request:', error);
        toast.error(`${persona?.character || 'AI'}'s spell fizzled! Please try again.`);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  // Function to handle form submission with type assertion
  const handleSubmit = (
    e?: { preventDefault?: () => void },
    chatRequestOptions?: ChatRequestOptions
  ) => {
    console.log('🔄 handleSubmit called with options:', chatRequestOptions);
    e?.preventDefault?.();
    // Use type assertion to access the message property
    const messageToSend = (chatRequestOptions as ExtendedChatRequestOptions)?.message || input;
    sendMessage(messageToSend);
  };
  
  // Function to stop the ongoing request
  const stop = () => {
    if (abortControllerRef.current) {
      console.log('🛑 Interrupting spell casting...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info(`You interrupted ${persona?.character || 'AI'}'s spell casting!`);
    }
  };
  
  // Function to reload the last user message
  const reload = () => {
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
      
      // Remove all messages after the last user message
      setMessages(messages.slice(0, messages.length - lastUserMessageIndex));
      
      // Re-send the last user message
      sendMessage(lastUserMessage.content);
    }
    
    // Return a promise to match the expected type
    return Promise.resolve(null);
  };

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${chatId}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  // Mock append function that returns a Promise
  const append = async (
    message: Message | { role: string; content: string; }, 
    chatRequestOptions?: ChatRequestOptions
  ): Promise<string | null> => {
    console.log('📝 append called with message:', message);
    return Promise.resolve(null);
  };

  // Display the persona name in the header
  const headerTitle = persona?.character || 'AI Companion';
  console.log(`🧙‍♂️ Current persona: ${headerTitle}`);

  return (
    <div className="terminal-background flex flex-col h-full max-h-[calc(100vh-theme(spacing.16))]">
      <div className="terminal-header">
        <ChatHeader
          chatId={chatId}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />
      </div>
      <div className="flex-1 overflow-hidden holoscreen-container m-4">
        <div className="scanline"></div>
        <Messages
          chatId={chatId}
          messages={messages}
          setMessages={setMessages}
          isLoading={isLoading}
          votes={votes || []}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={false}
        />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between p-2 border-t bg-background">
          <div className="flex items-center space-x-2">
            <SimpleTokenDisplay 
              current={tokenUsage.current} 
              limit={tokenUsage.limit} 
              label="Mana" 
              className="text-blue-500"
            />
            <div className="text-xs text-muted-foreground">
              {persona?.role && (
                <span className="font-semibold text-glow-sm">{persona.role}</span>
              )}
              {persona?.responseTime && (
                <span className="ml-2">{persona.responseTime} Response</span>
              )}
            </div>
          </div>
        </div>
        <MultimodalInput
          chatId={chatId}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          stop={stop}
          handleSubmit={handleSubmit}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          setMessages={setMessages}
          append={append}
          className=""
        />
      </div>
    </div>
  );
}
