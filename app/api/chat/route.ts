import { StreamingTextResponse } from 'ai';
import { OpenAIStream } from 'ai/streams';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { saveMessages } from '@/lib/db/queries';
import { type Message } from '@/lib/db/schema';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function POST(req: Request) {
  const { messages, id, model = 'gpt-4', visibility = 'private' } = await req.json();
  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = messages[messages.length - 1];

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    stream: true
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      try {
        const messagesToSave: Message[] = [
          {
            id: userMessage.id,
            chatId: id,
            content: userMessage.content,
            role: userMessage.role === 'data' ? 'user' : userMessage.role,
            createdAt: new Date()
          },
          {
            id: crypto.randomUUID(),
            chatId: id,
            content: completion,
            role: 'assistant',
            createdAt: new Date()
          }
        ];

        await saveMessages({ messages: messagesToSave });
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    }
  });

  return new StreamingTextResponse(stream, {
    headers: {
      'x-chat-id': id,
      'x-chat-visibility': visibility
    }
  });
} 