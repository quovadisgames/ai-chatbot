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

export async function POST(request: Request) {
  const {
    id,
    messages: rawMessages,
    selectedChatModel,
  }: { id: string; messages: Array<any>; selectedChatModel: string } =
    await request.json();

  // Convert incoming messages to our local type without type checking
  // This avoids the type error since we're handling the conversion manually
  const messages = rawMessages as any[];

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });

  // Convert our local message type to the ai package's Message type
  const aiMessages: AIMessage[] = messages.map(msg => {
    // Map function/tool roles to assistant for compatibility
    let role: 'user' | 'assistant' | 'system' | 'data' = 'user';
    
    if (msg.role === 'user') {
      role = 'user';
    } else if (msg.role === 'assistant') {
      role = 'assistant';
    } else if (msg.role === 'system') {
      role = 'system';
    } else if (msg.role === 'data') {
      role = 'data';
    } else {
      // For 'function' and 'tool' roles, map to 'assistant'
      role = 'assistant';
    }
    
    return {
      id: msg.id,
      content: msg.content,
      role
    };
  });

  return createDataStreamResponse({
    execute: (dataStream: any) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages: aiMessages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning'
            ? []
            : [
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
              ],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
        },
        onFinish: async ({ 
          response, 
          reasoning, 
          usage 
        }: { 
          response: { messages: any[] }, 
          reasoning?: any, 
          usage?: TokenUsage 
        }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              // Save the messages to the database
              const savedMessages = await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  };
                }),
              }) as SavedMessage[];

              // Get the assistant message for token tracking
              const assistantMessage = savedMessages.find(msg => msg.role === 'assistant');
              
              // If we have usage data from the model, use it
              // Otherwise, estimate token counts based on message lengths
              let promptTokens: number = usage?.promptTokens || 0;
              let completionTokens: number = usage?.completionTokens || 0;
              let totalTokens: number = usage?.totalTokens || 0;
              
              // If any token counts are missing or zero, estimate them
              if (promptTokens === 0 || completionTokens === 0 || totalTokens === 0) {
                // Estimate prompt tokens from user messages
                const estimatedPromptTokens = messages.reduce((sum, msg) => 
                  sum + estimateTokenCount(msg.content), 0);
                
                // Estimate completion tokens from assistant message
                const estimatedCompletionTokens = assistantMessage 
                  ? estimateTokenCount(assistantMessage.content) 
                  : 0;
                
                // Use estimates for any missing values
                promptTokens = promptTokens || estimatedPromptTokens;
                completionTokens = completionTokens || estimatedCompletionTokens;
                totalTokens = totalTokens || (promptTokens + completionTokens);
              }
              
              // Track token usage with our best data
              await trackTokenUsage({
                chatId: id,
                messageId: assistantMessage?.id,
                model: selectedChatModel,
                promptTokens,
                completionTokens,
                totalTokens,
              });
              
              console.log(`Token usage tracked for chat ${id}: ${totalTokens} tokens (${promptTokens} prompt, ${completionTokens} completion)`);
            } catch (error) {
              console.error('Failed to save chat or track token usage', error);
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: () => {
      return 'Oops, an error occured!';
    },
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
