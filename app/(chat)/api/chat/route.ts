import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveChat, saveMessages, getChatById, deleteChatById, ExtendedChat } from '@/lib/db/queries';
import { trackAIUsage } from '@/lib/ai-utils';
import { getMostRecentUserMessage } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { type Message } from '@/lib/db/schema';

// Mock authentication for development
const USE_MOCK_AUTH = true;
const MOCK_USER = { id: "mock-user-123", email: "dev@example.com" };

export async function POST(req: NextRequest) {
  console.log('🚀 POST /api/chat - Handler started');
  const startTime = Date.now();
  
  try {
    // Parse request
    console.log('📦 Parsing request body...');
    const { id, messages } = await req.json();
    console.log(`📦 Request parsed: chatId=${id}, messages.length=${messages.length}`);
    
    // Authentication
    console.log('🔐 Authenticating user...');
    const session = await auth() || (USE_MOCK_AUTH ? { user: MOCK_USER } : null);
    const userId = session?.user?.id;
    if (!userId) {
      console.log('❌ Authentication failed: No user ID found');
      return new Response('Unauthorized', { status: 401 });
    }
    console.log(`🔐 User authenticated: userId=${userId}`);

    // Get user message
    console.log('💬 Extracting user message...');
    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      console.log('❌ No user message found in request');
      return new Response('No user message found', { status: 400 });
    }
    console.log(`💬 User message extracted: ${userMessage.content.substring(0, 50)}${userMessage.content.length > 50 ? '...' : ''}`);
    
    const prompt = userMessage.content;
    
    // Check if chat exists
    console.log(`🔍 Checking if chat exists: chatId=${id}`);
    let existingChat: ExtendedChat | null = null;
    try {
      existingChat = await getChatById({ id });
      console.log(`🔍 Chat lookup result: ${existingChat ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.error('❌ Error fetching chat:', error);
    }
    
    // Check authorization
    if (existingChat) {
      console.log('🔒 Checking chat authorization...');
      // We need to handle the case where userId might be undefined
      // This is a safe way to check without TypeScript errors
      const chatUserId = existingChat && 'userId' in existingChat ? 
        (existingChat as any).userId : undefined;
      
      if (chatUserId && chatUserId !== userId) {
        console.log(`❌ Authorization failed: Chat belongs to userId=${chatUserId}, not current user`);
        return new Response('Unauthorized', { status: 401 });
      }
      console.log('🔒 Chat authorization successful');
    } else {
      // Create new chat
      console.log('📝 Creating new chat...');
      console.log('Generating title for new chat');
      const titleStart = Date.now();
      const title = await generateTitleFromUserMessage({ message: userMessage });
      console.log(`📝 Title generated in ${Date.now() - titleStart}ms: "${title}"`);
      
      console.log('💾 Saving new chat to database...');
      const saveStart = Date.now();
      await saveChat({ id, userId, title });
      console.log(`💾 Chat saved in ${Date.now() - saveStart}ms`);
    }
    
    // Save the user message
    console.log('💾 Saving user message to database...');
    const messageSaveStart = Date.now();
    try {
      const messageToSave: Message = {
        id: userMessage.id,
        chatId: id,
        content: userMessage.content,
        role: userMessage.role === 'data' ? 'user' : (userMessage.role as 'user' | 'assistant' | 'system'),
        createdAt: new Date()
      };
      await saveMessages({ messages: [messageToSave] });
      console.log(`💾 Message saved in ${Date.now() - messageSaveStart}ms`);
    } catch (error) {
      console.error('❌ Error saving message:', error);
      console.log('⚠️ Continuing despite message save error');
      // Continue anyway
    }

    // Process with AI and return streaming response
    console.log('🤖 Starting AI processing...');
    const aiStart = Date.now();
    const { usage, stream } = await trackAIUsage(userId, prompt);
    console.log(`🤖 AI processed in ${Date.now() - aiStart}ms, Token usage:`, usage);
    
    console.log(`✅ POST /api/chat - Handler completed in ${Date.now() - startTime}ms`);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error: unknown) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ Error in POST /api/chat after ${errorTime}ms:`, error);
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