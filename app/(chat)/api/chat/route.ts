import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveChat, saveMessages, getChatById, deleteChatById } from '@/lib/db/queries';
import { trackAIUsage } from '@/lib/ai-utils';
import { getMostRecentUserMessage } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';

// Mock authentication for development
const USE_MOCK_AUTH = true;
const MOCK_USER = { id: "mock-user-123", email: "dev@example.com" };

export async function POST(req: NextRequest) {
  try {
    // Parse request
    const { id, messages } = await req.json();
    console.log('Incoming request:', { id, messages });
    
    // Authentication
    const session = await auth() || (USE_MOCK_AUTH ? { user: MOCK_USER } : null);
    const userId = session?.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user message
    const userMessage = getMostRecentUserMessage(messages);
    console.log('Parsed userMessage:', userMessage);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }
    
    const prompt = userMessage.content;
    
    // Check if chat exists
    let existingChat = null;
    try {
      existingChat = await getChatById({ id });
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
    
    // Check authorization
    if (existingChat) {
      // We need to handle the case where userId might be undefined
      // This is a safe way to check without TypeScript errors
      const chatUserId = existingChat && 'userId' in existingChat ? 
        (existingChat as any).userId : undefined;
      
      if (chatUserId && chatUserId !== userId) {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      // Create new chat
      console.log('Generating title for new chat');
      const titleStart = Date.now();
      const title = await generateTitleFromUserMessage({ message: userMessage });
      console.log(`Title generated in ${Date.now() - titleStart}ms:`, title);
      
      console.log('Saving new chat');
      const saveStart = Date.now();
      await saveChat({ id, userId, title });
      console.log(`Chat saved in ${Date.now() - saveStart}ms`);
    }
    
    // Save the user message
    try {
      await saveMessages({ messages: [{ ...userMessage, createdAt: new Date(), chatId: id }] });
    } catch (error) {
      console.error('Error saving message:', error);
      // Continue anyway
    }

    // Process with AI and return streaming response
    console.log('Starting AI processing');
    const aiStart = Date.now();
    const { usage, stream } = await trackAIUsage(userId, prompt);
    console.log(`AI processed in ${Date.now() - aiStart}ms, Token usage:`, usage);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/chat:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Error: ${message}`, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the chat ID from the URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response('Missing chat ID', { status: 400 });
    }
    
    // Authentication
    const session = await auth() || (USE_MOCK_AUTH ? { user: MOCK_USER } : null);
    const userId = session?.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check if chat exists and belongs to user
    try {
      const existingChat = await getChatById({ id });
      
      // Check authorization
      if (existingChat) {
        const chatUserId = existingChat && 'userId' in existingChat ? 
          (existingChat as any).userId : undefined;
        
        if (chatUserId && chatUserId !== userId) {
          return new Response('Unauthorized', { status: 401 });
        }
      } else {
        return new Response('Chat not found', { status: 404 });
      }
      
      // Delete the chat
      await deleteChatById({ id });
      
      return new Response('Chat deleted successfully', { status: 200 });
    } catch (error) {
      console.error('Error deleting chat:', error);
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`Error: ${message}`, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Error in DELETE /api/chat:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Error: ${message}`, { status: 500 });
  }
} 