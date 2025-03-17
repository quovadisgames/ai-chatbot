import { OpenAIStream, StreamingTextResponse } from 'ai';
import { OpenAI } from 'openai';
import { auth } from '@/auth';
import { saveMessages } from '@/lib/db/queries';
import { type Message } from '@/lib/db/schema';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function POST(req: Request) {
  const { messages, id: chatId, model = 'gpt-4', visibility = 'private' } = await req.json();
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
      const messagesToSave: Message[] = [
        {
          id: userMessage.id,
          chatId,
          content: userMessage.content,
          role: userMessage.role as 'user' | 'assistant' | 'system',
          createdAt: new Date()
        },
        {
          id: crypto.randomUUID(),
          chatId,
          content: completion,
          role: 'assistant',
          createdAt: new Date()
        }
      ];

      const messageSaveStart = Date.now();
      try {
        await saveMessages({ messages: messagesToSave });
        console.log(`💾 Message saved in ${Date.now() - messageSaveStart}ms`);
      } catch (error) {
        console.error('❌ Error saving message:', error);
      }
    },
    onToken(token) {
      console.log('Token:', token);
    }
  });

  return new StreamingTextResponse(stream, {
    headers: {
      'x-chat-id': chatId,
      'x-chat-visibility': visibility
    }
  });
} 