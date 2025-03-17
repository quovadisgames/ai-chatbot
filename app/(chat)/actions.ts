'use server';

import { cookies } from 'next/headers';
import OpenAI from 'openai';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({ message }: { message: any }): Promise<string> {
  const USE_MOCK_DB = true; // Match route.ts
  if (USE_MOCK_DB) {
    console.log('[MOCK] Generating title');
    return `Chat: ${message.content.slice(0, 20)}...`; // Fast mock title
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `
        - you will generate a short title based on the first message a user begins a conversation with
        - ensure it is not more than 80 characters long
        - the title should be a summary of the user's message
        - do not use quotes or colons`
      },
      {
        role: 'user',
        content: JSON.stringify(message)
      }
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || 'New Chat';
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
