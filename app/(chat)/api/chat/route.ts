// Define types locally instead of importing from 'ai'
type LocalMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';
  createdAt?: Date;
  chatId?: string;
};

// Import the rest of the dependencies
import { auth } from '@/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import { trackTokenUsage } from '@/lib/ai/token-tracking';
import { trackAIUsage } from '@/lib/ai-utils';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

// Import AI functions from the actual module
import {
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { NextRequest } from 'next/server';

export const maxDuration = 60;

// Define the usage type
interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

// Define the saved message type
interface SavedMessage {
  id: string;
  chatId: string;
  role: string;
  content: string;
  createdAt: Date;
}

// Function to estimate token count based on text length
// This is a very rough estimate - 1 token is approximately 4 characters in English
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Helper function to get the most recent user message
function getMostRecentUserMessage(messages: Array<any>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

// Define a type that matches the ai package's Message type
type AIMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'data';
};

// Constants for mock authentication
const USE_MOCK_AUTH = true;
const MOCK_USER = {
  id: "mock-user-123",
  email: "dev@example.com",
};

export async function POST(req: NextRequest) {
  const { id, messages } = await req.json();
  const session = await auth() || (USE_MOCK_AUTH ? { user: MOCK_USER } : null);
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const userMessage = getMostRecentUserMessage(messages);
  if (!userMessage) return new Response('No user message found', { status: 400 });
  const prompt = userMessage.content;

  const chat = await getChatById({ id });
  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId, title });
  }
  await saveMessages({ messages: [{ ...userMessage, createdAt: new Date(), chatId: id }] });

  const response = await trackAIUsage(userId, prompt);
  console.log('Token usage:', response.usage);
  return new Response(response.toAIStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
